'use strict';

const Service = require('egg').Service;
// const iconst = require('../const');
// const OSSClient = require('ali-oss');
// const crypto = require('crypto');
// const moment = require('moment');

// function toInt(str) {
//   if (typeof str === 'number') return str;
//   if (!str) return str;
//   return parseInt(str, 10) || 0;
// }

class UserService extends Service {

  async isAdmin() {
    const ctx = this.ctx;
    let userInfo;
    if (ctx.state && ctx.state.$wxInfo && ctx.state.$wxInfo.loginState === 1) {
      // loginState 为 1，登录态校验成功
      userInfo = ctx.state.$wxInfo.userinfo;
    } else {
      return false;
    }
    return (userInfo.openId === 'olD044-zqndfwKj0Q2V5EQgbx29A');
  }

  async virtualAdminOpenId() {
    return '0';
  }


}
module.exports = UserService;
