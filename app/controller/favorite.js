'use strict';

// app/controller/users.js
const Controller = require('egg').Controller;
const iconst = require('../const');
// const debug = require('debug')('FavoriteController');
// const OSSClient = require('ali-oss');
// const crypto = require('crypto');
// const moment = require('moment');

function toInt(str) {
  if (typeof str === 'number') return str;
  if (!str) return str;
  return parseInt(str, 10) || 0;
}

class FavoriteController extends Controller {
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
    let before_favorite_id = toInt(ctx.query.before_favorite_id);
    if (!before_favorite_id) {
      before_favorite_id = Number.MAX_SAFE_INTEGER;
    }
    const query = {
      where: {
        userid: {
          [Op.eq]: userInfo.openId,
        },
        is_del: {
          [Op.eq]: 0,
        },
        id: {
          [Op.lt]: before_favorite_id,
        },
      },
      order: [
        [ 'id', 'DESC' ],
      ],
      limit: 20,
    };
    const list = await ctx.model.Favorite.findAll(query);
    const queryMinId = {
      where: {
        userid: {
          [Op.eq]: userInfo.openId,
        },
        is_del: {
          [Op.eq]: 0,
        },
      },
    };
    const min_favoriate_id = await ctx.model.Favorite.min('id', queryMinId);
    const videoIdList = [];
    list.forEach(item => {
      if (item.type === iconst.favoriteType.video) {
        videoIdList.push(item.target_id);
      }
    });
    const queryVideos = {
      where: {
        id: {
          [Op.in]: videoIdList,
        },
        is_del: {
          [Op.eq]: 0,
        },
      },
    };
    const videos = await ctx.model.Video.findAll(queryVideos);
    const { respList, users } = await ctx.service.video.setReferenceForVideos(videos, userInfo);
    ctx.state.data = { list, min_favoriate_id, videos: respList, users };
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
      type: { type: 'int' },
      target_id: { type: 'int' },
    };
    console.log('ctx.body:', ctx.request.body);
    const errors = this.app.validator.validate(rules, ctx.request.body);
    if (errors) {
      ctx.body = errors;
      ctx.status = 422;
      return;
    }
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    const { type, target_id } = ctx.request.body;
    // created_at updated_at 看看是否有默认值
    const userid = userInfo.openId;
    let favorite = await ctx.model.Favorite.findOne({
      where: {
        userid: {
          [Op.eq]: userid,
        },
        type: {
          [Op.eq]: type,
        },
        target_id: {
          [Op.eq]: target_id,
        },
      },
    });
    if (!favorite) {
      favorite = { type, userid, target_id, is_del: 0 };
    } else {
      favorite = favorite.toJSON();
      favorite.is_del = 0;
    }
    const result = await ctx.model.Favorite.upsert(favorite);
    if (result) {
      ctx.state.data = 'created';
    } else {
      ctx.state.data = 'unpadted';
    }
  }

  async delete() {
    const ctx = this.ctx;
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    let userInfo;
    if (ctx.state.$wxInfo.loginState === 1) {
      // loginState 为 1，登录态校验成功
      userInfo = ctx.state.$wxInfo.userinfo;
    } else {
      ctx.state.code = -1;
      return;
    }
    const rulesId = {
      favorite_id: { type: 'int' },
    };
    let errors = this.app.validator.validate(rulesId, ctx.request.body);
    if (errors) {
      const rulesTypeTarget = {
        type: { type: 'int' },
        target_id: { type: 'int' },
      };
      errors = this.app.validator.validate(rulesTypeTarget, ctx.request.body);
    }
    if (errors) {
      ctx.body = errors;
      ctx.status = 422;
      return;
    }
    const { type, target_id, favorite_id } = ctx.request.body;
    let query;
    if (favorite_id) {
      query = {
        where: {
          id: {
            [Op.eq]: favorite_id,
          },
        },
      };
    } else {
      query = {
        where: {
          userid: {
            [Op.eq]: userInfo.openId,
          },
          type: {
            [Op.eq]: type,
          },
          target_id: {
            [Op.eq]: target_id,
          },
        },
      };
    }
    const favorite = await ctx.model.Favorite.findOne(query);
    if (!favorite) {
      ctx.status = 400;
      ctx.body = `favoriteid: ${favorite_id} type: ${type} and target_id: ${target_id} not exist`;
      return;
    }
    if (favorite.is_del) {
      ctx.status = 400;
      ctx.body = 'favorite is deleted';
      return;
    }
    if (favorite.userid !== userInfo.openId) {
      ctx.status = 400;
      ctx.body = 'you are not the favorate user';
      return;
    }
    const updateResult = await ctx.model.Favorite.update(
      { is_del: 1 },
      query
    );
    const updateCount = updateResult[0];
    if (updateCount !== 1) {
      ctx.status = 500;
      ctx.body = `Favorite.update number: ${updateCount}`;
      return;
    }
    ctx.state.data = 'operated';
  }
}

module.exports = FavoriteController;
