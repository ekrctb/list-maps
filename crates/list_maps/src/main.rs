use anyhow::Context;
use chrono::prelude::*;
use osu_api::{
    data::{self, Beatmap, Mods, Score},
    OsuApi,
};
use reqwest::Client;
use serde_derive::*;
use serde_json::value::RawValue;
use std::{
    collections::HashMap,
    fs::File,
    io::{BufWriter, Write},
    path::PathBuf,
    str::FromStr,
};
use structopt::StructOpt;

fn get_api_key() -> anyhow::Result<String> {
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
    #[structopt(name = "show-db-stat")]
    ShowDbStat(ShowDbStat),
    #[structopt(name = "compute-map-stat")]
    ComputeMapStat(ComputeMapStat),
    #[structopt(name = "compare-diff-calc")]
    CompareDiffCalc(CompareDiffCalc),
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
    #[structopt(long = "num-scores", default_value = "3")]
    num_scores: i32,
    #[structopt(long = "num-dt-scores", default_value = "3")]
    num_dt_scores: i32,
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

#[derive(Debug, StructOpt)]
struct ShowDbStat {}

#[derive(Debug, StructOpt)]
struct ComputeMapStat {
    #[structopt(long = "min-stars", default_value = "0")]
    min_stars: f64,
    #[structopt(long = "include-loved")]
    include_loved: bool,
    #[structopt(long = "game-mode", default_value = "2")]
    game_mode: String,
    #[structopt(long = "include-converts")]
    include_converts: Option<bool>,
}

#[derive(Debug, StructOpt)]
struct CompareDiffCalc {}

fn reqwest_client() -> anyhow::Result<Client> {
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

fn api_client() -> anyhow::Result<ApiClient> {
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

fn retry_forever<T>(name: &str, mut f: impl FnMut() -> anyhow::Result<T>) -> T {
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
) -> anyhow::Result<()> {
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
                anyhow::bail!("Cannot make a progress")
            }
        }

        last_date = next_date;

        sleep_secs(20);
    }
}

fn beatmaps_cache() -> anyhow::Result<sled::Db> {
    Ok(sled::Db::start_default("db/beatmaps")?)
}

fn beatmaps_cache_old() -> anyhow::Result<sled::Db> {
    Ok(sled::Db::start_default("db/beatmaps_old")?)
}

fn get_maps(args: &GetMaps) -> anyhow::Result<()> {
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

fn scores_cache() -> anyhow::Result<sled::Db> {
    Ok(sled::Db::start_default("db/scores")?)
}

fn beatmap_stars(beatmap: &Beatmap) -> f64 {
    f64::from_str(&beatmap.difficultyrating).unwrap_or(0.0)
}

fn each_filtered_map(
    min_stars: f64,
    mut f: impl FnMut(&Beatmap) -> anyhow::Result<()>,
) -> anyhow::Result<u64> {
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
        anyhow::bail!("No maps found. First run `list-maps get-maps'.")
    }

    Ok(all_maps)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ScoreCacheValue {
    pub update_date: DateTime<Utc>,
    pub scores: Vec<Box<RawValue>>,
    #[serde(default)]
    pub no_more_scores: bool,
    #[serde(default)]
    pub dt_scores: Vec<Box<RawValue>>,
}

fn validate_game_mode_str(game_mode: &str) -> anyhow::Result<()> {
    let _ = data::game_mode_from_str(game_mode).context("Invalid game mode")?;
    Ok(())
}

#[derive(Default)]
struct Scores {
    pub scores: Vec<Box<RawValue>>,
    pub no_more_scores: bool,
}

fn get_scores_for(
    beatmap_id: &str,
    game_mode: &str,
    mods: Option<Mods>,
    num_scores: i32,
    api: &mut ApiClient,
) -> anyhow::Result<Scores> {
    let scores: Vec<Box<RawValue>> = retry_forever("get_scores", || {
        let mut request = osu_api::GetScores::new(&api.key, beatmap_id);
        request.mode(game_mode);
        if let Some(mods) = mods {
            request.mods(mods.bits() as i32);
        }
        request.limit(num_scores);
        let text = request.request_text(&mut api.client)?;
        Ok(serde_json::from_str(&text).context("malformed JSON")?)
    });
    let no_more_scores = (scores.len() as i32) < num_scores;
    Ok(Scores {
        scores,
        no_more_scores,
    })
}

fn get_scores(args: &GetScores) -> anyhow::Result<()> {
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
            let unexpired = match args.cache_expire {
                Some(dt) => value.update_date >= dt,
                None => true,
            };
            if unexpired {
                return Ok(());
            }
        }

        let mut fetch = |mods, num_scores| -> anyhow::Result<Scores> {
            if num_scores <= 0 {
                return Ok(Scores::default());
            }

            let scores = get_scores_for(
                &beatmap.beatmap_id,
                &args.game_mode,
                mods,
                num_scores,
                &mut api,
            )?;

            fetch_count += 1;
            println!(
                "{} {} {}: {} scores",
                count,
                beatmap_title(&beatmap),
                mods.map(|mods| mod_names(mods).concat())
                    .unwrap_or("".to_string()),
                scores.scores.len(),
            );
            sleep_secs(2);

            Ok(scores)
        };

        let update_date = Utc::now();

        let all_mods = fetch(None, args.num_scores)?;
        let dt = fetch(Some(Mods::DOUBLE_TIME), args.num_dt_scores)?;
        let hddt = fetch(Some(Mods::DOUBLE_TIME | Mods::HIDDEN), args.num_dt_scores)?;

        let dt_scores = dt.scores.into_iter().chain(hddt.scores).collect();

        let cache_value = ScoreCacheValue {
            update_date,
            scores: all_mods.scores,
            no_more_scores: all_mods.no_more_scores,
            dt_scores,
        };

        cache.set(&key, serde_json::to_vec(&cache_value)?)?;

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

#[derive(Ord, PartialOrd, Eq, PartialEq)]
pub enum PPVer {
    V1,
    V2,
}

fn calc_pp(
    ver: PPVer,
    stars: f64,
    approach_rate: f64,
    max_combo: f64,
    combo: f64,
    accuracy: f64,
    num_misses: f64,
) -> CalculatedPp {
    let mut pp = f64::powf(5.0 * f64::max(1.0, stars / 0.0049) - 4.0, 2.0) / 100_000.0;

    let (lb_mul, lb_threshold) = match ver {
        PPVer::V1 => ((0.4, 0.5), 3000.0),
        PPVer::V2 => ((0.3, 0.475), 2500.0),
    };

    let mut length_bonus = 0.95 + lb_mul.0 * f64::min(1.0, max_combo / lb_threshold);
    if max_combo > lb_threshold {
        length_bonus += (max_combo / lb_threshold).log10() * lb_mul.1;
    }
    pp *= length_bonus;

    let mut ar_bonus = 1.0;
    if ver >= PPVer::V2 && approach_rate > 10.0 {
        ar_bonus += 0.1 * (approach_rate - 10.0);
    }
    if approach_rate > 9.0 {
        ar_bonus += 0.1 * (approach_rate - 9.0);
    }
    if approach_rate < 8.0 {
        ar_bonus += 0.025 * (8.0 - approach_rate);
    }
    pp *= ar_bonus;

    pp *= f64::powf(0.97, num_misses);
    if max_combo > 0.0 {
        pp *= f64::powf(combo / max_combo, 0.8);
    }
    pp *= f64::powf(accuracy / 100.0, 5.5);

    let hd_bonus = match ver {
        PPVer::V1 => 1.05 + 0.075 * (10.0 - f64::min(10.0, approach_rate)),
        PPVer::V2 => {
            if approach_rate > 10.0 {
                1.01 + 0.04 * (11.0 - approach_rate)
            } else {
                1.05 + 0.075 * (10.0 - approach_rate)
            }
        }
    };

    let fl_bonus = 1.35 * length_bonus;

    CalculatedPp {
        nm: pp,
        hd: pp * hd_bonus,
        fl: pp * fl_bonus,
        hdfl: pp * hd_bonus * fl_bonus,
    }
}

struct BeatmapDifficulty {
    stars: f64,
    approach_rate: f64,
    circle_size: f64,
    max_combo: f64,
    hit_length: f64,
    total_length: f64,
}

fn beatmap_difficulty(beatmap: &Beatmap) -> anyhow::Result<BeatmapDifficulty> {
    let stars = beatmap_stars(beatmap);
    let approach_rate = f64::from_str(&beatmap.diff_approach)?;
    let circle_size = f64::from_str(&beatmap.diff_size)?;
    let max_combo = max_combo(&beatmap).unwrap_or(0.0);
    let hit_length = f64::from_str(&beatmap.hit_length)?;
    let total_length = f64::from_str(&beatmap.total_length)?;
    Ok(BeatmapDifficulty {
        stars,
        approach_rate,
        circle_size,
        max_combo,
        hit_length,
        total_length,
    })
}

fn get_fc_level(fc_count: &HashMap<Mods, i32>, min_misses: i32) -> i32 {
    let get = |mods| fc_count.get(&mods).cloned().unwrap_or(0);
    let get_contains = |mods| -> i32 {
        fc_count
            .iter()
            .filter(|(k, _)| k.contains(mods))
            .map(|x| x.1)
            .sum()
    };

    let hrdt_plus = get_contains(Mods::HARD_ROCK | Mods::DOUBLE_TIME);
    let dt_plus = get_contains(Mods::DOUBLE_TIME);
    let hr = get(Mods::HARD_ROCK);
    let hdhr = get(Mods::HIDDEN | Mods::HARD_ROCK);
    let hd = get(Mods::HIDDEN);
    let nm = get(Mods::empty());
    let ez_plus = get_contains(Mods::EASY);
    let fl_plus = get_contains(Mods::FLASHLIGHT);
    let ezfl = get(Mods::EASY | Mods::FLASHLIGHT);

    if hrdt_plus != 0 {
        return 10;
    }
    if dt_plus != 0 {
        return 9;
    }
    if fl_plus - ezfl != 0 {
        return 8;
    }
    if ezfl != 0 {
        return 7;
    }
    if hdhr != 0 {
        return 6;
    }
    if hr != 0 {
        return 5;
    }
    if hd != 0 {
        return 4;
    }
    if nm != 0 {
        return 3;
    }
    if ez_plus != 0 {
        return 2;
    }

    -min_misses
}

fn beatmap_summary(
    beatmap: &Beatmap,
    scores: &[Box<RawValue>],
    update_date: &DateTime<Utc>,
) -> anyhow::Result<serde_json::Value> {
    let mut fc_count = HashMap::new();
    let mut min_misses = 999;
    for (i, score) in scores.iter().enumerate() {
        let score: Score = match serde_json::from_str(score.get()) {
            Ok(x) => x,
            Err(e) => anyhow::bail!(
                "{}\n{}\nFailed to parse score (beatmap id = {}, index = {})",
                e,
                score.get(),
                beatmap.beatmap_id,
                i
            ),
        };
        let mods = data::mods_from_str(&score.enabled_mods)? & Mods::CATCH_DIFFICULTY_MASK;
        if mods.contains(Mods::HALF_TIME) {
            continue;
        }
        min_misses = min_misses.min(i32::from_str(&score.countmiss)?);
        if score.perfect == "1" {
            fc_count.entry(mods).and_modify(|x| *x += 1).or_insert(1);
        }
    }

    let diff = beatmap_difficulty(&beatmap)?;
    let ss_pp = calc_pp(
        PPVer::V2,
        diff.stars,
        diff.approach_rate,
        diff.max_combo,
        diff.max_combo,
        100.0,
        0.0,
    );
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
        diff.stars,
        ss_pp.nm,
        diff.hit_length,
        diff.max_combo,
        diff.approach_rate,
        diff.circle_size,
        get_fc_level(&fc_count, min_misses),
        format!("{}", update_date.format("%F")),
    ]))
}

fn each_filtered_map_with_scores(
    min_stars: f64,
    game_mode: &str,
    mut f: impl FnMut(&Beatmap, &[Box<RawValue>], &DateTime<Utc>) -> anyhow::Result<()>,
) -> anyhow::Result<u64> {
    let cache = scores_cache()?;
    let mut no_scores = true;
    let mut num_skipped = 0;

    let all_maps = each_filtered_map(min_stars, |beatmap| {
        let (scores, update_date) = match cache.get(&cache_key(&beatmap.beatmap_id, game_mode))? {
            Some(value) => {
                no_scores = false;
                let value: ScoreCacheValue =
                    serde_json::from_slice(&value).context("db content is malformed")?;
                let scores: Vec<_> = value.scores.into_iter().chain(value.dt_scores).collect();
                (scores, value.update_date)
            }
            None => {
                num_skipped += 1;
                return Ok(());
            }
        };

        f(beatmap, &scores, &update_date)
    })?;

    if num_skipped != 0 {
        eprintln!(
            "{} beatmaps skipped: scores have not downloaded.",
            num_skipped
        );
    }

    if no_scores {
        anyhow::bail!("No scores found. First run `list-maps get-scores'.")
    }

    Ok(all_maps)
}

fn output_rows<T: std::fmt::Display>(
    all_maps: u64,
    rows: impl IntoIterator<Item = T>,
    out_path: &std::path::Path,
) -> anyhow::Result<()> {
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

fn render_maps(args: &RenderMaps) -> anyhow::Result<()> {
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

fn calc_accuracy(score: &Score) -> anyhow::Result<f64> {
    let c300 = f64::from_str(&score.count300)?;
    let c100 = f64::from_str(&score.count100)?;
    let c50 = f64::from_str(&score.count50)?;
    let ckatu = f64::from_str(&score.countkatu)?;
    let cmiss = f64::from_str(&score.countmiss)?;
    Ok(100.0 * (c300 + c100 + c50) / (c300 + c100 + c50 + ckatu + cmiss))
}

fn mod_names(mods: Mods) -> Vec<&'static str> {
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

fn max_combo(beatmap: &Beatmap) -> Option<f64> {
    beatmap.max_combo.as_ref().and_then(|s| s.parse().ok())
}

fn fc_or_miss_display(beatmap: &Beatmap, score: &Score) -> anyhow::Result<String> {
    Ok(if score.perfect == "1" {
        "FC".to_string()
    } else {
        format!(
            "{}/{}x {}m",
            score.maxcombo,
            max_combo(&beatmap).unwrap_or(0.0),
            score.countmiss
        )
    })
}

fn ranking_row(beatmap: &Beatmap, score: &Score, pp: f64) -> anyhow::Result<serde_json::Value> {
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

fn render_ranking(args: &RenderRanking) -> anyhow::Result<()> {
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

fn score_display(beatmap: &Beatmap, score: &Score, index: usize) -> anyhow::Result<String> {
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

fn find_scores(args: &FindScores) -> anyhow::Result<()> {
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

fn show_beatmap_sub(api: &mut ApiClient, beatmap_id: &str) -> anyhow::Result<String> {
    let beatmaps = osu_api::GetBeatmaps::new(&api.key)
        .beatmap_id(beatmap_id)
        .request_text(&mut api.client)
        .context("get_beatmaps API failed")?;
    let beatmaps: Vec<Beatmap> = serde_json::from_str(&beatmaps).context("Broken JSON")?;
    let beatmap = beatmaps
        .first()
        .ok_or_else(|| anyhow::Error::msg("Beatmap not found"))?;
    let diff = beatmap_difficulty(&beatmap)?;

    Ok(format!(
        "=HYPERLINK(\"https://osu.ppy.sh/beatmapsets/{}#fruits/{}\",\"{}\")\t{}\t{}\t{}:{:02}",
        &beatmap.beatmapset_id,
        &beatmap.beatmap_id,
        beatmap_title(&beatmap),
        diff.stars,
        diff.approach_rate,
        (diff.hit_length as i64) / 60,
        (diff.hit_length as i64) % 60,
    ))
}

fn show_beatmap(_args: &ShowBeatmap) -> anyhow::Result<()> {
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
                    .with_context(|| format!("beatmap id {}", beatmap_id))?
            );
        }
    }
    Ok(())
}

fn show_db_stat(_args: &ShowDbStat) -> anyhow::Result<()> {
    let cache = scores_cache()?;
    let mut more_than_1 = 0;
    let mut more_than_10 = 0;
    let mut only_1 = 0;
    let mut total = 0;
    let mut count = 0;
    for entry in cache.iter() {
        let value: ScoreCacheValue = serde_json::from_slice(&entry?.1)?;
        let len = value.scores.len();
        if len > 10 {
            more_than_10 += 1;
        }
        if len > 1 {
            more_than_1 += 1;
        }
        if len == 1 {
            only_1 += 1;
        }
        total += len as u64;
        count += 1;
    }
    println!("count = {}", count);
    println!("average = {}", (total * 100 / count) as f64 / 100.0);
    println!("more_than_1 = {}", more_than_1);
    println!("more_than_10 = {}", more_than_10);
    println!("only_1 = {}", only_1);
    Ok(())
}

fn compute_map_stat(args: &ComputeMapStat) -> anyhow::Result<()> {
    let include_converts = args.include_converts.unwrap_or(true);
    let mut count = 0u64;
    let mut total_length = 0.0;
    let mut hit_length = 0.0;
    each_filtered_map(args.min_stars, |beatmap| {
        if !args.include_loved && (beatmap.approved != "1" && beatmap.approved != "2") {
            return Ok(());
        }
        if beatmap.mode != args.game_mode && !(include_converts && beatmap.mode == "0") {
            return Ok(());
        }
        count += 1;
        let diff = beatmap_difficulty(&beatmap)?;
        total_length += diff.total_length;
        hit_length += diff.hit_length;
        Ok(())
    })?;
    println!("Beatmap statistics for min_stars = {}", args.min_stars);
    println!("count = {}", count);
    println!("total_length = {}", total_length);
    println!("hit_length = {}", hit_length);
    Ok(())
}

fn compare_diff_calc(_args: &CompareDiffCalc) -> anyhow::Result<()> {
    let new_maps = beatmaps_cache()?;
    let old_maps = beatmaps_cache_old().context("Cannot open beatmaps_old database")?;

    let mut big_diff_maps = Vec::new();

    for entry in old_maps.iter() {
        let (key, old_entry) = entry.context("db")?;
        let new_entry;

        let old_map: Beatmap = serde_json::from_slice(&old_entry).context("db entry")?;

        let new_map: Beatmap = match new_maps.get(&key)? {
            None => {
                eprintln!("Not found in the new DB: {}", beatmap_title(&old_map));
                continue;
            }
            Some(entry) => {
                new_entry = entry;
                serde_json::from_slice(&new_entry).context("db entry")?
            }
        };

        if new_map.approved != "1" && new_map.approved != "2" {
            continue;
        }

        let old_diff = beatmap_difficulty(&old_map)?;
        let new_diff = beatmap_difficulty(&new_map)?;

        let ar = old_diff.approach_rate;
        let stars = (old_diff.stars, new_diff.stars);
        let combo = (old_diff.max_combo, new_diff.max_combo);

        let old_pp = calc_pp(PPVer::V1, stars.0, ar, combo.0, combo.0, 100.0, 0.0);
        let new_pp = calc_pp(PPVer::V2, stars.1, ar, combo.1, combo.1, 100.0, 0.0);

        let old_pp = old_pp.nm;
        let new_pp = new_pp.nm;
        if (new_pp - old_pp).abs() > 100.0 {
            big_diff_maps.push(((old_pp, new_pp), beatmap_title(&old_map)));
        }
    }

    big_diff_maps.sort_by_key(|(pp, _)| ordered_float::NotNan::new(-(pp.0 - pp.1).abs()).unwrap());
    use std::cmp::Ordering;
    for &ord in &[Ordering::Less, Ordering::Greater] {
        for (pp, title) in &big_diff_maps {
            if pp.0.partial_cmp(&pp.1) != Some(ord) {
                continue;
            }

            println!("{}: {:.0}pp -> {:.0}pp", title, pp.0, pp.1);
        }

        println!();
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
        App::ShowDbStat(args) => show_db_stat(&args),
        App::ComputeMapStat(args) => compute_map_stat(&args),
        App::CompareDiffCalc(args) => compare_diff_calc(&args),
    }
    .unwrap_or_else(|e| {
        eprintln!("{:#}", e);
    })
}
