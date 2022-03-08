use std::{
    fs::File,
    io::{BufRead, BufReader},
    time::Instant,
};

use anyhow::Context;
use clap::Clap;

#[derive(Clap)]
#[clap(about = "Test dump file parsing")]
pub struct Opts {
    #[clap(
        long = "parse-value",
        about = "Parse the actual value. If not set, only lexical structure is recognized and values are ignored."
    )]
    parse_value: bool,
}

#[derive(serde::Deserialize)]
pub struct NoValue {}

impl Opts {
    pub fn run(&self, super_opts: &super::Opts) -> anyhow::Result<()> {
        use osu_db_dump::Db::*;

        for &db in &[
            BeatmapDifficultyAttribs,
            BeatmapDifficulty,
            BeatmapFailtimes,
            BeatmapPerformanceBlacklist,
            Beatmapsets,
            Beatmaps,
            Counts,
            DifficultyAttribs,
            ScoresFruitsHigh,
            UserBeatmapPlaycount,
            UserStatsFruits,
            SampleUsers,
        ] {
            if let Err(e) = self.run_one(super_opts, db) {
                println!("Error {}: {}", db, e);
            }
        }

        Ok(())
    }

    fn run_one(&self, super_opts: &super::Opts, db: osu_db_dump::Db) -> anyhow::Result<()> {
        let path = super_opts.osu_dump_dir.join(db.file_name());
        let file = File::open(&path).context("cannot open input file")?;
        let file_size = file.metadata()?.len();

        println!(
            "Database {} at {} with size {:.3}MiB) ...",
            db,
            path.display(),
            (file_size as f64) * 1e-6
        );

        let instant = Instant::now();
        if self.parse_value {
            let total = self.run_parse_value(BufReader::new(file))?;
            println!(
                "> {} values parsed in {}ms",
                total,
                instant.elapsed().as_millis()
            );
        } else {
            let count = self.run_no_value(BufReader::new(file))?;
            println!(
                "> {} rows parsed in {}ms",
                count,
                instant.elapsed().as_millis()
            );
        }

        Ok(())
    }

    fn run_no_value(&self, reader: impl BufRead) -> anyhow::Result<u64> {
        let mut count = 0u64;

        for result in osu_db_dump::Reader::new(reader).deserialize()? {
            let _result: NoValue = result?;
            count += 1;
        }

        Ok(count)
    }

    fn run_parse_value(&self, reader: impl BufRead) -> anyhow::Result<u64> {
        let mut total = 0u64;

        for result in osu_db_dump::Reader::new(reader).deserialize()? {
            let result: Vec<osu_db_dump::AnyValue> = result?;
            total += result.len() as u64;
        }

        Ok(total)
    }
}
