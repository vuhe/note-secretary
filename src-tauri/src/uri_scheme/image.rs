use mime_guess::{from_path as guess_mime, mime};
use tauri::UriSchemeResponder;
use tauri::async_runtime::spawn_blocking;
use tauri::http::header::CONTENT_TYPE;
use tauri::http::{Request, Response, StatusCode};

enum QueryImageType {
  File,
  Id,
}

fn error_to_bytes_resp(error: impl ToString) -> Response<Vec<u8>> {
  Response::builder()
    .status(StatusCode::INTERNAL_SERVER_ERROR)
    .header(CONTENT_TYPE, mime::TEXT.to_string())
    .body(error.to_string().as_bytes().to_vec())
    .unwrap()
}

async fn handle_image(req: Request<Vec<u8>>) -> Response<Vec<u8>> {
  let query_type = match req.uri().query() {
    Some(it) if it == "type=file" => QueryImageType::File,
    Some(it) if it == "type=id" => QueryImageType::Id,
    _ => {
      return Response::builder()
        .status(StatusCode::NOT_FOUND)
        .body(vec![])
        .unwrap();
    }
  };

  let path = percent_encoding::percent_decode(&req.uri().path().as_bytes())
    .decode_utf8_lossy()
    .to_string();

  match query_type {
    QueryImageType::File => {
      let file_path = path.clone();
      let result = spawn_blocking(move || std::fs::read(file_path)).await;
      let file = match result {
        Ok(it) => match it {
          Ok(file) => file,
          Err(error) => return error_to_bytes_resp(error),
        },
        Err(error) => return error_to_bytes_resp(error),
      };
      let mime_type = guess_mime(&path).first_or(mime::IMAGE_JPEG).to_string();
      Response::builder()
        .header(CONTENT_TYPE, mime_type)
        .body(file)
        .unwrap()
    }
    QueryImageType::Id => {
      todo!("需要确定文件保存后实现")
    }
  }
}

pub async fn handle_image_request(req: Request<Vec<u8>>, resp: UriSchemeResponder) {
  resp.respond(handle_image(req).await)
}
