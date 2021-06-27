/*!

Output beatmap summary to be used by the html/js interface.

*/

use std::collections::HashMap;

use bstr::BString;
use osu_db_dump::{value::Ruleset, Db, Mods};

#[derive(serde::Deserialize)]
pub struct BeatmapSet {
    pub beatmapset_id: u32,
    pub artist: BString,
    pub title: BString,
    pub creator: BString,
    pub approved_date: BString,
}

#[derive(serde::Deserialize)]
pub struct Beatmap {
    pub beatmap_id: u32,
    pub beatmapset_id: u32,
    pub version: BString,
    pub hit_length: u32,
    pub diff_approach: f32,
    pub diff_size: f32,
    pub playmode: Ruleset,
    pub approved: u8,
}

#[derive(serde::Deserialize)]
pub struct Difficulty {
    pub beatmap_id: u32,
    pub mods: Mods,
    pub diff_unified: f32,
}

#[derive(Debug, serde::Deserialize)]
pub struct DifficultyAttribute {
    beatmap_id: u32,
    mods: Mods,
    attrib_id: u8,
    value: Option<f32>,
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
}

list_maps::impl_has_primary_id! {
    beatmapset_id for BeatmapSet;
    beatmap_id for Beatmap;
    user_id for User;
    score_id for Score;
}

bitflags::bitflags! {
    pub struct FcLevelFlags: u32 {
        /// HT+
        const HT = 1 << 0;
        /// EZ+ HT-
        const EZ = 1 << 1;
        /// EZ- HT-
        const NM = 1 << 2;
        /// EZ- HD+ HT-
        const HD = 1 << 3;
        /// EZ- HR+ HT-
        const HR = 1 << 4;
        /// HD+ HR+ HT-
        const HDHR = 1 << 5;
        /// EZ+ HT- FL+
        const EZFL = 1 << 6;
        /// HT+ FL+
        const HTFL = 1 << 7;
        /// EZ- HT- FL+
        const FL = 1 << 8;
        /// HR+ FL+
        const HRFL = 1 << 9;
        /// EZ+ DT+
        const EZDT = 1 << 10;
        /// EZ- DT+
        const DT = 1 << 11;
        /// EZ- HD+ DT+
        const HDDT = 1 << 12;
        /// HR+ DT+
        const HRDT = 1 << 13;
    }
}

pub fn get_mod_level(mods: Mods) -> FcLevelFlags {
    if mods.contains(Mods::HALF_TIME) {
        if mods.contains(Mods::FLASHLIGHT) {
            FcLevelFlags::HTFL
        } else {
            FcLevelFlags::HT
        }
    } else if mods.contains(Mods::EASY) {
        if mods.contains(Mods::DOUBLE_TIME) {
            FcLevelFlags::EZDT
        } else if mods.contains(Mods::FLASHLIGHT) {
            FcLevelFlags::EZFL
        } else {
            FcLevelFlags::EZ
        }
    } else if mods.contains(Mods::DOUBLE_TIME) {
        if mods.contains(Mods::HARD_ROCK) {
            FcLevelFlags::HRDT
        } else if mods.contains(Mods::HIDDEN) {
            FcLevelFlags::HDDT
        } else {
            FcLevelFlags::DT
        }
    } else if mods.contains(Mods::FLASHLIGHT) {
        if mods.contains(Mods::HARD_ROCK) {
            FcLevelFlags::HRFL
        } else {
            FcLevelFlags::FL
        }
    } else if mods.contains(Mods::HARD_ROCK) {
        if mods.contains(Mods::HIDDEN) {
            FcLevelFlags::HDHR
        } else {
            FcLevelFlags::HR
        }
    } else if mods.contains(Mods::HIDDEN) {
        FcLevelFlags::HD
    } else {
        FcLevelFlags::NM
    }
}

#[derive(Debug)]
pub struct ScoreStatistics {
    min_miss_no_ht: u16,
    fc_level_flags: FcLevelFlags,
}

pub const MIN_MISS_SENTINEL: u16 = 999;

impl Default for ScoreStatistics {
    fn default() -> Self {
        Self {
            min_miss_no_ht: MIN_MISS_SENTINEL,
            fc_level_flags: FcLevelFlags::empty(),
        }
    }
}

impl ScoreStatistics {
    pub fn add(&mut self, score: &Score) {
        if !score.enabled_mods.contains(Mods::HALF_TIME) {
            self.min_miss_no_ht = self.min_miss_no_ht.min(score.countmiss);
        }
        if score.countmiss == 0 {
            self.fc_level_flags |= get_mod_level(score.enabled_mods);
        }
    }
}

pub mod difficulty_attribs {
    pub const STARS: u8 = 1;
    pub const AR: u8 = 7;
    pub const MAX_COMBO: u8 = 9;
}

#[derive(Debug, Default)]
pub struct DifficultyAttributes {
    stars: f32,
    approach_rate: f32,
    max_combo: f32,
}

#[derive(Ord, PartialOrd, Eq, PartialEq)]
#[allow(unused)]
pub enum PPVersion {
    V1,
    V2,
}

impl PPVersion {
    pub const LATEST: PPVersion = PPVersion::V2;
}

pub struct PPInfo {
    pub nm: f32,
    pub hd: f32,
    pub fl: f32,
    pub hdfl: f32,
}

impl DifficultyAttributes {
    pub fn calculate_pp(
        &self,
        pp_version: PPVersion,
        combo: f32,
        accuracy: f32,
        num_misses: f32,
    ) -> PPInfo {
        let DifficultyAttributes {
            stars,
            approach_rate,
            max_combo,
            ..
        } = *self;
        let mut pp = f32::powf(5.0 * f32::max(1.0, stars / 0.0049) - 4.0, 2.0) / 100_000.0;

        let (lb_mul, lb_threshold) = match pp_version {
            PPVersion::V1 => ((0.4, 0.5), 3000.0),
            PPVersion::V2 => ((0.3, 0.475), 2500.0),
        };

        let mut length_bonus = 0.95 + lb_mul.0 * f32::min(1.0, max_combo / lb_threshold);
        if max_combo > lb_threshold {
            length_bonus += (max_combo / lb_threshold).log10() * lb_mul.1;
        }
        pp *= length_bonus;

        let mut ar_bonus = 1.0;
        if pp_version >= PPVersion::V2 && approach_rate > 10.0 {
            ar_bonus += 0.1 * (approach_rate - 10.0);
        }
        if approach_rate > 9.0 {
            ar_bonus += 0.1 * (approach_rate - 9.0);
        }
        if approach_rate < 8.0 {
            ar_bonus += 0.025 * (8.0 - approach_rate);
        }
        pp *= ar_bonus;

        pp *= f32::powf(0.97, num_misses);
        if max_combo > 0.0 {
            pp *= f32::powf(combo / max_combo, 0.8);
        }
        pp *= f32::powf(accuracy / 100.0, 5.5);

        let hd_bonus = match pp_version {
            PPVersion::V1 => 1.05 + 0.075 * (10.0 - f32::min(10.0, approach_rate)),
            PPVersion::V2 => {
                if approach_rate > 10.0 {
                    1.01 + 0.04 * (11.0 - approach_rate)
                } else {
                    1.05 + 0.075 * (10.0 - approach_rate)
                }
            }
        };

        let fl_bonus = 1.35 * length_bonus;

        PPInfo {
            nm: pp,
            hd: pp * hd_bonus,
            fl: pp * fl_bonus,
            hdfl: pp * hd_bonus * fl_bonus,
        }
    }
}

pub fn load_difficulty_attributes(
    super_opts: &super::Opts,
) -> anyhow::Result<HashMap<(u32, Mods), DifficultyAttributes>> {
    eprintln!("Loading beatmap difficulty attributes...");

    let mut diffs = HashMap::<(u32, Mods), DifficultyAttributes>::new();
    let mut total_attrs = 0u64;

    for entry in super_opts.deserialize_iter(Db::BeatmapDifficultyAttribs)? {
        let entry: DifficultyAttribute = entry?;
        let value = match entry.value {
            None => continue,
            Some(v) => v,
        };
        let diff = diffs.entry((entry.beatmap_id, entry.mods)).or_default();

        match entry.attrib_id {
            difficulty_attribs::STARS => diff.stars = value,
            difficulty_attribs::AR => diff.approach_rate = value,
            difficulty_attribs::MAX_COMBO => diff.max_combo = value,
            _ => continue,
        }
        total_attrs += 1;
    }

    eprintln!(
        "Loaded {} attributes of {} beatmaps",
        total_attrs,
        diffs.len()
    );

    Ok(diffs)
}

pub struct BeatmapInfo<'a> {
    set: &'a BeatmapSet,
    map: Beatmap,
    diff: &'a DifficultyAttributes,
    score_stats: ScoreStatistics,
}

#[derive(clap::Clap)]
#[clap(about = "Output beatmap summary file to be used by the html/js interface.")]
pub struct Opts {
    #[clap(
        long = "min-stars",
        about = "Minimum star difficulty to be included to the output.",
        default_value = "4"
    )]
    min_stars: f32,

    #[clap(long = "mode", default_value = "2")]
    mode: Ruleset,

    #[clap(long = "no-convert")]
    no_convert: bool,

    #[clap(
        long = "no-score-stats",
        about = "Don't read the score database to collect score statistics."
    )]
    no_score_stats: bool,

    #[clap(long = "verbose")]
    verbose: bool,
}

impl Opts {
    pub fn run(&self, super_opts: &super::Opts) -> anyhow::Result<()> {
        let sets = super_opts.load_all::<BeatmapSet>(Db::Beatmapsets)?;
        let diffs = load_difficulty_attributes(super_opts)?;

        let mut map_count: u64 = 0;
        let mut filtered_map_count: u64 = 0;

        let mut filtered_maps = Vec::new();
        for map in super_opts.deserialize_iter(Db::Beatmaps)? {
            let map: Beatmap = map?;

            if !(map.playmode == self.mode || (map.playmode == Ruleset::Osu && !self.no_convert)) {
                continue;
            }

            let set = match sets.get(&map.beatmapset_id) {
                None => {
                    if self.verbose {
                        eprintln!(
                            "{}/{}: no beatmapset info",
                            map.beatmapset_id, map.beatmap_id
                        );
                    }
                    continue;
                }
                Some(set) => set,
            };

            let diff = match diffs.get(&(map.beatmap_id, Mods::empty())) {
                None => {
                    if self.verbose {
                        eprintln!(
                            "{}/{}: no difficulty info",
                            map.beatmapset_id, map.beatmap_id,
                        );
                    }
                    continue;
                }
                Some(diff) => diff,
            };

            map_count += 1;

            if diff.stars < self.min_stars {
                continue;
            }

            filtered_map_count += 1;

            let info = BeatmapInfo {
                set,
                map,
                diff,
                score_stats: ScoreStatistics::default(),
            };

            if self.no_score_stats {
                self.display_beatmap_info(info)?;
            } else {
                filtered_maps.push(info);
            }
        }

        eprintln!(
            "{}/{} beatmaps remained after filtering.",
            filtered_map_count, map_count
        );

        if !self.no_score_stats {
            self.collect_score_stats(super_opts, &mut filtered_maps)?;

            filtered_maps.sort_by(|x, y| x.set.approved_date.cmp(&y.set.approved_date));

            for info in filtered_maps {
                self.display_beatmap_info(info)?;
            }
        }

        Ok(())
    }

    fn display_beatmap_info(&self, info: BeatmapInfo) -> anyhow::Result<()> {
        let title_format = format!(
            "{} - {} [{}] ({})",
            info.set.artist, info.set.title, info.map.version, info.set.creator
        );
        let nomod_ss_pp = info
            .diff
            .calculate_pp(PPVersion::LATEST, info.diff.max_combo, 100.0, 0.0)
            .nm;

        println!(
            "{approved_date:?},{set_id},{map_id},{status},{mode},{title:?},{stars:.4},{pp:.2},{hit_length},{max_combo},{ar},{cs},{min_miss},{fc_level_flags}",
            approved_date = info.set.approved_date,
            set_id = info.map.beatmapset_id,
            map_id = info.map.beatmap_id,
            status = info.map.approved,
            mode = info.map.playmode.id(),
            title = title_format,
            stars = info.diff.stars,
            pp = nomod_ss_pp,
            hit_length = info.map.hit_length,
            max_combo = info.diff.max_combo,
            ar = info.map.diff_approach,
            cs = info.map.diff_size,
            min_miss = info.score_stats.min_miss_no_ht,
            fc_level_flags = info.score_stats.fc_level_flags.bits(),
        );
        Ok(())
    }

    fn collect_score_stats(
        &self,
        super_opts: &super::Opts,
        maps: &mut Vec<BeatmapInfo>,
    ) -> anyhow::Result<()> {
        let map_index: HashMap<u32, usize> = maps
            .iter()
            .enumerate()
            .map(|(i, info)| (info.map.beatmap_id, i))
            .collect();

        let mut score_count: u64 = 0;
        let mut filtered_score_count: u64 = 0;

        eprintln!("Collecting score statistics...");
        for score in super_opts.deserialize_iter(Db::ScoresFruitsHigh)? {
            let score: Score = score?;
            score_count += 1;

            let info = match map_index.get(&score.beatmap_id) {
                None => continue,
                Some(&i) => &mut maps[i],
            };
            filtered_score_count += 1;

            info.score_stats.add(&score);
        }
        eprintln!(
            "{}/{} scores contributed to the score statistics.",
            filtered_score_count, score_count
        );

        Ok(())
    }
}
