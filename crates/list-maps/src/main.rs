use clap::Clap;
use nom::IResult;
use std::{
    fs::File,
    io::{BufRead, BufReader},
    path::PathBuf,
    time::Instant,
};

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

fn parse_test(args: &ParseTest) -> anyhow::Result<()> {
    let mut reader = BufReader::new(File::open(&args.input).expect("test file not found"));

    let instant = Instant::now();

    let mut buf = Vec::new();
    while reader
        .read_until(b'\n', &mut buf)
        .expect("file read failed")
        != 0
    {
        match osu_db_dump::parse::fold_inserted_values(
            |input| -> IResult<&[u8], _, nom::error::Error<&[u8]>> {
                osu_db_dump::parse::raw_value_count(input)
            },
            (0, 0),
            |x, y| (x.0 + 1, x.1 + y),
        )(&buf)
        {
            Ok((_, count)) => {
                if count.0 != 0 {
                    println!("count = {}, total values = {}", count.0, count.1);
                }
            }
            Err(e) => {
                anyhow::bail!(
                    "{}",
                    e.map(|e| (
                        e.code,
                        String::from_utf8_lossy(&e.input[..e.input.len().min(100)])
                    ))
                );
            }
        }

        buf.clear();
    }

    println!("{}ms", instant.elapsed().as_millis());

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
