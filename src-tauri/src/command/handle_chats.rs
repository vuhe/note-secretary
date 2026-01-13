use super::DataPath;
use crate::error::Result;
use crate::files::{ChatFile, ChatMessage};
use tauri::ipc::Response;

#[tauri::command]
pub async fn load_chat(path: DataPath<'_>, chat_id: String) -> Result<Response> {
  let messages = ChatMessage::read_all(&path.0, chat_id).await?;
  let bytes = serde_json::to_vec(&messages)?;
  Ok(Response::new(bytes))
}

#[tauri::command]
pub async fn save_chat_message(path: DataPath<'_>, message: ChatMessage) -> Result<()> {
  let _message_path = message.save(&path.0).await?;
  // TODO: 需要通知 s3 同步
  Ok(())
}

#[tauri::command]
pub async fn save_chat_file(path: DataPath<'_>, file: ChatFile) -> Result<()> {
  let _file_path = file.save(&path.0, None).await?;
  // TODO: 需要通知 s3 同步
  Ok(())
}
