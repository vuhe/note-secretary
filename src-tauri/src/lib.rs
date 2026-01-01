mod command;
mod database;
mod error;

use command::AppCommand;
use tauri::Result;

#[cfg(target_os = "macos")]
fn set_macos_title_bar(window: &tauri::WebviewWindow) -> Result<()> {
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
fn get_work_dir(app: &tauri::App) -> Result<std::path::PathBuf> {
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
      app.path().app_local_data_dir()?
    }
  };

  std::fs::create_dir_all(&work_dir)?;
  Ok(work_dir)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_opener::init())
    .register_handler()
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

      // 设置数据库和向量引擎
      let work_dir = get_work_dir(&app)?;
      database::setup_database(&work_dir)?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
