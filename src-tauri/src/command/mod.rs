mod handle_chats;
mod handle_env;
mod handle_notes;
mod handle_personas;

use crate::AppDataPath;
use crate::database::DatabaseHandler;
use tauri::{Builder, Runtime, State};

type DataPath<'a> = State<'a, AppDataPath>;
type Database<'a> = State<'a, DatabaseHandler>;

pub trait AppCommand {
  fn register_handler(self) -> Self;
}

impl<R: Runtime> AppCommand for Builder<R> {
  fn register_handler(self) -> Self {
    self.invoke_handler(tauri::generate_handler![
      handle_env::env_is_mobile,
      // chats
      handle_chats::load_chat,
      handle_chats::save_chat_message,
      handle_chats::save_chat_file,
      // notes
      handle_notes::get_all_notes,
      handle_notes::get_note_by_id,
      handle_notes::add_note,
      handle_notes::modify_note_meta,
      handle_notes::modify_note_content,
      handle_notes::delete_note_by_id,
      // personas
      handle_personas::get_all_personas,
      handle_personas::save_persona,
    ])
  }
}
