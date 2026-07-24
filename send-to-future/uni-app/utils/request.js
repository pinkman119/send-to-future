import config from './config.js';

// 从本地存储读取令牌（避免与 auth.js 形成循环依赖）
function getToken() {
  return uni.getStorageSync('stf_token') || '';
}

// 基于 uni.request 的 Promise 封装：统一 baseURL、自动附加 Authorization、统一错误提示
export function request(options) {
  const token = getToken();
  const header = Object.assign({}, options.header || {});
  if (token) {
    header['Authorization'] = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: config.baseURL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          const msg =
            (res.data && res.data.message) || `请求失败(${res.statusCode})`;
          uni.showToast({ title: msg, icon: 'none' });
          reject(res);
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络错误', icon: 'none' });
        reject(err);
      },
    });
  });
}

export function get(url, data) {
  return request({ url, method: 'GET', data });
}

export function post(url, data) {
  return request({ url, method: 'POST', data });
}
