'use strict';

// const fs = require('fs');
const env = process.env;
console.log('env.MySQL_PASSWORD', env.MySQL_PASSWORD);
module.exports = {
  development: {
    username: 'root',
    password: env.MySQL_PASSWORD,
    database: 'kids_app',
    host: '127.0.0.1',
    dialect: 'mysql',
    dialectOptions: {
      supportBigNumbers: true,
      bigNumberStrings: true,
    },
    define: {
      freezeTableName: false,
      underscored: true,
      charset: 'utf8mb4',
      dialectOptions: {
        collate: 'utf8mb4_general_ci',
      },
    },
  },
  test: {
    username: 'root',
    password: env.MySQL_PASSWORD,
    database: 'kids_app',
    host: '127.0.0.1',
    dialect: 'mysql',
    dialectOptions: {
      supportBigNumbers: true,
      bigNumberStrings: true,
    },
    define: {
      freezeTableName: false,
      underscored: true,
      charset: 'utf8mb4',
      dialectOptions: {
        collate: 'utf8mb4_general_ci',
      },
    },
  },
  production: {
    username: 'root',
    password: env.MySQL_PASSWORD,
    database: 'kids_app',
    host: '127.0.0.1',
    dialect: 'mysql',
    dialectOptions: {
      supportBigNumbers: true,
      bigNumberStrings: true,
    },
    define: {
      freezeTableName: false,
      underscored: true,
      charset: 'utf8mb4',
      dialectOptions: {
        collate: 'utf8mb4_general_ci',
      },
    },
  },
};
