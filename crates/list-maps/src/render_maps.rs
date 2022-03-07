/*!

Output beatmap summary to be used by the html/js interface.

*/

use std::{
    collections::HashMap,
    fs::File,
    io::{BufWriter, Write},
    path::PathBuf,
};

use anyhow::Context;
use bstr::BString;
use osu_db_dump::{value::Ruleset, Db, Mods};
use serde::{Deserialize, Deserializer};

#[derive(serde::Deserialize)]
pub struct BeatmapSet {
    pub beatmapset_id: u32,
    pub artist: BString,
    pub title: BString,
    pub creator: BString,
    #[serde(deserialize_with = "deserialize_approved_date")]
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
    pub approved: i8,
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

fn deserialize_approved_date<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<BString, D::Error> {
    match <Option<BString>>::deserialize(deserializer)? {
        Some(date) => Ok(date),
        None => Ok("2000-01-01 00:00:00".into()),
    }
}

pub struct ModsIndex {
    mask: Mods,
    mods: Vec<Mods>,
    index: HashMap<Mods, usize>,
}

impl ModsIndex {
    pub fn new(mods: Vec<Mods>) -> Self {
        let mask = mods.iter().copied().fold(Mods::empty(), |x, y| x | y);
        let index = mods
            .iter()
            .enumerate()
            .map(|(i, mods)| (*mods, i))
            .collect();

        Self { mask, mods, index }
    }

    pub fn len(&self) -> usize {
        self.mods.len()
    }

    pub fn index(&self, mods: Mods) -> usize {
        *self.index.get(&(mods & self.mask)).unwrap()
    }

    pub fn enumerate(&self) -> impl Iterator<Item = (usize, Mods)> + '_ {
        self.mods.iter().copied().enumerate()
    }
}

pub struct ModsInfo {
    pub diff_mods: ModsIndex,
    pub add_mods: ModsIndex,
}

// only handles osu!catch currently
impl ModsInfo {
    pub fn new(_ruleset: Ruleset) -> Self {
        let diff_mods = ModsIndex::new(vec![
            Mods::empty(),
            Mods::HARD_ROCK,
            Mods::EASY,
            Mods::DOUBLE_TIME,
            Mods::DOUBLE_TIME | Mods::HARD_ROCK,
            Mods::DOUBLE_TIME | Mods::EASY,
            Mods::HALF_TIME,
            Mods::HALF_TIME | Mods::HARD_ROCK,
            Mods::HALF_TIME | Mods::EASY,
        ]);

        let add_mods = ModsIndex::new(vec![
            Mods::empty(),
            Mods::HIDDEN,
            Mods::FLASHLIGHT,
            Mods::FLASHLIGHT | Mods::HIDDEN,
        ]);

        ModsInfo {
            diff_mods,
            add_mods,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct ScoreStatistics {
    min_miss: u8,
    fc_count: u16,
    fc_flags: u8,
}

impl Default for ScoreStatistics {
    fn default() -> Self {
        Self {
            min_miss: u8::MAX,
            fc_count: 0,
            fc_flags: 0,
        }
    }
}

impl ScoreStatistics {
    pub fn add(&mut self, mods_info: &ModsInfo, score: &Score) {
        self.min_miss = self.min_miss.min(if score.countmiss > u8::MAX as u16 {
            u8::MAX
        } else {
            score.countmiss as u8
        });
        if score.countmiss == 0 {
            self.fc_count = self.fc_count.saturating_add(1);
            self.fc_flags |= 1 << mods_info.add_mods.index(score.enabled_mods);
        }
    }

    pub fn merge(self, other: &ScoreStatistics) -> ScoreStatistics {
        Self {
            min_miss: self.min_miss.min(other.min_miss),
            fc_count: self.fc_count.saturating_add(other.fc_count),
            fc_flags: self.fc_flags | other.fc_flags,
        }
    }

    pub fn min_miss_or_fc_count(&self) -> i32 {
        if self.min_miss == u8::MAX {
            0
        } else if self.fc_count == 0 {
            assert!(self.min_miss > 0);
            -i32::from(self.min_miss)
        } else {
            i32::from(self.fc_count)
        }
    }
}

#[allow(unused)]
pub mod difficulty_attribs {
    // this is called "Aim" in DB.
    pub const STARS: u8 = 1;
    // Can be calculated from nomod AR
    pub const AR: u8 = 7;
    // Same as the nomod max combo.
    pub const MAX_COMBO: u8 = 9;
}

pub struct DifficultyAttributeMap {
    max_combo: HashMap<u32, f32>,
    stars: HashMap<(u32, Mods), f32>,
}

impl DifficultyAttributeMap {
    pub fn new() -> Self {
        Self {
            max_combo: HashMap::new(),
            stars: HashMap::new(),
        }
    }

    pub fn insert(&mut self, beatmap_id: u32, mods: Mods, attrib_id: u8, value: f32) -> bool {
        if mods.is_empty() && attrib_id == difficulty_attribs::MAX_COMBO {
            self.max_combo.insert(beatmap_id, value).is_none()
        } else if attrib_id == difficulty_attribs::STARS {
            self.stars.insert((beatmap_id, mods), value).is_none()
        } else {
            false
        }
    }

    pub fn len(&self) -> usize {
        self.max_combo.len()
    }

    pub fn get_max_combo(&self, beatmap_id: u32) -> Option<f32> {
        self.max_combo.get(&beatmap_id).copied()
    }

    pub fn get_stars(&self, beatmap_id: u32, mods: Mods) -> Option<f32> {
        self.stars.get(&(beatmap_id, mods)).copied()
    }
}

pub fn load_difficulty_attributes(
    super_opts: &super::Opts,
) -> anyhow::Result<DifficultyAttributeMap> {
    eprintln!("Loading beatmap difficulty attributes...");

    let mut diffs = DifficultyAttributeMap::new();
    let mut loaded_attrs = 0u64;
    let mut total_attrs = 0u64;

    for entry in super_opts.deserialize_iter(Db::BeatmapDifficultyAttribs)? {
        let entry: DifficultyAttribute = entry?;
        total_attrs += 1;

        let value = match entry.value {
            None => continue,
            Some(v) => v,
        };

        if diffs.insert(entry.beatmap_id, entry.mods, entry.attrib_id, value) {
            loaded_attrs += 1;
        }
    }

    eprintln!(
        "Loaded {}/{} attributes of {} beatmaps",
        loaded_attrs,
        total_attrs,
        diffs.len()
    );

    Ok(diffs)
}

pub struct BeatmapInfo<'a> {
    set: &'a BeatmapSet,
    map: Beatmap,
    max_combo: f32,
    nm_stars: f32,
    score_stats: Vec<ScoreStatistics>,
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

    #[clap(long = "output-dir", about = "The output directory.")]
    output_dir: Option<PathBuf>,

    #[clap(long = "no-convert")]
    no_convert: bool,

    #[clap(
        long = "no-score-stats",
        about = "Don't read the score database to collect score statistics."
    )]
    no_score_stats: bool,
}

impl Opts {
    pub fn run(&self, super_opts: &super::Opts) -> anyhow::Result<()> {
        let sets = super_opts.load_all::<BeatmapSet>(Db::Beatmapsets)?;
        let diffs = load_difficulty_attributes(super_opts)?;

        let mods_info = ModsInfo::new(self.mode);

        let mut map_count: u64 = 0;
        let mut filtered_map_count: u64 = 0;

        let mut filtered_maps = Vec::new();
        for map in super_opts.deserialize_iter(Db::Beatmaps)? {
            let map: Beatmap = map?;

            if map.approved <= 0 {
                continue;
            }

            if !(map.playmode == self.mode || (map.playmode == Ruleset::Osu && !self.no_convert)) {
                continue;
            }

            let set = match sets.get(&map.beatmapset_id) {
                None => {
                    eprintln!(
                        "{}/{}: no beatmapset info",
                        map.beatmapset_id, map.beatmap_id
                    );
                    continue;
                }
                Some(set) => set,
            };

            let (max_combo, nm_stars) = match (
                diffs.get_max_combo(map.beatmap_id),
                diffs.get_stars(map.beatmap_id, Mods::empty()),
            ) {
                (Some(max_combo), Some(stars)) => (max_combo, stars),
                _ => {
                    eprintln!(
                        "{}/{}: no difficulty info",
                        map.beatmapset_id, map.beatmap_id,
                    );
                    continue;
                }
            };

            map_count += 1;

            if nm_stars < self.min_stars {
                continue;
            }

            filtered_map_count += 1;

            let info = BeatmapInfo {
                set,
                map,
                max_combo,
                nm_stars,
                score_stats: vec![ScoreStatistics::default(); mods_info.diff_mods.len()],
            };

            filtered_maps.push(info);
        }

        eprintln!(
            "{}/{} beatmaps remained after filtering.",
            filtered_map_count, map_count
        );

        if !self.no_score_stats {
            self.collect_score_stats(super_opts, &mut filtered_maps)?;
        }

        filtered_maps.sort_by(|x, y| x.set.approved_date.cmp(&y.set.approved_date));

        let mut summary_writer = self.open_output_file("summary.csv")?;
        let mut mods_writers = mods_info
            .diff_mods
            .enumerate()
            .map(|(_, mods)| self.open_output_file(&format!("mods-{}.csv", mods.bits())))
            .collect::<Result<Vec<_>, _>>()?;

        for info in &filtered_maps {
            self.display_beatmap_info(&mut summary_writer, &mods_info, info)?;

            for (i, mods) in mods_info.diff_mods.enumerate() {
                let stars = match diffs.get_stars(info.map.beatmap_id, mods) {
                    Some(diff) => diff,
                    None => {
                        eprintln!(
                            "{}/{} {:?}: no difficulty info",
                            info.set.beatmapset_id, info.map.beatmap_id, mods,
                        );
                        continue;
                    }
                };

                self.display_mods_info(
                    &mut mods_writers[i],
                    info,
                    mods,
                    stars,
                    info.score_stats[i],
                )?;
            }
        }

        Ok(())
    }

    fn display_beatmap_info(
        &self,
        writer: &mut dyn Write,
        mods_info: &ModsInfo,
        info: &BeatmapInfo,
    ) -> anyhow::Result<()> {
        let stat_total = mods_info
            .diff_mods
            .enumerate()
            .filter(|(_, mods)| !mods.contains(Mods::HALF_TIME))
            .fold(ScoreStatistics::default(), |total, (i, _)| {
                total.merge(&info.score_stats[i])
            });

        let title_format = format!(
            "{} - {} [{}] ({})",
            info.set.artist, info.set.title, info.map.version, info.set.creator
        );

        writeln!(writer,
            "{approved_date:?},{set_id},{map_id},{status},{mode},{title:?},{hit_length},{nm_stars},{max_combo},{ar},{cs},{total_fc},{total_fc_flags}",
            approved_date = info.set.approved_date,
            set_id = info.map.beatmapset_id,
            map_id = info.map.beatmap_id,
            status = info.map.approved,
            mode = info.map.playmode.id(),
            title = title_format,
            hit_length = info.map.hit_length,
            nm_stars = info.nm_stars,
            max_combo = info.max_combo,
            ar = info.map.diff_approach,
            cs = info.map.diff_size,
            total_fc = stat_total.min_miss_or_fc_count(),
            total_fc_flags = stat_total.fc_flags,
        )?;
        Ok(())
    }

    fn display_mods_info(
        &self,
        writer: &mut dyn Write,
        info: &BeatmapInfo,
        mods: Mods,
        stars: f32,
        stats: ScoreStatistics,
    ) -> anyhow::Result<()> {
        writeln!(
            writer,
            "{map_id},{mods},{stars},{fc_count},{fc_flags}",
            map_id = info.map.beatmap_id,
            mods = mods.bits(),
            stars = stars,
            fc_count = stats.fc_count,
            fc_flags = stats.fc_flags
        )?;
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

        let mods_info = ModsInfo::new(self.mode);

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

            let diff_mods_index = mods_info.diff_mods.index(score.enabled_mods);
            info.score_stats[diff_mods_index].add(&mods_info, &score);
        }
        eprintln!(
            "{}/{} scores contributed to the score statistics.",
            filtered_score_count, score_count
        );

        Ok(())
    }

    fn open_output_file(&self, name: &str) -> anyhow::Result<Box<dyn Write>> {
        Ok(match &self.output_dir {
            None => Box::new(std::io::stdout()),
            Some(dir) => Box::new(BufWriter::new(
                File::create(dir.join(name)).context("cannot open summary output file")?,
            )),
        })
    }
}
