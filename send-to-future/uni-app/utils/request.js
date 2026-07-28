import config from './config.js';

/**
 * 从本地存储读取令牌（避免与 auth.js 形成循环依赖）
 * @returns {string} 令牌字符串
 */
function getToken() {
  return uni.getStorageSync('stf_token') || '';
}

/**
 * 基于 uni.request 的 Promise 封装，统一 baseURL、附加 Authorization、统一错误提示
 * @param {object} options - uni.request 配置对象，至少包含 url
 * @param {string} options.url - 请求路径
 * @param {string} [options.method='GET'] - 请求方法
 * @param {object} [options.data] - 请求数据
 * @param {object} [options.header] - 自定义请求头
 * @returns {Promise<any>} 请求成功时返回响应数据
 * @throws {object} 请求失败或网络错误时 reject 后端响应/错误对象
 */
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

/**
 * 发送 GET 请求
 * @param {string} url - 请求路径
 * @param {object} [data] - 请求参数
 * @returns {Promise<any>} 响应数据
 */
export function get(url, data) {
  return request({ url, method: 'GET', data });
}

/**
 * 发送 POST 请求
 * @param {string} url - 请求路径
 * @param {object} [data] - 请求体数据
 * @returns {Promise<any>} 响应数据
 */
export function post(url, data) {
  return request({ url, method: 'POST', data });
}

/**
 * 发送 PUT 请求
 * @param {string} url - 请求路径
 * @param {object} [data] - 请求体数据
 * @returns {Promise<any>} 响应数据
 */
export function put(url, data) {
  return request({ url, method: 'PUT', data });
}

/**
 * 发送 DELETE 请求
 * @param {string} url - 请求路径
 * @param {object} [data] - 请求体数据
 * @returns {Promise<any>} 响应数据
 */
export function del(url, data) {
  return request({ url, method: 'DELETE', data });
}
