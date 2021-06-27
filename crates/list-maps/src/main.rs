mod parse_test;
mod show_beatmap;

use std::path::PathBuf;

use clap::Clap;
use list_maps::{load_beatmap_index, BeatmapIndex, HasBeatmapId, HasBeatmapSetId};
use serde::de::DeserializeOwned;

#[derive(Clap)]
pub struct Opts {
    #[clap(
        long = "dump-dir",
        env = "OSU_DUMP_DIR",
        about = "The directory of osu database dump."
    )]
    pub osu_dump_dir: PathBuf,

    #[clap(subcommand)]
    sub_command: SubCommand,
}

impl Opts {
    pub fn load_beatmap_index<TSet, TMap>(&self) -> anyhow::Result<BeatmapIndex<TSet, TMap>>
    where
        TSet: DeserializeOwned + HasBeatmapSetId,
        TMap: DeserializeOwned + HasBeatmapId + HasBeatmapSetId,
    {
        eprintln!("Loading beatmaps...");
        let index = load_beatmap_index(&self.osu_dump_dir)?;
        eprintln!(
            "Loaded {} beatmap sets of {} beatmaps.",
            index.beatmapset_count(),
            index.beatmap_count()
        );
        Ok(index)
    }
}

#[derive(Clap)]
enum SubCommand {
    ParseTest(parse_test::Opts),
    ShowBeatmap(show_beatmap::Opts),
}

fn main() -> anyhow::Result<()> {
    let opts = Opts::parse();
    match &opts.sub_command {
        SubCommand::ParseTest(sub) => sub.run(&opts)?,
        SubCommand::ShowBeatmap(sub) => sub.run(&opts)?,
    }

    Ok(())
}
