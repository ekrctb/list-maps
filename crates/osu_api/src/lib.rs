extern crate failure;
extern crate osu_api_internal_derive;
extern crate reqwest;
extern crate serde;
extern crate serde_derive;
extern crate serde_json;
extern crate serde_urlencoded;

use osu_api_internal_derive::Api;
use reqwest::Client;
use serde::{de::DeserializeOwned, Serialize};
use serde_derive::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Beatmap {
    pub approved: String,
    pub approved_date: Option<String>,
    pub last_update: String,
    pub artist: String,
    pub beatmap_id: String,
    pub beatmapset_id: String,
    pub bpm: String,
    pub creator: String,
    pub creator_id: String,
    pub difficultyrating: String,
    pub diff_size: String,
    pub diff_overall: String,
    pub diff_approach: String,
    pub diff_drain: String,
    pub hit_length: String,
    pub source: String,
    pub genre_id: String,
    pub language_id: String,
    pub title: String,
    pub total_length: String,
    pub version: String,
    pub file_md5: Option<String>,
    pub mode: String,
    pub tags: String,
    pub favourite_count: String,
    pub playcount: String,
    pub passcount: String,
    pub max_combo: Option<String>,
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

fn make_url(name: &str) -> String {
    format!("https://osu.ppy.sh/api/{}", name)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "u")]
pub enum UserIdOrUsername {
    #[serde(rename = "id")]
    UserId(String),
    #[serde(rename = "string")]
    Username(String),
}

pub fn user_id(user_id: impl Into<String>) -> UserIdOrUsername {
    UserIdOrUsername::UserId(user_id.into())
}

pub fn username(username: impl Into<String>) -> UserIdOrUsername {
    UserIdOrUsername::Username(username.into())
}

fn request<Q: Serialize, R: DeserializeOwned>(
    client: &mut reqwest::Client,
    api_name: &'static str,
    query: &Q,
) -> reqwest::Result<R> {
    let mut res = client.get(&make_url(api_name)).query(query).send()?;
    res.json()
}

#[derive(Api, Debug, Clone, Serialize, Deserialize)]
pub struct GetBeatmaps {
    #[serde(rename = "k")]
    api_key: String,
    /// Note: beatmaps approved exactly at `since` are not included.
    #[serde(rename = "since")]
    since: Option<String>,
    #[serde(rename = "s")]
    beatmapset_id: Option<String>,
    #[serde(rename = "b")]
    beatmap_id: Option<String>,
    #[serde(flatten)]
    user: Option<UserIdOrUsername>,
    #[serde(rename = "m")]
    mode: Option<String>,
    #[serde(rename = "a")]
    include_converts: Option<String>,
    #[serde(rename = "h")]
    hash: Option<String>,
    #[serde(rename = "limit")]
    limit: Option<i32>,
}

impl GetBeatmaps {
    pub fn request(&self, client: &mut Client) -> reqwest::Result<Vec<Beatmap>> {
        request(client, "get_beatmaps", self)
    }
}

#[test]
fn get_beatmaps_query() {
    let query = serde_urlencoded::ser::to_string(
        GetBeatmaps::new("KEY")
            .beatmap_id("123")
            .user(username("USER")),
    )
    .unwrap();
    assert_eq!(query, "k=KEY&b=123&type=string&u=USER");
}

#[test]
fn beatmap_parse() {
    serde_json::from_str::<Beatmap>(
        r#"
        {"beatmapset_id":"65536","beatmap_id":"191904","approved":"-2","total_length":"148","hit_length":"83","version":"Normal","file_md5":"dd1cce6ddfe703615fbe35c6a2597103","diff_size":"2","diff_overall":"8","diff_approach":"5","diff_drain":"6","mode":"0","approved_date":null,"last_update":"2012-11-16 03:37:16","artist":"Horizon","title":"Flare","creator":"Jade Harley","creator_id":"1724271","bpm":"144.035","source":"Homestuck","tags":"cascade hs","genre_id":"1","language_id":"1","favourite_count":"5","playcount":"0","passcount":"0","max_combo":"179","difficultyrating":"1.8056436777114868"}
        "#).unwrap();
}

#[derive(Api, Debug, Clone, Serialize, Deserialize)]
pub struct GetUser {
    #[serde(rename = "k")]
    api_key: String,
    #[serde(flatten)]
    user: UserIdOrUsername,

    #[serde(rename = "m")]
    mode: Option<String>,
    #[serde(rename = "event_days")]
    event_days: Option<i32>,
}

impl GetUser {
    pub fn request(&self, client: &mut Client) -> reqwest::Result<Vec<Beatmap>> {
        request(client, "get_user", self)
    }
}

#[test]
fn get_user_query() {
    let query = serde_urlencoded::ser::to_string(GetUser::new("KEY", user_id("123")).event_days(2))
        .unwrap();
    assert_eq!(query, "k=KEY&type=id&u=123&event_days=2");
}

#[derive(Api, Debug, Clone, Serialize, Deserialize)]
pub struct GetScores {
    #[serde(rename = "k")]
    api_key: String,
    #[serde(rename = "b")]
    beatmap_id: String,

    #[serde(flatten)]
    user: Option<UserIdOrUsername>,
    #[serde(rename = "m")]
    mode: Option<String>,
    #[serde(rename = "mods")]
    mods: Option<i32>,
    #[serde(rename = "limit")]
    limit: Option<i32>,
}

impl GetScores {
    pub fn request(&self, client: &mut Client) -> reqwest::Result<Vec<Beatmap>> {
        request(client, "get_scores", self)
    }
}

#[test]
fn get_scores_query() {
    let query = serde_urlencoded::ser::to_string(GetScores::new("KEY", "123").mode("2").limit(100))
        .unwrap();
    assert_eq!(query, "k=KEY&b=123&m=2&limit=100");
}
