use super::{PASSWORD, SAVE_DIR};
use crate::error::Result;
use serde::{Deserialize, Serialize};
use serde_json::to_writer;
use std::fs::File;
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::async_runtime::spawn_blocking;
use zip::write::SimpleFileOptions;
use zip::{AesMode, CompressionMethod, ZipArchive, ZipWriter};

const FILE_DIR_NAME: &str = "files";

const DEFAULT_FILENAME: &str = "data";
const METADATA_FILENAME: &str = "meta.json";
const SUMMARY_FILENAME: &str = "summary.txt";

#[derive(Debug, Clone, Deserialize)]
pub struct ChatFile {
  /// 此消息所属的对话 id
  chat_id: String,
  /// 此消息所属的文件 id
  file_id: String,
  /// 文件的 mime type
  media_type: String,
  /// 文件名
  filename: Option<String>,
  /// 文件内容摘要
  summary: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
struct ChatFileMeta {
  media_type: String,
  filename: String,
}

impl ChatFile {
  fn filename(&self) -> Option<String> {
    if let Some(name) = self.filename.clone() {
      return Some(name);
    }
    mime_guess::get_mime_extensions_str(&self.media_type)
      .and_then(|it| it.first())
      .map(|it| format!("data.{it}"))
  }

  fn save_to_disk(self, path: PathBuf, data: Option<Vec<u8>>) -> Result<PathBuf> {
    let temp_path = path.with_added_extension("tmp");
    let temp_file = File::create(&temp_path)?;
    let mut writer = ZipWriter::new(temp_file);

    // [meta, summary, data] flag
    let mut flag = [true, true, true];

    if path.try_exists()? {
      let file = File::open(&path)?;
      let mut archive = ZipArchive::new(file)?;
      for i in 0..archive.len() {
        let entry = archive.by_index_raw(i)?;

        match entry.name() {
          METADATA_FILENAME => flag[0] = false,
          SUMMARY_FILENAME => flag[1] = false,
          DEFAULT_FILENAME => flag[2] = false,
          _ => continue,
        }

        writer.raw_copy_file(entry)?; // 高效拷贝，不涉及解密再加密
      }
    }

    let options = SimpleFileOptions::default()
      .compression_method(CompressionMethod::Stored)
      .with_aes_encryption(AesMode::Aes256, PASSWORD);

    // meta 没有复制
    if flag[0] {
      let filename = self.filename();
      let meta = ChatFileMeta {
        media_type: self.media_type,
        filename: filename.unwrap_or("unknown".into()),
      };

      writer.start_file(METADATA_FILENAME, options)?;
      to_writer(&mut writer, &meta)?;
    }

    // summary 没有复制
    if flag[1]
      && let Some(summary) = self.summary.as_deref()
    {
      writer.start_file(SUMMARY_FILENAME, options)?;
      writer.write_all(summary.as_bytes())?;
    }

    // data 没有复制
    if flag[2]
      && let Some(data) = data
    {
      writer.start_file(DEFAULT_FILENAME, options)?;
      writer.write_all(&data)?;
    }

    writer.finish()?;

    std::fs::rename(temp_path, &path)?;

    Ok(path)
  }
}

impl ChatFile {
  pub async fn save(self, app_data: &Path, data: Option<Vec<u8>>) -> Result<PathBuf> {
    let path = app_data
      .join(SAVE_DIR)
      .join(&self.chat_id)
      .join(FILE_DIR_NAME)
      .join(&self.file_id);
    spawn_blocking(move || self.save_to_disk(path, data)).await?
  }
}
