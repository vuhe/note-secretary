mod setup;

pub use setup::setup_database;

use sea_orm::DatabaseConnection;
use std::sync::OnceLock;

static DATABASE: OnceLock<DatabaseConnection> = OnceLock::new();
