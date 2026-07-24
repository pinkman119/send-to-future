// 后端基地址配置。
// 开发期：填本地/局域网地址（微信开发者工具中 localhost 即可访问本机后端）。
// 生产期：替换为线上域名，并需在微信公众平台「开发设置 → 服务器域名」加入 request 合法域名。
const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://your-backend-domain.com'
    : 'http://localhost:3000';

export default {
  baseURL: BASE_URL,
};
