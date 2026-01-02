#[tauri::command]
pub async fn env_is_mobile() -> bool {
  cfg!(mobile)
}
