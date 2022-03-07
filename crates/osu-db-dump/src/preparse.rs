use crate::make_display;

fn next_satisfy(input: &mut &[u8], pred: impl FnOnce(u8) -> bool) -> bool {
    match input.split_first() {
        Some((first, rest)) => {
            if pred(*first) {
                *input = rest;
                true
            } else {
                false
            }
        }
        None => false,
    }
}

fn next_eq(input: &mut &[u8], target: u8) -> bool {
    next_satisfy(input, |b| b == target)
}

fn prefix_eq(input: &mut &[u8], target: &[u8]) -> bool {
    match input.strip_prefix(target) {
        Some(rest) => {
            *input = rest;
            true
        }
        None => false,
    }
}

fn next(input: &mut &[u8]) -> Option<u8> {
    match input.split_first() {
        Some((first, rest)) => {
            *input = rest;
            Some(*first)
        }
        None => None,
    }
}

pub fn string_literal(input: &mut &[u8]) -> bool {
    if !prefix_eq(input, b"_binary '") && !next_eq(input, b'\'') {
        return false;
    }
    while let Some(b) = next(input) {
        if b == b'\'' {
            break;
        }
        if b == b'\\' {
            next_satisfy(input, |_| true);
        }
    }
    true
}

pub fn null_literal(input: &mut &[u8]) -> bool {
    prefix_eq(input, b"NULL")
}

pub fn number_literal(input: &mut &[u8]) -> bool {
    if !next_eq(input, b'-') && !next_satisfy(input, |b| b.is_ascii_digit()) {
        return false;
    }
    while next_satisfy(input, |b| {
        b.is_ascii_digit() || b == b'.' || b == b'e' || b == b'-'
    }) {}
    true
}

pub fn value(input: &mut &[u8]) -> bool {
    string_literal(input) || number_literal(input) || null_literal(input)
}

pub fn value_tuple<'a>(input: &mut &'a [u8], end_index: &mut [usize]) -> Result<(), &'static str> {
    let start = *input;
    if !next_eq(input, b'(') {
        return Err("value tuple");
    }
    let mut first = true;
    for out in end_index.iter_mut() {
        if !std::mem::replace(&mut first, false) && !next_eq(input, b',') {
            return Err("more value");
        }
        if !value(input) {
            return Err("value");
        }
        *out = start.len() - input.len();
    }
    if !next_eq(input, b')') {
        return Err("end of tuple");
    }
    Ok(())
}

pub fn value_tuple_separator(input: &mut &[u8]) -> bool {
    next_eq(input, b',')
}

pub fn identifier(input: &mut &[u8]) -> bool {
    if !next_eq(input, b'`') {
        return false;
    }
    while next(input).map_or(false, |b| b != b'`') {}
    true
}

pub fn insert_line_start(input: &mut &[u8]) -> Result<bool, &'static str> {
    if !prefix_eq(input, b"INSERT INTO ") {
        return Ok(false);
    }
    if !identifier(input) {
        return Err("table name");
    }
    if !prefix_eq(input, b" VALUES ") {
        return Err("VALUES token");
    }
    Ok(true)
}

pub fn insert_line_end(input: &mut &[u8]) -> Result<bool, &'static str> {
    if !next_eq(input, b';') {
        return Err("semicolon");
    }
    Ok(true)
}

pub fn table_def_start(input: &mut &[u8]) -> Result<bool, &'static str> {
    if !prefix_eq(input, b"CREATE TABLE ") {
        return Ok(false);
    }
    if !identifier(input) {
        return Err("table name");
    }
    if !prefix_eq(input, b" (") {
        return Err("table def start");
    }
    Ok(true)
}

pub fn table_def_line_start(input: &mut &[u8]) -> bool {
    if !next_eq(input, b' ') {
        return false;
    }
    while next_eq(input, b' ') {}
    true
}

pub fn table_def_end(input: &mut &[u8]) -> bool {
    next_eq(input, b')')
}

pub fn line_rest(input: &mut &[u8]) -> bool {
    if input.is_empty() {
        return false;
    }
    while let Some(b) = next(input) {
        if b == b'\n' {
            break;
        }
    }
    true
}

pub fn make_err_msg(input: &[u8], expected: &str) -> String {
    format!(
        "Lexer error: expected {} in {}",
        expected,
        make_display(input)
    )
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::test_utils::*;

    #[test]
    fn parse_string_literal() {
        check_accept(string_literal, "'string'");
        check_accept(string_literal, "'string'");
        check_accept(string_literal, "'レジェンド'");
        check_accept(string_literal, r"'\''");
        check_accept(string_literal, r"'\\\''");

        check_reject(string_literal, "", None);
        check_reject(string_literal, r"\", None);

        check_accept(string_literal, "'");
        check_accept(string_literal, r"'\");

        check_accept(string_literal, r"_binary 'string'");
    }

    #[test]
    fn parse_value() {
        check_accept(value, r"'string\0\'xxx'");
        check_accept(value, "-12.34e-5");
        check_accept(value, "NULL");

        check_reject(value, "", None);
        check_reject(value, ";", None);
        check_reject(value, ",1", None);
    }

    #[test]
    fn parse_value_tuple() {
        check_accept(|i| value_tuple(i, &mut []), "()");

        let mut tup = [0; 3];
        check_accept(|i| value_tuple(i, &mut tup), "(NULL,'string',123)");
        assert_eq!(tup, [5, 14, 18]);

        check_reject(|i| value_tuple(i, &mut tup), "", Some("value tuple"));
        check_reject(|i| value_tuple(i, &mut tup), "(", Some("value"));
        check_reject(|i| value_tuple(i, &mut tup), "(x)", Some("value"));
        check_reject(|i| value_tuple(i, &mut tup), "(1", Some("more value"));
        check_reject(
            |i| value_tuple(i, &mut tup),
            "(1,2,3,4)",
            Some("end of tuple"),
        );
    }
}
