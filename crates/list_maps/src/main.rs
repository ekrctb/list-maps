extern crate chrono;
extern crate failure;
extern crate osu_api;
extern crate reqwest;
extern crate structopt;

use chrono::prelude::*;
use failure::{Fallible, ResultExt};
use osu_api::*;
use structopt::StructOpt;

fn get_api_key() -> Fallible<String> {
    Ok(std::fs::read_to_string("API_SECRET")
        .context("Failed to open API_SECRET file")?
        .trim()
        .to_string())
}

#[derive(Debug, StructOpt)]
enum App {
    #[structopt(name = "get-maps")]
    GetMaps(GetMaps),
}

#[derive(Debug, StructOpt)]
struct GetMaps {}

impl GetMaps {
    fn run(&self) -> Fallible<()> {
        let api_key = get_api_key()?;
        let mut client = reqwest::Client::new();
        let beatmaps = GetBeatmaps::new(api_key)
            .since(Utc.ymd(2000, 1, 1).and_hms(0, 0, 0))
            .limit(2)
            .request(&mut client)?;
        println!("{:?}", beatmaps);
        Ok(())
    }
}

fn main() {
    match App::from_args() {
        App::GetMaps(args) => args.run(),
    }
    .unwrap_or_else(|e| {
        for cause in e.iter_chain() {
            eprintln!("{}", cause);
        }
    })
}
