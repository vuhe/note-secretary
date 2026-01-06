use super::APP_HANDLE;
use serde::Serialize;
use tauri::Emitter;

#[derive(Clone, Serialize)]
struct ToasterEvent<'a> {
  r#type: &'static str,
  title: &'a str,
  #[serde(skip_serializing_if = "Option::is_none")]
  description: Option<&'a str>,
}

pub fn info<'a>(title: &'a str, description: Option<&'a str>) {
  let Some(app_handle) = APP_HANDLE.get() else {
    return;
  };
  let payload = ToasterEvent {
    r#type: "info",
    title,
    description,
  };
  app_handle.emit("toaster", payload).ok();
}

pub fn warning<'a>(title: &'a str, description: Option<&'a str>) {
  let Some(app_handle) = APP_HANDLE.get() else {
    return;
  };
  let payload = ToasterEvent {
    r#type: "warning",
    title,
    description,
  };
  app_handle.emit("toaster", payload).ok();
}

pub fn error<'a>(title: &'a str, description: Option<&'a str>) {
  let Some(app_handle) = APP_HANDLE.get() else {
    return;
  };
  let payload = ToasterEvent {
    r#type: "error",
    title,
    description,
  };
  app_handle.emit("toaster", payload).ok();
}

pub fn success<'a>(title: &'a str, description: Option<&'a str>) {
  let Some(app_handle) = APP_HANDLE.get() else {
    return;
  };
  let payload = ToasterEvent {
    r#type: "success",
    title,
    description,
  };
  app_handle.emit("toaster", payload).ok();
}
