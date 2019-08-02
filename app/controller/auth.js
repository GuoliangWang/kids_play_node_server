'use strict';

// app/controller/users.js
const Controller = require('egg').Controller;
const iconst = require('../const');
// const debug = require('debug')('VideoController');
// const OSSClient = require('ali-oss');
// const crypto = require('crypto');
// const moment = require('moment');

// function toInt(str) {
//   if (typeof str === 'number') return str;
//   if (!str) return str;
//   return parseInt(str, 10) || 0;
// }

class AuthController extends Controller {

  async applyWatch() {
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
    console.log('ctx.body:', ctx.request.body);
    const errors = this.app.validator.validate(rules, ctx.request.body);
    if (errors) {
      ctx.body = errors;
      ctx.status = 422;
      return;
    }
    const { video_id } = ctx.request.body;
    const Op = this.app.Sequelize.Op;
    const query = {
      where: {
        id: {
          [Op.eq]: video_id,
        },
      },
    };
    const video = await ctx.model.Video.findOne(query);
    const from_userid = userInfo.openId;
    const to_userid = video.create_userid;
    const queryAuth = {
      where: {
        video_id: {
          [Op.eq]: video_id,
        },
        user_id: {
          [Op.eq]: userInfo.openId,
        },
        is_del: {
          [Op.eq]: 0,
        },
      },
    };
    let auth = await ctx.model.VideoAuthrity.findOne(queryAuth);
    if (auth) {
      ctx.status = 400;
      ctx.body = 'have applied watch this video';
      return;
    }
    auth = await ctx.model.VideoAuthrity.create({ video_id, user_id: userInfo.openId, auth: iconst.auth.apply, is_del: 0 });
    const contentObj = { reason: '我想看您的作品' };
    const msg = await ctx.model.Message.create({ from_userid, to_userid, type: iconst.msgType.applyWatchVideo, is_del: 0, content: JSON.stringify(contentObj), ref_id: video.id, status: iconst.msgStatus.waitingOpt });
    ctx.status = 201;
    ctx.body = { msg, auth };
  }

  async approveWatch() {
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
      message_id: { type: 'int' },
      approved: { type: 'int' },
    };
    console.log('ctx.body:', ctx.request.body);
    const errors = this.app.validator.validate(rules, ctx.request.body);
    if (errors) {
      ctx.body = errors;
      ctx.status = 422;
      return;
    }
    const Op = this.app.Sequelize.Op;
    const { message_id, approved } = ctx.request.body;
    const msg = await this.app.model.Message.findOne({
      where: {
        id: {
          [Op.eq]: message_id,
        },
      },
    });
    if (!msg) {
      ctx.status = 400;
      ctx.body = `msg id [${message_id}] not exist`;
      return;
    }
    if (msg.type !== iconst.msgType.applyWatchVideo) {
      ctx.status = 400;
      ctx.body = 'msg type is not applyWatchVideo';
      return;
    }
    if (userInfo.openId !== msg.to_userid) {
      ctx.status = 400;
      ctx.body = 'msg is not to you';
      return;
    }

    // const video = await ctx.model.Video.findOne({
    //   where: {
    //     id: {
    //       [Op.eq]: msg.ref_id
    //     }
    //   }
    // });
    // if (!video) {
    //   ctx.status = 400;
    //   ctx.body = `video id [${msg.ref_id}] not exist`
    //   return
    // }
    console.log(' msg.ref_id', msg.ref_id);
    console.log(' msg.from_userid', msg.from_userid);
    const auth = await ctx.model.VideoAuthrity.findOne({
      where: {
        video_id: {
          [Op.eq]: msg.ref_id,
        },
        user_id: {
          [Op.eq]: msg.from_userid,
        },
        auth: {
          [Op.eq]: iconst.auth.apply,
        },
        is_del: {
          [Op.eq]: 0,
        },
      },
    });
    if (!auth) {
      ctx.status = 400;
      ctx.body = 'video_authority table, apply info not exist';
      return;
    }
    // const newAuth = approved ? iconst.auth.read : iconst.auth.rejected;
    // const updateAuthResult = await ctx.model.VideoAuthrity.update(
    //   {
    //     auth: newAuth,
    //   },
    //   {
    //     where: {
    //       id: {
    //         [Op.eq]: auth.id,
    //       },
    //     },
    //   }
    // );
    const sendMsgResult = await ctx.service.message.approveWatchVideo(msg, userInfo, approved);
    if (!sendMsgResult.success) {
      ctx.status = 500;
      ctx.body = sendMsgResult.message;
      return;
    }
    ctx.status = 201;
    ctx.body = { msg, auth };
  }


}

module.exports = AuthController;
