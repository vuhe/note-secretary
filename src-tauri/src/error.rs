use serde::ser::Serializer;

#[derive(Debug)]
pub struct SetAppDataPathError;

impl std::fmt::Display for SetAppDataPathError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "failed to set app data path")
  }
}

impl std::error::Error for SetAppDataPathError {}

impl From<SetAppDataPathError> for tauri::Error {
  fn from(value: SetAppDataPathError) -> Self {
    Self::Anyhow(value.into())
  }
}

#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum Error {
  /// IO error.
  #[error("{0}")]
  IO(#[from] std::io::Error),
}

impl serde::Serialize for Error {
  fn serialize<S: Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

pub type Result<T> = std::result::Result<T, Error>;
