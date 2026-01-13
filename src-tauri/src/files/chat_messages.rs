use super::{PASSWORD, SAVE_DIR};
use crate::error::{Error, MapToCustomError, Result};
use futures::stream::{self, StreamExt};
use serde::Deserialize;
use serde_json::{Value, from_reader, to_writer};
use std::fs::File;
use std::path::{Path, PathBuf};
use tauri::async_runtime::spawn_blocking;
use zip::write::SimpleFileOptions;
use zip::{AesMode, CompressionMethod, ZipArchive, ZipWriter};

const MESSAGE_FILENAME: &str = "message.json";

#[derive(Debug, Clone, Deserialize)]
pub struct ChatMessage {
  /// 此消息所属的对话 id
  chat_id: String,
  /// 此信息在对话中的 index
  index: u16,
  /// 此信息的 id
  message_id: String,
  /// 此消息的内容
  message: Option<Value>,
  /// 是否忽略已存在的文件进行覆盖
  force: Option<bool>,
}

impl ChatMessage {
  fn save_to_disk(self, path: PathBuf) -> Result<Option<PathBuf>> {
    let need_check = !self.force.unwrap_or(false);
    let id = self.message_id;

    // 如果存在这个记录且 id 匹配那么跳过，id 不匹配会报错
    if need_check && path.try_exists()? {
      let file = File::open(&path)?;
      let archive = ZipArchive::new(file)?;
      return match archive.comment() == id.as_bytes() {
        true => Ok(None),
        false => Err(Error::new(format!(
          "对话记录 {id} 冲突，尝试刷新获取最新对话或强制覆盖"
        ))),
      };
    }

    let message = self
      .message
      .map_custom_err(|_| format!("对话记录 {id} 为 null"))?;

    let file = File::create(&path)?;
    let mut writer = ZipWriter::new(file);

    let options = SimpleFileOptions::default()
      .compression_method(CompressionMethod::Stored)
      .with_aes_encryption(AesMode::Aes256, PASSWORD);

    writer.start_file(MESSAGE_FILENAME, options)?;
    to_writer(&mut writer, &message)?;
    writer.set_comment(id);

    writer.finish()?;

    Ok(Some(path))
  }
}

impl ChatMessage {
  pub async fn save(self, app_data: &Path) -> Result<Option<PathBuf>> {
    let path = app_data
      .join(SAVE_DIR)
      .join(&self.chat_id)
      .join(format!("{:04}.message", &self.index));
    spawn_blocking(move || self.save_to_disk(path)).await?
  }

  pub async fn read_all(app_data: &Path, chat_id: String) -> Result<Vec<Value>> {
    let dir = app_data.join(SAVE_DIR).join(chat_id);
    let indexed_paths = spawn_blocking(move || {
      let mut indexed_paths = Vec::new();

      let entries = std::fs::read_dir(dir)?;
      for entry in entries {
        let path = entry?.path();
        // 检查文件扩展名是否为 .message
        if path.extension().filter(|it| *it == "message").is_none() {
          continue;
        }

        // 提取文件名（不含扩展名）
        let file_name = path
          .file_stem()
          .and_then(|it| it.to_str())
          .map_custom_err(|_| format!("文件名解析失败: {}", path.display()))?;

        // 解析数字
        let index = file_name
          .parse::<u16>()
          .map_custom_err(|e| format!("文件名解析失败（{}）: {}", file_name, e))?;
        indexed_paths.push((index, path));
      }

      // 按索引排序
      indexed_paths.sort_by_key(|&(index, _)| index);

      Ok::<Vec<(u16, PathBuf)>, Error>(indexed_paths)
    })
    .await??;

    // 并发读取所有文件
    let values: Vec<Value> = stream::iter(indexed_paths)
      .map(|(_, path)| async move {
        spawn_blocking(move || {
          let file = File::open(path)?;
          let mut archive = ZipArchive::new(file)?;
          let entry = archive.by_name_decrypt(MESSAGE_FILENAME, PASSWORD.as_bytes())?;
          let value: Value = from_reader(entry)?;
          Ok(value)
        })
        .await?
      })
      // 限制同时最多只有 10 个任务在跑
      .buffered(10)
      .collect::<Vec<Result<Value>>>()
      .await
      .into_iter()
      .collect::<Result<Vec<_>>>()?;

    Ok(values)
  }
}
