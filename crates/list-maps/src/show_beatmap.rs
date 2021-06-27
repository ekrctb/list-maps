//! Just show beatmap info given beatmap_id in standard input
// It seeems like the osu dump only contain ranked beatmaps?

use std::{collections::HashMap, io::BufRead};

use anyhow::Context;
use bstr::BString;
use osu_db_dump::Db;

#[derive(serde::Deserialize)]
pub struct BeatmapSet {
    pub beatmapset_id: u32,
    pub artist: BString,
    pub title: BString,
    pub creator: BString,
}

#[derive(serde::Deserialize)]
pub struct Beatmap {
    pub beatmap_id: u32,
    pub beatmapset_id: u32,
    pub version: BString,
}

list_maps::impl_has_primary_id! {
    beatmapset_id for BeatmapSet;
    beatmap_id for Beatmap;
}

#[derive(clap::Clap)]
#[clap(about = "Show beatmap info given in standard input")]
pub struct Opts {}

impl Opts {
    pub fn run(&self, super_opts: &super::Opts) -> anyhow::Result<()> {
        let sets = super_opts.load_all::<BeatmapSet>(Db::Beatmapsets)?;
        let maps = super_opts.load_all::<Beatmap>(Db::Beatmaps)?;

        let beatmap_id_matcher = regex::Regex::new(r"fruits/(\d+)").unwrap();
        let stdin = std::io::stdin();
        for line in stdin.lock().lines() {
            let line = line?;
            for beatmap_id in beatmap_id_matcher
                .captures_iter(&line)
                .map(|cs| cs.get(1).unwrap().as_str())
            {
                self.show_beatmap(&sets, &maps, beatmap_id)?;
            }
        }

        Ok(())
    }

    fn show_beatmap(
        &self,
        sets: &HashMap<u32, BeatmapSet>,
        maps: &HashMap<u32, Beatmap>,
        beatmap_id: &str,
    ) -> anyhow::Result<()> {
        let beatmap_id = beatmap_id.parse::<u32>().context("invalid beatmap id")?;
        match maps
            .get(&beatmap_id)
            .and_then(|map| sets.get(&map.beatmapset_id).map(|set| (set, map)))
        {
            None => {
                println!("beatmap {} not found", beatmap_id);
                return Ok(());
            }
            Some((set, map)) => {
                println!(
                    "{}/{}: {} - {} [{}] ({})",
                    map.beatmapset_id,
                    map.beatmap_id,
                    set.artist,
                    set.title,
                    map.version,
                    set.creator
                );
            }
        };
        Ok(())
    }
}
