mod image;

use crate::error::{Error, Result};
use mime_guess::mime::TEXT_PLAIN;
use tauri::http::header::{ACCESS_CONTROL_ALLOW_ORIGIN, CONTENT_TYPE};
use tauri::http::{Response, StatusCode};
use tauri::{Builder, Runtime};

type RespData = (&'static str, Vec<u8>);

fn result_to_resp(result: Result<RespData>) -> Response<Vec<u8>> {
  match result {
    Ok((mime, byte)) => Response::builder()
      .header(ACCESS_CONTROL_ALLOW_ORIGIN, "*")
      .header(CONTENT_TYPE, mime)
      .body(byte)
      .unwrap(),
    Err(Error::NotFound(_)) => Response::builder()
      .status(StatusCode::NOT_FOUND)
      .header(ACCESS_CONTROL_ALLOW_ORIGIN, "*")
      .body(vec![])
      .unwrap(),
    Err(error) => Response::builder()
      .status(StatusCode::INTERNAL_SERVER_ERROR)
      .header(ACCESS_CONTROL_ALLOW_ORIGIN, "*")
      .header(CONTENT_TYPE, TEXT_PLAIN.essence_str())
      .body(error.to_string().into_bytes())
      .unwrap(),
  }
}

pub trait CustomUriScheme {
  fn register_custom_uri(self) -> Self;
}

impl<R: Runtime> CustomUriScheme for Builder<R> {
  fn register_custom_uri(self) -> Self {
    self.register_asynchronous_uri_scheme_protocol("image", image::handler)
  }
}
