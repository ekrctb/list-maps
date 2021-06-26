mod parse_test;

use clap::Clap;

#[derive(Clap)]
struct Opts {
    #[clap(subcommand)]
    sub_command: SubCommand,
}

#[derive(Clap)]
enum SubCommand {
    ParseTest(parse_test::Opts),
}

fn main() -> anyhow::Result<()> {
    let opts = Opts::parse();

    match opts.sub_command {
        SubCommand::ParseTest(opts) => opts.run()?,
    }

    Ok(())
}
