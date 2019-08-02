'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE, FLOAT } = app.Sequelize;

  const Video = app.model.define('video', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    title: STRING,
    cover: STRING,
    url: STRING,
    width: INTEGER,
    height: INTEGER,
    size: INTEGER,
    duration: FLOAT,
    dream: STRING,
    create_userid: STRING,
    created_at: DATE,
    updated_at: DATE,
    is_del: INTEGER,
    privacy: INTEGER,
    status: INTEGER, // 审核中 。。。
  });

  return Video;
};
