extern crate chrono;
extern crate failure;
extern crate osu_api;
extern crate regex;
extern crate reqwest;
extern crate serde;
extern crate serde_derive;
extern crate serde_json;
extern crate sled;
extern crate structopt;

use chrono::prelude::*;
use failure::{Fallible, ResultExt};
use osu_api::{
    data::{self, Beatmap, Score},
    OsuApi,
};
use reqwest::Client;
use serde_derive::*;
use serde_json::value::RawValue;
use std::{
    fs::File,
    io::{BufWriter, Write},
    path::PathBuf,
    str::FromStr,
};
use structopt::StructOpt;

fn get_api_key() -> Fallible<String> {
    Ok(std::fs::read_to_string("API_SECRET")
        .context("Failed to open API_SECRET file")?
        .trim()
        .to_string())
}

#[derive(Debug, StructOpt)]
enum App {
    #[structopt(name = "get-maps")]
    GetMaps(GetMaps),
    #[structopt(name = "get-scores")]
    GetScores(GetScores),
    #[structopt(name = "render-maps")]
    RenderMaps(RenderMaps),
    #[structopt(name = "render-ranking")]
    RenderRanking(RenderRanking),
    #[structopt(name = "find-scores")]
    FindScores(FindScores),
    #[structopt(name = "show-beatmap")]
    ShowBeatmap(ShowBeatmap),
}

#[derive(Debug, StructOpt)]
struct GetMaps {
    #[structopt(long = "game-mode", default_value = "2")]
    game_mode: String,
    #[structopt(long = "include-converts")]
    include_converts: Option<bool>,
    #[structopt(long = "start-date")]
    start_date: Option<DateTime<Utc>>,
    #[structopt(long = "end-date")]
    end_date: Option<DateTime<Utc>>,
}

#[derive(Debug, StructOpt)]
struct RenderMaps {
    #[structopt(long = "game-mode", default_value = "2")]
    game_mode: String,
    #[structopt(
        long = "out_path",
        default_value = "data/summary.json",
        parse(from_os_str)
    )]
    out_path: PathBuf,
    #[structopt(long = "min-stars", default_value = "4")]
    min_stars: f64,
}

#[derive(Debug, StructOpt)]
struct GetScores {
    #[structopt(long = "game-mode", default_value = "2")]
    game_mode: String,
    #[structopt(long = "min-stars", default_value = "4")]
    min_stars: f64,
    #[structopt(long = "cache-expire")]
    cache_expire: Option<DateTime<Utc>>,
    #[structopt(long = "ranked-date-start")]
    approved_date_start: Option<DateTime<Utc>>,
}

#[derive(Debug, StructOpt)]
struct RenderRanking {
    #[structopt(
        long = "out_path",
        default_value = "data/ranking.json",
        parse(from_os_str)
    )]
    out_path: PathBuf,
    #[structopt(long = "min-stars", default_value = "4")]
    min_stars: f64,
    #[structopt(long = "game-mode", default_value = "2")]
    game_mode: String,
    #[structopt(long = "specific-maps")]
    specific_maps: bool,
}

#[derive(Debug, StructOpt)]
struct FindScores {
    #[structopt(long = "high-ar")]
    high_ar: f64,
}

#[derive(Debug, StructOpt)]
struct ShowBeatmap {}

fn reqwest_client() -> Fallible<Client> {
    use reqwest::header;
    let mut headers = header::HeaderMap::new();
    headers.insert(
        header::USER_AGENT,
        header::HeaderValue::from_static("<https://github.com/ekrctb/list-maps>"),
    );
    Ok(reqwest::Client::builder()
        .gzip(true)
        .default_headers(headers)
        .build()?)
}

#[derive(serde_derive::Deserialize)]
struct BeatmapEssential {
    approved_date: String,
    beatmap_id: String,
}

#[derive(Debug)]
struct ApiClient {
    key: String,
    client: Client,
}

fn api_client() -> Fallible<ApiClient> {
    let api_key = get_api_key()?;
    let client = reqwest_client()?;
    Ok(ApiClient {
        key: api_key,
        client,
    })
}

fn sleep_secs(secs: u64) {
    std::thread::sleep(std::time::Duration::from_secs(secs));
}

fn retry_forever<T>(name: &str, mut f: impl FnMut() -> Fallible<T>) -> T {
    let mut try_count = 0;
    loop {
        match f() {
            Ok(x) => return x,
            Err(e) => {
                try_count += 1;
                let sleep_seconds = 2u64.pow(try_count.min(10));
                eprintln!("{} failed: {}", name, e);
                eprintln!("Retrying in {} seconds...", sleep_seconds);
                sleep_secs(sleep_seconds);
            }
        }
    }
}

fn cache_key(beatmap_id: &str, game_mode_str: &str) -> String {
    format!("{}-{}", beatmap_id, game_mode_str)
}

fn request_all_ranked_maps(
    api: &mut ApiClient,
    cache: &sled::Tree,
    game_mode: &str,
    include_converts: bool,
    start_date: Option<DateTime<Utc>>,
    end_date: Option<DateTime<Utc>>,
) -> Fallible<()> {
    let include_converts = format!("{}", include_converts as u8);
    let beatmaps_limit = 500;
    let mut last_date = start_date.unwrap_or_else(|| Utc.ymd(2000, 1, 1).and_hms(0, 0, 0));
    let mut processed_beatmap_ids = std::collections::HashSet::new();
    loop {
        let since = last_date - chrono::Duration::seconds(1);
        let list: Vec<Box<RawValue>> = retry_forever("Get beatmaps", || {
            let text = osu_api::GetBeatmaps::new(&api.key)
                .since(since)
                .mode(game_mode)
                .include_converts(include_converts.clone())
                .limit(beatmaps_limit)
                .request_text(&mut api.client)
                .context("get_beatmaps API failed")?;

            Ok(serde_json::from_str(&text).context("malformed JSON")?)
        });

        let list_is_end = (list.len() as i32) < beatmaps_limit;
        let mut next_date = since;
        for (i, entry) in list.into_iter().enumerate() {
            let essential: BeatmapEssential = match serde_json::from_str(entry.get()) {
                Ok(x) => x,
                Err(e) => {
                    eprintln!("{}\nentry {} of since = {} ", e, i, since);
                    continue;
                }
            };

            if !processed_beatmap_ids.insert(essential.beatmap_id.clone()) {
                continue;
            }

            let key = cache_key(&essential.beatmap_id, &game_mode);
            cache.set(&key, entry.get().to_string().into_bytes())?;

            let date = match data::date_from_str(&essential.approved_date) {
                Ok(x) => x,
                Err(e) => {
                    eprintln!("{}\nbeatmap id = {}", e, &essential.beatmap_id);
                    continue;
                }
            };

            if next_date < date {
                next_date = date;
            }
        }
        println!("{} .. {}", since, next_date);

        if let Some(end) = end_date {
            if end < next_date {
                println!("End date ({}) reached", end);
                return Ok(());
            }
        }

        if next_date <= last_date {
            if list_is_end {
                return Ok(());
            } else {
                failure::bail!("Cannot make a progress")
            }
        }

        last_date = next_date;

        sleep_secs(20);
    }
}

fn beatmaps_cache() -> Fallible<sled::Db> {
    Ok(sled::Db::start_default("db/beatmaps")?)
}

fn get_maps(args: &GetMaps) -> Fallible<()> {
    let mut api = api_client()?;
    let cache = beatmaps_cache()?;

    validate_game_mode_str(&args.game_mode)?;
    let include_converts = args.include_converts.unwrap_or(args.game_mode != "0");
    let start_date = match args.start_date {
        Some(x) => Some(x),
        None => {
            // naive scan!
            let mut last_date = None;
            for entry in cache.iter() {
                let entry = entry.context("Failed to calculate start date")?.1;
                let date = serde_json::from_slice(&entry)
                    .map_err(|e| e.into())
                    .and_then(|x: BeatmapEssential| data::date_from_str(&x.approved_date))
                    .context("beatmap entry db contains malformed data")?;
                last_date = Some(match last_date {
                    None => date,
                    Some(d) => date.max(d),
                });
            }
            last_date
        }
    };
    let end_date = args.end_date;

    println!(
        "game_mode = {:?} {} converts, start_date = {:?}, end_date = {:?}",
        args.game_mode,
        if include_converts {
            "including"
        } else {
            "not including"
        },
        start_date,
        end_date
    );
    request_all_ranked_maps(
        &mut api,
        &cache,
        &args.game_mode,
        include_converts,
        start_date,
        end_date,
    )?;
    println!("Done!");

    Ok(())
}

fn scores_cache() -> Fallible<sled::Db> {
    Ok(sled::Db::start_default("db/scores")?)
}

fn beatmap_stars(beatmap: &Beatmap) -> f64 {
    f64::from_str(&beatmap.difficultyrating).unwrap_or(0.0)
}

fn each_filtered_map(min_stars: f64, mut f: impl FnMut(&Beatmap) -> Fallible<()>) -> Fallible<u64> {
    let cache = beatmaps_cache()?;

    let mut all_maps = 0;
    for entry in cache.iter() {
        all_maps += 1;

        let (key, entry) = entry.context("db")?;
        let beatmap: Beatmap = match serde_json::from_slice(&entry) {
            Ok(x) => x,
            Err(e) => {
                eprintln!(
                    "{}\nFailed to parse beatmap {}",
                    e,
                    String::from_utf8_lossy(&key)
                );
                continue;
            }
        };

        let stars = beatmap_stars(&beatmap);
        if stars.is_nan() || stars < min_stars - 1e-9 {
            continue;
        }

        f(&beatmap)?;
    }

    if all_maps == 0 {
        failure::bail!("No maps found. First run `list-maps get-maps'.")
    }

    Ok(all_maps)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ScoreCacheValue {
    pub update_date: DateTime<Utc>,
    pub scores: Vec<Box<RawValue>>,
}

fn validate_game_mode_str(game_mode: &str) -> Fallible<()> {
    let _ = data::game_mode_from_str(game_mode).context("Invalid game mode")?;
    Ok(())
}

fn get_scores(args: &GetScores) -> Fallible<()> {
    validate_game_mode_str(&args.game_mode)?;
    let mut api = api_client()?;
    let cache = scores_cache()?;
    let mut count = 0;
    let mut fetch_count = 0;
    each_filtered_map(args.min_stars, |beatmap| {
        count += 1;
        if let Some(approved_date) = beatmap
            .approved_date
            .as_ref()
            .and_then(|s| data::date_from_str(s.as_ref()).ok())
        {
            if let Some(start) = args.approved_date_start {
                if approved_date < start {
                    return Ok(());
                }
            }
        }
        let key = cache_key(&beatmap.beatmap_id, &args.game_mode);
        if let Some(value) = cache.get(&key)? {
            let value: ScoreCacheValue =
                serde_json::from_slice(&value).context("db content malformed")?;
            if match args.cache_expire {
                Some(dt) => value.update_date >= dt,
                None => true,
            } {
                return Ok(());
            }
        }
        let update_date = Utc::now();
        let scores: Vec<Box<RawValue>> = retry_forever("get_scores", || {
            let text = osu_api::GetScores::new(api.key.clone(), beatmap.beatmap_id.clone())
                .mode(args.game_mode.clone())
                .limit(100)
                .request_text(&mut api.client)?;
            Ok(serde_json::from_str(&text).context("malformed JSON")?)
        });
        fetch_count += 1;
        let len = scores.len();
        cache.set(
            &key,
            serde_json::to_vec(&ScoreCacheValue {
                update_date,
                scores,
            })?,
        )?;
        println!("{} {}: {} scores", count, beatmap_title(&beatmap), len);
        sleep_secs(2);

        Ok(())
    })?;

    println!("{} / {} maps done!", fetch_count, count);

    Ok(())
}

fn beatmap_title<'a>(beatmap: &Beatmap<'a>) -> String {
    format!(
        "{} - {} [{}]",
        beatmap.artist, beatmap.title, beatmap.version
    )
}

struct CalculatedPp {
    pub nm: f64,
    pub hd: f64,
    pub fl: f64,
    pub hdfl: f64,
}

fn calc_pp(
    stars: f64,
    approach_rate: f64,
    max_combo: f64,
    combo: f64,
    accuracy: f64,
    num_misses: f64,
) -> CalculatedPp {
    let mut pp = f64::powf((5.0 * stars / 0.0049) - 4.0, 2.0) / 100_000.0;
    let mut length_bonus = 0.95 + 0.4 * f64::min(1.0, max_combo / 3000.0);
    if max_combo > 3000.0 {
        length_bonus += (max_combo / 3000.0).log10() * 0.5;
    }
    pp *= length_bonus;
    pp *= f64::powf(0.97, num_misses);
    if max_combo > 0.0 {
        pp *= f64::powf(combo / max_combo, 0.8);
    }
    if approach_rate > 9.0 {
        pp *= 1.0 + 0.1 * (approach_rate - 9.0);
    }
    if approach_rate < 8.0 {
        pp *= 1.0 + 0.025 * (8.0 - approach_rate);
    }
    pp *= f64::powf(accuracy / 100.0, 5.5);
    let hd_bonus = 1.05 + 0.075 * (10.0 - f64::min(10.0, approach_rate));
    let fl_bonus = 1.35 * length_bonus;
    CalculatedPp {
        nm: pp,
        hd: pp * hd_bonus,
        fl: pp * fl_bonus,
        hdfl: pp * hd_bonus * fl_bonus,
    }
}

fn beatmap_summary(
    beatmap: &Beatmap,
    scores: &[Box<RawValue>],
    update_date: &DateTime<Utc>,
) -> Fallible<serde_json::Value> {
    use osu_api::data::Mods;
    let mods_mask = Mods::EASY
        | Mods::HIDDEN
        | Mods::HARD_ROCK
        | Mods::DOUBLE_TIME
        | Mods::HALF_TIME
        | Mods::FLASHLIGHT;
    let mut fc_count = std::collections::HashMap::new();
    let mut min_misses = 999;
    for (i, score) in scores.iter().enumerate() {
        let score: Score = match serde_json::from_str(score.get()) {
            Ok(x) => x,
            Err(e) => failure::bail!(
                "{}\n{}\nFailed to parse score (beatmap id = {}, index = {})",
                e,
                score.get(),
                beatmap.beatmap_id,
                i
            ),
        };
        let mods = data::mods_from_str(&score.enabled_mods)?;
        if !mods.contains(Mods::HALF_TIME) {
            min_misses = min_misses.min(i32::from_str(&score.countmiss)?);
        }
        if u8::from_str(&score.perfect)? == 1 {
            let relevant_mods = mods & mods_mask;
            fc_count
                .entry(relevant_mods)
                .and_modify(|x| *x += 1)
                .or_insert(1);
        }
    }
    let stars = beatmap_stars(beatmap);
    let approach_rate = f64::from_str(&beatmap.diff_approach)?;
    let max_combo = max_combo(&beatmap)?;
    let pp = calc_pp(stars, approach_rate, max_combo, max_combo, 100.0, 0.0);
    Ok(serde_json::json!([
        i8::from_str(&beatmap.approved)?,
        beatmap
            .approved_date
            .as_ref()
            .map(|s| s.as_ref())
            .unwrap_or(""),
        i8::from_str(&beatmap.mode)?,
        beatmap.beatmap_id,
        beatmap.beatmapset_id,
        beatmap_title(&beatmap),
        stars,
        pp.nm,
        f64::from_str(&beatmap.hit_length)?,
        max_combo,
        approach_rate,
        f64::from_str(&beatmap.diff_size)?,
        min_misses,
        fc_count.get(&Mods::empty()).unwrap_or(&0),
        fc_count.get(&Mods::HIDDEN).unwrap_or(&0),
        fc_count.get(&Mods::HARD_ROCK).unwrap_or(&0),
        fc_count
            .get(&(Mods::HIDDEN | Mods::HARD_ROCK))
            .unwrap_or(&0),
        fc_count.get(&Mods::DOUBLE_TIME).unwrap_or(&0),
        fc_count
            .get(&(Mods::HIDDEN | Mods::DOUBLE_TIME))
            .unwrap_or(&0),
        format!("{}", update_date.format("%F")),
    ]))
}

fn each_filtered_map_with_scores(
    min_stars: f64,
    game_mode: &str,
    mut f: impl FnMut(&Beatmap, &[Box<RawValue>], &DateTime<Utc>) -> Fallible<()>,
) -> Fallible<u64> {
    let cache = scores_cache()?;
    let mut no_scores = true;

    let all_maps = each_filtered_map(min_stars, |beatmap| {
        let (scores, update_date) = match cache.get(&cache_key(&beatmap.beatmap_id, game_mode))? {
            Some(value) => {
                no_scores = false;
                let value: ScoreCacheValue =
                    serde_json::from_slice(&value).context("db content is malformed")?;
                (value.scores, value.update_date)
            }
            None => {
                eprintln!(
                    "Beatmap {} skipped: scores have not downloaded.",
                    &beatmap.beatmap_id
                );
                return Ok(());
            }
        };

        f(beatmap, &scores, &update_date)
    })?;

    if no_scores {
        failure::bail!("No scores found. First run `list-maps get-scores'.")
    }

    Ok(all_maps)
}

fn output_rows<T: std::fmt::Display>(
    all_maps: u64,
    rows: impl IntoIterator<Item = T>,
    out_path: &std::path::Path,
) -> Fallible<()> {
    println!("Writing to {}", out_path.display());
    let mut out = BufWriter::new(File::create(&out_path)?);
    writeln!(&mut out, "[")?;
    let mut rows_len = 0;
    for value in rows {
        if rows_len != 0 {
            writeln!(&mut out, ",")?;
        }
        write!(&mut out, "{}", value)?;
        rows_len += 1;
    }
    writeln!(&mut out, "\n]")?;
    drop(out);
    println!("{} / {} maps done.", rows_len, all_maps);
    Ok(())
}

fn render_maps(args: &RenderMaps) -> Fallible<()> {
    validate_game_mode_str(&args.game_mode)?;

    let mut rows = Vec::new();
    let all_maps = each_filtered_map_with_scores(
        args.min_stars,
        &args.game_mode,
        |beatmap, scores, update_date| {
            match beatmap_summary(&beatmap, &scores, &update_date) {
                Ok(summary) => {
                    rows.push((beatmap_stars(beatmap), serde_json::to_string(&summary)?));
                }
                Err(e) => {
                    eprintln!("{}\nFailed to render summary", e);
                }
            }
            Ok(())
        },
    )?;

    rows.sort_by(|x, y| y.0.partial_cmp(&x.0).unwrap());
    output_rows(all_maps, rows.into_iter().map(|t| t.1), &args.out_path)
}

fn calc_accuracy(score: &Score) -> Fallible<f64> {
    let c300 = f64::from_str(&score.count300)?;
    let c100 = f64::from_str(&score.count100)?;
    let c50 = f64::from_str(&score.count50)?;
    let ckatu = f64::from_str(&score.countkatu)?;
    let cmiss = f64::from_str(&score.countmiss)?;
    Ok(100.0 * (c300 + c100 + c50) / (c300 + c100 + c50 + ckatu + cmiss))
}

fn mod_names(mods: data::Mods) -> Vec<&'static str> {
    use osu_api::data::Mods;
    let mut names = Vec::new();
    if mods.contains(Mods::NO_FAIL) {
        names.push("NF");
    }
    if mods.contains(Mods::EASY) {
        names.push("EZ");
    }
    if mods.contains(Mods::HIDDEN) {
        names.push("HD");
    }
    if mods.contains(Mods::DOUBLE_TIME) {
        names.push(if mods.contains(Mods::NIGHTCORE) {
            "NC"
        } else {
            "DT"
        });
    }
    if mods.contains(Mods::HALF_TIME) {
        names.push("HT");
    }
    if mods.contains(Mods::HARD_ROCK) {
        names.push("HR");
    }
    if mods.contains(Mods::FLASHLIGHT) {
        names.push("FL");
    }
    if mods.contains(Mods::SUDDEN_DEATH) {
        names.push(if mods.contains(Mods::PERFECT) {
            "PF"
        } else {
            "SD"
        });
    }
    names
}

fn max_combo(beatmap: &Beatmap) -> Fallible<f64> {
    Ok(beatmap
        .max_combo
        .as_ref()
        .ok_or_else(|| failure::err_msg("max_combo is null"))?
        .parse()?)
}

fn fc_or_miss_display(beatmap: &Beatmap, score: &Score) -> Fallible<String> {
    Ok(if score.perfect == "1" {
        "FC".to_string()
    } else {
        format!(
            "{}/{}x {}m",
            score.maxcombo,
            max_combo(&beatmap)?,
            score.countmiss
        )
    })
}

fn ranking_row(beatmap: &Beatmap, score: &Score, pp: f64) -> Fallible<serde_json::Value> {
    Ok(serde_json::json!([
        beatmap_stars(beatmap),
        pp,
        score.user_id,
        score.username,
        beatmap.beatmap_id,
        beatmap.beatmapset_id,
        beatmap_title(beatmap),
        mod_names(data::mods_from_str(&score.enabled_mods)?).concat(),
        calc_accuracy(score)?,
        fc_or_miss_display(&beatmap, &score)?,
        score.date
    ]))
}

fn render_ranking(args: &RenderRanking) -> Fallible<()> {
    validate_game_mode_str(&args.game_mode)?;

    let mut rows = Vec::new();
    let all_maps =
        each_filtered_map_with_scores(args.min_stars, &args.game_mode, |beatmap, scores, _| {
            if (beatmap.mode == args.game_mode) != args.specific_maps {
                return Ok(());
            }
            for score in scores {
                let score: Score = serde_json::from_str(score.get())?;
                let pp = match &score.pp {
                    Some(s) => f64::from_str(&s).unwrap_or(0.0),
                    None => continue,
                };
                if pp.is_nan() || pp < 400.0 {
                    continue;
                }
                match ranking_row(&beatmap, &score, pp) {
                    Ok(row) => {
                        rows.push((pp, serde_json::to_string(&row)?));
                    }
                    Err(e) => {
                        eprintln!("{}\nFailed to render summary", e);
                    }
                }
            }
            Ok(())
        })?;

    rows.sort_by(|x, y| y.0.partial_cmp(&x.0).unwrap());
    output_rows(all_maps, rows.into_iter().map(|t| t.1), &args.out_path)
}

fn score_display(beatmap: &Beatmap, score: &Score, index: usize) -> Fallible<String> {
    use std::fmt::Write;
    let mod_names = mod_names(data::mods_from_str(&score.enabled_mods)?);
    let mut buf = String::new();
    buf.push_str(&score.username);
    buf.push_str(" | ");
    buf.push_str(&beatmap_title(&beatmap));
    if !mod_names.is_empty() {
        buf.push_str(" +");
        buf.push_str(&mod_names.concat());
    }
    write!(&mut buf, " {:.2}% ", calc_accuracy(&score)?).unwrap();
    buf.push_str(&fc_or_miss_display(&beatmap, &score)?);
    write!(&mut buf, " #{}", index + 1).unwrap();
    if let Some(pp) = &score.pp {
        write!(&mut buf, " | {:.0}pp", f64::from_str(&pp)?).unwrap();
    }
    Ok(buf)
}

fn find_scores(args: &FindScores) -> Fallible<()> {
    use osu_api::data::Mods;
    // Finding criteria are hardcoded for now.
    // Find high-AR DT ranked FCs.
    each_filtered_map_with_scores(4.0, "2", |beatmap, scores, _| {
        for (i, score) in scores.iter().enumerate() {
            // only ranked or approved maps
            if beatmap.approved != "1" && beatmap.approved != "2" {
                continue;
            }
            let ar = f64::from_str(&beatmap.diff_approach)?;

            let score: Score = serde_json::from_str(score.get())?;
            let mods = data::mods_from_str(&score.enabled_mods)?;
            if score.perfect != "1"
                || mods.contains(Mods::HALF_TIME)
                || !mods.contains(Mods::DOUBLE_TIME)
            {
                continue;
            }
            let ar = 10f64.min(
                ar * if mods.contains(Mods::EASY) {
                    0.5
                } else if mods.contains(Mods::HARD_ROCK) {
                    1.4
                } else {
                    1.0
                },
            );
            if ar < args.high_ar - 1e-9 {
                continue;
            }
            println!("AR{:.2}+: {}", ar, score_display(&beatmap, &score, i)?);
        }
        Ok(())
    })?;
    Ok(())
}

fn show_beatmap_sub(api: &mut ApiClient, beatmap_id: &str) -> Fallible<String> {
    let beatmaps = osu_api::GetBeatmaps::new(&api.key)
        .beatmap_id(beatmap_id)
        .request_text(&mut api.client)
        .context("get_beatmaps API failed")?;
    let beatmaps: Vec<Beatmap> = serde_json::from_str(&beatmaps).context("Broken JSON")?;
    let beatmap = beatmaps
        .first()
        .ok_or_else(|| failure::err_msg("Beatmap not found"))?;
    let stars = beatmap_stars(beatmap);
    let approach_rate = f64::from_str(&beatmap.diff_approach)?;
    let length = i32::from_str(&beatmap.hit_length)?;

    Ok(format!(
        r#"=HYPERLINK("https://osu.ppy.sh/beatmapsets/{}#fruits/{}","{}")   {}  {}  {}:{:02}"#,
        &beatmap.beatmapset_id,
        &beatmap.beatmap_id,
        beatmap_title(&beatmap),
        stars,
        approach_rate,
        length / 60,
        length % 60,
    ))
}

fn show_beatmap(_args: &ShowBeatmap) -> Fallible<()> {
    use std::io::BufRead;
    let mut api = api_client()?;
    let stdin = std::io::stdin();
    let stdin = stdin.lock();
    let beatmap_id_matcher = regex::Regex::new(r"fruits/(\d+)").unwrap();
    for line in stdin.lines() {
        let line = line?;
        for beatmap_id in beatmap_id_matcher
            .captures_iter(&line)
            .map(|cs| cs.get(1).unwrap().as_str())
        {
            println!(
                "{}",
                show_beatmap_sub(&mut api, beatmap_id)
                    .with_context(|_| format!("beatmap id {}", beatmap_id))?
            );
        }
    }
    Ok(())
}

fn main() {
    match App::from_args() {
        App::GetMaps(args) => get_maps(&args),
        App::GetScores(args) => get_scores(&args),
        App::RenderMaps(args) => render_maps(&args),
        App::RenderRanking(args) => render_ranking(&args),
        App::FindScores(args) => find_scores(&args),
        App::ShowBeatmap(args) => show_beatmap(&args),
    }
    .unwrap_or_else(|e| {
        for cause in e.iter_chain() {
            eprintln!("{}", cause);
        }
    })
}
