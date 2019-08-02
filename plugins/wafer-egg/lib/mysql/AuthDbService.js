'use strict';

const debug = require('debug')('qcloud-sdk[AuthDbService]');
const uuidGenerator = require('uuid/v4');
const moment = require('moment');
const ERRORS = require('../constants').ERRORS;
const mysql = require('./index');

/**
 * 储存用户信息
 * @param {object} userInfo 用户信息
 * @param {string} skey 客户端登录状态的标识
 * @param {string} session_key sessionKey
 * @return {Promise} promise对象
 */
function saveUserInfo(userInfo, skey, session_key) {
  const uuid = uuidGenerator();
  const create_time = moment().format('YYYY-MM-DD HH:mm:ss');
  const last_visit_time = create_time;
  const open_id = userInfo.openId;
  const user_info = JSON.stringify(userInfo);

  // 查重并决定是插入还是更新数据
  return mysql('cSessionInfo').count('open_id as hasUser').where({
    open_id,
  })
    .then(res => {
      // 如果存在用户则更新
      if (res[0].hasUser) {
        return mysql('cSessionInfo').update({
          skey, last_visit_time, session_key, user_info,
        }).where({
          open_id,
        });
      }
      return mysql('cSessionInfo').insert({
        uuid, skey, create_time, last_visit_time, open_id, session_key, user_info,
      });

    })
    .then(() => ({
      userinfo: userInfo,
      skey,
    }))
    .catch(e => {
      debug('%s: %O', ERRORS.DBERR.ERR_WHEN_INSERT_TO_DB, e);
      throw new Error(`${ERRORS.DBERR.ERR_WHEN_INSERT_TO_DB}\n${e}`);
    });
}

/**
 * 通过 skey 获取用户信息
 * @param {string} skey 登录时颁发的 skey 为登录态标识
 * @return {object} 用户信息
 */
function getUserInfoBySKey(skey) {
  if (!skey) throw new Error(ERRORS.DBERR.ERR_NO_SKEY_ON_CALL_GETUSERINFOFUNCTION);

  return mysql('cSessionInfo').select('*').where({
    skey,
  });
}

/**
 * 通过 openid 获取用户信息
 * @param {string} openId 用户的 openId
 * @return {object} 用户信息
 */
function getUserInfoByOpenId(openId) {
  if (!openId) throw new Error(ERRORS.DBERR.ERR_NO_OPENID_ON_CALL_GETUSERINFOFUNCTION);

  return mysql('cSessionInfo').select('*').where({ open_id: openId })
    .first();
}

/**
 * 通过openid列表 批量获取用户信息
 * @param {Array} openIdList 用户的openid列表
 * @return {Array} 用户信息数组
 */
function getUsersByOpenIdList(openIdList) {
  if (Object.prototype.toString.call(openIdList) !== '[object Array]') {
    return [];
  }
  return mysql('cSessionInfo').select('user_info').whereIn('open_id', openIdList);
}

module.exports = {
  saveUserInfo,
  getUserInfoBySKey,
  getUserInfoByOpenId,
  getUsersByOpenIdList,
};
