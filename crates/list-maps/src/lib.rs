use std::{collections::HashMap, fs::File, io::BufReader, path::Path};

use anyhow::Context;
use bstr::BString;
use serde::de::DeserializeOwned;

pub fn deserialize_iter<T: DeserializeOwned>(
    osu_dump_dir: &Path,
    file_name: &str,
) -> anyhow::Result<impl Iterator<Item = osu_db_dump::Result<T>>> {
    let path = osu_dump_dir.join(file_name);
    let file = File::open(path).context("cannot open input file")?;
    let reader = BufReader::new(file);
    Ok(osu_db_dump::Reader::new(reader).deserialize::<T>()?)
}

#[derive(serde::Deserialize)]
pub struct BasicBeatmapSetInfo {
    pub beatmapset_id: u32,
    pub artist: BString,
    pub title: BString,
    pub creator: BString,
    pub approved: u8,
    pub approved_date: BString,
}

#[derive(serde::Deserialize)]
pub struct BasicBeatmapInfo {
    pub beatmap_id: u32,
    pub beatmapset_id: u32,
    pub version: BString,
    pub hit_length: u32,
    pub difficultyrating: f32,
    pub diff_approach: f32,
}

pub struct BasicBeatmapAndSetInfo<'a> {
    pub set: &'a BasicBeatmapSetInfo,
    pub map: &'a BasicBeatmapInfo,
}

pub struct BasicBeatmapIndex {
    sets: HashMap<u32, BasicBeatmapSetInfo>,
    maps: HashMap<u32, BasicBeatmapInfo>,
}

impl BasicBeatmapIndex {
    pub fn beatmapset_count(&self) -> usize {
        self.sets.len()
    }

    pub fn beatmap_count(&self) -> usize {
        self.maps.len()
    }

    pub fn get_beatmapset(&self, beatmapset_id: u32) -> Option<&BasicBeatmapSetInfo> {
        self.sets.get(&beatmapset_id)
    }

    pub fn get_beatmap(&self, beatmap_id: u32) -> Option<&BasicBeatmapInfo> {
        self.maps.get(&beatmap_id)
    }

    pub fn get_beatmap_and_set(&self, beatmap_id: u32) -> Option<BasicBeatmapAndSetInfo<'_>> {
        self.get_beatmap(beatmap_id).and_then(|map| {
            self.get_beatmapset(map.beatmapset_id)
                .map(|set| BasicBeatmapAndSetInfo { set, map })
        })
    }
}

pub fn load_basic_beatmap_index(osu_dump_dir: &Path) -> anyhow::Result<BasicBeatmapIndex> {
    let mut sets = HashMap::new();
    for set in deserialize_iter::<BasicBeatmapSetInfo>(osu_dump_dir, "osu_beatmapsets.sql")? {
        let set = set?;
        sets.insert(set.beatmapset_id, set);
    }

    let mut maps = HashMap::new();
    for map in deserialize_iter::<BasicBeatmapInfo>(osu_dump_dir, "osu_beatmaps.sql")? {
        let map = map?;
        maps.insert(map.beatmap_id, map);
    }

    Ok(BasicBeatmapIndex { sets, maps })
}
