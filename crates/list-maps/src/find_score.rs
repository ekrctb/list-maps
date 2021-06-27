use std::cmp::Reverse;

use bstr::BString;
use colored::{ColoredString, Colorize};
use ordered_float::OrderedFloat;
use osu_db_dump::{Db, Mods};

#[derive(serde::Deserialize)]
pub struct BeatmapSet {
    pub beatmapset_id: u32,
    pub artist: BString,
    pub title: BString,
}

#[derive(serde::Deserialize)]
pub struct Beatmap {
    pub beatmap_id: u32,
    pub beatmapset_id: u32,
    pub version: BString,
    pub diff_approach: f32,
}

#[derive(serde::Deserialize)]
pub struct User {
    pub user_id: u32,
    pub username: String,
}

#[derive(serde::Deserialize)]
pub struct Score {
    pub score_id: u32,
    pub beatmap_id: u32,
    pub user_id: u32,
    pub countmiss: u16,
    pub enabled_mods: osu_db_dump::Mods,
    pub date: BString,
    pub pp: Option<f32>,
}

list_maps::impl_has_primary_id! {
    beatmapset_id for BeatmapSet;
    beatmap_id for Beatmap;
    user_id for User;
    score_id for Score;
}

pub fn difficulty_to_value(difficulty: f64, min: f64, mid: f64, max: f64) -> f64 {
    if difficulty > 5.0 {
        mid + (max - mid) * (difficulty - 5.0) / 5.0
    } else {
        mid - (mid - min) * (5.0 - difficulty) / 5.0
    }
}

pub fn value_to_difficulty(value: f64, min: f64, mid: f64, max: f64) -> f64 {
    assert!(min < max || max < min);
    if (mid < value) == (min < max) {
        (value - mid) / (max - mid) * 5.0 + 5.0
    } else {
        5.0 - (mid - value) / (mid - min) * 5.0
    }
}

pub fn calculate_ar_with_clock_rate(ar: f64, rate: f64) -> f64 {
    const MIN: f64 = 1800.0;
    const MID: f64 = 1200.0;
    const MAX: f64 = 450.0;
    let preempt = difficulty_to_value(ar, MIN, MID, MAX);
    value_to_difficulty(preempt / rate, MIN, MID, MAX)
}

fn get_effective_ar(map: &Beatmap, score: &Score) -> f64 {
    let mut ar = map.diff_approach as f64;
    if score.enabled_mods.contains(Mods::EASY) {
        ar *= 0.5;
    }
    if score.enabled_mods.contains(Mods::HARD_ROCK) {
        ar = f64::min(ar * 1.4, 10.0);
    }
    let mut rate = 1.0;
    if score.enabled_mods.contains(Mods::DOUBLE_TIME) {
        rate *= 1.5
    }
    if score.enabled_mods.contains(Mods::HALF_TIME) {
        rate *= 0.75
    }
    calculate_ar_with_clock_rate(ar, rate)
}

fn bold_if(string: String, cond: bool) -> ColoredString {
    if cond {
        string.bold()
    } else {
        string.normal()
    }
}

struct ScoreInfo<'a> {
    set: &'a BeatmapSet,
    map: &'a Beatmap,
    user: Option<&'a User>,
    score: Score,
    pp: f64,
    effective_ar: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, clap::Clap)]
pub enum ScoreSortMethod {
    #[clap(about = "No sorting is performed and scores are displayed immediately.")]
    NoSorting,
    #[clap(about = "Sort the scores from highest pp to lowest pp.")]
    Pp,
}

#[derive(clap::Clap)]
#[clap(about = "Find scores with certain criteria.")]
pub struct Opts {
    #[clap(
        long = "sort",
        about = "Sort the result using this method.",
        arg_enum,
        default_value = "no-sorting"
    )]
    sort: ScoreSortMethod,

    #[clap(
        long = "ar-ge",
        name = "AR",
        about = "Find scores with effective AR greater or equal to this value."
    )]
    ar_ge: Option<f64>,
    #[clap(
        long = "pp-ge",
        name = "PP",
        about = "Find scores with pp greater or equal to this value."
    )]
    pp_ge: Option<f64>,

    #[clap(
        long = "miss-le",
        about = "Find scores with miss count less or equal to this value."
    )]
    miss_le: Option<u32>,
    #[clap(
        long = "perfect",
        about = "Find scores with no misses.",
        conflicts_with = "miss_le"
    )]
    perfect: bool,

    #[clap(long = "no-nf", about = "Exclude scores with NoFail mod enabled.")]
    no_nf: bool,
    #[clap(long = "no-ez", about = "Exclude scores with Easy mod enabled.")]
    no_ez: bool,
    #[clap(long = "no-hd", about = "Exclude scores with Hidden mod enabled.")]
    no_hd: bool,
    #[clap(
        long = "no-dt",
        about = "Exclude scores with DoubleTime (or NightCore) mod enabled."
    )]
    no_dt: bool,
    #[clap(long = "no-ht", about = "Exclude scores with HalfTime mod enabled.")]
    no_ht: bool,
    #[clap(long = "no-hr", about = "Exclude scores with HardRock mod enabled.")]
    no_hr: bool,
    #[clap(long = "no-fl", about = "Exclude scores with FlashLight mod enabled.")]
    no_fl: bool,

    #[clap(long = "nf", about = "Find scores with NoFail mod enabled.")]
    require_nf: bool,
    #[clap(long = "ez", about = "Find scores with Easy mod enabled.")]
    require_ez: bool,
    #[clap(long = "hd", about = "Find scores with Hidden mod enabled.")]
    require_hd: bool,
    #[clap(
        long = "dt",
        about = "Find scores with DoubleTime (or NightCore) mod enabled."
    )]
    require_dt: bool,
    #[clap(long = "ht", about = "Find scores with HalfTime mod enabled.")]
    require_ht: bool,
    #[clap(long = "hr", about = "Find scores with HardRock mod enabled.")]
    require_hr: bool,
    #[clap(long = "fl", about = "Find scores with FlashLight mod enabled.")]
    require_fl: bool,
}

fn cond_mod(cond: bool, mods: Mods) -> Mods {
    if cond {
        mods
    } else {
        Mods::empty()
    }
}

fn mods_from_flags(nf: bool, ez: bool, hd: bool, dt: bool, ht: bool, hr: bool, fl: bool) -> Mods {
    cond_mod(nf, Mods::NO_FAIL)
        | cond_mod(ez, Mods::EASY)
        | cond_mod(hd, Mods::HIDDEN)
        | cond_mod(dt, Mods::DOUBLE_TIME)
        | cond_mod(ht, Mods::HALF_TIME)
        | cond_mod(hr, Mods::HARD_ROCK)
        | cond_mod(fl, Mods::FLASHLIGHT)
}

impl Opts {
    pub fn run(&self, super_opts: &super::Opts) -> anyhow::Result<()> {
        let sets = super_opts.load_all::<BeatmapSet>(Db::Beatmapsets)?;
        let maps = super_opts.load_all::<Beatmap>(Db::Beatmaps)?;
        let users = super_opts.load_all::<User>(Db::SampleUsers)?;

        let exclude_mods = mods_from_flags(
            self.no_nf, self.no_ez, self.no_hd, self.no_dt, self.no_ht, self.no_hr, self.no_fl,
        );
        let required_mods = mods_from_flags(
            self.require_nf,
            self.require_ez,
            self.require_hd,
            self.require_dt,
            self.require_ht,
            self.require_hr,
            self.require_fl,
        );

        let ar_ge = self.ar_ge.unwrap_or(f64::NEG_INFINITY);
        let pp_ge = self.pp_ge.unwrap_or(f64::NEG_INFINITY);
        let miss_le = if self.perfect {
            0
        } else {
            self.miss_le.unwrap_or(u32::MAX)
        };

        let display_immediately = self.sort == ScoreSortMethod::NoSorting;

        let mut total_count = 0u64;
        let mut satisfied_count = 0u64;
        let mut scores_to_sort = Vec::new();

        for score in super_opts.deserialize_iter(Db::ScoresFruitsHigh)? {
            total_count += 1;

            let score: Score = score?;
            let (set, map) = match maps
                .get(&score.beatmap_id)
                .and_then(|map| sets.get(&map.beatmapset_id).map(|set| (set, map)))
            {
                None => continue,
                Some(info) => info,
            };

            if score.enabled_mods.intersects(exclude_mods) {
                continue;
            }

            if !score.enabled_mods.contains(required_mods) {
                continue;
            }

            if (score.countmiss as u32) > miss_le {
                continue;
            }

            let effective_ar = get_effective_ar(map, &score);
            if effective_ar < ar_ge - 1e-9 {
                continue;
            }

            let pp = score.pp.unwrap_or_default() as f64;
            if pp < pp_ge {
                continue;
            }

            let user = users.get(&score.user_id);
            let info = ScoreInfo {
                set,
                map,
                user,
                score,
                pp,
                effective_ar,
            };

            if display_immediately {
                self.display_score(&info);
            } else {
                scores_to_sort.push(info);
            }

            satisfied_count += 1;
        }

        if !display_immediately {
            match self.sort {
                ScoreSortMethod::NoSorting => {}
                ScoreSortMethod::Pp => {
                    scores_to_sort.sort_by_key(|info| Reverse(OrderedFloat(info.pp)))
                }
            }

            for info in scores_to_sort {
                self.display_score(&info);
            }
        }

        eprintln!(
            "{} / {} scores satified the criteria.",
            satisfied_count, total_count
        );

        Ok(())
    }

    fn display_score(&self, info: &ScoreInfo) {
        let ScoreInfo {
            set,
            map,
            user,
            score,
            pp,
            effective_ar,
        } = info;

        let user_name = user.map(|user| user.username.as_str()).unwrap_or("???");

        let miss_format = if score.countmiss == 0 {
            "".to_string()
        } else {
            format!(" {}xMiss", score.countmiss)
        };

        println!(
            "{user} | {artist} - {title} [{version}]{mods}{miss} {pp} {ar} | {date} <https://osu.ppy.sh/scores/fruits/{score_id}>",
            user = user_name,
            artist = set.artist,
            title = set.title,
            version = map.version,
            mods = score.enabled_mods.format_plus(),
            miss = miss_format,
            pp = bold_if(format!("{:.0}pp", pp), self.pp_ge.is_some()),
            ar = bold_if(format!("AR{:.2}", effective_ar), self.ar_ge.is_some()),
            date = score.date,
            score_id = score.score_id
        );
    }
}
