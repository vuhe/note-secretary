mod image;

use tauri::async_runtime::spawn;
use tauri::{Builder, Runtime};

pub trait CustomUriScheme {
  fn register_custom_uri(self) -> Self;
}

impl<R: Runtime> CustomUriScheme for Builder<R> {
  fn register_custom_uri(self) -> Self {
    self.register_asynchronous_uri_scheme_protocol("image", move |_ctx, request, responder| {
      spawn(image::handle_image_request(request, responder));
    })
  }
}
