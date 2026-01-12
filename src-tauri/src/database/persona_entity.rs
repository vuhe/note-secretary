use super::DatabaseHandler;
use sea_orm::IntoActiveModel;
use sea_orm::entity::prelude::*;
use sea_orm::sea_query::OnConflict;
use serde::{Deserialize, Serialize};

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[sea_orm(table_name = "personas")]
pub struct Model {
  /// id，唯一标识符，面具名称
  #[sea_orm(primary_key, auto_increment = false)]
  pub id: String,
  /// 提供商
  pub provider: String,
  /// 模型 ID
  pub model: String,
  /// 模型 apiKey
  pub api_key: String,
  /// 提供商 URL
  #[serde(skip_serializing_if = "Option::is_none")]
  pub base_url: Option<String>,
  /// 参数 maxTokens
  pub max_tokens: i32,
  /// 参数 maxOutputTokens
  #[serde(skip_serializing_if = "Option::is_none")]
  pub max_output_tokens: Option<i32>,
  /// 参数 temperature
  #[serde(skip_serializing_if = "Option::is_none")]
  pub temperature: Option<f64>,
  /// 参数 topP
  #[serde(skip_serializing_if = "Option::is_none")]
  pub top_p: Option<f64>,
  /// 参数 topK
  #[serde(skip_serializing_if = "Option::is_none")]
  pub top_k: Option<i32>,
  /// 参数 presencePenalty
  #[serde(skip_serializing_if = "Option::is_none")]
  pub presence_penalty: Option<f64>,
  /// 参数 frequencyPenalty
  #[serde(skip_serializing_if = "Option::is_none")]
  pub frequency_penalty: Option<f64>,
  /// 系统提示词
  pub system_prompt: String,
}

impl ActiveModelBehavior for ActiveModel {}

impl DatabaseHandler {
  pub async fn find_all_personas(&self) -> crate::error::Result<Vec<Model>> {
    Ok(Entity::find().all(&self.0).await?)
  }

  pub async fn save_persona(&self, model: Model) -> crate::error::Result<()> {
    Entity::insert(model.into_active_model())
      .on_conflict(
        OnConflict::column(Column::Id)
          .update_columns([
            Column::Provider,
            Column::Model,
            Column::ApiKey,
            Column::BaseUrl,
            Column::MaxTokens,
            Column::MaxOutputTokens,
            Column::Temperature,
            Column::TopP,
            Column::TopK,
            Column::PresencePenalty,
            Column::FrequencyPenalty,
            Column::SystemPrompt,
          ])
          .to_owned(),
      )
      .exec(&self.0)
      .await?;
    Ok(())
  }
}
