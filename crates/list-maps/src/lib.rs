use std::{collections::HashMap, fs::File, io::BufReader, path::Path};

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

pub trait HasPrimaryId {
    fn primary_id(&self) -> u32;
}

#[macro_export]
macro_rules! impl_has_primary_id {
    ($($id_name:ident for $type_name:path);* $(;)?) => {
        $(
            impl $crate::HasPrimaryId for $type_name {
                fn primary_id(&self) -> u32 {
                    self.$id_name
                }
            }
        )*
    };
}

pub fn load_all<T: DeserializeOwned + HasPrimaryId>(
    osu_dump_dir: &Path,
    db: osu_db_dump::Db,
) -> anyhow::Result<HashMap<u32, T>> {
    eprintln!("Loading {}...", db);

    let value_map = deserialize_iter(osu_dump_dir, db)?
        .map(|r| r.map(|value: T| (value.primary_id(), value)))
        .collect::<Result<HashMap<_, _>, _>>()?;

    eprintln!("Loaded {} {}", value_map.len(), db);

    Ok(value_map)
}
