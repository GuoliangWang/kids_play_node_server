'use strict';

// app/controller/users.js
const Controller = require('egg').Controller;
const iconst = require('../const');
// const debug = require('debug')('VideoController');
// const OSSClient = require('ali-oss');
// const crypto = require('crypto');
// const moment = require('moment');

function toInt(str) {
  if (typeof str === 'number') return str;
  if (!str) return str;
  return parseInt(str, 10) || 0;
}

class VideoController extends Controller {
  async list() {
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
    let before_video_id = toInt(ctx.query.before_video_id);
    if (!before_video_id) {
      before_video_id = Number.MAX_SAFE_INTEGER;
    }
    const query = {
      where: {
        [Op.or]: [
          {
            create_userid: {
              [Op.eq]: userInfo.openId,
            },
          },
          {
            status: {
              [Op.eq]: iconst.applyStatus.approved,
            },
          },
        ],
        id: {
          [Op.lt]: before_video_id,
        },
        is_del: {
          [Op.eq]: 0,
        },
      },
      order: [
        [ 'id', 'DESC' ],
      ],
      limit: 20,
    };
    const list = await ctx.model.Video.findAll(query);
    const queryMinId = {
      where: {
        is_del: {
          [Op.eq]: 0,
        },
      },
    };
    const min_video_id = await ctx.model.Video.min('id', queryMinId);
    const { respList, users } = await this.setReferenceForVideos(list, userInfo);
    ctx.state.data = { list: respList, min_video_id, users };
  }

  async save() {
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
      url: { type: 'string' },
      cover: { type: 'string' },
      privacy: { type: 'int' },
      duration: { type: 'number' },
    };
    console.log('ctx.body:', ctx.request.body);
    const errors = this.app.validator.validate(rules, ctx.request.body);
    if (errors) {
      ctx.body = errors;
      ctx.status = 422;
      return;
    }
    const { title, url, cover, privacy, width, height, size, duration, dream } = ctx.request.body;
    // created_at updated_at 看看是否有默认值
    const create_userid = userInfo.openId;
    const status = iconst.applyStatus.waitingApproval;
    const is_del = 0;
    const video = await ctx.model.Video.create({ title, url, cover, privacy, width, height, size, duration, dream, create_userid, status, is_del });
    const msg = await ctx.service.message.applyShowVideo(video);
    if (!msg) {
      ctx.status = 500;
      ctx.body = 'send apply msg fail';
      return;
    }
    ctx.status = 201;
    ctx.body = video;
  }

  async info() {
    const ctx = this.ctx;
    ctx.query.id = toInt(ctx.query.id);
    const errors = this.app.validator.validate({ id: { type: 'int' } }, ctx.query);
    if (errors) {
      ctx.body = errors;
      ctx.status = 422;
      return;
    }
    const videoId = ctx.query.id;
    const userId = ctx.query.user_id;
    let userInfo 
    userId && (userInfo = await this.app.wafer.AuthDbService.getUserInfoByOpenId(userId))
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    const query = {
      where: {
        id: {
          [Op.eq]: videoId,
        },
      },
    };
    const list = await ctx.model.Video.findAll(query);
    if (list.length === 0) {
      ctx.body = 'video not found';
      ctx.status = 404;
      return;
    }
    const { respList, users } = await ctx.service.video.setReferenceForVideos(list, userInfo);
    if (users.length === 0) {
      ctx.body = 'video creater not found';
      ctx.status = 404;
      return;
    }
    const videoInfo = respList[0];
    let isFavorite = false;
    if (userInfo) {
      const favoriteQuery = {
        where: {
          userid: {
            [Op.eq]: userInfo.openId,
          },
          type: {
            [Op.eq]: iconst.favoriteType.video,
          },
          target_id: {
            [Op.eq]: videoInfo.id,
          },
          is_del: {
            [Op.eq]: 0,
          },
        },
      };
      const favoriteList = await this.app.model.Favorite.findAll(favoriteQuery);
      isFavorite = favoriteList.length > 0 ? 1 : 0;
    }
    const createUserInfo = JSON.parse(users[0].user_info);

    ctx.state.data = { video_info: videoInfo, user_info: userInfo, create_user_info: createUserInfo, is_favorite: isFavorite };
    console.log('ctx.state.data,', ctx.state.data);
  }

  async update() {
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
      id: { type: 'int' },
    };
    const errors = this.app.validator.validate(rules, ctx.request.body);
    if (errors) {
      ctx.body = errors;
      ctx.status = 422;
      return;
    }
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    const { id, privacy } = ctx.request.body;
    const video = await ctx.model.Video.findByPk(id);
    if (!video) {
      ctx.body = `video id:${id} not exist`;
      ctx.status = 400;
      return;
    }
    if (video.create_userid !== userInfo.openId) {
      ctx.body = 'you are not creater';
      ctx.status = 400;
      return;
    }
    const values = {};
    if (privacy) {
      values.privacy = privacy;
    }
    const updateResult = await ctx.model.Video.update(
      values,
      {
        where: {
          id: {
            [Op.eq]: id,
          },
        },
      });
    if (updateResult[0] === 0) {
      ctx.body = 'did not update anything';
      ctx.status = 400;
      return;
    }
    ctx.state.data = 'operated';
  }

  async delete() {
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
      id: { type: 'int' },
    };
    const errors = this.app.validator.validate(rules, ctx.request.body);
    if (errors) {
      ctx.body = errors;
      ctx.status = 422;
      return;
    }
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    const { id } = ctx.request.body;
    const video = await ctx.model.Video.findByPk(id);
    if (!video) {
      ctx.body = `video id:${id} not exist`;
      ctx.status = 400;
      return;
    }
    if (video.create_userid !== userInfo.openId) {
      ctx.body = 'you are not creater';
      ctx.status = 400;
      return;
    }
    const values = { is_del: 1 };
    const updateResult = await ctx.model.Video.update(
      values,
      {
        where: {
          id: {
            [Op.eq]: id,
          },
        },
      });
    if (updateResult[0] === 0) {
      ctx.body = 'did not update anything';
      ctx.status = 400;
      return;
    }
    ctx.state.data = 'operated';
  }
  async approveShow() {
    const ctx = this.ctx;
    // let userInfo;
    if (ctx.state.$wxInfo.loginState === 1) {
      // loginState 为 1，登录态校验成功
      // userInfo = ctx.state.$wxInfo.userinfo;
    } else {
      ctx.state.code = -1;
      return;
    }
    const isAdmin = await ctx.service.user.isAdmin();
    if (!isAdmin) {
      ctx.body = 'you are not admin';
      ctx.status = 400;
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
    const video = await ctx.model.Video.findOne({
      where: {
        id: {
          [Op.eq]: msg.ref_id,
        },
      },
    });
    if (!video) {
      ctx.status = 400;
      ctx.body = `video id [${msg.ref_id}] not exist`;
      return;
    }
    let status;
    if (approved) {
      if (video.status === iconst.applyStatus.approved) {
        ctx.status = 400;
        ctx.body = `video id [${msg.ref_id}] have been approved `;
        return;
      }
      status = iconst.applyStatus.approved;
    } else {
      if (video.status === iconst.applyStatus.rejected) {
        ctx.status = 400;
        ctx.body = `video id [${msg.ref_id}] have been rejected `;
        return;
      }
      status = iconst.applyStatus.rejected;
    }
    console.log('change status:', status);
    const updateResult = await ctx.model.Video.update(
      { status },
      {
        where: {
          id: {
            [Op.eq]: video.id,
          },
        },
      }
    );
    const updateCount = updateResult[0];
    if (updateCount !== 1) {
      ctx.status = 500;
      ctx.body = `Video.update number: ${updateCount}`;
      return;
    }
    const sendMsgResult = await ctx.service.message.approveShowVideo(msg, video, approved);
    if (!sendMsgResult.success) {
      ctx.status = 500;
      ctx.body = sendMsgResult.message;
      return;
    }
    ctx.state.data = 'operated';
  }

  async adminDelete() {
    const ctx = this.ctx;
    // let userInfo;
    if (ctx.state.$wxInfo.loginState === 1) {
      // loginState 为 1，登录态校验成功
      // userInfo = ctx.state.$wxInfo.userinfo;
    } else {
      ctx.state.code = -1;
      return;
    }
    const isAdmin = await ctx.service.user.isAdmin();
    if (!isAdmin) {
      ctx.body = 'you are not admin';
      ctx.status = 400;
      return;
    }
    const rules = {
      message_id: { type: 'int' },
    };
    console.log('ctx.body:', ctx.request.body);
    const errors = this.app.validator.validate(rules, ctx.request.body);
    if (errors) {
      ctx.body = errors;
      ctx.status = 422;
      return;
    }
    const Op = this.app.Sequelize.Op;
    const { message_id } = ctx.request.body;
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
    const video = await ctx.model.Video.findOne({
      where: {
        id: {
          [Op.eq]: msg.ref_id,
        },
      },
    });
    if (!video) {
      ctx.status = 400;
      ctx.body = `video id [${msg.ref_id}] not exist`;
      return;
    }
    const updateResult = await ctx.model.Video.update(
      { is_del: 1 },
      {
        where: {
          id: {
            [Op.eq]: video.id,
          },
        },
      }
    );
    const updateCount = updateResult[0];
    if (updateCount !== 1) {
      ctx.status = 500;
      ctx.body = `Video.update number: ${updateCount}`;
      return;
    }
    const sendMsgResult = await ctx.service.message.adminDeleteShowVideo(msg, video);
    if (!sendMsgResult.success) {
      ctx.status = 500;
      ctx.body = sendMsgResult.message;
      return;
    }
    ctx.state.data = 'operated';
  }

  async uploadedList() {
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
    let before_video_id = toInt(ctx.query.before_video_id);
    if (!before_video_id) {
      before_video_id = Number.MAX_SAFE_INTEGER;
    }
    const query = {
      where: {
        create_userid: {
          [Op.eq]: userInfo.openId,
        },
        id: {
          [Op.lt]: before_video_id,
        },
        is_del: {
          [Op.eq]: 0,
        },
      },
      order: [
        [ 'id', 'DESC' ],
      ],
      limit: 20,
    };
    const list = await ctx.model.Video.findAll(query);
    const queryMinId = {
      where: {
        create_userid: {
          [Op.eq]: userInfo.openId,
        },
        is_del: {
          [Op.eq]: 0,
        },
      },
    };
    const min_video_id = await ctx.model.Video.min('id', queryMinId);
    const { respList, users } = await this.setReferenceForVideos(list, userInfo);
    ctx.state.data = { list: respList, min_video_id, users };
  }

  async asyncInfo() {
    const ctx = this.ctx;
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    const rules = {
      video_ids: { type: 'string' },
    };
    console.log('ctx.body:', ctx.request.body);
    const errors = this.app.validator.validate(rules, ctx.request.body);
    if (errors) {
      ctx.body = errors;
      ctx.status = 422;
      return;
    }
    const { video_ids, user_id } = ctx.request.body;
    let userInfo;
    user_id && (userInfo = await this.app.wafer.AuthDbService.getUserInfoByOpenId(user_id));
    const videoIdArray = video_ids.split(',');
    const resVideoIdArray = [];
    for(let i = 0; i < videoIdArray.length; i++) {
      let item = videoIdArray[i]
      const urlKey = iconst.redisKey.stsVideoUrlPre + item;
      let redisUrl = await this.app.redis.get(urlKey);
      if(!redisUrl) {
        resVideoIdArray.push(Number(item))
      }
    }
    const query = {
      where: {
        id: {
          [Op.in]: resVideoIdArray,
        }
      }
    }
    const list = await ctx.model.Video.findAll(query);
    const { respList } = await ctx.service.video.setReferenceForVideos(list, userInfo);
    ctx.state.data = { video_list: respList };
  }

}

module.exports = VideoController;
