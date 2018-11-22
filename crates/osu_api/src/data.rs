use chrono::prelude::*;
use failure::Fallible;
use num_enum::{CustomTryInto, IntoPrimitive};
use osu_api_internal_derive::Getters;
use serde_derive::{Deserialize, Serialize};
use std::str::FromStr;

// TODO:
// syntax like #[get f64 bpm]
#[derive(Debug, Clone, Serialize, Deserialize, Getters)]
pub struct Beatmap {
    pub approved: String,
    pub approved_date: Option<String>,
    pub last_update: String,
    pub artist: String,
    pub beatmap_id: String,
    pub beatmapset_id: String,
    #[get_f64(bpm)]
    pub bpm: String,
    pub creator: String,
    pub creator_id: String,
    #[get_f64(stars)]
    pub difficultyrating: String,
    #[get_f64(cs)]
    pub diff_size: String,
    #[get_f64(od)]
    pub diff_overall: String,
    #[get_f64(ar)]
    pub diff_approach: String,
    #[get_f64(hp)]
    pub diff_drain: String,
    #[get_f64(hit_length)]
    pub hit_length: String,
    pub source: String,
    pub genre_id: String,
    pub language_id: String,
    pub title: String,
    #[get_f64(total_length)]
    pub total_length: String,
    pub version: String,
    pub file_md5: Option<String>,
    pub mode: String,
    pub tags: String,
    #[get_f64(favourite_count)]
    pub favourite_count: String,
    #[get_f64(play_count)]
    pub playcount: String,
    #[get_f64(pass_count)]
    pub passcount: String,
    pub max_combo: Option<String>,
}

fn parse_date(s: &str) -> Fallible<DateTime<Utc>> {
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

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Clone, Copy, Hash, CustomTryInto, IntoPrimitive)]
#[repr(u8)]
pub enum GameMode {
    Standard = 0,
    Taiko = 1,
    Catch = 2,
    Mania = 3,
}

impl Beatmap {
    pub fn approval_status(&self) -> Fallible<ApprovalStatus> {
        i8::from_str(self.approved.as_ref())?
            .try_into_ApprovalStatus()
            .map_err(failure::err_msg)
    }

    pub fn approved_date(&self) -> Fallible<Option<DateTime<Utc>>> {
        match &self.approved_date {
            None => Ok(None),
            Some(s) => Ok(Some(parse_date(s.as_ref())?)),
        }
    }

    pub fn game_mode(&self) -> Fallible<GameMode> {
        u8::from_str(self.mode.as_ref())?
            .try_into_GameMode()
            .map_err(failure::err_msg)
    }
}

#[test]
fn beatmap_parse() {
    let beatmap = serde_json::from_str::<Beatmap>(
        r#"
{"beatmapset_id":"1","beatmap_id":"75","approved":"1","total_length":"142","hit_length":"109","version":"Normal","file_md5":"a5b99395a42bd55bc5eb1d2411cbdf8b","diff_size":"4","diff_overall":"6","diff_approach":"6","diff_drain":"6","mode":"0","approved_date":"2007-10-06 17:46:31","last_update":"2007-10-06 17:46:31","artist":"Kenji Ninuma","title":"DISCO PRINCE","creator":"peppy","creator_id":"2","bpm":"119.999","source":"","tags":"katamari","genre_id":"2","language_id":"3","favourite_count":"394","playcount":"335489","passcount":"42530","max_combo":"314","difficultyrating":"2.291992664337158"}
        "#).unwrap();
    assert_eq!(beatmap.approval_status().unwrap(), ApprovalStatus::Ranked);
    assert_eq!(
        beatmap.approved_date().unwrap(),
        Some(chrono::Utc.ymd(2007, 10, 06).and_hms(17, 46, 31))
    );
    assert_eq!(beatmap.game_mode().unwrap(), GameMode::Standard);
    assert_eq!(beatmap.ar().unwrap(), 6.0);
    assert_eq!(beatmap.stars().unwrap(), 2.291992664337158);
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub user_id: String,
    pub username: String,
    pub join_date: String,
    pub count300: String,
    pub count100: String,
    pub count50: String,
    pub playcount: String,
    pub ranked_score: String,
    pub total_score: String,
    pub pp_rank: String,
    pub level: String,
    pub pp_raw: String,
    pub accuracy: String,
    pub count_rank_ss: String,
    pub count_rank_ssh: String,
    pub count_rank_s: String,
    pub count_rank_sh: String,
    pub count_rank_a: String,
    pub country: String,
    pub total_seconds_played: String,
    pub pp_country_rank: String,
    pub events: Vec<UserEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserEvent {
    pub display_html: String,
    pub beatmap_id: String,
    pub beatmapset_id: String,
    pub date: String,
    pub epicfactor: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Score {
    pub score_id: String,
    pub score: String,
    pub username: String,
    pub count300: String,
    pub count100: String,
    pub count50: String,
    pub countmiss: String,
    pub maxcombo: String,
    pub countkatu: String,
    pub countgeki: String,
    pub perfect: String,
    pub enabled_mods: String,
    pub user_id: String,
    pub date: String,
    pub rank: String,
    pub pp: String,
    pub replay_available: String,
}
