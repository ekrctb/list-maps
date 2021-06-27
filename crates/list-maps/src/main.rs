mod parse_test;
mod show_beatmap;

use std::path::PathBuf;

use clap::Clap;
use list_maps::deserialize_iter;
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
    pub fn deserialize_iter<T: DeserializeOwned>(
        &self,
        db: osu_db_dump::Db,
    ) -> anyhow::Result<impl Iterator<Item = osu_db_dump::Result<T>>> {
        deserialize_iter(&self.osu_dump_dir, db)
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
