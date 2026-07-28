import { ref, computed } from 'vue'
import { users, letters, orders, coords } from '@/mock/data'

// 全局响应式数据源：静态前端阶段由 mock 数据初始化，后续可替换为接口数据。
// 各视图共享同一份数据，审核操作会即时反映到首页统计与侧边栏徽标。

export const usersData = ref(users.map((u) => ({ ...u })))
export const lettersData = ref(letters.map((l) => ({ ...l })))
export const ordersData = ref(orders.map((o) => ({ ...o })))
export const coordsData = ref(coords.map((c) => ({ ...c })))

/** 待审核信件（status=0）。 */
export const pendingLetters = computed(() => lettersData.value.filter((l) => l.status === 0))

/** 用户总数。 */
export const userCount = computed(() => usersData.value.length)

/** 访问数量（静态模拟值，后续对接埋点接口）。 */
export const visitCount = ref(23860)

/** 付费信件数量（支付成功的订单数）。 */
export const paidLetterCount = computed(() => ordersData.value.filter((o) => o.status === 1).length)

/** 付费信件收入（支付成功订单金额合计）。 */
export const paidIncome = computed(() =>
  ordersData.value.filter((o) => o.status === 1).reduce((sum, o) => sum + Number(o.amount), 0)
)

/**
 * 批量更新信件状态（审核操作）。
 * @param {number[]} ids - 目标信件 id 列表
 * @param {number} status - 目标状态：1=通过(旅行中) / 3=驳回
 */
export function updateLettersStatus(ids, status) {
  const set = new Set(ids)
  lettersData.value.forEach((l) => {
    if (set.has(l.letter_id)) {
      l.status = status
    }
  })
}
