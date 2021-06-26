use clap::Clap;
use serde::Deserialize;
use std::{fs::File, io::BufReader, path::PathBuf};

#[derive(Clap)]
struct Opts {
    #[clap(subcommand)]
    sub_command: SubCommand,
}

#[derive(Clap)]
enum SubCommand {
    ParseTest(ParseTest),
}

#[derive(Clap)]
struct ParseTest {
    #[clap(about = "A .sql file from osu dump")]
    input: PathBuf,
}

#[derive(Deserialize)]
struct OsuScore {
    pp: Option<f32>,
}

fn parse_test(args: &ParseTest) -> anyhow::Result<()> {
    let reader = BufReader::new(File::open(&args.input).expect("test file not found"));
    let mut reader = osu_db_dump::de::Reader::new(reader);
    let mut total_pp = 0.0f64;
    let mut total_scores = 0;
    for result in reader.deserialize()? {
        let result: OsuScore = result?;
        total_scores += 1;
        total_pp += result.pp.unwrap_or_default() as f64;
    }
    println!(
        "{} scores with average {}pp",
        total_scores,
        total_pp / (total_scores as f64)
    );
    Ok(())
}

fn main() {
    let opts = Opts::parse();

    if let Err(err) = match opts.sub_command {
        SubCommand::ParseTest(args) => parse_test(&args),
    } {
        println!("{}", err);
    }
}
