use serde::ser::Serializer;

#[derive(Debug, thiserror::Error)]
pub enum SetupError {
  /// OnceLock set error.
  #[error("failed to set {0}")]
  OnceLock(&'static str),
  /// Database error.
  #[error("database: {0}")]
  Database(#[from] sea_orm::DbErr),
}

impl From<SetupError> for tauri::Error {
  fn from(value: SetupError) -> Self {
    Self::Anyhow(value.into())
  }
}

#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum Error {
  /// IO error.
  #[error("{0}")]
  IO(#[from] std::io::Error),
  /// Database error.
  #[error("database: {0}")]
  Database(#[from] sea_orm::DbErr),
}

impl serde::Serialize for Error {
  fn serialize<S: Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

pub type Result<T> = std::result::Result<T, Error>;
