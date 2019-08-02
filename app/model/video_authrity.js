'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE } = app.Sequelize;

  const model = app.model.define('video_authority', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    video_id: INTEGER,
    user_id: STRING,
    auth: INTEGER, // 1 读
    created_at: DATE,
    updated_at: DATE,
    is_del: INTEGER,
  });

  return model;
};
