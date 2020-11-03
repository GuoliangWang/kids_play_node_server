'use strict';

/**
 * @param {Egg.Application} app - egg application
 */

module.exports = app => {
  const waferInst = app.wafer;
  const { router, controller } = app;
  const basePath = '/app_kids';
  const get = (path, func) => {
    router.get(basePath + path, func);
  };
  // const post = (path, func) => {
  //   router.post(basePath + path, func);
  // };
  // const resources = (name, path, func) => {
  //   router.resources(name, basePath + path, func);
  // };
  // 登录接口 /app/login
  router.get(basePath + '/login', waferInst.auth.authorizationMiddleware, controller.login.login);
  // 用户信息接口（可以用来验证登录态） /app/user
  router.get(basePath + '/user/info', waferInst.auth.validationMiddleware, controller.users.info);
  router.get(basePath + '/oss/sts', waferInst.auth.validationMiddleware, controller.oss.sts);
  router.get(basePath + '/video/list', waferInst.auth.validationMiddleware, controller.video.list);
  router.post(basePath + '/video/save', waferInst.auth.validationMiddleware, controller.video.save);
  router.get(basePath + '/video/info', controller.video.info);
  router.post(basePath + '/video/update', waferInst.auth.validationMiddleware, controller.video.update);
  router.post(basePath + '/video/delete', waferInst.auth.validationMiddleware, controller.video.delete);
  router.get(basePath + '/video/uploaded_list', waferInst.auth.validationMiddleware, controller.video.uploadedList);
  router.post(basePath + '/video/async', controller.video.asyncInfo);

  router.get(basePath + '/favorite/list', waferInst.auth.validationMiddleware, controller.favorite.list);
  router.post(basePath + '/favorite/save', waferInst.auth.validationMiddleware, controller.favorite.save);
  router.post(basePath + '/favorite/delete', waferInst.auth.validationMiddleware, controller.favorite.delete);

  router.get(basePath + '/message/apply_show_video_msg_list', waferInst.auth.validationMiddleware, controller.message.applyShowVideoMsgList);
  router.get(basePath + '/message/apply_watch_video_msg_list', waferInst.auth.validationMiddleware, controller.message.applyWathVideoMsgList);
  router.get(basePath + '/message/received_list', waferInst.auth.validationMiddleware, controller.message.receivedList);
  router.post(basePath + '/message/reply_help_dream', waferInst.auth.validationMiddleware, controller.message.replyHelpDream);

  router.post(basePath + '/auth/apply_watch', waferInst.auth.validationMiddleware, controller.auth.applyWatch);
  router.post(basePath + '/auth/approve_watch', waferInst.auth.validationMiddleware, controller.auth.approveWatch);
  router.post(basePath + '/admin/video/approve_show', waferInst.auth.validationMiddleware, controller.video.approveShow);
  router.post(basePath + '/admin/video/delete', waferInst.auth.validationMiddleware, controller.video.adminDelete);
  // router.get(basePath + '/home/ref', controller.home.ref);
  router.post(basePath + '/dream/help_dream', waferInst.auth.validationMiddleware, controller.dream.helpDream);

  get('/home/index', controller.home.index);

};
