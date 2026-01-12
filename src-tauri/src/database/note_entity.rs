use super::DatabaseHandler;
use sea_orm::entity::prelude::*;
use sea_orm::{IntoActiveModel, QuerySelect};
use serde::{Deserialize, Serialize};

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Deserialize, Serialize)]
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
  pub summary: String,
  /// 正文，markdown
  #[serde(default)]
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

impl DatabaseHandler {
  pub async fn find_all_notes(&self) -> crate::error::Result<Vec<NoteSummary>> {
    let result = Entity::find()
      .select_only()
      .column(Column::Id)
      .column(Column::Category)
      .column(Column::Title)
      .into_model::<NoteSummary>()
      .all(&self.0)
      .await?;
    Ok(result)
  }

  pub async fn find_note_by_id(&self, id: &str) -> crate::error::Result<Option<Model>> {
    Ok(Entity::find_by_id(id).one(&self.0).await?)
  }

  pub async fn insert_note(&self, model: &Model) -> crate::error::Result<()> {
    let model = model.clone().into_active_model();
    model.insert(&self.0).await?;
    Ok(())
  }

  pub async fn update_note_metadata(&self, model: &Model) -> crate::error::Result<()> {
    Entity::update_many()
      .col_expr(Column::Category, Expr::value(model.category.clone()))
      .col_expr(Column::Title, Expr::value(model.title.clone()))
      .col_expr(Column::Summary, Expr::value(model.summary.clone()))
      .filter(Column::Id.eq(model.id.clone()))
      .exec(&self.0)
      .await?;
    Ok(())
  }

  pub async fn update_note_content(&self, id: &str, content: &str) -> crate::error::Result<()> {
    Entity::update_many()
      .col_expr(Column::Content, Expr::value(content))
      .filter(Column::Id.eq(id))
      .exec(&self.0)
      .await?;
    Ok(())
  }

  pub async fn delete_note_by_id(&self, id: &str) -> crate::error::Result<()> {
    Entity::delete_by_id(id).exec(&self.0).await?;
    Ok(())
  }
}
