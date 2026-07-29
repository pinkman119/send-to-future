import { reactive, computed } from 'vue'

// ============ 统计指标 ============
export const stats = reactive({
  users: 12856,
  visits: 384921,
  paidLetters: 1247,
  paidRevenue: 89640,
  usersTrend: [12.1, 12.4, 12.6, 12.5, 12.8, 12.9, 13.2, 12.9, 13.1, 12.8, 12.85, 12.86],
  visitsTrend: [320, 380, 350, 420, 460, 440, 510, 480, 520, 540, 560, 590],
  paidTrend: [80, 95, 102, 110, 105, 120, 130, 125, 140, 135, 145, 150],
  revenueTrend: [6200, 6800, 7100, 7500, 7300, 7800, 8100, 7900, 8400, 8600, 8800, 8964],
})

// ============ 待办列表 ============
export const todos = reactive([
  { id: 1, title: '审核 8 封待处理信件', priority: 'high', due: '今天 18:00', done: false, icon: 'shield-check' },
  { id: 2, title: '回复 EARTH-12138 用户的申诉', priority: 'high', due: '今天 20:00', done: false, icon: 'mail-alert' },
  { id: 3, title: '复核坐标异常的 3 个用户轨迹', priority: 'medium', due: '明天', done: false, icon: 'map-pin' },
  { id: 4, title: '整理本周付费信件收入报表', priority: 'medium', due: '周五', done: false, icon: 'file-text' },
  { id: 5, title: '更新审核关键词词库', priority: 'low', due: '本周内', done: false, icon: 'tag' },
  { id: 6, title: '同步上周运营周会会议纪要', priority: 'low', due: '已完成', done: true, icon: 'clipboard-check' },
])

// ============ 信件数据（status: 0=待审核 1=已通过 2=已拒绝） ============
export const letters = reactive([
  { id: 'L20260725001', sender: 'EARTH-12138', receiver: 'MARS-09421', title: '关于火星基地建设的提案信', status: 0, paid: true, amount: 9.9, createdAt: '2026-07-25 14:32', coords: '31.23°N, 121.47°E' },
  { id: 'L20260725002', sender: 'VENUS-22018', receiver: 'NEPTUNE-33210', title: '金星的告白 · 第七封', status: 0, paid: true, amount: 19.9, createdAt: '2026-07-25 13:18', coords: '22.54°N, 114.06°E' },
  { id: 'L20260725003', sender: 'MOON-77001', receiver: 'SATURN-55812', title: '月光下写给土星环的诗', status: 0, paid: false, amount: 0, createdAt: '2026-07-25 11:45', coords: '39.90°N, 116.40°E' },
  { id: 'L20260725004', sender: 'PLUTO-00432', receiver: 'EARTH-12138', title: '冥王星之约', status: 0, paid: true, amount: 29.9, createdAt: '2026-07-25 10:22', coords: '34.27°N, 108.95°E' },
  { id: 'L20260725005', sender: 'URANUS-11029', receiver: 'MARS-09421', title: '天王星观察日记', status: 0, paid: false, amount: 0, createdAt: '2026-07-25 09:15', coords: '23.13°N, 113.26°E' },
  { id: 'L20260725006', sender: 'EARTH-12138', receiver: 'VENUS-22018', title: '地球回信：关于夏日的记忆', status: 0, paid: true, amount: 9.9, createdAt: '2026-07-24 22:08', coords: '31.23°N, 121.47°E' },
  { id: 'L20260725007', sender: 'NEPTUNE-33210', receiver: 'PLUTO-00432', title: '海王星的蓝色低语', status: 0, paid: true, amount: 19.9, createdAt: '2026-07-24 19:50', coords: '30.57°N, 104.07°E' },
  { id: 'L20260725008', sender: 'MARS-09421', receiver: 'MOON-77001', title: '红色星球对月光的思念', status: 0, paid: false, amount: 0, createdAt: '2026-07-24 17:33', coords: '29.56°N, 106.55°E' },
  { id: 'L20260724001', sender: 'SATURN-55812', receiver: 'EARTH-12138', title: '土星环上的婚礼邀请', status: 1, paid: true, amount: 39.9, createdAt: '2026-07-24 15:20', coords: '40.71°N, 74.01°W' },
  { id: 'L20260724002', sender: 'VENUS-22018', receiver: 'URANUS-11029', title: '致天王星的回音', status: 1, paid: false, amount: 0, createdAt: '2026-07-24 11:08', coords: '22.54°N, 114.06°E' },
  { id: 'L20260724003', sender: 'PLUTO-00432', receiver: 'SATURN-55812', title: '冥王星写给土星的告别', status: 1, paid: true, amount: 9.9, createdAt: '2026-07-24 09:42', coords: '34.27°N, 108.95°E' },
  { id: 'L20260723001', sender: 'MOON-77001', receiver: 'NEPTUNE-33210', title: '月光下的蓝色约定', status: 1, paid: false, amount: 0, createdAt: '2026-07-23 22:15', coords: '39.90°N, 116.40°E' },
  { id: 'L20260723002', sender: 'MARS-09421', receiver: 'EARTH-12138', title: '火星的春日来信', status: 2, paid: true, amount: 19.9, createdAt: '2026-07-23 18:30', coords: '29.56°N, 106.55°E' },
  { id: 'L20260723003', sender: 'URANUS-11029', receiver: 'VENUS-22018', title: '天王星的奇怪情书', status: 2, paid: false, amount: 0, createdAt: '2026-07-23 14:22', coords: '23.13°N, 113.26°E' },
])

export const pendingLettersCount = computed(() => letters.filter((l) => l.status === 0).length)

// ============ 坐标数据（user_coord 表） ============
// 坐标类型：phone 手机号 / email 邮箱号 / wechat 微信号 / address 实际地址
export const coordTypeMap = {
  phone: { label: '手机号', icon: 'phone', cls: 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400' },
  email: { label: '邮箱号', icon: 'mail', cls: 'bg-success-light dark:bg-success/10 text-success' },
  wechat: { label: '微信号', icon: 'message-circle', cls: 'bg-warning-light dark:bg-warning/10 text-warning' },
  address: { label: '实际地址', icon: 'map-pin', cls: 'bg-danger-light dark:bg-danger/10 text-danger' },
}

export const coords = reactive([
  // EARTH-12138
  { id: 1, user: 'EARTH-12138', type: 'phone', content: '138-1213-8128', createdAt: '2026-07-25 14:32' },
  { id: 2, user: 'EARTH-12138', type: 'email', content: 'earth12138@stellarletters.app', createdAt: '2026-07-25 14:32' },
  { id: 3, user: 'EARTH-12138', type: 'wechat', content: 'earth_12138', createdAt: '2026-07-25 14:32' },
  { id: 4, user: 'EARTH-12138', type: 'address', content: '上海市黄浦区人民大道 100 号', createdAt: '2026-07-25 14:32' },
  // MARS-09421
  { id: 5, user: 'MARS-09421', type: 'phone', content: '139-0942-1092', createdAt: '2026-07-25 13:18' },
  { id: 6, user: 'MARS-09421', type: 'email', content: 'mars09421@stellarletters.app', createdAt: '2026-07-25 13:18' },
  { id: 7, user: 'MARS-09421', type: 'wechat', content: 'mars_09421', createdAt: '2026-07-25 13:18' },
  { id: 8, user: 'MARS-09421', type: 'address', content: '北京市东城区长安街 1 号', createdAt: '2026-07-25 13:18' },
  // VENUS-22018
  { id: 9, user: 'VENUS-22018', type: 'phone', content: '137-2201-8810', createdAt: '2026-07-25 11:45' },
  { id: 10, user: 'VENUS-22018', type: 'email', content: 'venus22018@stellarletters.app', createdAt: '2026-07-25 11:45' },
  { id: 11, user: 'VENUS-22018', type: 'wechat', content: 'venus_22018', createdAt: '2026-07-25 11:45' },
  { id: 12, user: 'VENUS-22018', type: 'address', content: '深圳市福田区市民中心', createdAt: '2026-07-25 11:45' },
  // NEPTUNE-33210
  { id: 13, user: 'NEPTUNE-33210', type: 'phone', content: '136-3321-0021', createdAt: '2026-07-25 10:22' },
  { id: 14, user: 'NEPTUNE-33210', type: 'email', content: 'neptune33210@stellarletters.app', createdAt: '2026-07-25 10:22' },
  { id: 15, user: 'NEPTUNE-33210', type: 'wechat', content: 'neptune_33210', createdAt: '2026-07-25 10:22' },
  { id: 16, user: 'NEPTUNE-33210', type: 'address', content: '广州市越秀区中山五路 28 号', createdAt: '2026-07-25 10:22' },
  // PLUTO-00432
  { id: 17, user: 'PLUTO-00432', type: 'phone', content: '135-0043-2001', createdAt: '2026-07-25 09:15' },
  { id: 18, user: 'PLUTO-00432', type: 'email', content: 'pluto00432@stellarletters.app', createdAt: '2026-07-25 09:15' },
  { id: 19, user: 'PLUTO-00432', type: 'wechat', content: 'pluto_00432', createdAt: '2026-07-25 09:15' },
  { id: 20, user: 'PLUTO-00432', type: 'address', content: '西安市雁塔区大雁塔南广场', createdAt: '2026-07-25 09:15' },
  // URANUS-11029
  { id: 21, user: 'URANUS-11029', type: 'phone', content: '134-1102-9012', createdAt: '2026-07-24 22:08' },
  { id: 22, user: 'URANUS-11029', type: 'email', content: 'uranus11029@stellarletters.app', createdAt: '2026-07-24 22:08' },
  { id: 23, user: 'URANUS-11029', type: 'wechat', content: 'uranus_11029', createdAt: '2026-07-24 22:08' },
  { id: 24, user: 'URANUS-11029', type: 'address', content: '广州市天河区珠江新城兴民路', createdAt: '2026-07-24 22:08' },
  // SATURN-55812
  { id: 25, user: 'SATURN-55812', type: 'phone', content: '133-5581-2001', createdAt: '2026-07-24 19:50' },
  { id: 26, user: 'SATURN-55812', type: 'email', content: 'saturn55812@stellarletters.app', createdAt: '2026-07-24 19:50' },
  { id: 27, user: 'SATURN-55812', type: 'wechat', content: 'saturn_55812', createdAt: '2026-07-24 19:50' },
  { id: 28, user: 'SATURN-55812', type: 'address', content: '成都市锦江区春熙路中段', createdAt: '2026-07-24 19:50' },
  // MOON-77001
  { id: 29, user: 'MOON-77001', type: 'phone', content: '132-7700-1001', createdAt: '2026-07-24 17:33' },
  { id: 30, user: 'MOON-77001', type: 'email', content: 'moon77001@stellarletters.app', createdAt: '2026-07-24 17:33' },
  { id: 31, user: 'MOON-77001', type: 'wechat', content: 'moon_77001', createdAt: '2026-07-24 17:33' },
  { id: 32, user: 'MOON-77001', type: 'address', content: '重庆市渝中区解放碑步行街', createdAt: '2026-07-24 17:33' },
])
