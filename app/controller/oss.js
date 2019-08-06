'use strict';

// app/controller/users.js
const Controller = require('egg').Controller;
const { STS } = require('ali-oss');
// const fs = require('fs');
// const path = require('path');
const crypto = require('crypto');
const moment = require('moment');
const uuidGenerator = require('uuid/v4');

class AliOssController extends Controller {
  async sts() {
    const ctx = this.ctx;
    let userInfo;
    if (ctx.state.$wxInfo.loginState === 1) {
      // loginState 为 1，登录态校验成功
      userInfo = ctx.state.$wxInfo.userinfo;
    } else {
      ctx.state.code = -1;
      return;
    }
    const suffix = ctx.query.suffix || '';
    const openId = userInfo.openId;
    const userOssFilePathPre = 'kids_users/' + openId + '/' + moment().format('YYYYMMDD') + '/';
    const uuid = uuidGenerator();
    const conf = this.app.config.aliOss;
    console.log(conf);
    const policy = JSON.stringify(conf.AllPolicy);
    // if (conf.PolicyFile) {
    //   policy = fs.readFileSync(path.resolve(__dirname, conf.PolicyFile)).toString('utf-8');
    // }
    const client = new STS({
      accessKeyId: conf.AccessKeyId,
      accessKeySecret: conf.AccessKeySecret,
    });
    await client.assumeRole(conf.RoleArn, policy, conf.TokenExpireTime).then(result => {
      const expiration = new Date(Date.now() + 60 * 1000); // 60秒后过期, 一个请求上传一个文件
      const resPolicyText = {
        expiration: expiration.toISOString(), // 设置该Policy的失效时间，超过这个失效时间之后，就没有办法通过这个policy上传文件了
        conditions: [
          [ 'content-length-range', 0, 1048576000 ], // 设置上传文件的大小限制
          [ 'starts-with', '$key', userOssFilePathPre ],
        ],
      };
      const resPolicyBase64 = new Buffer(JSON.stringify(resPolicyText)).toString('base64');
      const signature = crypto.createHmac('sha1', result.credentials.AccessKeySecret).update(resPolicyBase64).digest('base64');
      console.log('assumeRole result:', result);
      // res.set('Access-Control-Allow-Origin', '*');
      // res.set('Access-Control-Allow-METHOD', 'GET');
      const res = {
        AccessKeyId: result.credentials.AccessKeyId,
        // AccessKeySecret: result.credentials.AccessKeySecret,
        signature,
        policy: resPolicyBase64,
        SecurityToken: result.credentials.SecurityToken,
        Expiration: result.credentials.Expiration,
        // cdnHost: 'https://www.narniaclub.com',
        cdnHost: 'https://kidsmedia.qutou88.com',
        uploadHost: 'https://narnia-app.oss-cn-beijing.aliyuncs.com',
        ossFilePath: userOssFilePathPre + uuid + suffix,
      };
      ctx.state.data = res;
    }).catch(err => {
      console.log(err);
      ctx.status = 400;
      ctx.body = err.message;
    });
  }

}

module.exports = AliOssController;
