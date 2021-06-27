use std::{convert::TryFrom, fmt::Display};

use bstr::BString;

#[derive(Debug)]
pub enum AnyValue {
    Null,
    Integer(i64),
    Float(f64),
    String(BString),
}

impl Display for AnyValue {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AnyValue::Null => f.write_str("NULL"),
            AnyValue::Integer(v) => v.fmt(f),
            AnyValue::Float(v) => v.fmt(f),
            // not escaped (this is for debug only anyway)
            AnyValue::String(v) => write!(f, "'{}'", v),
        }
    }
}

struct AnyValueVisitor;

impl<'de> serde::de::Visitor<'de> for AnyValueVisitor {
    type Value = AnyValue;

    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        formatter.write_str("null, number or string literal")
    }

    fn visit_unit<E: serde::de::Error>(self) -> Result<Self::Value, E> {
        Ok(AnyValue::Null)
    }

    fn visit_i64<E: serde::de::Error>(self, v: i64) -> Result<Self::Value, E> {
        Ok(AnyValue::Integer(v))
    }

    fn visit_f64<E: serde::de::Error>(self, v: f64) -> Result<Self::Value, E> {
        Ok(AnyValue::Float(v))
    }

    fn visit_str<E: serde::de::Error>(self, v: &str) -> Result<Self::Value, E> {
        Ok(AnyValue::String(v.into()))
    }

    fn visit_string<E: serde::de::Error>(self, v: String) -> Result<Self::Value, E> {
        Ok(AnyValue::String(v.into()))
    }

    fn visit_bytes<E: serde::de::Error>(self, v: &[u8]) -> Result<Self::Value, E> {
        Ok(AnyValue::String(v.into()))
    }

    fn visit_byte_buf<E: serde::de::Error>(self, v: Vec<u8>) -> Result<Self::Value, E> {
        Ok(AnyValue::String(v.into()))
    }
}

impl<'de> serde::Deserialize<'de> for AnyValue {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        deserializer.deserialize_any(AnyValueVisitor)
    }
}

bitflags::bitflags! {
    /// Mod combination represented by bitflields.
    pub struct Mods: u32 {
        const NO_FAIL      = 1;
        const EASY         = 2;
        const TOUCH_DEVICE = 4;
        const HIDDEN       = 8;
        const HARD_ROCK    = 16;
        const SUDDEN_DEATH = 32;
        const DOUBLE_TIME  = 64;
        const RELAX        = 128;
        const HALF_TIME    = 256;
        const NIGHTCORE    = 512;
        const FLASHLIGHT   = 1024;
        const AUTOPLAY     = 2048;
        const SPUN_OUT     = 4096;
        const AUTOPILOT    = 8192;
        const PERFECT      = 16384;
        const KEY4         = 32768;
        const KEY5         = 65536;
        const KEY6         = 131072;
        const KEY7         = 262144;
        const KEY8         = 524288;
        const FADE_IN      = 1048576;
        const RANDOM       = 2097152;
        const CINEMA       = 4194304;
        const TARGET       = 8388608;
        const KEY9         = 16777216;
        const KEY_COOP     = 33554432;
        const KEY1         = 67108864;
        const KEY3         = 134217728;
        const KEY2         = 268435456;
        const SCORE_V2     = 536870912;

        const CATCH_DIFFICULTY_MASK = Self::EASY.bits | Self::HIDDEN.bits | Self::HARD_ROCK.bits | Self::DOUBLE_TIME.bits | Self::HALF_TIME.bits | Self::FLASHLIGHT.bits;
    }
}

impl Mods {
    /// Mods not used in osu!catch are not implemented.
    pub fn get_mod_names(self, names: &mut Vec<&'static str>) {
        if self.contains(Mods::NO_FAIL) {
            names.push("NF");
        }
        if self.contains(Mods::EASY) {
            names.push("EZ");
        }
        if self.contains(Mods::HIDDEN) {
            names.push("HD");
        }
        if self.contains(Mods::DOUBLE_TIME) {
            names.push(if self.contains(Mods::NIGHTCORE) {
                "NC"
            } else {
                "DT"
            });
        }
        if self.contains(Mods::HALF_TIME) {
            names.push("HT");
        }
        if self.contains(Mods::HARD_ROCK) {
            names.push("HR");
        }
        if self.contains(Mods::FLASHLIGHT) {
            names.push("FL");
        }
        if self.contains(Mods::SUDDEN_DEATH) {
            names.push(if self.contains(Mods::PERFECT) {
                "PF"
            } else {
                "SD"
            });
        }
    }

    /// Display like " +HDDT".
    pub fn format_plus(self) -> impl Display {
        let mut names = Vec::new();
        self.get_mod_names(&mut names);
        if names.is_empty() {
            "".to_string()
        } else {
            format!(" +{}", names.concat())
        }
    }
}

struct ModsVisitor;

impl<'de> serde::de::Visitor<'de> for ModsVisitor {
    type Value = Mods;

    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        formatter.write_str("an integer representing mod combination")
    }

    fn visit_u32<E: serde::de::Error>(self, v: u32) -> Result<Self::Value, E> {
        Mods::from_bits(v).ok_or_else(|| E::custom(format!("invalid mod combination: {}", v)))
    }

    fn visit_i64<E: serde::de::Error>(self, v: i64) -> Result<Self::Value, E> {
        self.visit_u32(u32::try_from(v).map_err(E::custom)?)
    }

    fn visit_u64<E: serde::de::Error>(self, v: u64) -> Result<Self::Value, E> {
        self.visit_u32(u32::try_from(v).map_err(E::custom)?)
    }
}

impl<'de> serde::Deserialize<'de> for Mods {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        deserializer.deserialize_u32(ModsVisitor)
    }
}
