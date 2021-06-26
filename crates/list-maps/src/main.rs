mod parse_test;

use std::path::PathBuf;

use clap::Clap;

#[derive(Clap)]
pub struct Opts {
    #[clap(
        long = "dump-dir",
        env = "OSU_DUMP_DIR",
        about = "The directory of osu database dump."
    )]
    osu_dump_dir: PathBuf,

    #[clap(subcommand)]
    sub_command: SubCommand,
}

#[derive(Clap)]
enum SubCommand {
    ParseTest(parse_test::Opts),
}

fn main() -> anyhow::Result<()> {
    let opts = Opts::parse();
    match &opts.sub_command {
        SubCommand::ParseTest(sub) => sub.run(&opts)?,
    }

    Ok(())
}
