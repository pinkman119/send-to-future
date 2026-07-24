import { post } from './request.js';

const TOKEN_KEY = 'stf_token';
const USER_KEY = 'stf_user';

// 将登录态写入 globalData（供全局读取）
function setGlobalLogin(token, user) {
  const app = getApp();
  if (app && app.globalData) {
    app.globalData.login = { token, user };
  }
}

// 静默登录：优先复用本地令牌，否则通过 uni.login 取 code 调后端建档
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

export function getToken() {
  const app = getApp();
  if (app && app.globalData && app.globalData.login && app.globalData.login.token) {
    return app.globalData.login.token;
  }
  return uni.getStorageSync(TOKEN_KEY) || '';
}

export function getUserInfo() {
  const app = getApp();
  if (app && app.globalData && app.globalData.login && app.globalData.login.user) {
    return app.globalData.login.user;
  }
  return uni.getStorageSync(USER_KEY) || null;
}

export function isLoggedIn() {
  return !!getToken();
}
