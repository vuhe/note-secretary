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
  #[error("{0} not found")]
  NotFound(String),
  #[error("{0}")]
  Custom(Cow<'static, str>),
}

impl serde::Serialize for Error {
  fn serialize<S: Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

pub type Result<T> = std::result::Result<T, Error>;
