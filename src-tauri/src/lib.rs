use anyhow::anyhow;
use std::path::PathBuf;
use std::sync::OnceLock;
use tauri::{App, Result, WebviewWindow};

#[tauri::command]
fn greet() -> String {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  use std::time::{SystemTime, UNIX_EPOCH};
  let now = SystemTime::now();
  let epoch_ms = now.duration_since(UNIX_EPOCH).unwrap().as_millis();
  format!("Hello world from Rust! Current epoch: {epoch_ms}")
}

static APP_DATA_PATH: OnceLock<PathBuf> = OnceLock::new();

#[cfg(target_os = "macos")]
fn set_macos_title_bar(window: &WebviewWindow) -> Result<()> {
  use block2::RcBlock;
  use objc2::rc::Retained;
  use objc2_app_kit::{NSAppearance, NSAppearanceNameDarkAqua, NSColor, NSWindow};
  use std::ptr::NonNull;

  let ns_window = unsafe { &*(window.ns_window()? as *const NSWindow) };

  let provider = RcBlock::new(
    move |appearance: NonNull<NSAppearance>| -> NonNull<NSColor> {
      let app = unsafe { appearance.as_ref() };

      // 检查当前外观名称是否为深色 (DarkAqua)
      let color = if unsafe { *app.name() == *NSAppearanceNameDarkAqua } {
        // 返回深色模式下的颜色
        NSColor::colorWithRed_green_blue_alpha(23.0 / 255.0, 23.0 / 255.0, 23.0 / 255.0, 1.0)
      } else {
        // 返回浅色模式下的颜色
        NSColor::colorWithRed_green_blue_alpha(250.0 / 255.0, 250.0 / 255.0, 250.0 / 255.0, 1.0)
      };

      unsafe { NonNull::new_unchecked(Retained::as_ptr(&color) as *mut NSColor) }
    },
  );

  let dynamic_color = unsafe { NSColor::colorWithName_dynamicProvider(None, &provider) };
  ns_window.setBackgroundColor(Some(&dynamic_color));

  Ok(())
}

#[allow(unused_variables)]
fn set_work_dir(app: &App) -> Result<()> {
  let work_dir = {
    #[cfg(debug_assertions)]
    {
      let mut current = std::env::current_dir()?;
      current.pop();
      current.join("test-data")
    }
    #[cfg(not(debug_assertions))]
    {
      use tauri::Manager;
      app.path().app_local_data_dir()
    }
  };

  std::fs::create_dir_all(&work_dir)?;
  APP_DATA_PATH
    .set(work_dir)
    .map_err(|_| anyhow!("failed to set app data path"))?;

  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![greet])
    .setup(|app| {
      let win_builder = tauri::WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::default())
        .title("Note Secretary")
        .inner_size(900.0, 700.0)
        .resizable(true)
        .fullscreen(false);

      // 仅在 macOS 时设置透明标题栏和背景颜色
      #[cfg(target_os = "macos")]
      {
        let win_builder = win_builder.title_bar_style(tauri::TitleBarStyle::Transparent);
        let window = win_builder.build()?;
        set_macos_title_bar(&window)?;
      }

      // 设置全局数据目录
      set_work_dir(&app)?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
