'use strict';

const Controller = require('egg').Controller;
const iconst = require('../const');

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    let { before_video_id: beforeVideoId } = ctx.query;
    beforeVideoId && (beforeMsgId = parseInt(beforeMsgId));
    beforeVideoId = beforeVideoId ? beforeVideoId : Number.MAX_SAFE_INTEGER;
    const query = {
      where: {
        id: {
          [Op.lt]: beforeVideoId,
        },
        status: {
          [Op.eq]: iconst.applyStatus.approved,
        },
        is_del: {
          [Op.eq]: 0,
        },
        privacy: {
          [Op.eq]: iconst.privacy.public,
        },
      },
      order: [
        [ 'id', 'DESC' ],
      ],
      limit: 20,
    };
    const video_list = await this.app.model.Video.findAll(query);
    const { respList, users } = await ctx.service.video.setReferenceForVideos(video_list, null);
    const queryMinId = {
      where: {
        status: {
          [Op.eq]: iconst.applyStatus.approved,
        },
        is_del: {
          [Op.eq]: 0,
        },
        privacy: {
          [Op.eq]: iconst.privacy.public,
        },
      },
    };
    const min_video_id = await ctx.model.Video.min('id', queryMinId);
    ctx.state.data = { video_list: respList, users, min_video_id};
  }

  async preparedVideosFor(list) {
    const ctx = this.ctx;
    const conf = this.app.config.aliOss;
    // await promiseForReadVideoSts(item)
    const respList = [];
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      let authorized = false;
      if (item.status !== iconst.applyStatus.approved) { // 未审核通过的,其他人无权观看
        authorized = false;
      } else if (item.privacy === iconst.privacy.public) { // 审核通过的公开资源都有权观看
        authorized = true;
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
      respList.push(Object.assign({ authorized }, item.toJSON()));
    }
    return respList;
  }

}

module.exports = HomeController;
