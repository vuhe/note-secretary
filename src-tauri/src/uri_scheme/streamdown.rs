use super::result_to_resp;
use crate::error::{Error, Result};
use mime_guess::mime::TEXT_JAVASCRIPT;
use std::path::PathBuf;
use tauri::async_runtime::{spawn, spawn_blocking};
use tauri::http::Request;
use tauri::path::BaseDirectory;
use tauri::{Manager, Runtime, UriSchemeContext, UriSchemeResponder as Resp};

type Ctx<'a, R> = UriSchemeContext<'a, R>;

fn parse_url_path(parts: &[&str]) -> Result<PathBuf> {
  match parts {
    ["shiki", _version, "langs", filename @ ..] => {
      let mut p = PathBuf::from("shiki-langs");
      filename.iter().for_each(|it| p.push(it));
      Ok(p)
    }
    ["mermaid", _version, "chunks", _dir, filename @ ..] => {
      let mut p = PathBuf::from("mermaid-chunks");
      filename.iter().for_each(|it| p.push(it));
      Ok(p)
    }
    ["mermaid", _version, filename @ ..] => {
      let mut p = PathBuf::from("mermaid");
      filename.iter().for_each(|it| p.push(it));
      Ok(p)
    }
    ["katex", _version, "fonts", filename @ ..] => {
      let mut p = PathBuf::from("katex-fonts");
      filename.iter().for_each(|it| p.push(it));
      Ok(p)
    }
    ["katex", _version, filename @ ..] => {
      let mut p = PathBuf::from("katex");
      filename.iter().for_each(|it| p.push(it));
      Ok(p)
    }
    _ => Err(Error::NotFound("streamdown res".into())),
  }
}

fn parse_path<R: Runtime>(ctx: Ctx<'_, R>, req: Request<Vec<u8>>) -> Result<PathBuf> {
  let url_path = percent_encoding::percent_decode(&req.uri().path().as_bytes())
    .decode_utf8_lossy()
    .to_string();

  let parts: Vec<&str> = url_path.split('/').filter(|s| !s.is_empty()).collect();
  let resolved_path = parse_url_path(&parts)?;

  let path = ctx
    .app_handle()
    .path()
    .resolve(resolved_path, BaseDirectory::Resource)?;

  Ok(path)
}

/// 在字节流中定位第一对匹配的引号 (支持 ' 或 ")
fn find_alias_path(data_path: &PathBuf, data: &[u8]) -> Option<PathBuf> {
  let mut iter = data.iter().enumerate();

  // 找第一个引号
  let (start, &quote_byte) = iter.find(|&(_, &b)| b == b'\'' || b == b'\"')?;
  if start + 1 >= data.len() {
    return None;
  }

  // 找结束引号
  let (end, _) = data[start + 1..]
    .iter()
    .enumerate()
    .find(|&(_, &b)| b == quote_byte)?;

  // 提取引号内的路径
  let path_bytes = &data[start + 1..start + 1 + end];
  let path_str = std::str::from_utf8(path_bytes)
    .ok()
    .filter(|it| it.starts_with("./"))?;

  // 裁剪掉前面的 ./ 并返回
  let mut alias_path = data_path.clone();
  alias_path.pop();
  alias_path.push(path_str.trim_start_matches("./"));
  Some(alias_path)
}

async fn get_bytes(path: PathBuf) -> Result<Vec<u8>> {
  spawn_blocking(move || {
    if path.try_exists().ok() == Some(false) {
      return Err(Error::NotFound("streamdown res".into()));
    }

    let file = std::fs::read(&path)?;

    let pattern = b"export { default } from";
    let alias_pos = file
      .windows(pattern.len())
      .position(|window| window == pattern);
    if let Some(pos) = alias_pos {
      // 2. 找到模式串后，提取后面的路径部分
      let tail = &file[pos + pattern.len()..];

      // 寻找别名路径并读取，例如 javascript.mjs
      if let Some(alias_path) = find_alias_path(&path, tail) {
        let alias_file = std::fs::read(&alias_path)?;
        return Ok(alias_file);
      }
    }

    Ok::<Vec<u8>, Error>(file)
  })
  .await?
}

pub fn handler<R: Runtime>(ctx: Ctx<'_, R>, req: Request<Vec<u8>>, resp: Resp) {
  let file = match parse_path(ctx, req) {
    Ok(it) => it,
    Err(error) => {
      resp.respond(result_to_resp(Err(error)));
      return;
    }
  };

  let mime = mime_guess::from_path(&file)
    .first_raw()
    .unwrap_or(TEXT_JAVASCRIPT.essence_str());

  spawn(async move {
    let result = get_bytes(file).await.map(|it| (mime, it));
    resp.respond(result_to_resp(result));
  });
}
