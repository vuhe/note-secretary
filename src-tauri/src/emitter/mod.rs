pub mod toaster;

use crate::error::OnceLockSetup;
use serde::Serialize;
use std::sync::OnceLock;
use tauri::{App, AppHandle, Emitter};

static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

pub fn setup_emitter(app: &App) -> tauri::Result<()> {
  APP_HANDLE.setup(app.handle().clone(), "emitter")?;
  Ok(())
}

pub fn event<S: Serialize + Clone>(event: &str, payload: S) {
  let Some(app_handle) = APP_HANDLE.get() else {
    return;
  };
  app_handle.emit(event, payload).ok();
}
