use crate::{make_display, make_span, ParseResult};

pub(crate) fn check_accept<'a, I: ?Sized + AsRef<[u8]>, R: ParseResult>(
    parser: impl FnOnce(&mut &'a [u8]) -> R,
    input: &'a I,
) {
    let mut input = input.as_ref();
    let start = input;
    let r = parser(&mut input);
    assert!(
        r.is_accept(),
        "parser rejected the input {} expected {:?} at {}",
        make_display(start),
        r.get_expected(),
        make_display(input)
    );
    assert!(
        input.is_empty(),
        "parser didn't consume all the input: {} of {}",
        make_display(input),
        make_display(start),
    );
}

pub(crate) fn check_reject<'a, I: ?Sized + AsRef<[u8]>, R: ParseResult>(
    parser: impl FnOnce(&mut &'a [u8]) -> R,
    input: &'a I,
    expected: Option<&str>,
) {
    let mut input = input.as_ref();
    let start = input;
    let r = parser(&mut input);
    assert!(
        !r.is_accept(),
        "parser accepted the input {}",
        make_display(start)
    );
    assert_eq!(r.get_expected(), expected);
    if expected.is_none() {
        assert_eq!(
            input.len(),
            start.len(),
            "parser consumed the input {} of {}",
            make_display(make_span(start, input)),
            make_display(start),
        );
    }
}
