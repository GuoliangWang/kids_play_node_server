'use strict';

const applyStatus = {
  waitingApproval: 1, // 等待审核
  approved: 2, // 审核通过
  rejected: 3, // 审核未通过
};

const privacy = {
  public: 1, // 公开
  needApply: 2, // 需申请访问
  self: 3, // 需申请访问
};

const auth = {
  read: 1, // 允许查看
  apply: 2, // 正在申请
  rejected: 3, // 已拒绝
};

const favoriteType = {
  video: 1,
};

// 【1:上传视频】【2:视频审核通过】【3:视频审核未通过】【4:视频违规被删除】【5:申请观看】【6:同意观看】 【7:拒绝观看】【8:删除视频】【9:助梦】【10:回复助梦】 
const msgType = {
  applyShowVideo: 1,
  applyShowVideoApproved: 2,
  applyShowVideoRejected: 3,
  // videoDeleted: 4,
  applyWatchVideo: 5,
  applyWatchVideoApproved: 6,
  applyWatchVideoRejected: 7,
  applyShowVideoDeleted: 8,
  helpDream: 9,
  replyHelpDream: 10,
};

const msgStatus = {
  waitingOpt: 1, // 等待处理
  operated: 2, // 已处理
  normal: 3, // 不需要处理
  approved: 4, // 已同意
  rejected: 5, // 已拒绝
  deleted: 6, // 已删除
};

const redisKey = {
  stsVideoUrlPre: 'kids:sts:video:url:',
  stsVideoCoverPre: 'kids:sts:video:cover:',
};

const popularVideoStatus = {
  on: 1,
  off: 2,
};

module.exports = {
  applyStatus,
  privacy,
  auth,
  favoriteType,
  msgType,
  msgStatus,
  redisKey,
  popularVideoStatus,
};
