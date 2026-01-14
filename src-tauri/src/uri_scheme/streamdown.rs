use super::result_to_resp;
use crate::error::{Error, Result};
use mime_guess::mime::TEXT_JAVASCRIPT;
use std::path::PathBuf;
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

  std::thread::spawn(move || {
    if file.try_exists().ok() == Some(false) {
      let not_found = Error::NotFound("streamdown res".into());
      resp.respond(result_to_resp(Err(not_found)));
      return;
    }

    let file = match std::fs::read(file) {
      Ok(it) => it,
      Err(error) => {
        resp.respond(result_to_resp(Err(error.into())));
        return;
      }
    };

    let result = (mime, file);
    resp.respond(result_to_resp(Ok(result)));
  });
}
