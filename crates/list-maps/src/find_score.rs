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
    pub diff_size: f32,
    pub playmode: u8,
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

pub fn calculate_effective_ar(ar: f64, rate: f64) -> f64 {
    const MIN: f64 = 1800.0;
    const MID: f64 = 1200.0;
    const MAX: f64 = 450.0;
    let preempt = difficulty_to_value(ar, MIN, MID, MAX);
    value_to_difficulty(preempt / rate, MIN, MID, MAX)
}

pub fn calculate_effective_cs(cs: f64, rate: f64) -> f64 {
    const MIN: f64 = 1.7;
    const MID: f64 = 1.0;
    const MAX: f64 = 0.3;
    let scale = difficulty_to_value(cs, MIN, MID, MAX);
    value_to_difficulty(scale / rate, MIN, MID, MAX)
}

pub fn get_clock_rate(mods: Mods) -> f64 {
    let mut rate = 1.0;
    if mods.contains(Mods::DOUBLE_TIME) {
        rate *= 1.5
    }
    if mods.contains(Mods::HALF_TIME) {
        rate *= 0.75
    }
    rate
}

fn get_effective_ar(map: &Beatmap, score: &Score) -> f64 {
    let mut ar = map.diff_approach as f64;
    if score.enabled_mods.contains(Mods::EASY) {
        ar *= 0.5;
    }
    if score.enabled_mods.contains(Mods::HARD_ROCK) {
        ar = f64::min(ar * 1.4, 10.0);
    }
    calculate_effective_ar(ar, get_clock_rate(score.enabled_mods))
}

fn get_effective_cs(map: &Beatmap, score: &Score) -> f64 {
    let mut cs = map.diff_size as f64;
    if score.enabled_mods.contains(Mods::EASY) {
        cs *= 0.5;
    }
    if score.enabled_mods.contains(Mods::HARD_ROCK) {
        cs = f64::min(cs * 1.3, 10.0);
    }
    calculate_effective_cs(cs, get_clock_rate(score.enabled_mods))
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
    effective_cs: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, clap::Clap)]
pub enum ScoreSortMethod {
    #[clap(about = "No sorting is performed and scores are displayed immediately.")]
    NoSorting,
    #[clap(about = "Highest pp first.")]
    Pp,
    #[clap(about = "Highest effective AR first.")]
    Ar,
    #[clap(about = "Highest effective CS first.")]
    Cs,
    #[clap(about = "Newest scores first.")]
    New,
    #[clap(about = "Oldest scores first.")]
    Old,
}

impl ScoreSortMethod {
    fn is_date(self) -> bool {
        self == Self::New || self == Self::Old
    }

    fn sort(self, scores: &mut Vec<ScoreInfo>) {
        match self {
            Self::NoSorting => {}
            Self::Pp => scores.sort_by_key(|info| Reverse(OrderedFloat(info.pp))),
            Self::Ar => scores.sort_by_key(|i| Reverse(OrderedFloat(i.effective_ar))),
            Self::Cs => scores.sort_by_key(|i| Reverse(OrderedFloat(i.effective_cs))),
            Self::New => scores.sort_by(|x, y| y.score.date.cmp(&x.score.date)),
            Self::Old => scores.sort_by(|x, y| x.score.date.cmp(&y.score.date)),
        }
    }
}

#[derive(clap::Clap)]
#[clap(about = "Find scores using specified criteria.")]
pub struct Opts {
    #[clap(
        long = "sort",
        about = "Sort the result using this method.",
        arg_enum,
        default_value = "no-sorting"
    )]
    sort_method: ScoreSortMethod,

    #[clap(
        long = "limit",
        about = "Only display specified number of scores at max."
    )]
    limit: Option<u64>,

    #[clap(
        long = "ar-ge",
        about = "with effective ApproachRate greater or equal to this value."
    )]
    ar_ge: Option<f64>,
    #[clap(
        long = "ar-le",
        about = "with effective ApproachRate less or equal to this value."
    )]
    ar_le: Option<f64>,

    #[clap(
        long = "cs-ge",
        about = "with effective CircleSize greater or equal to this value."
    )]
    cs_ge: Option<f64>,
    #[clap(
        long = "cs-le",
        about = "with effective CircleSize less or equal to this value."
    )]
    cs_le: Option<f64>,

    #[clap(long = "pp-ge", about = "with pp greater or equal to this value.")]
    pp_ge: Option<f64>,
    #[clap(long = "pp-le", about = "with pp less or equal to this value.")]
    pp_le: Option<f64>,

    #[clap(
        long = "miss-ge",
        about = "with miss count greater or equal to this value."
    )]
    miss_ge: Option<u32>,
    #[clap(
        long = "miss-le",
        about = "with miss count less or equal to this value."
    )]
    miss_le: Option<u32>,
    #[clap(
        long = "perfect",
        about = "with no misses.",
        conflicts_with = "miss-le",
        conflicts_with = "miss-ge"
    )]
    perfect: bool,

    #[clap(
        long = "newer-than",
        about = "with achieved date newer than this value. Format like 2015-12-23 13:56:44.",
        alias = "date-le"
    )]
    date_le: Option<String>,
    #[clap(
        long = "older-than",
        about = "with achieved date older than this value. Format like 2015-12-23 13:56:44.",
        alias = "date-ge"
    )]
    date_ge: Option<String>,

    #[clap(
        long = "std",
        about = "on the osu!standard (converted) map.",
        alias = "convert",
        alias = "no-specific"
    )]
    require_convert: bool,
    #[clap(
        long = "ctb",
        about = "on the osu!catch specific map",
        alias = "no-convert",
        alias = "specific",
        conflicts_with = "std"
    )]
    no_convert: bool,

    #[clap(long = "no-nf", about = "with NoFail mod disabled.")]
    no_nf: bool,
    #[clap(long = "no-ez", about = "with Easy mod disabled.")]
    no_ez: bool,
    #[clap(long = "no-hd", about = "with Hidden mod disabled.")]
    no_hd: bool,
    #[clap(long = "no-dt", about = "with DoubleTime (or NightCore) mod disabled.")]
    no_dt: bool,
    #[clap(long = "no-ht", about = "with HalfTime mod disabled.")]
    no_ht: bool,
    #[clap(long = "no-hr", about = "with HardRock mod disabled.")]
    no_hr: bool,
    #[clap(long = "no-fl", about = "with FlashLight mod disabled.")]
    no_fl: bool,

    #[clap(long = "nf", about = "with NoFail mod enabled.")]
    require_nf: bool,
    #[clap(long = "ez", about = "with Easy mod enabled.")]
    require_ez: bool,
    #[clap(long = "hd", about = "with Hidden mod enabled.")]
    require_hd: bool,
    #[clap(long = "dt", about = "with DoubleTime (or NightCore) mod enabled.")]
    require_dt: bool,
    #[clap(long = "ht", about = "with HalfTime mod enabled.")]
    require_ht: bool,
    #[clap(long = "hr", about = "with HardRock mod enabled.")]
    require_hr: bool,
    #[clap(long = "fl", about = "with FlashLight mod enabled.")]
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

        let ar_range = self.ar_ge.unwrap_or(f64::NEG_INFINITY) - 1e-9
            ..=self.ar_le.unwrap_or(f64::INFINITY) + 1e-9;
        let cs_range = self.cs_ge.unwrap_or(f64::NEG_INFINITY) - 1e-9
            ..=self.cs_le.unwrap_or(f64::INFINITY) + 1e-9;
        let pp_range =
            self.pp_ge.unwrap_or(f64::NEG_INFINITY)..=self.pp_le.unwrap_or(f64::INFINITY);
        let miss_range = if self.perfect {
            0..=0
        } else {
            self.miss_ge.unwrap_or(0)..=self.miss_le.unwrap_or(u32::MAX)
        };
        let date_range =
            self.date_le.as_deref().unwrap_or("0")..=self.date_ge.as_deref().unwrap_or("9");
        let mode_range = if self.require_convert {
            0..=0
        } else if self.no_convert {
            2..=2
        } else {
            0..=u8::MAX
        };

        let display_immediately = self.sort_method == ScoreSortMethod::NoSorting;
        let mut num_displayed = 0;

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

            let effective_ar = get_effective_ar(map, &score);
            if !ar_range.contains(&effective_ar) {
                continue;
            }

            let effective_cs = get_effective_cs(map, &score);
            if !cs_range.contains(&effective_cs) {
                continue;
            }

            let pp = score.pp.unwrap_or_default() as f64;
            if !pp_range.contains(&pp) {
                continue;
            }

            let miss = score.countmiss as u32;
            if !miss_range.contains(&miss) {
                continue;
            }

            if !date_range.contains(&score.date) {
                continue;
            }

            if !mode_range.contains(&map.playmode) {
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
                effective_cs,
            };

            if display_immediately {
                self.display_score(&info, &mut num_displayed);
            } else {
                scores_to_sort.push(info);
            }

            satisfied_count += 1;
        }

        if !display_immediately {
            self.sort_method.sort(&mut scores_to_sort);
            for info in scores_to_sort {
                self.display_score(&info, &mut num_displayed);
            }
        }

        eprintln!(
            "{} / {} scores satified the criteria.",
            satisfied_count, total_count
        );
        if num_displayed != satisfied_count {
            eprintln!(
                "{} scores not displayed due to limit.",
                satisfied_count - num_displayed
            );
        }

        Ok(())
    }

    fn display_score(&self, info: &ScoreInfo, num_displayed: &mut u64) {
        if let Some(limit) = self.limit {
            if limit <= *num_displayed {
                return;
            }
        }
        *num_displayed += 1;

        let ScoreInfo {
            set,
            map,
            user,
            score,
            pp,
            effective_ar,
            effective_cs,
        } = info;

        let user_name = user.map(|user| user.username.as_str()).unwrap_or("???");

        let mods_format = score.enabled_mods.format_plus().to_string();
        let miss_format = if score.countmiss == 0 {
            "".to_string()
        } else {
            format!(" {}xMiss", score.countmiss)
        };
        let pp_format = bold_if(
            format!("{:.0}pp", pp),
            self.pp_ge.is_some() || self.pp_le.is_some() || self.sort_method == ScoreSortMethod::Pp,
        );
        let ar_format = bold_if(
            format!("AR{:.1}", effective_ar),
            self.ar_ge.is_some() || self.ar_le.is_some() || self.sort_method == ScoreSortMethod::Ar,
        );
        let cs_format = bold_if(
            format!("CS{:.1}", effective_cs),
            self.cs_ge.is_some() || self.cs_le.is_some() || self.sort_method == ScoreSortMethod::Cs,
        );
        let date_format = bold_if(
            score.date.to_string(),
            self.date_ge.is_some() || self.date_le.is_some() || self.sort_method.is_date(),
        );

        println!(
            "{user} | {artist} - {title} [{version}]{mods}{miss} {pp} {ar} {cs} | {date} <https://osu.ppy.sh/scores/fruits/{score_id}>",
            user = user_name,
            artist = set.artist,
            title = set.title,
            version = map.version,
            mods = mods_format,
            miss = miss_format,
            pp = pp_format,
            ar = ar_format,
            cs = cs_format,
            date = date_format,
            score_id = score.score_id
        );
    }
}
