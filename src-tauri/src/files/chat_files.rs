use super::{PASSWORD, SAVE_DIR};
use crate::database::DatabaseHandler;
use crate::error::{MapToCustomError, Result};
use data_url::DataUrl;
use serde::Deserialize;
use std::fs::{File, create_dir_all};
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::async_runtime::spawn_blocking;
use tauri_plugin_http::reqwest;
use zip::write::SimpleFileOptions;
use zip::{AesMode, CompressionMethod, ZipArchive, ZipWriter};

const FILE_DIR_NAME: &str = "files";

const DEFAULT_FILENAME: &str = "data";
const SUMMARY_FILENAME: &str = "summary.txt";

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
  /// 文件内容摘要
  summary: Option<String>,
  /// 文件内容
  data: Option<ChatFileData>,
}

impl ChatFile {
  fn save_to_disk(self, path: PathBuf, data: Option<Vec<u8>>) -> Result<PathBuf> {
    // 如果不存在父文件夹，创建文件夹
    if let Some(parent) = path.parent() {
      create_dir_all(parent)?;
    }

    let temp_path = path.with_added_extension("tmp");
    let temp_file = File::create(&temp_path)?;
    let mut writer = ZipWriter::new(temp_file);

    let mut need_copy_summary = true;
    let mut need_copy_data = true;

    if path.try_exists()? {
      let file = File::open(&path)?;
      let mut archive = ZipArchive::new(file)?;
      for i in 0..archive.len() {
        let entry = archive.by_index_raw(i)?;

        match entry.name() {
          SUMMARY_FILENAME => need_copy_summary = false,
          DEFAULT_FILENAME => need_copy_data = false,
          _ => continue,
        }

        writer.raw_copy_file(entry)?; // 高效拷贝，不涉及解密再加密
      }
    }

    let options = SimpleFileOptions::default()
      .compression_method(CompressionMethod::Stored)
      .with_aes_encryption(AesMode::Aes256, PASSWORD);

    // summary 没有复制
    if need_copy_summary && let Some(summary) = self.summary.as_deref() {
      writer.start_file(SUMMARY_FILENAME, options)?;
      writer.write_all(summary.as_bytes())?;
    }

    // data 没有复制
    if need_copy_data && let Some(data) = data {
      writer.start_file(DEFAULT_FILENAME, options)?;
      writer.write_all(&data)?;
    }

    writer.finish()?;

    std::fs::rename(temp_path, &path)?;

    Ok(path)
  }
}

impl ChatFile {
  pub async fn save(self, app_data: &Path, database: &DatabaseHandler) -> Result<PathBuf> {
    let path = app_data
      .join(SAVE_DIR)
      .join(&self.chat_id)
      .join(FILE_DIR_NAME)
      .join(&self.file_id);
    let data = match self.data.as_ref() {
      None => None,
      Some(it) => Some(it.to_data(database).await?),
    };
    spawn_blocking(move || self.save_to_disk(path, data)).await?
  }
}
