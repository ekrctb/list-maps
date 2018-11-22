extern crate chrono;
extern crate failure;
extern crate osu_api;
extern crate reqwest;
extern crate serde;
extern crate serde_derive;
extern crate serde_json;
extern crate sled;
extern crate structopt;

use chrono::prelude::*;
use failure::{Fallible, ResultExt};
use osu_api::{
    data::{self, Beatmap},
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
}

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
            let text = osu_api::GetBeatmaps::new(api.key.as_ref())
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

fn beatmaps_cache() -> Fallible<sled::Tree> {
    Ok(sled::Tree::start_default("db/beatmaps")?)
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

fn scores_cache() -> Fallible<sled::Tree> {
    Ok(sled::Tree::start_default("db/scores")?)
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
    each_filtered_map(args.min_stars, |beatmap| {
        count += 1;
        let key = cache_key(&beatmap.beatmap_id, &args.game_mode);
        if let Some(value) = cache.get(&key)? {
            let value: ScoreCacheValue =
                serde_json::from_slice(&value).context("db content malformed")?;
            if match args.cache_expire {
                Some(dt) => value.update_date < dt,
                None => true,
            } {
                eprintln!("Beatmap {} skipped: scores have not downloaded.",
                    &beatmap.beatmap_id);
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

    println!("{} maps done!", count);

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

fn beatmap_summary(beatmap: &Beatmap, scores: &[Box<RawValue>]) -> Fallible<serde_json::Value> {
    use osu_api::data::Mods;
    let mods_mask = Mods::Easy
        | Mods::Hidden
        | Mods::HardRock
        | Mods::DoubleTime
        | Mods::HalfTime
        | Mods::Flashlight;
    let mut fc_count = std::collections::HashMap::new();
    let mut min_misses = 999;
    for (i, score) in scores.iter().enumerate() {
        let score: data::Score = match serde_json::from_str(score.get()) {
            Ok(x) => x,
            Err(e) => failure::bail!(
                "{}\n{}\nFailed to parse score (beatmap id = {}, index = {})",
                e,
                score.get(),
                beatmap.beatmap_id,
                i
            ),
        };
        min_misses = min_misses.min(i32::from_str(&score.countmiss)?);
        if u8::from_str(&score.perfect)? == 1 {
            let relevant_mods = data::mods_from_str(&score.enabled_mods)? & mods_mask;
            fc_count
                .entry(relevant_mods)
                .and_modify(|x| *x += 1)
                .or_insert(1);
        }
    }
    let stars = beatmap_stars(beatmap);
    let approach_rate = f64::from_str(&beatmap.diff_approach)?;
    let max_combo = beatmap
        .max_combo
        .as_ref()
        .map(|s| f64::from_str(&s))
        .unwrap_or(Ok(0.0))?;
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
        fc_count.get(&Mods::Hidden).unwrap_or(&0),
        fc_count.get(&Mods::HardRock).unwrap_or(&0),
        fc_count.get(&(Mods::Hidden | Mods::HardRock)).unwrap_or(&0),
        fc_count.get(&Mods::DoubleTime).unwrap_or(&0),
        fc_count
            .get(&(Mods::Hidden | Mods::DoubleTime))
            .unwrap_or(&0),
    ]))
}

fn render_maps(args: &RenderMaps) -> Fallible<()> {
    validate_game_mode_str(&args.game_mode)?;
    let mut rows = Vec::new();
    let cache = scores_cache()?;
    let mut no_scores = true;
    let all_maps = each_filtered_map(args.min_stars, |beatmap| {
        let scores = match cache.get(&cache_key(&beatmap.beatmap_id, &args.game_mode))? {
            Some(value) => {
                no_scores = false;
                let value: ScoreCacheValue =
                    serde_json::from_slice(&value).context("db content is malformed")?;
                value.scores
            }
            None => return Ok(()),
        };
        match beatmap_summary(&beatmap, &scores) {
            Ok(summary) => {
                rows.push((beatmap_stars(beatmap), serde_json::to_string(&summary)?));
            }
            Err(e) => {
                eprintln!("{}\nFailed to render summary", e);
            }
        }
        Ok(())
    })?;

    if no_scores {
        failure::bail!("No scores found. First run `list-maps get-scores'.")
    }

    rows.sort_by(|x, y| y.0.partial_cmp(&x.0).unwrap());
    let rows_len = rows.len();

    println!("Writing to {}", args.out_path.display());
    let mut out = BufWriter::new(File::create(&args.out_path)?);
    writeln!(&mut out, "[")?;
    for (i, (_, value)) in rows.into_iter().enumerate() {
        if i != 0 {
            writeln!(&mut out, ",")?;
        }
        write!(&mut out, "{}", value)?;
    }
    writeln!(&mut out, "\n]")?;
    drop(out);
    println!("{} / {} maps done.", rows_len, all_maps);

    Ok(())
}

fn main() {
    match App::from_args() {
        App::GetMaps(args) => get_maps(&args),
        App::GetScores(args) => get_scores(&args),
        App::RenderMaps(args) => render_maps(&args),
    }
    .unwrap_or_else(|e| {
        for cause in e.iter_chain() {
            eprintln!("{}", cause);
        }
    })
}
