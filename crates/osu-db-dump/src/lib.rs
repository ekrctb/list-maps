//!

use std::fmt::Display;

pub mod de;
pub mod parse;
pub mod preparse;
#[cfg(test)]
mod test_utils;
pub mod value;

pub use de::Error;
pub type Result<T, E = Error> = std::result::Result<T, E>;
pub use de::Reader;
use serde::Serialize;
pub use value::AnyValue;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Db {
    BeatmapDifficultyAttribs,
    BeatmapDifficulty,
    BeatmapFailtimes,
    BeatmapPerformanceBlacklist,
    Beatmapsets,
    Beatmaps,
    Counts,
    DifficultyAttribs,
    ScoresFruitsHigh,
    UserBeatmapPlaycount,
    UserStatsFruits,
    SampleUsers,
}

impl Display for Db {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.serialize(f)
    }
}

impl Db {
    pub fn file_name(self) -> String {
        match self {
            Db::SampleUsers => format!("{}.sql", self),
            _ => format!("osu_{}.sql", self),
        }
    }
}

pub(crate) trait ParseResult {
    fn is_accept(&self) -> bool;
    fn get_expected(&self) -> Option<&'static str>;
}

impl ParseResult for bool {
    fn is_accept(&self) -> bool {
        *self
    }

    fn get_expected(&self) -> Option<&'static str> {
        None
    }
}

impl ParseResult for Result<bool, &'static str> {
    fn is_accept(&self) -> bool {
        self.unwrap_or(false)
    }

    fn get_expected(&self) -> Option<&'static str> {
        self.err()
    }
}

impl ParseResult for Result<(), &'static str> {
    fn is_accept(&self) -> bool {
        self.is_ok()
    }

    fn get_expected(&self) -> Option<&'static str> {
        self.err()
    }
}

fn make_display(input: &[u8]) -> impl Display {
    let max_len = 50;
    let truncated = &input[..input.len().min(max_len)];
    let end_indicator = if input.len() > max_len {
        "..."
    } else if input.len() <= 5 {
        "<end>"
    } else {
        ""
    };
    format!("{}{}", String::from_utf8_lossy(truncated), end_indicator)
}

pub(crate) fn make_span<'a>(start: &'a [u8], input: &[u8]) -> &'a [u8] {
    &start[..start.len() - input.len()]
}
