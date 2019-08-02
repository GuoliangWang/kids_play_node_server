/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
const env = process.env;
console.log('test');
module.exports = (/* appInfo*/) => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = {};
  // add your user config here
  // const userConfig = {
  //   myAppName: 'naniar_node_server',
  //   sequelize: {
  //     username: 'root',
  //     password: env.MySQL_PASSWORD,
  //     dialect: 'mysql',
  //     host: '127.0.0.1',
  //     port: 3306,
  //     database: 'kids_app',
  //   },
  // };

  // userConfig.weixin = {
  //   mysql: {
  //     host: userConfig.sequelize.host,
  //     port: userConfig.sequelize.port,
  //     user: userConfig.sequelize.username,
  //     db: 'kids_auth',
  //     pass: userConfig.sequelize.password,
  //     char: 'utf8mb4',
  //   },
  // };
  config.redis = {
    client: {
      port: 6379, // Redis port
      host: '127.0.0.1', // Redis host
      password: 'redis5566',
      db: 0,
    },
  };
  return {
    ...config,
    // ...userConfig,
  };
};

