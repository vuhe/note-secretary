use super::DataPath;
use crate::error::Result;
use crate::files::{ChatFile, ChatMessage};
use serde_json::Value;

#[tauri::command]
pub async fn save_chat_message(path: DataPath<'_>, message: ChatMessage) -> Result<()> {
  let _message_path = message.save(&path.0).await?;
  // TODO: 需要通知 s3 同步
  Ok(())
}

#[tauri::command]
pub async fn read_chat_messages(_path: DataPath<'_>, _chat_id: String) -> Result<Vec<Value>> {
  todo!()
}

#[tauri::command]
pub async fn save_chat_file(path: DataPath<'_>, file: ChatFile) -> Result<()> {
  let _file_path = file.save(&path.0, None).await?;
  // TODO: 需要通知 s3 同步
  Ok(())
}
