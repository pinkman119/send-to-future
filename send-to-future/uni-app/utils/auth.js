import { post } from './request.js';

const TOKEN_KEY = 'stf_token';
const USER_KEY = 'stf_user';

/**
 * 将登录态写入 globalData，供全局读取
 * @param {string} token - 登录令牌
 * @param {object} user - 用户信息
 */
function setGlobalLogin(token, user) {
  const app = getApp();
  if (app && app.globalData) {
    app.globalData.login = { token, user };
  }
}

/**
 * 静默登录：优先复用本地令牌，否则通过 uni.login 取 code 调后端建档
 * @returns {Promise<object>} 包含 token、user、isNewUser、skipped 的登录结果
 */
export async function silentLogin() {
  const token = uni.getStorageSync(TOKEN_KEY);
  const user = uni.getStorageSync(USER_KEY);
  if (token && user) {
    setGlobalLogin(token, user);
    return { token, user, isNewUser: false, skipped: true };
  }

  const loginRes = await uni.login({ provider: 'weixin' });
  const code = loginRes && loginRes.code;
  if (!code) {
    throw new Error('获取微信登录 code 失败');
  }

  const res = await post('/wechat/login', { code });
  uni.setStorageSync(TOKEN_KEY, res.token);
  uni.setStorageSync(USER_KEY, res.user);
  setGlobalLogin(res.token, res.user);
  return Object.assign({}, res, { skipped: false });
}

/**
 * 获取当前登录令牌（优先读取 globalData，否则读取本地存储）
 * @returns {string} 登录令牌，未登录时为空字符串
 */
export function getToken() {
  const app = getApp();
  if (app && app.globalData && app.globalData.login && app.globalData.login.token) {
    return app.globalData.login.token;
  }
  return uni.getStorageSync(TOKEN_KEY) || '';
}

/**
 * 获取当前用户信息（优先读取 globalData，否则读取本地存储）
 * @returns {object|null} 用户信息，未登录时为 null
 */
export function getUserInfo() {
  const app = getApp();
  if (app && app.globalData && app.globalData.login && app.globalData.login.user) {
    return app.globalData.login.user;
  }
  return uni.getStorageSync(USER_KEY) || null;
}

/**
 * 判断当前是否已登录
 * @returns {boolean} 已登录返回 true，否则返回 false
 */
export function isLoggedIn() {
  return !!getToken();
}
