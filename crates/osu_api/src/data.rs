use chrono::prelude::*;
use failure::Fallible;
use num_enum::{CustomTryInto, IntoPrimitive};
use serde_derive::{Deserialize, Serialize};
use std::str::FromStr;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Beatmap<'a> {
    pub approved: &'a str,
    pub approved_date: Option<&'a str>,
    pub last_update: &'a str,
    pub artist: &'a str,
    pub beatmap_id: &'a str,
    pub beatmapset_id: &'a str,
    pub bpm: &'a str,
    pub creator: &'a str,
    pub creator_id: &'a str,
    pub difficultyrating: &'a str,
    pub diff_size: &'a str,
    pub diff_overall: &'a str,
    pub diff_approach: &'a str,
    pub diff_drain: &'a str,
    pub hit_length: &'a str,
    pub source: &'a str,
    pub genre_id: &'a str,
    pub language_id: &'a str,
    pub title: &'a str,
    pub total_length: &'a str,
    pub version: &'a str,
    pub file_md5: Option<&'a str>,
    pub mode: &'a str,
    pub tags: &'a str,
    pub favourite_count: &'a str,
    pub playcount: &'a str,
    pub passcount: &'a str,
    pub max_combo: Option<&'a str>,
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
    pub user_id: &'a str,
    pub username: &'a str,
    pub join_date: &'a str,
    pub count300: &'a str,
    pub count100: &'a str,
    pub count50: &'a str,
    pub playcount: &'a str,
    pub ranked_score: &'a str,
    pub total_score: &'a str,
    pub pp_rank: &'a str,
    pub level: &'a str,
    pub pp_raw: &'a str,
    pub accuracy: &'a str,
    pub count_rank_ss: &'a str,
    pub count_rank_ssh: &'a str,
    pub count_rank_s: &'a str,
    pub count_rank_sh: &'a str,
    pub count_rank_a: &'a str,
    pub country: &'a str,
    pub total_seconds_played: &'a str,
    pub pp_country_rank: &'a str,
    pub events: Vec<UserEvent<'a>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserEvent<'a> {
    pub display_html: &'a str,
    pub beatmap_id: &'a str,
    pub beatmapset_id: &'a str,
    pub date: &'a str,
    pub epicfactor: &'a str,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Score<'a> {
    pub score_id: &'a str,
    pub score: &'a str,
    pub username: &'a str,
    pub count300: &'a str,
    pub count100: &'a str,
    pub count50: &'a str,
    pub countmiss: &'a str,
    pub maxcombo: &'a str,
    pub countkatu: &'a str,
    pub countgeki: &'a str,
    pub perfect: &'a str,
    pub enabled_mods: &'a str,
    pub user_id: &'a str,
    pub date: &'a str,
    pub rank: &'a str,
    pub pp: &'a str,
    pub replay_available: &'a str,
}
