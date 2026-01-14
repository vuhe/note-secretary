use super::{RespData, result_to_resp};
use crate::error::{Error, Result};
use mime_guess::{from_path as guess_mime, mime};
use tauri::async_runtime::{spawn, spawn_blocking};
use tauri::http::Request;
use tauri::{Runtime, UriSchemeContext, UriSchemeResponder as Resp};

type Ctx<'a, R> = UriSchemeContext<'a, R>;

enum QueryImageType {
  File,
  Id,
}

async fn handle_image(req: Request<Vec<u8>>) -> Result<RespData> {
  let query_type = match req.uri().query() {
    Some(it) if it == "type=file" => QueryImageType::File,
    Some(it) if it == "type=id" => QueryImageType::Id,
    _ => return Err(Error::NotFound("image".into())),
  };

  let path = percent_encoding::percent_decode(&req.uri().path().as_bytes())
    .decode_utf8_lossy()
    .to_string();

  match query_type {
    QueryImageType::File => {
      let reader = {
        let path = path.clone();
        move || std::fs::read(path)
      };
      let file = spawn_blocking(reader).await??;
      let mime_type = guess_mime(&path)
        .first_raw()
        .unwrap_or(mime::IMAGE_JPEG.essence_str());
      Ok((mime_type, file))
    }
    QueryImageType::Id => {
      todo!("需要确定文件保存后实现")
    }
  }
}

pub fn handler<R: Runtime>(_: Ctx<'_, R>, req: Request<Vec<u8>>, resp: Resp) {
  spawn(async move {
    let result = handle_image(req).await;
    resp.respond(result_to_resp(result));
  });
}
