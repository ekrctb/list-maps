/*!
    So, the goal is freely select properties like:

```rust
#[derive(serde::Deserialize)]
struct BeatmapSet {
    beatmapset_id: u32,
    title: Vec<u8>,
    bpm: f32,
}

fn main() {
    let mut reader = Reader::new(BufReader::new(File::open("osu_beatmapsets.sql")?));
    for result in reader.deserialize() {
        let set: BeatmapSet<> = result?;
        println!("{}: {} with {}bpm", set.beatmapset_id, set.title, set.bpm);
    }
}
```

- Only support `DeserializeOwned` types for the iterator iterface.

*/

use std::{
    io::{self, BufRead},
    marker::PhantomData,
};

use serde::de::DeserializeOwned;

use crate::{
    make_display,
    parse::{self, ValueTuple, ValueTupleParser},
};

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("IO error")]
    Io(#[source] io::Error),
    #[error("Parse error {0}")]
    Parse(String),
    #[error("{0} expected")]
    Expected(String),
    #[error("{0}")]
    Custom(String),
}

impl From<io::Error> for Error {
    fn from(e: io::Error) -> Self {
        Self::Io(e)
    }
}

impl serde::de::Error for Error {
    fn custom<T>(msg: T) -> Self
    where
        T: std::fmt::Display,
    {
        Self::Custom(format!("{}", msg))
    }
}

impl Error {
    fn from_parse_error(line: u64, pos: usize, input: &[u8], expected: &str) -> Self {
        Self::Parse(format!(
            "at {}:{}: expected {} in {}",
            line,
            pos,
            expected,
            make_display(input)
        ))
    }

    fn expected(message: &str) -> Self {
        Error::Expected(message.to_owned())
    }
}

#[derive(Debug)]
pub struct TableDef {
    column_names: Vec<String>,
}

impl TableDef {
    fn new(column_names: Vec<String>) -> Self {
        Self { column_names }
    }

    pub fn column_count(&self) -> usize {
        self.column_names.len()
    }
}

pub struct Reader<R> {
    reader: R,
    line_num: u64,
    line_buf: Vec<u8>,
}

impl<R: BufRead> Reader<R> {
    pub fn new(reader: R) -> Self {
        Self {
            reader,
            line_num: 0,
            line_buf: Vec::new(),
        }
    }

    fn read_line(&mut self) -> Result<bool, Error> {
        self.line_buf.clear();
        let n = self.reader.read_until(b'\n', &mut self.line_buf)?;
        if self.line_buf.last() == Some(&b'\n') {
            self.line_buf.pop();
        }
        self.line_num += 1;
        Ok(n != 0)
    }

    fn make_parse_error(&self, input: &[u8], expected: &str) -> Error {
        let pos = self.line_buf.len() - input.len() + 1;
        Error::from_parse_error(self.line_num, pos, input, expected)
    }

    fn read_table_def(&mut self) -> Result<TableDef, Error> {
        let mut p = parse::TableDefParser::new();
        loop {
            if !self.read_line()? {
                return Err(Error::expected("table definition"));
            }
            let mut input = &self.line_buf[..];
            match p.feed_line(&mut input) {
                Ok(false) => {}
                Ok(true) => break,
                Err(expected) => return Err(self.make_parse_error(input, expected)),
            }
        }

        Ok(TableDef::new(p.into_column_names()))
    }

    pub fn deserialize<'a, D: DeserializeOwned>(
        &'a mut self,
    ) -> Result<DeserializeIter<'a, R, D>, Error> {
        let table_def = self.read_table_def()?;
        Ok(DeserializeIter::new(self, table_def))
    }
}

pub struct DeserializeIter<'a, R, D> {
    reader: &'a mut Reader<R>,
    table_def: TableDef,
    parser: ValueTupleParser,
    line_pos: usize,
    _phantom: PhantomData<fn() -> D>,
}

impl<'a, R: BufRead, D: DeserializeOwned> DeserializeIter<'a, R, D> {
    fn new(reader: &'a mut Reader<R>, table_def: TableDef) -> Self {
        let tuple_size = table_def.column_count();
        Self {
            reader,
            table_def,
            parser: ValueTupleParser::new(tuple_size),
            line_pos: 0,
            _phantom: PhantomData,
        }
    }
}

impl<'a, R: BufRead, D: DeserializeOwned> Iterator for DeserializeIter<'a, R, D> {
    type Item = Result<D, Error>;

    fn next(&mut self) -> Option<Self::Item> {
        loop {
            if self.line_pos >= self.reader.line_buf.len() {
                self.line_pos = 0;
                match self.reader.read_line() {
                    Ok(false) => return None,
                    Ok(true) => {}
                    Err(e) => return Some(Err(e)),
                }
            }
            let mut input = &self.reader.line_buf[self.line_pos..];
            let res = self.parser.parse_value(&mut input);
            self.line_pos = self.reader.line_buf.len() - input.len();
            match res {
                Ok(None) => {}
                Ok(Some(tuple)) => {
                    let deserializer = ValueTupleDeserializer::new(&self.table_def, tuple);
                    return Some(D::deserialize(deserializer));
                }
                Err(expected) => {
                    return Some(Err(self.reader.make_parse_error(input, expected)));
                }
            }
        }
    }
}

pub struct ValueTupleDeserializer<'a, 'b> {
    table_def: &'b TableDef,
    tuple: ValueTuple<'a, 'b>,
}

impl<'a, 'b> ValueTupleDeserializer<'a, 'b> {
    pub fn new(table_def: &'b TableDef, tuple: ValueTuple<'a, 'b>) -> Self {
        Self { table_def, tuple }
    }
}

impl<'de, 'b> serde::Deserializer<'de> for ValueTupleDeserializer<'de, 'b> {
    type Error = Error;

    fn deserialize_any<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_bool<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_i8<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_i16<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_i32<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_i64<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_u8<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_u16<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_u32<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_u64<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_f32<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_f64<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_char<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_str<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_string<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_bytes<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_byte_buf<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_option<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_unit<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_unit_struct<V>(
        self,
        name: &'static str,
        visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_newtype_struct<V>(
        self,
        name: &'static str,
        visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_seq<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_tuple<V>(self, len: usize, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_tuple_struct<V>(
        self,
        name: &'static str,
        len: usize,
        visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_map<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_struct<V>(
        self,
        name: &'static str,
        fields: &'static [&'static str],
        visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_enum<V>(
        self,
        name: &'static str,
        variants: &'static [&'static str],
        visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_identifier<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }

    fn deserialize_ignored_any<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        todo!()
    }
}
