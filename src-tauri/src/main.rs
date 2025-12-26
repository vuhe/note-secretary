// 用于在 Windows 生产版本（release）中禁用额外的控制台窗口
// 请勿删除, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  note_secretary_lib::run()
}
