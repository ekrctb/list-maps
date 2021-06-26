//! Just show beatmap info given beatmap_id in standard input
// It seeems like the osu dump only contain ranked beatmaps?

use std::io::BufRead;

use anyhow::Context;
use list_maps::BasicBeatmapIndex;

#[derive(clap::Clap)]
#[clap(about = "Show beatmap info given in standard input")]
pub struct Opts {}

impl Opts {
    pub fn run(&self, super_opts: &super::Opts) -> anyhow::Result<()> {
        let index = super_opts.load_basic_beatmap_index()?;
        let beatmap_id_matcher = regex::Regex::new(r"fruits/(\d+)").unwrap();
        let stdin = std::io::stdin();
        for line in stdin.lock().lines() {
            let line = line?;
            for beatmap_id in beatmap_id_matcher
                .captures_iter(&line)
                .map(|cs| cs.get(1).unwrap().as_str())
            {
                self.show_beatmap(&index, beatmap_id)?;
            }
        }
        Ok(())
    }

    fn show_beatmap(&self, index: &BasicBeatmapIndex, beatmap_id: &str) -> anyhow::Result<()> {
        let beatmap_id = beatmap_id.parse::<u32>().context("invalid beatmap id")?;
        let info = match index.get_beatmap_and_set(beatmap_id) {
            None => {
                println!("beatmap {} not found", beatmap_id);
                return Ok(());
            }
            Some(info) => info,
        };
        println!(
            "{}/{}: {} - {} [{}] ({})",
            info.map.beatmapset_id,
            info.map.beatmap_id,
            info.set.artist,
            info.set.title,
            info.map.version,
            info.set.creator
        );
        Ok(())
    }
}
