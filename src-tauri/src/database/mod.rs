mod note_entity;
mod persona_entity;

pub use note_entity::Model as Note;
pub use note_entity::NoteSummary;
pub use persona_entity::Model as Persona;

use crate::AppDataPath;
use sea_orm::{ConnectOptions, Database, DatabaseConnection, DbErr};
use tauri::async_runtime::block_on;
use tauri::{Error, Manager};

pub struct DatabaseHandler(DatabaseConnection);

async fn init_database(opt: ConnectOptions) -> Result<DatabaseConnection, DbErr> {
  let database = Database::connect(opt).await?;
  database
    .get_schema_builder()
    .register(note_entity::Entity)
    .register(persona_entity::Entity)
    .sync(&database)
    .await?;
  Ok(database)
}

pub fn setup_database(app: &tauri::App) -> tauri::Result<()> {
  let app_data_path = app.state::<AppDataPath>();
  let path = app_data_path.0.join("data.sqlite");
  let url = format!("sqlite://{}?mode=rwc", path.to_string_lossy());
  let opt = ConnectOptions::new(url);

  let result = match block_on(init_database(opt)) {
    Ok(it) => it,
    Err(e) => return Err(Error::Anyhow(e.into())),
  };
  app.manage(DatabaseHandler(result));

  Ok(())
}
