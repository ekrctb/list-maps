pub mod data;

use chrono::prelude::*;
use osu_api_internal_derive::Api;
use reqwest::Client;
use serde::{Deserialize, Serialize};

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

fn request<Q: Serialize>(
    client: &mut reqwest::Client,
    api_name: &'static str,
    query: &Q,
) -> reqwest::Result<String> {
    let mut res = client.get(&make_url(api_name)).query(query).send()?;
    res.text()
}

pub trait OsuApi: Sized + Serialize {
    fn api_name() -> &'static str;

    fn request_text(&self, client: &mut Client) -> reqwest::Result<String> {
        request(client, Self::api_name(), self)
    }
}

#[derive(Api, Debug, Clone, Serialize)]
pub struct GetBeatmaps {
    #[serde(rename = "k")]
    api_key: String,
    /// Note: beatmaps approved exactly at `since` are not included.
    #[serde(rename = "since")]
    since: Option<DateTime<Utc>>,
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

impl OsuApi for GetBeatmaps {
    fn api_name() -> &'static str {
        "get_beatmaps"
    }
}

#[test]
fn get_beatmaps_query() {
    let query =
        serde_urlencoded::ser::to_string(GetBeatmaps::new("KEY").user(username("USER"))).unwrap();
    assert_eq!(query, "k=KEY&type=string&u=USER");

    let query = serde_urlencoded::ser::to_string(
        GetBeatmaps::new("KEY").since(Utc.ymd(2000, 1, 1).and_hms(0, 0, 0)),
    )
    .unwrap();
    assert_eq!(query, "k=KEY&since=2000-01-01T00%3A00%3A00Z");
}

#[derive(Api, Debug, Clone, Serialize)]
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

impl OsuApi for GetUser {
    fn api_name() -> &'static str {
        "get_user"
    }
}

#[test]
fn get_user_query() {
    let query = serde_urlencoded::ser::to_string(GetUser::new("KEY", user_id("123")).event_days(2))
        .unwrap();
    assert_eq!(query, "k=KEY&type=id&u=123&event_days=2");
}

#[derive(Api, Debug, Clone, Serialize)]
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

impl OsuApi for GetScores {
    fn api_name() -> &'static str {
        "get_scores"
    }
}

#[test]
fn get_scores_query() {
    let query = serde_urlencoded::ser::to_string(GetScores::new("KEY", "123").mode("2").limit(100))
        .unwrap();
    assert_eq!(query, "k=KEY&b=123&m=2&limit=100");
}
