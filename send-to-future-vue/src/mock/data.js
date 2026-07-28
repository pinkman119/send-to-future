// 静态前端的模拟数据：依据 Prisma schema 的 user / letter / order / user_coord 建模。
// 后期对接后端时，只需将各视图中的 mock 数据替换为接口返回即可。

/**
 * 用户表（user）模拟数据。
 * @type {Array<object>}
 */
export const users = [
  { user_id: 1001, planet_code: 'PL-7F3A', nickname: '小行星阿布', openid: 'oWX_1a', listeners_count: 12, created_time: '2026-01-12 09:21' },
  { user_id: 1002, planet_code: 'PL-2B9C', nickname: '星轨旅人', openid: 'oWX_2b', listeners_count: 8, created_time: '2026-01-18 14:03' },
  { user_id: 1003, planet_code: 'PL-9D1E', nickname: '拾光者', openid: 'oWX_3c', listeners_count: 23, created_time: '2026-02-02 20:45' },
  { user_id: 1004, planet_code: 'PL-5A0F', nickname: '匿名星尘', openid: 'oWX_4d', listeners_count: 3, created_time: '2026-02-11 11:10' },
  { user_id: 1005, planet_code: 'PL-3C8B', nickname: '银河邮差', openid: 'oWX_5e', listeners_count: 41, created_time: '2026-02-20 08:30' },
  { user_id: 1006, planet_code: 'PL-1E7D', nickname: '夜航船', openid: 'oWX_6f', listeners_count: 6, created_time: '2026-03-05 22:18' },
  { user_id: 1007, planet_code: 'PL-8H4K', nickname: '潮汐', openid: 'oWX_7g', listeners_count: 17, created_time: '2026-03-19 07:50' },
  { user_id: 1008, planet_code: 'PL-6G2L', nickname: '观测员K', openid: 'oWX_8h', listeners_count: 9, created_time: '2026-04-01 16:42' },
  { user_id: 1009, planet_code: 'PL-4T9M', nickname: '尘埃', openid: 'oWX_9i', listeners_count: 2, created_time: '2026-04-14 13:05' },
  { user_id: 1010, planet_code: 'PL-0R5N', nickname: '回声', openid: 'oWX_0j', listeners_count: 31, created_time: '2026-05-02 19:33' },
  { user_id: 1011, planet_code: 'PL-A1Q7', nickname: '折叠时间', openid: 'oWX_aq', listeners_count: 14, created_time: '2026-05-21 10:12' },
  { user_id: 1012, planet_code: 'PL-C6W3', nickname: '深空', openid: 'oWX_cw', listeners_count: 5, created_time: '2026-06-08 23:47' }
]

const nicknameOf = (id) => (users.find((u) => u.user_id === id) || {}).nickname || '未知用户'

/**
 * 信件表（letter）模拟数据，status：0=审核中 / 1=旅行中 / 2=已送达 / 3=审核驳回。
 * @type {Array<object>}
 */
export const letters = [
  { letter_id: 5001, letter_no: 'LT-2601A', sender_id: 1001, mode: 0, channel_code: 0, keyword: '给十年后', content: '希望那时的你依然热爱星空。', is_public: true, status: 0, create_time: '2026-06-20 10:01' },
  { letter_id: 5002, letter_no: 'LT-2601B', sender_id: 1003, mode: 1, channel_code: 1, keyword: '生日快乐', content: '给未来的自己：别怕慢，慢慢来。', is_public: false, status: 0, create_time: '2026-06-21 12:30' },
  { letter_id: 5003, letter_no: 'LT-2601C', sender_id: 1005, mode: 0, channel_code: 0, keyword: '寄语', content: '愿银河邮差把思念准时送达。', is_public: true, status: 0, create_time: '2026-06-22 09:15' },
  { letter_id: 5004, letter_no: 'LT-2601D', sender_id: 1007, mode: 2, channel_code: 2, keyword: '不灭信', content: '给最重要的人，无论多久都在。', is_public: false, status: 0, create_time: '2026-06-23 18:40' },
  { letter_id: 5005, letter_no: 'LT-2601E', sender_id: 1010, mode: 0, channel_code: 0, keyword: '夏日', content: '今年的蝉鸣，寄给明年的你。', is_public: true, status: 0, create_time: '2026-06-24 07:55' },
  { letter_id: 5006, letter_no: 'LT-2509A', sender_id: 1002, mode: 0, channel_code: 0, keyword: '问候', content: '已经送达的普通一封信。', is_public: true, status: 2, create_time: '2026-05-30 15:20' },
  { letter_id: 5007, letter_no: 'LT-2510B', sender_id: 1004, mode: 1, channel_code: 1, keyword: '提醒', content: '旅行中的短信提醒信件。', is_public: false, status: 1, create_time: '2026-06-02 11:00' },
  { letter_id: 5008, letter_no: 'LT-2511C', sender_id: 1006, mode: 0, channel_code: 0, keyword: '投诉', content: '内容疑似违规，已驳回。', is_public: true, status: 3, create_time: '2026-06-05 20:10' },
  { letter_id: 5009, letter_no: 'LT-2512D', sender_id: 1008, mode: 0, channel_code: 0, keyword: '日常', content: '一封安静的公开信。', is_public: true, status: 2, create_time: '2026-06-09 08:25' },
  { letter_id: 5010, letter_no: 'LT-2512E', sender_id: 1011, mode: 2, channel_code: 2, keyword: '珍藏', content: '不灭信已送达。', is_public: false, status: 2, create_time: '2026-06-12 22:00' }
]

/**
 * 订单表（order）模拟数据，status：0=待支付 / 1=支付成功 / 2=已关闭或退款。
 * 付费信件收入与付费信件数量均依据 status=1 的订单统计。
 * @type {Array<object>}
 */
export const orders = [
  { order_id: 9001, letter_id: 5004, channel_code: 'unbreakable', amount: 19.9, status: 1, success_time: '2026-06-23 18:45' },
  { order_id: 9002, letter_id: 5002, channel_code: 'sms', amount: 1.0, status: 1, success_time: '2026-06-21 12:35' },
  { order_id: 9003, letter_id: 5010, channel_code: 'unbreakable', amount: 19.9, status: 1, success_time: '2026-06-12 22:05' },
  { order_id: 9004, letter_id: 5007, channel_code: 'sms', amount: 1.0, status: 1, success_time: '2026-06-02 11:05' },
  { order_id: 9005, letter_id: 4999, channel_code: 'mail', amount: 6.0, status: 0, success_time: null },
  { order_id: 9006, letter_id: 4998, channel_code: 'unbreakable', amount: 19.9, status: 2, success_time: null }
]

/**
 * 坐标表（user_coord）模拟数据。
 * @type {Array<object>}
 */
export const coords = [
  { coord_id: 7001, user_id: 1001, coord_type: 'email', coord_value: 'abu@example.com', create_time: '2026-01-12 09:25', update_time: '2026-03-01 10:00' },
  { coord_id: 7002, user_id: 1001, coord_type: 'phone', coord_value: '138****1024', create_time: '2026-01-12 09:26', update_time: '2026-03-01 10:00' },
  { coord_id: 7003, user_id: 1003, coord_type: 'email', coord_value: 'picker@example.com', create_time: '2026-02-02 20:50', update_time: '2026-02-02 20:50' },
  { coord_id: 7004, user_id: 1005, coord_type: 'phone', coord_value: '139****7788', create_time: '2026-02-20 08:35', update_time: '2026-04-11 09:12' },
  { coord_id: 7005, user_id: 1005, coord_type: 'email', coord_value: 'post@example.com', create_time: '2026-02-20 08:36', update_time: '2026-04-11 09:12' },
  { coord_id: 7006, user_id: 1007, coord_type: 'email', coord_value: 'tide@example.com', create_time: '2026-03-19 07:55', update_time: '2026-03-19 07:55' },
  { coord_id: 7007, user_id: 1010, coord_type: 'phone', coord_value: '137****3344', create_time: '2026-05-02 19:40', update_time: '2026-05-02 19:40' },
  { coord_id: 7008, user_id: 1011, coord_type: 'email', coord_value: 'fold@example.com', create_time: '2026-05-21 10:20', update_time: '2026-06-15 14:30' }
]

/** 信件状态的中文映射。 */
export const LETTER_STATUS_TEXT = { 0: '审核中', 1: '旅行中', 2: '已送达', 3: '审核驳回' }

/** 渠道编码的中文映射。 */
export const CHANNEL_TEXT = { 0: '邮件', 1: '短信', 2: '不灭信' }

/** 依据 user_id 反查昵称。 */
export const getNickname = nicknameOf
