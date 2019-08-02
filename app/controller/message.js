'use strict';

// app/controller/users.js
const Controller = require('egg').Controller;
const iconst = require('../const');
// const debug = require('debug')('MessageController');
// const OSSClient = require('ali-oss');
// const crypto = require('crypto');
// const moment = require('moment');

function toInt(str) {
  if (typeof str === 'number') return str;
  if (!str) return str;
  return parseInt(str, 10) || 0;
}

class MessageController extends Controller {

  async applyShowVideoMsgList() {
    const ctx = this.ctx;
    let userInfo;
    if (ctx.state.$wxInfo.loginState === 1) {
      // loginState 为 1，登录态校验成功
      userInfo = ctx.state.$wxInfo.userinfo;
    } else {
      ctx.state.code = -1;
      return;
    }
    const isAdmin = await ctx.service.user.isAdmin();
    if (!isAdmin) {
      ctx.state.data = { list: [], users: [], videos: [] };
      return;
    }
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    const msgList = await ctx.service.message.applyShowMsgList(ctx.query.before_msg_id);
    let openIdList = [];
    let videoIdList = [];
    msgList.forEach(item => {
      openIdList.push(item.from_userid);
      openIdList.push(item.to_userid);
      videoIdList.push(item.ref_id);
    });
    const openIdSet = new Set(openIdList);
    openIdList = Array.from(openIdSet);
    const users = await this.app.wafer.AuthDbService.getUsersByOpenIdList(openIdList);
    const videoIdSet = new Set(videoIdList);
    videoIdList = Array.from(videoIdSet);
    const videoQuery = {
      where: {
        id: {
          [Op.in]: videoIdList,
        },
      },
    };
    let videos = await ctx.model.Video.findAll(videoQuery);
    videos = await this.preparedVideosFor(videos, userInfo, true);
    ctx.state.data = { list: msgList, users, videos };
  }

  async preparedVideosFor(list, userInfo, isAdmin) {
    const ctx = this.ctx;
    const conf = this.app.config.aliOss;
    // await promiseForReadVideoSts(item)
    const respList = [];
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      let authorized = false;
      let auth = 0;
      if (isAdmin) {
        authorized = true;
      } else if (item.create_userid === userInfo.openId) { // 作者本人有权
        authorized = true;
      } else if (item.status !== iconst.applyStatus.approved) { // 未审核通过的,其他人无权观看
        authorized = false;
      } else if (item.privacy === iconst.privacy.public) { // 审核通过的公开资源都有权观看
        authorized = true;
      } else { // 作者允许观看的，才可观看
        const authrity = await ctx.model.VideoAuthrity.findOne({ where: { video_id: item.id } });
        if (authrity && authrity.auth === iconst.auth.read) {
          authorized = true;
          auth = authrity.auth;
        }
      }
      authorized = authorized ? 1 : 0;
      if (authorized) {
        const urlKey = iconst.redisKey.stsVideoUrlPre + item.id;
        const coverKey = iconst.redisKey.stsVideoCoverPre + item.id;
        let redisUrl = await this.app.redis.get(urlKey);
        let redisCover = await this.app.redis.get(coverKey);
        if (!redisUrl) {
          const stsRes = await ctx.service.video.promiseForReadVideoSts(item);
          if (stsRes) {
            redisUrl = stsRes.videoUrl;
            redisCover = stsRes.coverUrl;
            await this.app.redis.set(urlKey, redisUrl);
            await this.app.redis.expire(urlKey, conf.TokenExpireTime / 2);
            await this.app.redis.set(coverKey, redisCover);
            await this.app.redis.expire(coverKey, conf.TokenExpireTime / 2);
          }
        }
        if (redisUrl) {
          item.url = redisUrl;
        }
        if (redisCover) {
          item.cover = redisCover;
        }
      }
      respList.push(Object.assign({ authorized, auth }, item.toJSON()));
    }
    return respList;
  }

  async applyWathVideoMsgList() {
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
    ctx.request.query.video_id = toInt(ctx.request.query.video_id);
    const errors = this.app.validator.validate(rules, ctx.request.query);
    if (errors) {
      ctx.body = errors;
      ctx.status = 422;
      return;
    }
    const { video_id, before_msg_id } = ctx.request.query;
    const { msgList, users: msgUsers } = await ctx.service.message.videoApplyMsgListFor(video_id, userInfo, before_msg_id);
    ctx.state.data = { apply_msg_list: msgList, apply_msg_users: msgUsers };
  }

  async receivedList() {
    const ctx = this.ctx;
    let userInfo;
    if (ctx.state.$wxInfo.loginState === 1) {
      // loginState 为 1，登录态校验成功
      userInfo = ctx.state.$wxInfo.userinfo;
    } else {
      ctx.state.code = -1;
      return;
    }
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    const msgList = await ctx.service.message.receivedList(ctx.query.before_msg_id, userInfo);
    let openIdList = [];
    let videoIdList = [];
    msgList.forEach(item => {
      openIdList.push(item.from_userid);
      openIdList.push(item.to_userid);
      videoIdList.push(item.ref_id);
    });
    const openIdSet = new Set(openIdList);
    openIdList = Array.from(openIdSet);
    const users = await this.app.wafer.AuthDbService.getUsersByOpenIdList(openIdList);
    const videoIdSet = new Set(videoIdList);
    videoIdList = Array.from(videoIdSet);
    const videoQuery = {
      where: {
        id: {
          [Op.in]: videoIdList,
        },
      },
    };
    let videos = await ctx.model.Video.findAll(videoQuery);
    videos = await this.preparedVideosFor(videos, userInfo, true);
    ctx.state.data = { list: msgList, users, videos };
  }

  async replyHelpDream() {
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
      msg_id: { type: 'int' },
      content: { type: 'string'}
    };
    console.log('ctx.body:', ctx.request.body);
    const errors = this.app.validator.validate(rules, ctx.request.body);
    if (errors) {
      ctx.body = errors;
      ctx.status = 422;
      return;
    }
    const { msg_id, content } = ctx.request.body;
    const Op = this.app.Sequelize.Op;
    const query = {
      where: {
        id: {
          [Op.eq]: msg_id,
        },
      },
    };
    const msg = await ctx.model.Message.findOne(query);
    if(!msg) {
      ctx.status = 400;
      ctx.body = `msg_id[${msg_id}] not found`;
      return
    }
    // 创建一条，发给作者的消息
    const newMsg = await ctx.service.message.replyHelpDream(msg, content);
    if (!newMsg) {
      ctx.status = 500;
      ctx.body = 'send reply helpDream msg fail';
      return;
    }
    ctx.state.data = 'operated';
    
  }

}

module.exports = MessageController;
