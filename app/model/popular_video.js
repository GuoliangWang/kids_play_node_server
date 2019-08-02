'use strict';

module.exports = app => {
  const { INTEGER, DATE } = app.Sequelize;

  const Model = app.model.define('popular_video', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    video_id: INTEGER,
    weight: INTEGER,
    created_at: DATE,
    updated_at: DATE,
    status: INTEGER,
    is_del: INTEGER,
  });

  return Model;
};
