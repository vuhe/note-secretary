use super::{PASSWORD, SAVE_DIR};
use crate::database::DatabaseHandler;
use crate::error::{MapToCustomError, Result};
use data_url::DataUrl;
use serde::Deserialize;
use std::fs::{File, create_dir_all};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use tauri::async_runtime::spawn_blocking;
use tauri_plugin_http::reqwest;
use zip::write::SimpleFileOptions;
use zip::{AesMode, CompressionMethod, ZipArchive, ZipWriter};

const FILE_DIR_NAME: &str = "files";
const DEFAULT_FILENAME: &str = "data";

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "kind", content = "data")]
enum ChatFileData {
  #[serde(rename = "file")]
  Url(String),
  #[serde(rename = "tauri")]
  Path(PathBuf),
  #[serde(rename = "ref")]
  RefId(String),
}

impl ChatFileData {
  async fn to_data(&self, database: &DatabaseHandler) -> Result<Vec<u8>> {
    match self {
      Self::Url(url) => {
        if url.starts_with("data:") {
          let url = DataUrl::process(url)?;
          let (body, _) = url.decode_to_vec()?;
          return Ok(body);
        }
        let res = reqwest::get(url).await?;
        Ok(res.bytes().await?.into())
      }
      Self::Path(path) => {
        let path = path.clone();
        Ok(spawn_blocking(move || std::fs::read(path)).await??)
      }
      Self::RefId(note_id) => {
        let note = database
          .find_note_by_id(note_id)
          .await?
          .map_custom_err(|_| format!("找不到对应笔记（{note_id}）"))?;
        Ok(note.content.into_bytes())
      }
    }
  }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatFile {
  /// 此消息所属的对话 id
  chat_id: String,
  /// 此消息所属的文件 id
  file_id: String,
  /// 文件内容
  data: Option<ChatFileData>,
}

impl ChatFile {
  fn save_to_disk(self, path: PathBuf, data: Vec<u8>) -> Result<PathBuf> {
    // 如果不存在父文件夹，创建文件夹
    if let Some(parent) = path.parent() {
      create_dir_all(parent)?;
    }

    let file = File::create(&path)?;
    let mut writer = ZipWriter::new(file);

    let options = SimpleFileOptions::default()
      .compression_method(CompressionMethod::Stored)
      .with_aes_encryption(AesMode::Aes256, PASSWORD);

    writer.start_file(DEFAULT_FILENAME, options)?;
    writer.write_all(&data)?;
    writer.finish()?;

    Ok(path)
  }
}

impl ChatFile {
  pub async fn save(self, app_data: &Path, database: &DatabaseHandler) -> Result<PathBuf> {
    let path = app_data
      .join(SAVE_DIR)
      .join(&self.chat_id)
      .join(FILE_DIR_NAME)
      .join(format!("{}.file", &self.file_id));
    let data = self
      .data
      .as_ref()
      .map_custom_err(|_| "保存文件时数据缺失")?;
    let data = data.to_data(database).await?;
    spawn_blocking(move || self.save_to_disk(path, data)).await?
  }

  pub async fn read(self, app_data: &Path) -> Result<Vec<u8>> {
    let path = app_data
      .join(SAVE_DIR)
      .join(&self.chat_id)
      .join(FILE_DIR_NAME)
      .join(format!("{}.file", &self.file_id));
    spawn_blocking(move || {
      let file = File::open(path)?;
      let mut archive = ZipArchive::new(file)?;
      let mut entry = archive.by_name_decrypt(DEFAULT_FILENAME, PASSWORD.as_bytes())?;
      let mut buffer = Vec::with_capacity(entry.size() as usize);
      entry.read_to_end(&mut buffer)?;
      Ok(buffer)
    })
    .await?
  }
}
