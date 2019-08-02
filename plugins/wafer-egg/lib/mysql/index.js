'use strict';

const configs = require('../../config');

module.exports = require('knex')({
  client: 'mysql2',
  connection: {
    host: configs.mysql.host,
    port: configs.mysql.port,
    user: configs.mysql.user,
    password: configs.mysql.pass,
    database: configs.mysql.db,
    charset: configs.mysql.char,
  },
});
