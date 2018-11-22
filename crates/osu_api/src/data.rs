#![allow(clippy::unreadable_literal)]

use chrono::prelude::*;
use failure::Fallible;
use num_enum::{CustomTryInto, IntoPrimitive};
use serde_derive::{Deserialize, Serialize};
use std::borrow::Cow;
use std::str::FromStr;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Beatmap<'a> {
    #[serde(borrow)]
    pub approved: Cow<'a, str>,
    #[serde(borrow)]
    pub approved_date: Option<Cow<'a, str>>,
    #[serde(borrow)]
    pub last_update: Cow<'a, str>,
    #[serde(borrow)]
    pub artist: Cow<'a, str>,
    #[serde(borrow)]
    pub beatmap_id: Cow<'a, str>,
    #[serde(borrow)]
    pub beatmapset_id: Cow<'a, str>,
    #[serde(borrow)]
    pub bpm: Cow<'a, str>,
    #[serde(borrow)]
    pub creator: Cow<'a, str>,
    #[serde(borrow)]
    pub creator_id: Cow<'a, str>,
    #[serde(borrow)]
    pub difficultyrating: Cow<'a, str>,
    #[serde(borrow)]
    pub diff_size: Cow<'a, str>,
    #[serde(borrow)]
    pub diff_overall: Cow<'a, str>,
    #[serde(borrow)]
    pub diff_approach: Cow<'a, str>,
    #[serde(borrow)]
    pub diff_drain: Cow<'a, str>,
    #[serde(borrow)]
    pub hit_length: Cow<'a, str>,
    #[serde(borrow)]
    pub source: Cow<'a, str>,
    #[serde(borrow)]
    pub genre_id: Cow<'a, str>,
    #[serde(borrow)]
    pub language_id: Cow<'a, str>,
    #[serde(borrow)]
    pub title: Cow<'a, str>,
    #[serde(borrow)]
    pub total_length: Cow<'a, str>,
    #[serde(borrow)]
    pub version: Cow<'a, str>,
    #[serde(borrow)]
    pub file_md5: Option<Cow<'a, str>>,
    #[serde(borrow)]
    pub mode: Cow<'a, str>,
    #[serde(borrow)]
    pub tags: Cow<'a, str>,
    #[serde(borrow)]
    pub favourite_count: Cow<'a, str>,
    #[serde(borrow)]
    pub playcount: Cow<'a, str>,
    #[serde(borrow)]
    pub passcount: Cow<'a, str>,
    #[serde(borrow)]
    pub max_combo: Option<Cow<'a, str>>,
}

pub fn date_from_str(s: &str) -> Fallible<DateTime<Utc>> {
    let dt = NaiveDateTime::parse_from_str(s, "%Y-%m-%d %H:%M:%S")?;
    Ok(DateTime::from_utc(dt, Utc))
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Clone, Copy, Hash, CustomTryInto, IntoPrimitive)]
#[repr(i8)]
pub enum ApprovalStatus {
    Graveyard = -2,
    Wip = -1,
    Pending = 0,
    Ranked = 1,
    Approved = 2,
    Qualified = 3,
    Loved = 4,
}

pub fn approval_status_from_str(s: &str) -> Fallible<ApprovalStatus> {
    i8::from_str(s)?
        .try_into_ApprovalStatus()
        .map_err(failure::err_msg)
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Clone, Copy, Hash, CustomTryInto, IntoPrimitive)]
#[repr(u8)]
pub enum GameMode {
    Standard = 0,
    Taiko = 1,
    Catch = 2,
    Mania = 3,
}

pub fn game_mode_from_str(s: &str) -> Fallible<GameMode> {
    u8::from_str(s)?
        .try_into_GameMode()
        .map_err(failure::err_msg)
}

pub fn game_mode_to_string(mode: GameMode) -> String {
    format!("{}", u8::from(mode))
}

#[test]
fn beatmap_parse() {
    let beatmap = serde_json::from_str::<Beatmap>(
        r#"
{"beatmapset_id":"1","beatmap_id":"75","approved":"1","total_length":"142","hit_length":"109","version":"Normal","file_md5":"a5b99395a42bd55bc5eb1d2411cbdf8b","diff_size":"4","diff_overall":"6","diff_approach":"6","diff_drain":"6","mode":"0","approved_date":"2007-10-06 17:46:31","last_update":"2007-10-06 17:46:31","artist":"Kenji Ninuma","title":"DISCO PRINCE","creator":"peppy","creator_id":"2","bpm":"119.999","source":"","tags":"katamari","genre_id":"2","language_id":"3","favourite_count":"394","playcount":"335489","passcount":"42530","max_combo":"314","difficultyrating":"2.291992664337158"}
        "#).unwrap();
    assert_eq!(
        approval_status_from_str(&beatmap.approved).unwrap(),
        ApprovalStatus::Ranked
    );
    assert_eq!(
        date_from_str(&beatmap.approved_date.unwrap()).unwrap(),
        chrono::Utc.ymd(2007, 10, 06).and_hms(17, 46, 31)
    );
    assert_eq!(
        game_mode_from_str(&beatmap.mode).unwrap(),
        GameMode::Standard
    );
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User<'a> {
    #[serde(borrow)]
    pub user_id: Cow<'a, str>,
    #[serde(borrow)]
    pub username: Cow<'a, str>,
    #[serde(borrow)]
    pub join_date: Cow<'a, str>,
    #[serde(borrow)]
    pub count300: Cow<'a, str>,
    #[serde(borrow)]
    pub count100: Cow<'a, str>,
    #[serde(borrow)]
    pub count50: Cow<'a, str>,
    #[serde(borrow)]
    pub playcount: Cow<'a, str>,
    #[serde(borrow)]
    pub ranked_score: Cow<'a, str>,
    #[serde(borrow)]
    pub total_score: Cow<'a, str>,
    #[serde(borrow)]
    pub pp_rank: Cow<'a, str>,
    #[serde(borrow)]
    pub level: Cow<'a, str>,
    #[serde(borrow)]
    pub pp_raw: Cow<'a, str>,
    #[serde(borrow)]
    pub accuracy: Cow<'a, str>,
    #[serde(borrow)]
    pub count_rank_ss: Cow<'a, str>,
    #[serde(borrow)]
    pub count_rank_ssh: Cow<'a, str>,
    #[serde(borrow)]
    pub count_rank_s: Cow<'a, str>,
    #[serde(borrow)]
    pub count_rank_sh: Cow<'a, str>,
    #[serde(borrow)]
    pub count_rank_a: Cow<'a, str>,
    #[serde(borrow)]
    pub country: Cow<'a, str>,
    #[serde(borrow)]
    pub total_seconds_played: Cow<'a, str>,
    #[serde(borrow)]
    pub pp_country_rank: Cow<'a, str>,
    #[serde(borrow)]
    pub events: Vec<UserEvent<'a>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserEvent<'a> {
    #[serde(borrow)]
    pub display_html: Cow<'a, str>,
    #[serde(borrow)]
    pub beatmap_id: Cow<'a, str>,
    #[serde(borrow)]
    pub beatmapset_id: Cow<'a, str>,
    #[serde(borrow)]
    pub date: Cow<'a, str>,
    #[serde(borrow)]
    pub epicfactor: Cow<'a, str>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Score<'a> {
    #[serde(borrow)]
    pub score_id: Cow<'a, str>,
    #[serde(borrow)]
    pub score: Cow<'a, str>,
    #[serde(borrow)]
    pub username: Cow<'a, str>,
    #[serde(borrow)]
    pub count300: Cow<'a, str>,
    #[serde(borrow)]
    pub count100: Cow<'a, str>,
    #[serde(borrow)]
    pub count50: Cow<'a, str>,
    #[serde(borrow)]
    pub countmiss: Cow<'a, str>,
    #[serde(borrow)]
    pub maxcombo: Cow<'a, str>,
    #[serde(borrow)]
    pub countkatu: Cow<'a, str>,
    #[serde(borrow)]
    pub countgeki: Cow<'a, str>,
    #[serde(borrow)]
    pub perfect: Cow<'a, str>,
    #[serde(borrow)]
    pub enabled_mods: Cow<'a, str>,
    #[serde(borrow)]
    pub user_id: Cow<'a, str>,
    #[serde(borrow)]
    pub date: Cow<'a, str>,
    #[serde(borrow)]
    pub rank: Cow<'a, str>,
    #[serde(borrow)]
    pub pp: Option<Cow<'a, str>>,
    #[serde(borrow)]
    pub replay_available: Cow<'a, str>,
}

bitflags::bitflags! {
    pub struct Mods: u32 {
        const NoFail         = 1;
        const Easy           = 2;
        const TouchDevice    = 4;
        const Hidden         = 8;
        const HardRock       = 16;
        const SuddenDeath    = 32;
        const DoubleTime     = 64;
        const Relax          = 128;
        const HalfTime       = 256;
        const Nightcore      = 512;
        const Flashlight     = 1024;
        const Autoplay       = 2048;
        const SpunOut        = 4096;
        const Autopilot      = 8192;
        const Perfect        = 16384;
        const Key4           = 32768;
        const Key5           = 65536;
        const Key6           = 131072;
        const Key7           = 262144;
        const Key8           = 524288;
        const FadeIn         = 1048576;
        const Random         = 2097152;
        const Cinema         = 4194304;
        const Target         = 8388608;
        const Key9           = 16777216;
        const KeyCoop        = 33554432;
        const Key1           = 67108864;
        const Key3           = 134217728;
        const Key2           = 268435456;
        const ScoreV2        = 536870912;
    }
}

pub fn mods_from_str(s: &str) -> Fallible<Mods> {
    Mods::from_bits(u32::from_str(s)?).ok_or_else(|| failure::err_msg("Invalid Mods value"))
}
