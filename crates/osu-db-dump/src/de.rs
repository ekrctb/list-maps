/*!

You can select properties freely like:

```rust,no_run
# use osu_db_dump::Reader;
# use bstr::BString;
# use std::{io::BufReader, fs::File};

#[derive(serde::Deserialize)]
struct BeatmapSet {
    beatmapset_id: u32,
    title: BString,
    bpm: f32,
}

# fn main() -> Result<(), Box<dyn std::error::Error>> {
let mut reader = Reader::new(BufReader::new(File::open("osu_beatmapsets.sql")?));
for result in reader.deserialize()? {
    let set: BeatmapSet = result?;
    println!("{}: {} with {}bpm", set.beatmapset_id, set.title, set.bpm);
}
# Ok(())
# }

```

- Only support `DeserializeOwned` types for the iterator iterface.

*/

use std::{
    io::{self, BufRead},
    marker::PhantomData,
    str::FromStr,
};

use atoi::FromRadix10SignedChecked;
use duplicate::duplicate;
use serde::de::{value::BorrowedStrDeserializer, DeserializeOwned};

use crate::{
    make_display,
    parse::{self, LiteralKind, ValueTuple, ValueTupleParser},
};

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("IO error")]
    Io(#[source] io::Error),
    #[error("Parse error {0}")]
    Parse(String),
    #[error("unexpected end of input: {0} expected")]
    EndOfInput(String),
    #[error("{0}")]
    Custom(String),
    #[error("{0} is unsupported")]
    Unsupported(String),
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
    fn from_parse_error(line: u64, column: usize, input: &[u8], expected: &str) -> Self {
        Self::Parse(format!(
            "at {}:{}: expected {} in {}",
            line,
            column,
            expected,
            make_display(input)
        ))
    }

    fn end_of_input(expected: &str) -> Self {
        Error::EndOfInput(expected.to_owned())
    }

    fn unsupported(feature: &str) -> Self {
        Error::Unsupported(feature.to_owned())
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

pub struct ReaderPos<'a> {
    line_num: u64,
    line: &'a [u8],
}

impl<'a> ReaderPos<'a> {
    fn new(line_num: u64, line: &'a [u8]) -> Self {
        Self { line_num, line }
    }

    pub fn make_parse_error(&self, input: &'a [u8], expected: &str) -> Error {
        Error::from_parse_error(
            self.line_num,
            self.line.len() - input.len() + 1,
            input,
            expected,
        )
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

    fn reader_pos(&self) -> ReaderPos<'_> {
        ReaderPos::new(self.line_num, &self.line_buf)
    }

    fn make_parse_error(&self, input: &[u8], expected: &str) -> Error {
        self.reader_pos().make_parse_error(input, expected)
    }

    fn read_table_def(&mut self) -> Result<TableDef, Error> {
        let mut p = parse::TableDefParser::new();
        loop {
            if !self.read_line()? {
                return Err(Error::end_of_input("table definition"));
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

    pub fn deserialize<D: DeserializeOwned>(mut self) -> Result<DeserializeIter<R, D>, Error> {
        let table_def = self.read_table_def()?;
        Ok(DeserializeIter::new(self, table_def))
    }
}

pub struct DeserializeIter<R, D> {
    reader: Reader<R>,
    table_def: TableDef,
    parser: ValueTupleParser,
    line_pos: usize,
    _phantom: PhantomData<fn() -> D>,
}

impl<R: BufRead, D: DeserializeOwned> DeserializeIter<R, D> {
    fn new(reader: Reader<R>, table_def: TableDef) -> Self {
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

impl<'a, R: BufRead, D: DeserializeOwned> Iterator for DeserializeIter<R, D> {
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
                    let mut deserializer = ValueTupleDeserializer::new(
                        self.reader.reader_pos(),
                        &self.table_def,
                        tuple,
                    );
                    return Some(D::deserialize(&mut deserializer));
                }
                Err(expected) => {
                    return Some(Err(self.reader.make_parse_error(input, expected)));
                }
            }
        }
    }
}

pub struct ValueTupleDeserializer<'a> {
    reader_pos: ReaderPos<'a>,
    table_def: &'a TableDef,
    tuple: ValueTuple<'a, 'a>,
    current_index: usize,
    buf: Vec<u8>,
}

impl<'a> ValueTupleDeserializer<'a> {
    pub fn new(
        reader_pos: ReaderPos<'a>,
        table_def: &'a TableDef,
        tuple: ValueTuple<'a, 'a>,
    ) -> Self {
        assert!(
            table_def.column_count() == tuple.count(),
            "tuple count mismatch"
        );

        Self {
            reader_pos,
            table_def,
            tuple,
            current_index: 0,
            buf: Vec::new(),
        }
    }

    fn has_next_span(&self) -> bool {
        self.current_index < self.tuple.count()
    }

    fn peek_span_opt(&mut self) -> Option<&'a [u8]> {
        if !self.has_next_span() {
            None
        } else {
            Some(self.tuple.value_span(self.current_index))
        }
    }

    fn peek_span(&mut self, expected: &str) -> Result<&'a [u8], Error> {
        self.peek_span_opt()
            .ok_or_else(|| Error::end_of_input(expected))
    }

    fn next_span(&mut self, expected: &str) -> Result<&'a [u8], Error> {
        let span = self.peek_span(expected)?;
        self.current_index += 1;
        Ok(span)
    }

    fn peek_column_name_opt(&self) -> Option<&'a str> {
        if self.has_next_span() {
            Some(&self.table_def.column_names[self.current_index])
        } else {
            None
        }
    }

    fn make_parse_error(&self, input: &[u8], expected: &str) -> Error {
        self.reader_pos.make_parse_error(input, expected)
    }

    fn next_integer<T: Default + FromRadix10SignedChecked>(&mut self) -> Result<T, Error> {
        let span = self.next_span("integer")?;
        let mut value = T::default();
        match parse::integer_literal(span, &mut value) {
            Ok(()) => Ok(value),
            Err(expected) => Err(self.make_parse_error(span, expected)),
        }
    }

    fn next_boolean(&mut self) -> Result<bool, Error> {
        let span = self.next_span("boolean value")?;
        let mut value = bool::default();
        match parse::boolean_integer(span, &mut value) {
            Ok(()) => Ok(value),
            Err(expected) => Err(self.make_parse_error(span, expected)),
        }
    }

    fn next_from_str<T: Default + FromStr>(&mut self, expected: &'static str) -> Result<T, Error> {
        let span = self.next_span(expected)?;
        let mut value = T::default();
        match parse::from_str(span, expected, &mut value) {
            Ok(()) => Ok(value),
            Err(expected) => Err(self.make_parse_error(span, expected)),
        }
    }

    fn next_string(&mut self) -> Result<Option<&'a [u8]>, Error> {
        let span = self.next_span("string literal")?;
        self.buf.clear();
        match parse::string_literal_opt_borrow(span, &mut self.buf) {
            Ok(r) => Ok(r),
            Err(expected) => Err(self.make_parse_error(span, expected)),
        }
    }

    fn next_null(&mut self) -> Result<(), Error> {
        let span = self.next_span("null literal")?;
        match parse::null_literal(span) {
            Ok(()) => Ok(()),
            Err(expected) => Err(self.make_parse_error(span, expected)),
        }
    }

    fn next_ignore_any(&mut self) -> Result<(), Error> {
        self.next_span("value")?;
        Ok(())
    }
}

impl<'a, 'de> serde::Deserializer<'de> for &'a mut ValueTupleDeserializer<'de> {
    type Error = Error;

    fn deserialize_any<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        let span = self.peek_span("value")?;
        match parse::infer_kind(span) {
            Some(LiteralKind::Null) => self.deserialize_unit(visitor),
            Some(LiteralKind::String) => self.deserialize_bytes(visitor),
            Some(LiteralKind::Integer) => self.deserialize_i64(visitor),
            Some(LiteralKind::Decimal) => self.deserialize_f64(visitor),
            None => Err(self.make_parse_error(span, "null, string, or number")),
        }
    }

    fn deserialize_bool<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        visitor.visit_bool(self.next_boolean()?)
    }

    #[duplicate(
          deserialize_ixx     visit_ixx;
        [ deserialize_i8  ] [ visit_i8  ];
        [ deserialize_i16 ] [ visit_i16 ];
        [ deserialize_i32 ] [ visit_i32 ];
        [ deserialize_i64 ] [ visit_i64 ];
        [ deserialize_u8  ] [ visit_u8  ];
        [ deserialize_u16 ] [ visit_u16 ];
        [ deserialize_u32 ] [ visit_u32 ];
        [ deserialize_u64 ] [ visit_u64 ];
    )]
    fn deserialize_ixx<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        visitor.visit_ixx(self.next_integer()?)
    }

    fn deserialize_f32<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        visitor.visit_f32(self.next_from_str("number")?)
    }

    fn deserialize_f64<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        visitor.visit_f64(self.next_from_str("number")?)
    }

    fn deserialize_char<V>(self, _visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        Err(Error::unsupported("deserializing char"))
    }

    fn deserialize_str<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        self.deserialize_bytes(visitor)
    }

    fn deserialize_string<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        self.deserialize_byte_buf(visitor)
    }

    fn deserialize_bytes<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        if let Some(borrowed) = self.next_string()? {
            visitor.visit_borrowed_bytes(borrowed)
        } else {
            visitor.visit_bytes(&self.buf)
        }
    }

    fn deserialize_byte_buf<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        if let Some(borrowed) = self.next_string()? {
            visitor.visit_borrowed_bytes(borrowed)
        } else {
            visitor.visit_byte_buf(std::mem::take(&mut self.buf))
        }
    }

    fn deserialize_option<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        if parse::infer_kind_is_null(self.peek_span("value")?) {
            self.next_null()?;
            visitor.visit_none()
        } else {
            visitor.visit_some(self)
        }
    }

    fn deserialize_unit<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        self.next_null()?;
        visitor.visit_unit()
    }

    fn deserialize_unit_struct<V>(
        self,
        _name: &'static str,
        visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        self.deserialize_unit(visitor)
    }

    fn deserialize_newtype_struct<V>(
        self,
        _name: &'static str,
        visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        visitor.visit_newtype_struct(self)
    }

    fn deserialize_seq<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        visitor.visit_seq(self)
    }

    fn deserialize_tuple<V>(self, _len: usize, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        self.deserialize_seq(visitor)
    }

    fn deserialize_tuple_struct<V>(
        self,
        _name: &'static str,
        _len: usize,
        visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        self.deserialize_seq(visitor)
    }

    fn deserialize_map<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        visitor.visit_map(self)
    }

    fn deserialize_struct<V>(
        self,
        _name: &'static str,
        _fields: &'static [&'static str],
        visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        self.deserialize_map(visitor)
    }

    fn deserialize_enum<V>(
        self,
        _name: &'static str,
        _variants: &'static [&'static str],
        _visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        Err(Error::unsupported("deserializing enum"))
    }

    fn deserialize_identifier<V>(self, _visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        Err(Error::unsupported("deserializing identifier"))
    }

    fn deserialize_ignored_any<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::Visitor<'de>,
    {
        self.next_ignore_any()?;
        visitor.visit_unit()
    }
}

impl<'a, 'de> serde::de::SeqAccess<'de> for &'a mut ValueTupleDeserializer<'de> {
    type Error = Error;

    fn next_element_seed<T>(&mut self, seed: T) -> Result<Option<T::Value>, Self::Error>
    where
        T: serde::de::DeserializeSeed<'de>,
    {
        if self.has_next_span() {
            seed.deserialize(&mut **self).map(Some)
        } else {
            Ok(None)
        }
    }
}

impl<'a, 'de> serde::de::MapAccess<'de> for &'a mut ValueTupleDeserializer<'de> {
    type Error = Error;

    fn next_key_seed<K>(&mut self, seed: K) -> Result<Option<K::Value>, Self::Error>
    where
        K: serde::de::DeserializeSeed<'de>,
    {
        if let Some(name) = self.peek_column_name_opt() {
            seed.deserialize(BorrowedStrDeserializer::new(name))
                .map(Some)
        } else {
            Ok(None)
        }
    }

    fn next_value_seed<V>(&mut self, seed: V) -> Result<V::Value, Self::Error>
    where
        V: serde::de::DeserializeSeed<'de>,
    {
        seed.deserialize(&mut **self)
    }
}

#[cfg(test)]
mod test {
    use std::{collections::BTreeMap, fmt::Debug};

    use bstr::BString;

    use super::*;
    use crate::preparse;

    fn check_deserializer<T: Debug + PartialEq<T> + DeserializeOwned>(
        line: &[u8],
        column_names: &[&str],
        expected: T,
    ) {
        let pos = ReaderPos::new(1, line);
        let table_def = TableDef::new(column_names.iter().copied().map(String::from).collect());
        let mut end_index = vec![0; table_def.column_count()];
        let tuple = {
            let mut input = line;
            preparse::value_tuple(&mut input, &mut end_index).unwrap();
            assert!(input.is_empty());
            ValueTuple::new(line, &end_index)
        };
        let mut deserializer = ValueTupleDeserializer::new(pos, &table_def, tuple);
        match T::deserialize(&mut deserializer) {
            Ok(value) => assert_eq!(value, expected),
            Err(err) => assert!(false, "deserializer returned error: {}", err),
        }
    }

    fn check_deserializer_n<T: Debug + PartialEq<T> + DeserializeOwned>(
        line: &[u8],
        column_count: usize,
        expected: T,
    ) {
        let column_names: Vec<String> = (0..column_count).map(|i| format!("dummy{}", i)).collect();
        let column_names: Vec<&str> = column_names.iter().map(|s| s.as_ref()).collect();
        check_deserializer(line, &column_names, expected);
    }

    fn check_deserializer_one<T: Debug + PartialEq<T> + DeserializeOwned>(
        line: &[u8],
        expected: T,
    ) {
        check_deserializer_n(line, 1, expected);
    }

    #[test]
    fn deserializer_basic() {
        check_deserializer_one(b"(0)", 0i32);
        check_deserializer_one(b"(1)", 1u32);
        check_deserializer_one(b"(-1)", -1i8);

        check_deserializer_one(b"(1)", true);
        check_deserializer_one(b"(0)", false);

        check_deserializer_one(b"(1.5)", 1.5f32);
        check_deserializer_one(b"(1.5)", 1.5f64);
        check_deserializer_one(b"(-1e-3)", -1e-3f64);

        check_deserializer_one(b"(NULL)", ());

        check_deserializer_one(b"(NULL)", None::<i32>);
        check_deserializer_one(b"(123)", Some(123));
    }

    #[test]
    fn deserialize_string() {
        check_deserializer_one(b"('str')", "str".to_string());
        check_deserializer_one(br"('es\'ca\\pe\0xxx')", "es'ca\\pe\0xxx".to_string());
        check_deserializer_one(b"('null')", Some("null".to_string()));
    }

    #[test]
    fn deserialize_bytes() {
        check_deserializer_one(b"('\xff\x80')", BString::from(&b"\xff\x80"[..]));
    }

    #[test]
    fn deserialize_seq() {
        check_deserializer_n(b"(1,2,3)", 3, vec![1, 2, 3u32]);
        check_deserializer_n(
            b"('a','b','c')",
            3,
            vec!["a".to_string(), "b".to_string(), "c".to_string()],
        );
        check_deserializer_n(b"(NULL,2,NULL)", 3, vec![None, Some(2i32), None]);
    }

    #[test]
    fn deserialize_map() {
        check_deserializer(
            b"(1,2,3)",
            &["z", "y", "x"],
            [
                ("x".to_string(), 3),
                ("y".to_string(), 2),
                ("z".to_string(), 1),
            ]
            .iter()
            .cloned()
            .collect::<BTreeMap<String, i32>>(),
        );
    }

    #[test]
    fn deserialize_struct() {
        #[derive(Debug, PartialEq, serde::Deserialize)]
        struct TestStruct1 {
            x: i32,
            y: String,
            z: Option<f64>,
        }
        check_deserializer(
            b"('a',1)",
            &["y", "x"],
            TestStruct1 {
                x: 1,
                y: "a".to_string(),
                z: None,
            },
        );
    }

    #[test]
    fn deserialize_struct_unknown_fields() {
        #[derive(Debug, PartialEq, serde::Deserialize)]
        struct TestStruct2 {
            y: i32,
        }
        check_deserializer(
            b"('a',3,NULL,'b')",
            &["x", "y", "z", "w"],
            TestStruct2 { y: 3 },
        );
    }
}
