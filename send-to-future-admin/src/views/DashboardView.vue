<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { stats, todos, pendingLettersCount } from '@/data/mock'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import BaseIcon from '@/components/ui/BaseIcon.vue'

const { auth } = useAuth()
const { toast } = useToast()

const cardColorMap = {
  primary: { bg: 'bg-primary-50 dark:bg-primary-500/10', text: 'text-primary-500', bar: '#009EF7' },
  success: { bg: 'bg-success-light dark:bg-success/10', text: 'text-success', bar: '#50CD89' },
  warning: { bg: 'bg-warning-light dark:bg-warning/10', text: 'text-warning', bar: '#FFA800' },
  danger: { bg: 'bg-danger-light dark:bg-danger/10', text: 'text-danger', bar: '#F1416C' },
}

const statCards = [
  { label: '用户数量', value: stats.users, suffix: '', icon: 'users', trend: '+2.4%', trendUp: true, color: 'primary', spark: stats.usersTrend, sparkMax: 13.5 },
  { label: '访问数量', value: stats.visits, suffix: '', icon: 'mouse-pointer-click', trend: '+8.7%', trendUp: true, color: 'success', spark: stats.visitsTrend, sparkMax: 600 },
  { label: '付费信件数量', value: stats.paidLetters, suffix: '封', icon: 'mail-check', trend: '+12.3%', trendUp: true, color: 'warning', spark: stats.paidTrend, sparkMax: 160 },
  { label: '付费信件收入', value: stats.paidRevenue, prefix: '¥', suffix: '', icon: 'trending-up', trend: '+5.6%', trendUp: true, color: 'danger', spark: stats.revenueTrend, sparkMax: 9000 },
]

function sparkHeight(v, max) {
  return Math.max(8, (v / max) * 100)
}
function sparkOpacity(i, len) {
  return 0.4 + (i / len) * 0.6
}

const priorityMap = {
  high: { label: '高优', color: 'bg-danger-light dark:bg-danger/15 text-danger' },
  medium: { label: '中优', color: 'bg-warning-light dark:bg-warning/15 text-warning' },
  low: { label: '低优', color: 'bg-canvas dark:bg-surface-darker text-ink-muted dark:text-ink-darkMuted' },
}

const openTodos = computed(() => todos.filter((t) => !t.done).length)

function toggleTodo(todo) {
  todo.done = !todo.done
  if (todo.done) toast(`已完成：${todo.title}`, 'success')
}

const statusItems = [
  { name: 'API 服务', percent: 99.98, level: 'success', note: '运行正常' },
  { name: '数据库', percent: 99.95, level: 'success', note: '响应 12ms' },
  { name: '存储服务', percent: 97.2, level: 'warning', note: '空间 78%' },
  { name: '消息队列', percent: 99.99, level: 'success', note: '0 积压' },
]

const statusColorMap = {
  success: { bar: 'bg-success', text: 'text-success' },
  warning: { bar: 'bg-warning', text: 'text-warning' },
  danger: { bar: 'bg-danger', text: 'text-danger' },
}

// ============ 时钟 ============
const clockTime = ref('--:--:--')
const clockDate = ref('--')

function updateClock() {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  clockTime.value = `${hh}:${mm}:${ss}`
  clockDate.value = `${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`
}

let clockTimer = null
onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
})
onBeforeUnmount(() => clockTimer && clearInterval(clockTimer))
</script>

<template>
  <!-- 欢迎横幅 -->
  <section class="mb-6 rounded-2xl overflow-hidden relative bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 text-white p-6 lg:p-8">
    <div
      class="absolute inset-0 opacity-30"
      style="background-image: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 40%), radial-gradient(circle at 20% 90%, rgba(255,255,255,0.2) 0%, transparent 40%);"
    ></div>
    <div class="absolute right-6 top-6 hidden sm:block">
      <div class="w-32 h-32 rounded-full bg-white/10 backdrop-blur grid place-items-center">
        <div class="text-center">
          <p class="text-[10px] uppercase tracking-widest text-white/70">现在</p>
          <p class="text-3xl font-bold font-mono clock-digit leading-none mt-1">{{ clockTime }}</p>
          <p class="text-[11px] text-white/80 mt-1">{{ clockDate }}</p>
        </div>
      </div>
    </div>
    <div class="relative max-w-xl">
      <p class="text-sm text-white/80">欢迎回来，</p>
      <h1 class="text-2xl lg:text-3xl font-extrabold tracking-tight mt-1">{{ auth?.name || '管理员' }} ✨</h1>
      <p class="mt-3 text-sm text-white/85 leading-relaxed">
        今日有 <span class="font-semibold text-white">{{ pendingLettersCount }} 封信件</span> 待审核，
        <span class="font-semibold text-white">{{ openTodos }} 项</span> 待办事项需处理。
        <span class="sm:hidden block mt-2 font-mono">{{ clockTime }} · {{ clockDate }}</span>
      </p>
      <div class="mt-5 flex flex-wrap gap-2">
        <router-link
          to="/letter-audit"
          class="btn btn-ghost bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <BaseIcon name="shield-check" :size="16" /> 去审核
        </router-link>
        <button class="btn btn-ghost bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2" @click="toast('数据已刷新', 'success')">
          <BaseIcon name="refresh-cw" :size="16" /> 刷新数据
        </button>
      </div>
    </div>
  </section>

  <!-- 统计卡片 -->
  <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
    <div
      v-for="c in statCards"
      :key="c.label"
      class="stat-card bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark shadow-card p-5"
    >
      <div class="flex items-start justify-between mb-3">
        <div class="w-11 h-11 rounded-xl grid place-items-center" :class="cardColorMap[c.color].bg">
          <BaseIcon :name="c.icon" :size="20" :class="cardColorMap[c.color].text" />
        </div>
        <span class="text-xs font-semibold flex items-center gap-0.5" :class="c.trendUp ? 'text-success' : 'text-danger'">
          <BaseIcon :name="c.trendUp ? 'trending-up' : 'trending-down'" :size="14" />
          {{ c.trend }}
        </span>
      </div>
      <p class="text-sm text-ink-muted dark:text-ink-darkMuted">{{ c.label }}</p>
      <p class="text-2xl font-extrabold tracking-tight mt-1">
        {{ c.prefix || '' }}{{ c.value.toLocaleString() }}{{ c.suffix }}
      </p>
      <div class="flex items-end gap-1 h-10 mt-3">
        <div
          v-for="(v, i) in c.spark"
          :key="i"
          class="spark-bar w-1.5 rounded-sm"
          :style="{ height: sparkHeight(v, c.sparkMax) + '%', background: cardColorMap[c.color].bar, opacity: sparkOpacity(i, c.spark.length) }"
        ></div>
      </div>
    </div>
  </section>

  <!-- 待办 + 快捷 -->
  <section class="grid grid-cols-1 lg:grid-cols-3 gap-5">
    <!-- 待办列表 -->
    <div class="lg:col-span-2 bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark shadow-card overflow-hidden">
      <div class="flex items-center justify-between p-5 border-b border-line dark:border-line-dark">
        <div class="flex items-center gap-2">
          <BaseIcon name="list-checks" :size="20" class="text-primary-500" />
          <h3 class="font-bold text-base">待办列表</h3>
          <span class="text-xs px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 font-medium">{{ openTodos }} 项</span>
        </div>
        <button class="text-xs text-ink-muted dark:text-ink-darkMuted hover:text-primary-500 flex items-center gap-1">
          查看全部 <BaseIcon name="arrow-right" :size="12" />
        </button>
      </div>
      <div class="divide-y divide-line dark:divide-line-dark">
        <div
          v-for="t in todos"
          :key="t.id"
          class="flex items-center gap-3 p-4 hover:bg-canvas/60 dark:hover:bg-surface-darker/40 transition group"
        >
          <input type="checkbox" class="cb flex-shrink-0" :checked="t.done" @change="toggleTodo(t)" />
          <div class="w-9 h-9 rounded-lg bg-canvas dark:bg-surface-darker grid place-items-center flex-shrink-0">
            <BaseIcon
              :name="t.icon"
              :size="16"
              :class="t.done ? 'text-ink-muted dark:text-ink-darkMuted' : 'text-primary-500'"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate" :class="t.done ? 'line-through text-ink-muted dark:text-ink-darkMuted' : ''">{{ t.title }}</p>
            <p class="text-xs text-ink-muted dark:text-ink-darkMuted mt-0.5">{{ t.due }}</p>
          </div>
          <span class="text-[10px] font-semibold px-2 py-1 rounded-md flex-shrink-0" :class="priorityMap[t.priority].color">{{ priorityMap[t.priority].label }}</span>
        </div>
      </div>
    </div>

    <!-- 快捷入口 + 系统状态 -->
    <div class="space-y-5">
      <!-- 快捷入口 -->
      <div class="bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark shadow-card p-5">
        <h3 class="font-bold text-base mb-4 flex items-center gap-2">
          <BaseIcon name="zap" :size="20" class="text-primary-500" /> 快捷操作
        </h3>
        <div class="grid grid-cols-2 gap-2">
          <router-link to="/letter-audit" class="btn-ghost p-3 rounded-xl border border-line dark:border-line-dark hover:border-primary-500 transition group text-left">
            <BaseIcon name="shield-check" :size="20" class="text-primary-500 mb-2" />
            <p class="text-xs font-semibold">审核信件</p>
            <p class="text-[10px] text-ink-muted dark:text-ink-darkMuted mt-0.5">{{ pendingLettersCount }} 封待处理</p>
          </router-link>
          <router-link to="/coord-manage" class="btn-ghost p-3 rounded-xl border border-line dark:border-line-dark hover:border-primary-500 transition group text-left">
            <BaseIcon name="map-pin" :size="20" class="text-success mb-2" />
            <p class="text-xs font-semibold">坐标管理</p>
            <p class="text-[10px] text-ink-muted dark:text-ink-darkMuted mt-0.5">{{ 32 }} 条记录</p>
          </router-link>
          <button class="btn-ghost p-3 rounded-xl border border-line dark:border-line-dark hover:border-primary-500 transition text-left" @click="toast('报表生成中…', 'info')">
            <BaseIcon name="file-bar-chart" :size="20" class="text-warning mb-2" />
            <p class="text-xs font-semibold">收入报表</p>
            <p class="text-[10px] text-ink-muted dark:text-ink-darkMuted mt-0.5">本周导出</p>
          </button>
          <button class="btn-ghost p-3 rounded-xl border border-line dark:border-line-dark hover:border-primary-500 transition text-left" @click="toast('设置项开发中', 'warning')">
            <BaseIcon name="settings-2" :size="20" class="text-danger mb-2" />
            <p class="text-xs font-semibold">系统设置</p>
            <p class="text-[10px] text-ink-muted dark:text-ink-darkMuted mt-0.5">配置参数</p>
          </button>
        </div>
      </div>

      <!-- 系统状态 -->
      <div class="bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark shadow-card p-5">
        <h3 class="font-bold text-base mb-4 flex items-center gap-2">
          <BaseIcon name="activity" :size="20" class="text-primary-500" /> 系统状态
        </h3>
        <div class="space-y-3">
          <div v-for="s in statusItems" :key="s.name">
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full pulse-dot" :class="statusColorMap[s.level].bar"></span>
                <span class="text-sm font-medium">{{ s.name }}</span>
              </div>
              <span class="text-xs font-semibold" :class="statusColorMap[s.level].text">{{ s.note }}</span>
            </div>
            <div class="h-1.5 rounded-full bg-canvas dark:bg-surface-darker overflow-hidden">
              <div class="h-full rounded-full" :class="statusColorMap[s.level].bar" :style="{ width: s.percent + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
