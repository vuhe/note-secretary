use serde::ser::Serializer;
use std::borrow::Cow;
use std::sync::OnceLock;

#[derive(Debug, thiserror::Error)]
pub enum SetupError {
  #[error("failed to set {0}")]
  OnceLock(&'static str),
}

impl From<SetupError> for tauri::Error {
  fn from(value: SetupError) -> Self {
    Self::Anyhow(value.into())
  }
}

pub trait OnceLockSetup<T> {
  fn setup(&self, value: T, hint: &'static str) -> std::result::Result<(), SetupError>;
}

impl<T> OnceLockSetup<T> for OnceLock<T> {
  fn setup(&self, value: T, hint: &'static str) -> std::result::Result<(), SetupError> {
    self.set(value).map_err(|_| SetupError::OnceLock(hint))
  }
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error("{0}")]
  IO(#[from] std::io::Error),

  #[error("database: {0}")]
  Database(#[from] sea_orm::DbErr),
  #[error("handle zip: {0}")]
  Zip(#[from] zip::result::ZipError),
  #[error("handle json: {0}")]
  Json(#[from] serde_json::Error),
  #[error("handle data-url: {0}")]
  DataUrl(#[from] data_url::DataUrlError),
  #[error("decode data-url: {0}")]
  DecodeDataUrl(#[from] data_url::forgiving_base64::InvalidBase64),
  #[error("request: {0}")]
  Request(#[from] tauri_plugin_http::reqwest::Error),

  #[error("{0}")]
  Tauri(#[from] tauri::Error),

  #[error("{0} not found")]
  NotFound(String),
  #[error("{0}")]
  Custom(Cow<'static, str>),
}

impl Error {
  pub fn new(s: impl Into<Cow<'static, str>>) -> Self {
    Self::Custom(s.into())
  }
}

impl serde::Serialize for Error {
  fn serialize<S: Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

pub type Result<T> = std::result::Result<T, Error>;

pub trait MapToCustomError<T, E> {
  fn map_custom_err<O, R>(self, op: O) -> Result<T>
  where
    O: FnOnce(E) -> R,
    R: Into<Cow<'static, str>>;
}

impl<T, E> MapToCustomError<T, E> for std::result::Result<T, E> {
  fn map_custom_err<O, R>(self, op: O) -> Result<T>
  where
    O: FnOnce(E) -> R,
    R: Into<Cow<'static, str>>,
  {
    match self {
      Ok(t) => Ok(t),
      Err(e) => Err(Error::Custom(op(e).into())),
    }
  }
}

impl<T> MapToCustomError<T, ()> for Option<T> {
  fn map_custom_err<O, R>(self, op: O) -> Result<T>
  where
    O: FnOnce(()) -> R,
    R: Into<Cow<'static, str>>,
  {
    match self {
      Some(t) => Ok(t),
      None => Err(Error::Custom(op(()).into())),
    }
  }
}
