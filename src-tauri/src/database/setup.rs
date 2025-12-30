use crate::error;
use sea_orm::{ConnectOptions, Database};
use std::path::Path;
use tauri::Result;
use tauri::async_runtime::block_on;

pub fn setup_database(work_dir: &Path) -> Result<()> {
  let path = work_dir.join("data.sqlite");
  let url = format!("sqlite://{}?mode=rwc", path.to_string_lossy());
  let opt = ConnectOptions::new(url);

  let result =
    block_on(async { Database::connect(opt).await }).map_err(|e| error::SetupError::Database(e))?;

  super::DATABASE
    .set(result)
    .map_err(|_| error::SetupError::OnceLock("database"))?;

  Ok(())
}
