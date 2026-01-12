use super::Database;
use crate::database::{Note, NoteSummary};
use crate::emitter::event;
use crate::error::{Error, Result};

const NOTE_CHANGE_EVENT: &str = "notes-change-event";

#[tauri::command]
pub async fn get_all_notes(db: Database<'_>, _search: Option<String>) -> Result<Vec<NoteSummary>> {
  db.find_all_notes().await
}

#[tauri::command]
pub async fn get_note_by_id(db: Database<'_>, id: String) -> Result<Note> {
  db.find_note_by_id(&id)
    .await?
    .ok_or(Error::NotFound(format!("note({id})")))
}

#[tauri::command]
pub async fn add_note(db: Database<'_>, note: Note) -> Result<()> {
  db.insert_note(&note).await?;
  event(NOTE_CHANGE_EVENT, NOTE_CHANGE_EVENT);

  // TODO: 需要通知 s3 同步
  Ok(())
}

#[tauri::command]
pub async fn modify_note_meta(db: Database<'_>, note: Note) -> Result<()> {
  db.update_note_metadata(&note).await?;
  event(NOTE_CHANGE_EVENT, NOTE_CHANGE_EVENT);

  // TODO: 需要通知 s3 同步
  Ok(())
}

#[tauri::command]
pub async fn modify_note_content(db: Database<'_>, id: String, content: String) -> Result<()> {
  db.update_note_content(&id, &content).await
  // TODO: 需要通知 s3 同步
}

#[tauri::command]
pub async fn delete_note_by_id(db: Database<'_>, id: String) -> Result<()> {
  db.delete_note_by_id(&id).await?;
  event(NOTE_CHANGE_EVENT, NOTE_CHANGE_EVENT);

  // TODO: 需要通知 s3 同步
  Ok(())
}
