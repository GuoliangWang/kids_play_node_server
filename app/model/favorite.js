'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE } = app.Sequelize;

  const Favorite = app.model.define('favorite', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    userid: STRING,
    type: INTEGER, // 1: 视频
    target_id: INTEGER,
    created_at: DATE,
    updated_at: DATE,
    is_del: INTEGER,
  });

  return Favorite;
};
