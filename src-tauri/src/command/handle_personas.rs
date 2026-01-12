use super::Database;
use crate::database::Persona;
use crate::error::Result;

#[tauri::command]
pub async fn get_all_personas(db: Database<'_>) -> Result<Vec<Persona>> {
  db.find_all_personas().await
}

#[tauri::command]
pub async fn save_persona(db: Database<'_>, persona: Persona) -> Result<()> {
  // TODO: 保存时应该数据同步到 s3
  db.save_persona(persona).await
}
