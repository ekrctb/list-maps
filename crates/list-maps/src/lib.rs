use std::{fs::File, io::BufReader, path::Path};

use anyhow::Context;
use serde::de::DeserializeOwned;

pub fn deserialize_iter<T: DeserializeOwned>(
    osu_dump_dir: &Path,
    db: osu_db_dump::Db,
) -> anyhow::Result<impl Iterator<Item = osu_db_dump::Result<T>>> {
    let path = osu_dump_dir.join(db.file_name());
    let file = File::open(path).context("cannot open input file")?;
    let reader = BufReader::new(file);
    Ok(osu_db_dump::Reader::new(reader).deserialize::<T>()?)
}
