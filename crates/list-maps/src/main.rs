mod find_score;
mod parse_test;
mod render_maps;

use std::{collections::HashMap, path::PathBuf};

use clap::Clap;
use list_maps::{deserialize_iter, load_all, HasPrimaryId};
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

    pub fn load_all<T: DeserializeOwned + HasPrimaryId>(
        &self,
        db: osu_db_dump::Db,
    ) -> anyhow::Result<HashMap<u32, T>> {
        load_all(&self.osu_dump_dir, db)
    }
}

#[derive(Clap)]
enum SubCommand {
    ParseTest(parse_test::Opts),
    FindScore(find_score::Opts),
    RenderMaps(render_maps::Opts),
}

fn main() -> anyhow::Result<()> {
    let opts = Opts::parse();
    match &opts.sub_command {
        SubCommand::ParseTest(sub) => sub.run(&opts)?,
        SubCommand::FindScore(sub) => sub.run(&opts)?,
        SubCommand::RenderMaps(sub) => sub.run(&opts)?,
    }

    Ok(())
}
