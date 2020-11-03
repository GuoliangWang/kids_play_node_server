'use strict';

const Controller = require('egg').Controller;
const iconst = require('../const');

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    let { before_video_id: beforeVideoId } = ctx.query;
    beforeVideoId && (beforeVideoId = parseInt(beforeVideoId));
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
    ctx.state.data = { video_list: respList, users, min_video_id };
  }

}

module.exports = HomeController;
