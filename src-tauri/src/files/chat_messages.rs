use super::{PASSWORD, SAVE_DIR};
use crate::error::{Error, Result};
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
        false => Err(Error::Custom(
          format!("对话记录 {id} 冲突，尝试刷新获取最新对话或强制覆盖").into(),
        )),
      };
    }

    let Some(message) = self.message else {
      return Err(Error::Custom(format!("对话记录 {id} 为 null").into()));
    };

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

  fn read_from_disk(self, path: PathBuf) -> Result<Value> {
    let file = File::open(path)?;
    let mut archive = ZipArchive::new(file)?;
    let entry = archive.by_name_decrypt(MESSAGE_FILENAME, PASSWORD.as_bytes())?;

    Ok(from_reader(entry)?)
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

  pub async fn read(self, app_data: &Path) -> Result<Value> {
    let path = app_data
      .join(SAVE_DIR)
      .join(&self.chat_id)
      .join(format!("{:04}.message", &self.index));
    spawn_blocking(move || self.read_from_disk(path)).await?
  }
}
