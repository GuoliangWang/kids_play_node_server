'use strict';

const Service = require('egg').Service;
const iconst = require('../const');
const OSSClient = require('ali-oss');
// const crypto = require('crypto');
// const moment = require('moment');

// function toInt(str) {
//   if (typeof str === 'number') return str;
//   if (!str) return str;
//   return parseInt(str, 10) || 0;
// }

class MessageService extends Service {

  promiseForReadVideoSts(video) {
    return new Promise(resolve => {
      const videoPath = video.url;
      const coverPath = video.cover; // reduce image size
      console.log('coverPath:', coverPath);
      const conf = this.app.config.aliOss;
      // let policy = JSON.stringify(conf.bucketReadPolicy)
      const policy = JSON.stringify(conf.AllPolicy);
      // if (conf.PolicyFile) {
      //   policy = fs.readFileSync(path.resolve(__dirname, conf.PolicyFile)).toString('utf-8');
      // }
      const client = new OSSClient.STS({
        accessKeyId: conf.AccessKeyId,
        accessKeySecret: conf.AccessKeySecret,
      });
      client.assumeRole(conf.RoleArn, policy, conf.TokenExpireTime).then(result => {
        const region = 'oss-cn-beijing';
        const bucket = 'narnia-app';
        const signatureHost = `http://${bucket}.${region}.aliyuncs.com`;
        const oss = new OSSClient({
          region,
          accessKeyId: result.credentials.AccessKeyId,
          accessKeySecret: result.credentials.AccessKeySecret,
          stsToken: result.credentials.SecurityToken,
          bucket,
        });
        let videoUrl = oss.signatureUrl(videoPath, { expires: conf.TokenExpireTime });
        let coverUrl = oss.signatureUrl(coverPath, { expires: conf.TokenExpireTime, 'x-oss-process': 'image/resize,w_512' });
        videoUrl = videoUrl.replace(signatureHost, iconst.oss.narnia_app_cdn_host);
        coverUrl = coverUrl.replace(signatureHost, iconst.oss.narnia_app_cdn_host);
        const res = {
          videoUrl,
          coverUrl,
        };
        resolve(res);
      }).catch(err => {
        console.log('err:', err);
        // debug('Catch Error: %o', err);
        resolve(null);
      });
    });
  }

  async setReferenceForVideos(list, userInfo) {
    const ctx = this.ctx;
    let openIdList = [];
    const conf = this.app.config.aliOss;
    // await promiseForReadVideoSts(item)
    const respList = [];
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      openIdList.push(item.create_userid);
      let authorized = false;
      let auth = 0;
      if (userInfo && item.create_userid === userInfo.openId) { // 作者本人有权
        authorized = true;
      } else if (item.status !== iconst.applyStatus.approved) { // 未审核通过的,其他人无权观看
        authorized = false;
      } else if (item.privacy === iconst.privacy.public) { // 审核通过的公开资源都有权观看
        authorized = true;
      } else if (userInfo && item.privacy === iconst.privacy.needApply) { // 作者允许观看的，才可观看
        const authrity = await ctx.model.VideoAuthrity.findOne({ where: { video_id: item.id, user_id: userInfo.openId } });
        if (authrity && authrity.auth === iconst.auth.read) {
          authorized = true;
          auth = authrity.auth;
        }
      } else if (item.privacy === iconst.privacy.self) {
        authorized = false;
      }
      authorized = authorized ? 1 : 0;
      if (authorized) {
        const urlKey = iconst.redisKey.stsVideoUrlPre + item.id;
        const coverKey = iconst.redisKey.stsVideoCoverPre + item.id;
        let redisUrl = await this.app.redis.get(urlKey);
        let redisCover = await this.app.redis.get(coverKey);
        if (!redisUrl) {
          const stsRes = await ctx.service.video.promiseForReadVideoSts(item);
          // let stsRes = await this.promiseForReadVideoSts(item)
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
    const openIdSet = new Set(openIdList);
    openIdList = Array.from(openIdSet);
    const users = await this.app.wafer.AuthDbService.getUsersByOpenIdList(openIdList);
    console.log('users length:', users.length);
    return { respList, users };
  }

}
module.exports = MessageService;
