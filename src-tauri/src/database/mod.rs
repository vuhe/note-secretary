mod note_entity;
mod persona_entity;

pub use persona_entity::Model as Persona;

use crate::error::{OnceLockSetup, SetupError};
use sea_orm::{ConnectOptions, Database, DatabaseConnection};
use std::path::Path;
use std::sync::OnceLock;
use tauri::async_runtime::block_on;

static DATABASE: OnceLock<DatabaseConnection> = OnceLock::new();

async fn init_database(opt: ConnectOptions) -> Result<DatabaseConnection, SetupError> {
  let database = Database::connect(opt).await?;
  database
    .get_schema_builder()
    .register(note_entity::Entity)
    .register(persona_entity::Entity)
    .sync(&database)
    .await?;
  Ok(database)
}

pub fn setup_database(work_dir: &Path) -> tauri::Result<()> {
  let path = work_dir.join("data.sqlite");
  let url = format!("sqlite://{}?mode=rwc", path.to_string_lossy());
  let opt = ConnectOptions::new(url);

  let result = block_on(init_database(opt))?;
  DATABASE.setup(result, "database")?;

  Ok(())
}
