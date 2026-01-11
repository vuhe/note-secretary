use super::PASSWORD;
use crate::error::{Error, Result};
use serde_json::{Value, from_reader, to_writer};
use std::fs::File;
use std::path::Path;
use zip::write::SimpleFileOptions;
use zip::{AesMode, CompressionMethod, ZipArchive, ZipWriter};

const MESSAGE_FILENAME: &str = "message.json";

pub fn save_chat_message(path: &Path, message: Value, force: bool) -> Result<()> {
  let id = message
    .as_object()
    .and_then(|it| it.get("id"))
    .and_then(|id| id.as_str())
    .map(|id| id.to_owned());

  // 如果存在这个记录且 id 匹配那么跳过，id 不匹配会报错
  if !force
    && path.try_exists()?
    && let Some(id) = id.as_deref()
  {
    let file = File::open(path)?;
    let archive = ZipArchive::new(file)?;
    return match archive.comment() == id.as_bytes() {
      true => Ok(()),
      false => Err(Error::Custom(
        "对话记录 id 冲突，尝试刷新获取最新对话或强制覆盖".into(),
      )),
    };
  }

  let file = File::create(path)?;
  let mut writer = ZipWriter::new(file);

  let options = SimpleFileOptions::default()
    .compression_method(CompressionMethod::Stored)
    .with_aes_encryption(AesMode::Aes256, PASSWORD);

  writer.start_file(MESSAGE_FILENAME, options)?;
  to_writer(&mut writer, &message)?;

  if let Some(id) = id {
    writer.set_comment(id);
  }

  writer.finish()?;

  Ok(())
}

pub fn read_chat_message(path: &Path) -> Result<Value> {
  let file = File::open(path)?;
  let mut archive = ZipArchive::new(file)?;
  let entry = archive.by_name_decrypt(MESSAGE_FILENAME, PASSWORD.as_bytes())?;
  Ok(from_reader(entry)?)
}
