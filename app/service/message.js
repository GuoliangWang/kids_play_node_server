'use strict';

const Service = require('egg').Service;
const iconst = require('../const');
function toInt(str) {
  if (typeof str === 'number') return str;
  if (!str) return str;
  return parseInt(str, 10) || 0;
}

class MessageService extends Service {
  // 默认不需要提供构造函数。
  // constructor(ctx) {
  //   super(ctx); 如果需要在构造函数做一些处理，一定要有这句话，才能保证后面 `this.ctx`的使用。
  //   // 就可以直接通过 this.ctx 获取 ctx 了
  //   // 还可以直接通过 this.app 获取 app 了
  // }
  async videoApplyMsgListFor(videoId, userInfo, beforeMsgId) {
    if (!beforeMsgId) {
      beforeMsgId = Number.MAX_SAFE_INTEGER;
    } else {
      beforeMsgId = toInt(beforeMsgId);
    }
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    const msgQuery = {
      where: {
        [Op.or]: [
          {
            to_userid: {
              [Op.eq]: userInfo.openId,
            },
          },
          {
            from_userid: {
              [Op.eq]: userInfo.openId,
            },
          },
        ],
        ref_id: {
          [Op.eq]: videoId,
        },
        type: {
          [Op.in]: [ iconst.msgType.applyWatchVideo, iconst.msgType.applyWatchVideoApproved, iconst.msgType.applyWatchVideoRejected ],
        },
        status: {
          [Op.ne]: iconst.msgStatus.normal,
        },
        id: {
          [Op.lt]: beforeMsgId,
        },
      },
      order: [
        [ 'id', 'ASC' ],
      ],
      limit: 20,
    };
    const msgList = await this.app.model.Message.findAll(msgQuery);
    let openIdList = [];
    msgList.forEach(item => {
      openIdList.push(item.from_userid);
      openIdList.push(item.to_userid);
    });
    const openIdSet = new Set(openIdList);
    openIdList = Array.from(openIdSet);
    const users = await this.app.wafer.AuthDbService.getUsersByOpenIdList(openIdList);
    return { msgList, users };
  }

  async applyShowVideo(video) {
    const ctx = this.ctx;
    const adminOpenId = await ctx.service.user.virtualAdminOpenId();
    const msg = await ctx.model.Message.create({ from_userid: video.create_userid, to_userid: adminOpenId, type: iconst.msgType.applyShowVideo, is_del: 0, content: JSON.stringify({}), ref_id: video.id, status: iconst.msgStatus.waitingOpt });
    return msg;
  }

  async approveShowVideo(applyMsg, video, approved) {
    const ctx = this.ctx;
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    const adminOpenId = await this.ctx.service.user.virtualAdminOpenId();
    const fromMsgStatus = approved ? iconst.msgStatus.approved : iconst.msgStatus.rejected;
    const updateResult = await ctx.model.Message.update({ status: fromMsgStatus }, {
      where: {
        id: {
          [Op.eq]: applyMsg.id,
        },
      },
    });
    if (updateResult[0] === 0) {
      return { success: false, message: 'did not update applyMsg status' };
    }
    const msgType = approved ? iconst.msgType.applyShowVideoApproved : iconst.msgType.applyShowVideoRejected;
    const msg = await ctx.model.Message.create({ from_userid: adminOpenId, to_userid: video.create_userid, type: msgType, is_del: 0, content: JSON.stringify({ apply_msg_id: applyMsg.id }), ref_id: video.id, status: iconst.msgStatus.normal });
    if (!msg) {
      return { success: false, message: 'did not create notify msg' };
    }
    return { success: true };
  }

  async applyShowMsgList(beforeMsgId) {
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    if (!beforeMsgId) {
      beforeMsgId = Number.MAX_SAFE_INTEGER;
    }
    beforeMsgId = parseInt(beforeMsgId);
    const msgQuery = {
      where: {
        id: {
          [Op.lt]: beforeMsgId,
        },
        type: {
          [Op.eq]: iconst.msgType.applyShowVideo,
        },
      },
      order: [
        [ 'id', 'DESC' ],
      ],
      limit: 20,
    };
    const msgList = await this.app.model.Message.findAll(msgQuery);
    return msgList;
  }

  async approveWatchVideo(msg, userInfo, approved) {
    const ctx = this.ctx;
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    const fromMsgStatus = approved ? iconst.msgStatus.approved : iconst.msgStatus.rejected;
    const updateMsgResult = await ctx.model.Message.update(
      { status: fromMsgStatus },
      {
        where: {
          id: {
            [Op.eq]: msg.id,
          },
        },
      }
    );
    console.log('updateMsgResult:', updateMsgResult);
    if (updateMsgResult[0] === 0) {
      return { success: false, message: 'did not update applyMsg status' };
    }
    const msgType = approved ? iconst.msgType.applyWatchVideoApproved : iconst.msgType.applyWatchVideoRejected;
    const operatedMsg = await ctx.model.Message.create({ from_userid: userInfo.openId, to_userid: msg.from_userid, type: msgType, is_del: 0, content: JSON.stringify({ from_msg_id: msg.id }), ref_id: msg.ref_id, status: iconst.msgStatus.normal });
    if (!operatedMsg) {
      return { success: false, message: 'did not create notify msg' };
    }
    return { success: true };
  }

  async adminDeleteShowVideo(applyMsg, video) {
    const ctx = this.ctx;
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    const adminOpenId = await this.ctx.service.user.virtualAdminOpenId();
    const fromMsgStatus = iconst.msgStatus.deleted;
    const updateResult = await ctx.model.Message.update({ status: fromMsgStatus }, {
      where: {
        id: {
          [Op.eq]: applyMsg.id,
        },
      },
    });
    if (updateResult[0] === 0) {
      return { success: false, message: 'did not update applyMsg status' };
    }
    const msgType = iconst.msgType.applyShowVideoDeleted;
    const msg = await ctx.model.Message.create({ from_userid: adminOpenId, to_userid: video.create_userid, type: msgType, is_del: 0, content: JSON.stringify({ apply_msg_id: applyMsg.id }), ref_id: video.id, status: iconst.msgStatus.normal });
    if (!msg) {
      return { success: false, message: 'did not create notify msg' };
    }
    return { success: true };
  }

  async receivedList(beforeMsgId, userInfo) {
    const Sequelize = this.app.Sequelize;
    const Op = Sequelize.Op;
    if (!beforeMsgId) {
      beforeMsgId = Number.MAX_SAFE_INTEGER;
    }
    beforeMsgId = parseInt(beforeMsgId);
    const msgQuery = {
      where: {
        id: {
          [Op.lt]: beforeMsgId,
        },
        type: {
          [Op.in]: [ iconst.msgType.applyShowVideoApproved,
            iconst.msgType.applyShowVideoRejected,
            iconst.msgType.applyWatchVideo,
            iconst.msgType.applyWatchVideoApproved,
            iconst.msgType.applyWatchVideoRejected,
            iconst.msgType.applyShowVideoDeleted,
            iconst.msgType.helpDream,
            iconst.msgType.replyHelpDream,
          ],

        },
        to_userid: {
          [Op.eq]: userInfo.openId,
        },
      },
      order: [
        [ 'id', 'DESC' ],
      ],
      limit: 20,
    };
    const msgList = await this.app.model.Message.findAll(msgQuery);
    return msgList;
  }

  async helpDream(video, userInfo) {
    const ctx = this.ctx;
    const msg = await ctx.model.Message.create({ from_userid: userInfo.openId, to_userid: video.create_userid, type: iconst.msgType.helpDream, is_del: 0, content: JSON.stringify({}), ref_id: video.id, status: iconst.msgStatus.normal });
    return msg;
  }

  async replyHelpDream(msg, content) {
    const ctx = this.ctx;
    const replyMsg = await ctx.model.Message.create({ from_userid: msg.to_userid, to_userid: msg.from_userid, type: iconst.msgType.replyHelpDream, is_del: 0, content: JSON.stringify({content}), ref_id: msg.ref_id, status: iconst.msgStatus.normal });
    return replyMsg;
  }

}
module.exports = MessageService;
