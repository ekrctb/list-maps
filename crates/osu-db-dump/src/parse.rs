use std::str::{self, FromStr};

use atoi::FromRadix10SignedChecked;

use crate::{make_span, preparse};
pub use preparse::make_err_msg;

pub fn string_literal_opt_borrow<'a>(
    mut input: &'a [u8],
    buf: &mut Vec<u8>,
) -> Result<Option<&'a [u8]>, &'static str> {
    if input.len() < 2 || input[0] != b'\'' || input[input.len() - 1] != b'\'' {
        return Err("string literal");
    }
    input = &input[1..];
    let mut first = true;
    loop {
        let mut i = 0;
        while i + 1 < input.len() && input[i] != b'\\' {
            i += 1;
        }
        // zero-copy case
        if std::mem::replace(&mut first, false) && i + 1 == input.len() {
            return Ok(Some(&input[..i]));
        }
        buf.extend_from_slice(&input[..i]);
        input = &input[i..];

        if input.len() < 2 {
            if input.is_empty() {
                return Err("escape sequence");
            }
            break;
        }
        buf.push(match input[1] {
            b'0' => 0x00,
            b'\'' => b'\'',
            b'"' => b'"',
            b'b' => 0x08,
            b'n' => b'\n',
            b'r' => b'\r',
            b't' => b'\t',
            b'Z' => 0x1a,
            b'\\' => b'\\',
            _ => return Err("escape sequence"),
        });
        input = &input[2..];
    }
    return Ok(None);
}

pub fn string_literal(input: &[u8], buf: &mut Vec<u8>) -> Result<(), &'static str> {
    if let Some(borrowed) = string_literal_opt_borrow(input, buf)? {
        buf.extend_from_slice(borrowed);
    }
    Ok(())
}

pub fn integer_literal<T: FromRadix10SignedChecked>(
    input: &[u8],
    out: &mut T,
) -> Result<(), &'static str> {
    let (res, _) = T::from_radix_10_signed_checked(input);
    match res {
        Some(value) => {
            *out = value;
            Ok(())
        }
        _ => Err("integer literal"),
    }
}

pub fn from_str<T: FromStr>(
    input: &[u8],
    expected: &'static str,
    out: &mut T,
) -> Result<(), &'static str> {
    match str::from_utf8(input).ok().and_then(|s| T::from_str(s).ok()) {
        Some(value) => {
            *out = value;
            Ok(())
        }
        None => Err(expected),
    }
}

pub fn null_literal(input: &[u8]) -> Result<(), &'static str> {
    if input != b"NULL" {
        return Err("null literal");
    }
    Ok(())
}

pub fn boolean_integer(input: &[u8], out: &mut bool) -> Result<(), &'static str> {
    if input != b"0" && input != b"1" {
        return Err("boolean integer");
    }
    *out = input == b"1";
    Ok(())
}

pub enum LiteralKind {
    Null,
    String,
    Integer,
    Decimal,
}

pub fn infer_kind_is_null(span: &[u8]) -> bool {
    span.first() == Some(&b'N')
}

pub fn infer_kind(span: &[u8]) -> Option<LiteralKind> {
    match span.first() {
        Some(b'N') => Some(LiteralKind::Null),
        Some(b'\'') => Some(LiteralKind::String),
        Some(b'0'..=b'9') | Some(b'-') => {
            if span.iter().any(|&b| b == b'.' || b == b'e') {
                Some(LiteralKind::Decimal)
            } else {
                Some(LiteralKind::Integer)
            }
        }
        _ => None,
    }
}

pub fn column_name(input: &mut &[u8], out: &mut String) -> Result<(), &'static str> {
    if input.len() < 2 || input[0] != b'`' || input[input.len() - 1] != b'`' {
        return Err("column name");
    }
    match std::str::from_utf8(&input[1..input.len() - 1]) {
        Err(_) => Err("column name"),
        Ok(str) => {
            out.push_str(str);
            Ok(())
        }
    }
}

pub struct TableDefParser {
    in_table_def: bool,
    columns: Vec<String>,
}

impl TableDefParser {
    pub fn new() -> Self {
        Self {
            in_table_def: false,
            columns: Vec::new(),
        }
    }

    pub fn feed_line(&mut self, input: &mut &[u8]) -> Result<bool, &'static str> {
        if !self.in_table_def {
            if preparse::table_def_start(input)? {
                self.in_table_def = true;
            }
            Ok(false)
        } else if preparse::table_def_end(input) {
            self.in_table_def = false;
            Ok(true)
        } else {
            if !preparse::table_def_line_start(input) {
                return Ok(false);
            }
            let start = *input;
            if !preparse::identifier(input) {
                return Ok(false);
            }
            let mut span = make_span(start, input);
            let mut name = String::new();
            column_name(&mut span, &mut name)?;
            self.columns.push(name);
            Ok(false)
        }
    }

    pub fn into_column_names(self) -> Vec<String> {
        self.columns
    }
}

#[derive(Debug)]
pub struct ValueTuple<'a, 'b> {
    span: &'a [u8],
    end_index: &'b [usize],
}

impl<'a, 'b> ValueTuple<'a, 'b> {
    pub(crate) fn new(span: &'a [u8], end_index: &'b [usize]) -> Self {
        Self { span, end_index }
    }

    pub fn count(&self) -> usize {
        self.end_index.len()
    }

    pub fn value_span(&self, i: usize) -> &'a [u8] {
        let start_index = if i == 0 { 1 } else { self.end_index[i - 1] + 1 };
        let end_index = self.end_index[i];
        &self.span[start_index..end_index]
    }
}

impl<'a, 'b, 'c, 'd> PartialEq<ValueTuple<'c, 'd>> for ValueTuple<'a, 'b> {
    fn eq(&self, other: &ValueTuple<'c, 'd>) -> bool {
        self.count() == other.count()
            && self.span == other.span
            && self.end_index == other.end_index
    }
}

pub struct ValueTupleParser {
    in_insert_line: bool,
    end_index: Vec<usize>,
}

impl ValueTupleParser {
    pub fn new(tuple_size: usize) -> Self {
        Self {
            in_insert_line: false,
            end_index: vec![0; tuple_size],
        }
    }

    pub fn parse_value<'a, 'b>(
        &'b mut self,
        input: &mut &'a [u8],
    ) -> Result<Option<ValueTuple<'a, 'b>>, &'static str> {
        if !self.in_insert_line {
            if preparse::insert_line_start(input)? {
                self.in_insert_line = true;
            } else {
                preparse::line_rest(input);
            }
        } else {
            if !preparse::value_tuple_separator(input) {
                preparse::insert_line_end(input)?;
                self.in_insert_line = false;
            }
        };
        if !self.in_insert_line {
            Ok(None)
        } else {
            let start = *input;
            preparse::value_tuple(input, &mut self.end_index)?;
            Ok(Some(ValueTuple::new(
                make_span(start, input),
                &self.end_index,
            )))
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::test_utils::*;

    #[test]
    fn parse_string_literal() {
        check_accept(|i| string_literal(i, &mut Vec::new()), "''");

        let mut buf = Vec::new();
        check_accept(|i| string_literal(i, &mut buf), r#"'\0\'\"\b\n\r\t\Z\\'"#);
        assert_eq!(buf, b"\0\'\"\x08\n\r\t\x1a\\");
        buf.clear();

        check_reject(
            |i| string_literal(i, &mut Vec::new()),
            "",
            Some("string literal"),
        );

        check_reject(
            |i| string_literal(i, &mut Vec::new()),
            r"'\!'",
            Some("escape sequence"),
        );
    }

    #[test]
    fn table_def_parser() {
        let mut p = TableDefParser::new();
        assert_eq!(p.feed_line(&mut &b"// comment"[..]), Ok(false));
        assert_eq!(
            p.feed_line(&mut &b"CREATE TABLE `table_name` ("[..]),
            Ok(false)
        );
        assert_eq!(
            p.feed_line(&mut &b"  `id` mediumint unsigned NOT NULL AUTO_INCREMENT,"[..]),
            Ok(false)
        );
        assert_eq!(
            p.feed_line(&mut &b"  `column_2` float unsigned NOT NULL DEFAULT '0',"[..]),
            Ok(false)
        );
        assert_eq!(p.feed_line(&mut &b"  KEY `index_1` (`id`),"[..]), Ok(false));
        assert_eq!(p.feed_line(&mut &b") ENGINE=xx ... "[..]), Ok(true));
        assert_eq!(p.into_column_names(), vec!["id", "column_2"])
    }

    #[test]
    fn value_tuple_parser() {
        let mut p = ValueTupleParser::new(2);
        let mut input = &b"INSERT INTO `table` VALUES (1,'a'),(2,'b'),(31,'cx');"[..];
        assert_eq!(
            p.parse_value(&mut input),
            Ok(Some(ValueTuple::new(b"(1,'a')", &[2, 6])))
        );
        assert_eq!(
            p.parse_value(&mut input),
            Ok(Some(ValueTuple::new(b"(2,'b')", &[2, 6])))
        );
        assert_eq!(
            p.parse_value(&mut input),
            Ok(Some(ValueTuple::new(b"(31,'cx')", &[3, 8])))
        );
        assert_eq!(p.parse_value(&mut input), Ok(None));
        assert!(input.is_empty());

        input = &b"// random line"[..];
        assert_eq!(p.parse_value(&mut input), Ok(None));
        assert!(input.is_empty());

        input = &b"INSERT INTO `table` VALUES (4,'d');"[..];
        assert_eq!(
            p.parse_value(&mut input),
            Ok(Some(ValueTuple::new(b"(4,'d')", &[2, 6])))
        );
        assert_eq!(p.parse_value(&mut input), Ok(None));
        assert!(input.is_empty());

        input = &b"// \n\nINSERT INTO `table` VALUES (5,'e');"[..];
        assert_eq!(p.parse_value(&mut input), Ok(None));
        assert_eq!(p.parse_value(&mut input), Ok(None));
        assert_eq!(
            p.parse_value(&mut input),
            Ok(Some(ValueTuple::new(b"(5,'e')", &[2, 6])))
        );
        assert_eq!(p.parse_value(&mut input), Ok(None));
        assert!(input.is_empty());
    }
}
