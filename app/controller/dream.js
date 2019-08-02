'use strict';

const Controller = require('egg').Controller;

class DreamController extends Controller {

  async helpDream() {
    const ctx = this.ctx;
    let userInfo;
    if (ctx.state.$wxInfo.loginState === 1) {
      // loginState 为 1，登录态校验成功
      userInfo = ctx.state.$wxInfo.userinfo;
    } else {
      ctx.state.code = -1;
      return;
    }
    const rules = {
      video_id: { type: 'int' },
    };
    const errors = this.app.validator.validate(rules, ctx.request.body);
    if (errors) {
      ctx.body = errors;
      ctx.status = 422;
      return;
    }
    const { video_id } = ctx.request.body;
    const video = await ctx.model.Video.findByPk(video_id);
    if (!video) {
      ctx.body = `video id:${video_id} not exist`;
      ctx.status = 400;
      return;
    }
    // 创建一条，发给作者的消息
    const msg = await ctx.service.message.helpDream(video, userInfo);
    if (!msg) {
      ctx.status = 500;
      ctx.body = 'send helpDream msg fail';
      return;
    }
    ctx.state.data = 'operated';
  }

}

module.exports = DreamController;
