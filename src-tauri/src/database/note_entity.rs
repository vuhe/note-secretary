use sea_orm::QuerySelect;
use sea_orm::entity::prelude::*;
use serde::Serialize;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "notes")]
pub struct Model {
  /// id，唯一标识符，UUID
  #[sea_orm(primary_key, auto_increment = false)]
  pub id: String,
  /// 分组，note 的文件夹
  #[sea_orm(unique_key = "item")]
  pub category: String,
  /// 标题，note 的文件名
  #[sea_orm(unique_key = "item")]
  pub title: String,
  /// 总结，用于AI问答和搜寻
  pub summary: Option<String>,
  /// 正文，markdown
  pub content: String,
}

impl ActiveModelBehavior for ActiveModel {}

#[derive(DerivePartialModel, Serialize)]
#[sea_orm(entity = "Entity")]
pub struct NoteSummary {
  pub id: String,
  pub category: String,
  pub title: String,
}

impl Model {
  pub async fn all() -> crate::error::Result<Vec<NoteSummary>> {
    let result = Entity::find()
      .select_only()
      .column(Column::Id)
      .column(Column::Category)
      .column(Column::Title)
      .into_model::<NoteSummary>()
      .all(super::DATABASE.get().unwrap())
      .await?;
    Ok(result)
  }
}
