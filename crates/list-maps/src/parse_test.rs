use std::{
    ffi::OsStr,
    fs::{read_dir, File},
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
    time::Instant,
};

use anyhow::Context;
use clap::Clap;

#[derive(Clap)]
#[clap(about = "Test dump file parsing")]
pub struct Opts {
    #[clap(about = "Additional .sql files from osu database dump")]
    input_files: Vec<PathBuf>,
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
        for path in &self.input_files {
            self.run_one(path)?;
        }

        for entry in read_dir(&super_opts.osu_dump_dir).context("cannot open osu dump directory")? {
            let path = entry?.path();
            if path.extension() == Some(OsStr::new("sql")) {
                self.run_one(&path)?;
            }
        }
        Ok(())
    }

    fn run_one(&self, input_path: &Path) -> anyhow::Result<()> {
        let file = File::open(input_path).context("cannot open input file")?;
        let file_size = file.metadata()?.len();

        println!(
            "Parsing {} (size = {:.3}MiB) ...",
            input_path.display(),
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
