'use strict';

module.exports = {
  // The function called when performing a database upgrade, create a `videos` table
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, DATE, STRING, FLOAT } = Sequelize;
    await queryInterface.createTable('videos', {
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
  },
  // The function called when performing a database downgrade, delete the `videos` table
  down: async queryInterface => {
    await queryInterface.dropTable('videos');
  },
};
