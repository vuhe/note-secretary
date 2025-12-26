// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
fn greet() -> String {
  let now = SystemTime::now();
  let epoch_ms = now.duration_since(UNIX_EPOCH).unwrap().as_millis();
  format!("Hello world from Rust! Current epoch: {epoch_ms}")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![greet])
    .setup(|app| {
      let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
        .title("Note Secretary")
        .inner_size(800.0, 600.0)
        .resizable(true)
        .fullscreen(false);

      // 仅在 macOS 时设置透明标题栏
      #[cfg(target_os = "macos")]
      let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);

      let window = win_builder.build().unwrap();

      // 仅在构建 macOS 时设置背景颜色
      #[cfg(target_os = "macos")]
      {
        use block2::RcBlock;
        use objc2::rc::Retained;
        use objc2_app_kit::{NSAppearance, NSAppearanceNameDarkAqua, NSColor, NSWindow};
        use std::ptr::NonNull;

        unsafe {
          let ns_window = &*(window.ns_window().unwrap() as *const NSWindow);

          let provider = RcBlock::new(
            move |appearance: NonNull<NSAppearance>| -> NonNull<NSColor> {
              let app = appearance.as_ref();

              // 检查当前外观名称是否为深色 (DarkAqua)
              // bestMatchFromAppearances 会在数组中寻找最匹配的外观
              let is_dark = *app.name() == *NSAppearanceNameDarkAqua;

              let color = if is_dark {
                // 返回深色模式下的颜色
                NSColor::colorWithRed_green_blue_alpha(
                  23.0 / 255.0,
                  23.0 / 255.0,
                  23.0 / 255.0,
                  1.0,
                )
              } else {
                // 返回浅色模式下的颜色
                NSColor::colorWithRed_green_blue_alpha(
                  250.0 / 255.0,
                  250.0 / 255.0,
                  250.0 / 255.0,
                  1.0,
                )
              };

              NonNull::new_unchecked(Retained::as_ptr(&color) as *mut NSColor)
            },
          );

          let dynamic_color = NSColor::colorWithName_dynamicProvider(None, &provider);
          ns_window.setBackgroundColor(Some(&dynamic_color));
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
