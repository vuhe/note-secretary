use crate::database::{Note, NoteSummary};
use crate::error::Result;

#[tauri::command]
pub async fn get_all_notes() -> Result<Vec<NoteSummary>> {
  Note::all().await
}
