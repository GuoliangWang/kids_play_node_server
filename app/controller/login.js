'use strict';

// app/controller/users.js
const Controller = require('egg').Controller;

class LoginController extends Controller {
  async login() {
    const ctx = this.ctx;
    // console.log('fdsfs', ctx.state.$wxInfo)
    // 通过 Koa 中间件进行登录之后
    // 登录信息会被存储到 ctx.state.$wxInfo
    // 具体查看：
    if (ctx.state.$wxInfo.loginState) {
      ctx.state.data = ctx.state.$wxInfo.userinfo;
    }

  }
}

module.exports = LoginController;
