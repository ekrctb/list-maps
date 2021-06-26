use std::fmt::Display;

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
