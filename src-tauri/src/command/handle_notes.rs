use crate::database::{Note, NoteSummary};
use crate::error::{Error, Result};

#[tauri::command]
pub async fn get_all_notes() -> Result<Vec<NoteSummary>> {
  Note::all().await
}

#[tauri::command]
pub async fn get_note_by_id(id: String) -> Result<Note> {
  Note::find_by_id(&id)
    .await?
    .ok_or(Error::NotFound(format!("note({id})")))
}
