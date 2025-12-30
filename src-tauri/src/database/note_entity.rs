use sea_orm::entity::prelude::*;

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
