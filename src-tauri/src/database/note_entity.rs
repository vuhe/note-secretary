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

  pub async fn find_by_id(id: &str) -> crate::error::Result<Option<Model>> {
    Ok(
      Entity::find_by_id(id)
        .one(super::DATABASE.get().unwrap())
        .await?,
    )
  }

  pub async fn insert(&self) -> crate::error::Result<()> {
    let model = self.clone().into_active_model();
    model.insert(super::DATABASE.get().unwrap()).await?;
    Ok(())
  }

  pub async fn update_metadata(&self) -> crate::error::Result<()> {
    Entity::update_many()
      .col_expr(Column::Category, Expr::value(self.category.clone()))
      .col_expr(Column::Title, Expr::value(self.title.clone()))
      .col_expr(Column::Summary, Expr::value(self.summary.clone()))
      .filter(Column::Id.eq(self.id.clone()))
      .exec(super::DATABASE.get().unwrap())
      .await?;
    Ok(())
  }

  pub async fn update_content<'a>(id: &'a str, content: &'a str) -> crate::error::Result<()> {
    Entity::update_many()
      .col_expr(Column::Content, Expr::value(content))
      .filter(Column::Id.eq(id))
      .exec(super::DATABASE.get().unwrap())
      .await?;
    Ok(())
  }

  pub async fn delete_by_id(id: &str) -> crate::error::Result<()> {
    Entity::delete_by_id(id)
      .exec(super::DATABASE.get().unwrap())
      .await?;
    Ok(())
  }
}
