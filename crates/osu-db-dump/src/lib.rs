//!

// Each line is read to the buffer (no streaming parser needed).
//
//
// Note: the strings are encoded as UTF-8, but the dump file contains non-UTF8 bytes (binary values).
// Ref: <https://dev.mysql.com/doc/refman/8.0/en/literals.html>

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
#[non_exhaustive]
pub enum LineHeaderKind {
    Insert,
    Other,
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum RawValueKind {
    /// 'string\0xxx' (may contain non-utf-8 bytes).
    String,
    /// 12345, -12.34e-5
    Number,
    /// NULL
    Null,
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct RawValue<'a> {
    kind: RawValueKind,
    span: &'a [u8],
}

impl<'a> RawValue<'a> {
    fn new(kind: RawValueKind, span: &'a [u8]) -> Self {
        Self { kind, span }
    }
}

impl<'a> Default for RawValue<'a> {
    fn default() -> Self {
        RawValue::new(RawValueKind::Null, b"")
    }
}

pub mod parse {
    use super::{LineHeaderKind, RawValue, RawValueKind};
    use nom::{
        branch::alt,
        bytes::complete::{tag, take, take_while, take_while1},
        combinator::{map, opt, recognize, rest, value},
        error::ParseError,
        multi::{many0_count, separated_list0},
        sequence::{delimited, preceded, terminated},
        IResult,
    };

    fn string_fragment_literal<'a, E: ParseError<&'a [u8]>>(
        input: &'a [u8],
    ) -> IResult<&[u8], &[u8], E> {
        take_while1(|b| b != b'\\' && b != b'\'')(input)
    }

    fn string_fragment_escaped_raw<'a, E: ParseError<&'a [u8]>>(
        input: &'a [u8],
    ) -> IResult<&[u8], &[u8], E> {
        preceded(tag("\\"), take(1usize))(input)
    }

    pub fn raw_string_literal<'a, E: ParseError<&'a [u8]>>(
        input: &'a [u8],
    ) -> IResult<&[u8], &[u8], E> {
        delimited(
            tag("'"),
            recognize(many0_count(alt((
                string_fragment_literal,
                string_fragment_escaped_raw,
            )))),
            tag("'"),
        )(input)
    }

    pub fn raw_null_literal<'a, E: ParseError<&'a [u8]>>(
        input: &'a [u8],
    ) -> IResult<&[u8], &[u8], E> {
        tag("NULL")(input)
    }

    pub fn raw_number_literal<'a, E: ParseError<&'a [u8]>>(
        input: &'a [u8],
    ) -> IResult<&[u8], &[u8], E> {
        take_while1(|b: u8| b.is_ascii_digit() || b == b'.' || b == b'-' || b == b'e')(input)
    }

    pub fn raw_value<'a, E: ParseError<&'a [u8]>>(
        input: &'a [u8],
    ) -> IResult<&'a [u8], RawValue<'a>, E> {
        alt((
            map(raw_string_literal, |span| {
                RawValue::new(RawValueKind::String, span)
            }),
            map(raw_number_literal, |span| {
                RawValue::new(RawValueKind::Number, span)
            }),
            map(raw_null_literal, |span| {
                RawValue::new(RawValueKind::Null, span)
            }),
        ))(input)
    }

    /// It matches \`name\`.
    /// No support for escaping sequence of any kind.
    pub fn identifier<'a, E: ParseError<&'a [u8]>>(input: &'a [u8]) -> IResult<&[u8], &[u8], E> {
        delimited(
            tag("`"),
            take_while(|b: u8| b.is_ascii_alphanumeric() || b == b'_'),
            tag("`"),
        )(input)
    }

    pub fn insert_line_header<'a, E: ParseError<&'a [u8]>>(
        input: &'a [u8],
    ) -> IResult<&[u8], &[u8], E> {
        delimited(tag("INSERT INTO "), identifier, tag(" VALUES "))(input)
    }

    pub fn wrap_value_tuple<'a, F, O, E: ParseError<&'a [u8]>>(
        inner: F,
    ) -> impl FnMut(&'a [u8]) -> IResult<&'a [u8], O, E>
    where
        F: FnMut(&'a [u8]) -> IResult<&'a [u8], O, E>,
    {
        delimited(tag("("), inner, tag(")"))
    }

    pub fn value_tuple_separator<'a, E: ParseError<&'a [u8]>>(
        input: &'a [u8],
    ) -> IResult<&[u8], bool, E> {
        alt((value(false, tag(",")), value(true, tag(";"))))(input)
    }

    pub fn line_header<'a, E: ParseError<&'a [u8]>>(
        input: &'a [u8],
    ) -> IResult<&[u8], LineHeaderKind, E> {
        alt((
            value(LineHeaderKind::Insert, insert_line_header),
            value(LineHeaderKind::Other, rest),
        ))(input)
    }

    pub fn fold_inserted_values<'a, E: ParseError<&'a [u8]>, F, G, O, R>(
        mut inner: F,
        init: R,
        mut fold: G,
    ) -> impl FnOnce(&'a [u8]) -> IResult<&'a [u8], R, E>
    where
        F: FnMut(&'a [u8]) -> IResult<&'a [u8], O, E>,
        G: FnMut(R, O) -> R,
    {
        move |input| {
            let (input, kind) = line_header(input)?;
            match kind {
                LineHeaderKind::Other => Ok((input, init)),
                LineHeaderKind::Insert => {
                    let mut input = input;
                    let mut res = init;
                    loop {
                        let (new_input, value) = wrap_value_tuple(&mut inner)(input)?;
                        input = new_input;
                        res = fold(res, value);

                        let (new_input, end) = value_tuple_separator(input)?;
                        input = new_input;
                        if end {
                            break;
                        }
                    }
                    Ok((input, res))
                }
            }
        }
    }

    pub fn raw_value_vec<'a, E: ParseError<&'a [u8]>>(
        input: &'a [u8],
    ) -> IResult<&[u8], Vec<RawValue<'a>>, E> {
        separated_list0(tag(","), raw_value)(input)
    }

    pub fn raw_value_count<'a, E: ParseError<&'a [u8]>>(
        input: &'a [u8],
    ) -> IResult<&[u8], usize, E> {
        many0_count(terminated(raw_value, opt(tag(","))))(input)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use nom::bytes::complete::tag;
    use std::fmt::Debug;

    fn check_ok<'a, I: ?Sized + AsRef<[u8]>, T: Debug + PartialEq<U>, U: Debug>(
        parser: impl FnOnce(&'a [u8]) -> nom::IResult<&'a [u8], T>,
        input: &'a I,
        expected_result: U,
    ) {
        match parser(input.as_ref()) {
            Ok(([], value)) => assert_eq!(value, expected_result),
            Ok((rest, _)) => assert!(
                false,
                "The parser didn't consume all of the input: {:?}",
                String::from_utf8_lossy(rest)
            ),
            Err(err) => assert!(false, "The parser returned an error: {:?}", err),
        }
    }

    fn check_err<'a, I: ?Sized + AsRef<[u8]>, T: Debug>(
        parser: impl FnOnce(&'a [u8]) -> nom::IResult<&'a [u8], T>,
        input: &'a I,
    ) {
        match parser(input.as_ref()) {
            Err(_err) => {}
            Ok((rest, value)) => assert!(
                false,
                "Parser unexpectedly suceeded: {:?} with rest = {:?}",
                value, rest
            ),
        }
    }

    #[test]
    fn parse_raw_string_literal() {
        check_ok(parse::raw_string_literal, "'string'", b"string");
        check_ok(parse::raw_string_literal, "'string'", b"string");
        check_ok(
            parse::raw_string_literal,
            "'レジェンド'",
            "レジェンド".as_bytes(),
        );
        check_ok(parse::raw_string_literal, r"'\''", br"\'");
        check_ok(parse::raw_string_literal, r"'\\\''", br"\\\'");
        check_err(parse::raw_string_literal, "");
        check_err(parse::raw_string_literal, "'");
        check_err(parse::raw_string_literal, r"'\'");
    }

    #[test]
    fn parse_raw_value() {
        check_ok(
            parse::raw_value,
            r"'string\0\'xxx'",
            RawValue::new(RawValueKind::String, br"string\0\'xxx"),
        );
        check_ok(
            parse::raw_value,
            "-12.34e-5",
            RawValue::new(RawValueKind::Number, b"-12.34e-5"),
        );
        check_ok(
            parse::raw_value,
            "NULL",
            RawValue::new(RawValueKind::Null, b"NULL"),
        );
        check_err(parse::raw_value, "");
        check_err(parse::raw_value, "'");
        check_err(parse::raw_value, ";");
        check_err(parse::raw_value, ",1");
    }

    #[test]
    fn parse_value_tuple() {
        check_ok(
            parse::raw_value_vec,
            "NULL,'string',123",
            vec![
                RawValue::new(RawValueKind::Null, b"NULL"),
                RawValue::new(RawValueKind::String, b"string"),
                RawValue::new(RawValueKind::Number, b"123"),
            ],
        );
        check_ok(
            parse::wrap_value_tuple(parse::raw_value_count),
            "(123,NULL,'string')",
            3,
        )
    }

    #[test]
    fn parse_line_header() {
        check_ok(
            parse::line_header,
            "INSERT INTO `table` VALUES ",
            LineHeaderKind::Insert,
        );
        check_ok(parse::line_header, "-- comment", LineHeaderKind::Other);
        check_ok(
            parse::line_header,
            "DROP TABLE IF EXISTS `table`;",
            LineHeaderKind::Other,
        );
    }

    #[test]
    fn parse_insert_values() {
        assert_eq!(
            parse::fold_inserted_values::<nom::error::Error<&[u8]>, _, _, _, _>(
                tag("1"),
                0,
                |x, _| x + 1
            )(b"INSERT INTO `table` VALUES (1),(1);"),
            Ok((&b""[..], 2))
        );
    }
}
