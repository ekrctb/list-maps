use std::{collections::HashMap, fs::File, io::BufReader, path::Path};

use anyhow::Context;
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

pub struct BasicBeatmapAndSetInfo<'a, TSet, TMap> {
    pub set: &'a TSet,
    pub map: &'a TMap,
}

pub struct BeatmapIndex<TSet, TMap> {
    sets: HashMap<u32, TSet>,
    maps: HashMap<u32, TMap>,
}

impl<TSet, TMap> BeatmapIndex<TSet, TMap> {
    pub fn beatmapset_count(&self) -> usize {
        self.sets.len()
    }

    pub fn beatmap_count(&self) -> usize {
        self.maps.len()
    }

    pub fn get_beatmapset(&self, beatmapset_id: u32) -> Option<&TSet> {
        self.sets.get(&beatmapset_id)
    }

    pub fn get_beatmap(&self, beatmap_id: u32) -> Option<&TMap> {
        self.maps.get(&beatmap_id)
    }
}

impl<TSet, TMap> BeatmapIndex<TSet, TMap>
where
    TMap: HasBeatmapSetId,
{
    pub fn get_beatmap_and_set(
        &self,
        beatmap_id: u32,
    ) -> Option<BasicBeatmapAndSetInfo<'_, TSet, TMap>> {
        self.get_beatmap(beatmap_id).and_then(|map| {
            self.get_beatmapset(map.beatmapset_id())
                .map(|set| BasicBeatmapAndSetInfo { set, map })
        })
    }
}

pub trait HasBeatmapId {
    fn beatmap_id(&self) -> u32;
}

pub trait HasBeatmapSetId {
    fn beatmapset_id(&self) -> u32;
}

#[macro_export]
macro_rules! impl_beatmap_traits {
    ($set_type:path, $map_type:path) => {
        impl $crate::HasBeatmapSetId for $set_type {
            fn beatmapset_id(&self) -> u32 {
                self.beatmapset_id
            }
        }

        impl $crate::HasBeatmapSetId for $map_type {
            fn beatmapset_id(&self) -> u32 {
                self.beatmapset_id
            }
        }

        impl $crate::HasBeatmapId for $map_type {
            fn beatmap_id(&self) -> u32 {
                self.beatmap_id
            }
        }
    };
}

pub fn load_beatmap_index<TSet, TMap>(
    osu_dump_dir: &Path,
) -> anyhow::Result<BeatmapIndex<TSet, TMap>>
where
    TSet: DeserializeOwned + HasBeatmapSetId,
    TMap: DeserializeOwned + HasBeatmapId,
{
    let mut sets = HashMap::new();
    for set in deserialize_iter::<TSet>(osu_dump_dir, "osu_beatmapsets.sql")? {
        let set = set?;
        sets.insert(set.beatmapset_id(), set);
    }

    let mut maps = HashMap::new();
    for map in deserialize_iter::<TMap>(osu_dump_dir, "osu_beatmaps.sql")? {
        let map = map?;
        maps.insert(map.beatmap_id(), map);
    }

    Ok(BeatmapIndex { sets, maps })
}
