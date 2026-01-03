mod handle_env;
mod handle_notes;
mod handle_personas;

use tauri::{Builder, Runtime};

pub trait AppCommand {
  fn register_handler(self) -> Self;
}

impl<R: Runtime> AppCommand for Builder<R> {
  fn register_handler(self) -> Self {
    self.invoke_handler(tauri::generate_handler![
      handle_env::env_is_mobile,
      handle_notes::get_all_notes,
      handle_notes::get_note_by_id,
      handle_personas::get_all_personas,
      handle_personas::save_persona,
    ])
  }
}
