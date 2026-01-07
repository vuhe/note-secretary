use crate::database::{Note, NoteSummary};
use crate::emitter::event;
use crate::error::{Error, Result};

const NOTE_CHANGE_EVENT: &str = "notes-change-event";

#[tauri::command]
pub async fn get_all_notes(_search: Option<String>) -> Result<Vec<NoteSummary>> {
  Note::all().await
}

#[tauri::command]
pub async fn get_note_by_id(id: String) -> Result<Note> {
  Note::find_by_id(&id)
    .await?
    .ok_or(Error::NotFound(format!("note({id})")))
}

#[tauri::command]
pub async fn add_note(note: Note) -> Result<()> {
  note.insert().await?;
  event(NOTE_CHANGE_EVENT, NOTE_CHANGE_EVENT);

  // TODO: 需要通知 s3 同步
  Ok(())
}

#[tauri::command]
pub async fn modify_note_meta(note: Note) -> Result<()> {
  note.update_metadata().await?;
  event(NOTE_CHANGE_EVENT, NOTE_CHANGE_EVENT);

  // TODO: 需要通知 s3 同步
  Ok(())
}

#[tauri::command]
pub async fn modify_note_content(id: String, content: String) -> Result<()> {
  Note::update_content(&id, &content).await
  // TODO: 需要通知 s3 同步
}

#[tauri::command]
pub async fn delete_note_by_id(id: String) -> Result<()> {
  Note::delete_by_id(&id).await?;
  event(NOTE_CHANGE_EVENT, NOTE_CHANGE_EVENT);

  // TODO: 需要通知 s3 同步
  Ok(())
}
