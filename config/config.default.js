/* eslint valid-jsdoc: "off" */

'use strict';
const env = process.env;
console.log('default');
/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1550668734085_1152';

  // add your middleware config here
  config.middleware = [ 'response', 'weixinbodyparser' ];

  // add your user config here
  const userConfig = {
    myAppName: 'kids_node_server',
    sequelize: {
      username: 'root',
      password: env.MySQL_PASSWORD,
      dialect: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      database: 'kids_app',
    },
  };
  userConfig.weixin = {
    // 微信小程序 App ID
    appId: env.WEI_XIN_KIDS_APP_ID,
    // 微信小程序 App Secret
    appSecret: env.WEI_XIN_KIDS_APP_SECRET,
    // 是否使用腾讯云代理登录小程序
    useQcloudLogin: false,
    /**
     * MySQL 配置，用来存储 session 和用户信息
    */
    mysql: {
      host: userConfig.sequelize.host,
      port: userConfig.sequelize.port,
      user: userConfig.sequelize.username,
      db: 'kids_auth',
      pass: userConfig.sequelize.password,
      char: 'utf8mb4',
    },
    // 微信登录态有效期
    wxLoginExpires: 7200,
  };
  userConfig.aliOss = {
    AccessKeyId: env.ALI_SDK_STS_ID,
    AccessKeySecret: env.ALI_SDK_STS_SECRET,
    RoleArn: env.ALI_SDK_STS_ROLE,
    // 建议 Token 失效时间为 1 小时
    TokenExpireTime: '3600',
    AllPolicy: {
      Statement: [
        {
          Action: [
            'oss:*',
          ],
          Effect: 'Allow',
          Resource: [ 'acs:oss:*:*:*' ],
        },
      ],
      Version: '1',
    },
    bucketReadPolicy: {
      Statement: [
        {
          Action: [
            'oss:GetObject',
            'oss:ListObjects',
          ],
          Effect: 'Allow',
          Resource: [ 'acs:oss:*:*:narnia-app/*', 'acs:oss:*:*:narnia-app' ],
        },
      ],
      Version: '1',
    },
    bucketReadWritePolicy: {
      Statement: [
        {
          Action: [
            'oss:GetObject',
            'oss:PutObject',
            'oss:DeleteObject',
            'oss:ListParts',
            'oss:AbortMultipartUpload',
            'oss:ListObjects',
          ],
          Effect: 'Allow',
          Resource: [ 'acs:oss:*:*:narnia-app/*', 'acs:oss:*:*:narnia-app' ],
        },
      ],
      Version: '1',
    },
  };
  config.security = {
    csrf: {
      enable: false,
    },
  };
  config.validate = {
    // convert: false,
    // validateRoot: false,
  };
  config.logger = {
    disableConsoleAfterReady: false,
  };
  return {
    ...config,
    ...userConfig,
  };
};

