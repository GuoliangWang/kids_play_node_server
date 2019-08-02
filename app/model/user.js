'use strict';

module.exports = app => {
  const { INTEGER, DATE } = app.Sequelize;

  const User = app.model.define('user', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    narnia_role: INTEGER,
    narnia_num: INTEGER,
    created_at: DATE,
    updated_at: DATE,
  });

  return User;
};
