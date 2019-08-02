'use strict';

const debug = require('debug')('koa-weapp-demo');

// 响应处理模块
module.exports = () => {
  return async function response(ctx, next) {
    // console.log(' ctx.app.wafer',  ctx.app.wafer)
    const waferInst = ctx.app.wafer;
    console.log('ctx.state', ctx.state);
    try {
      // 调用下一个 middleware
      await next();
      // 处理响应结果
      // 如果直接写入在 body 中，则不作处理
      // 如果写在 ctx.body 为空，则使用 state 作为响应
      if (!ctx.body) {
        const body = {};
        if (ctx.state.code) {
          body.code = ctx.state.code;
          ctx.body = body;
        }
        if (ctx.state.data) {
          body.data = ctx.state.data;
          if (typeof (body.code) === 'undefined') {
            body.code = 0;
          }
          ctx.body = body;
        }
      }

    } catch (e) {
      if (e.message === waferInst.ERRORS.ERR_SKEY_INVALID) {
        // catch 住无效skey错误
        debug('Catch Error: %o', e);

        // 设置状态码为 500 - 服务端错误
        ctx.status = 500;

        // 输出详细的错误信息
        ctx.body = {
          code: -1,
          error: e && e.message ? e.message : e.toString(),
        };
      } else {
        throw e;
      }
    }
  };
};
