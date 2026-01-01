use crate::database::Persona;
use crate::error::Result;

#[tauri::command]
pub async fn get_all_personas() -> Result<Vec<Persona>> {
  Persona::all().await
}

#[tauri::command]
pub async fn save_persona(persona: Persona) -> Result<()> {
  // TODO: 保存时应该数据同步到 s3
  persona.save().await
}
