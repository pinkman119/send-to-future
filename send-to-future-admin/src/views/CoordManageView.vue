<script setup>
import { ref, computed } from 'vue'
import { coords, coordTypeMap } from '@/data/mock'
import { useToast } from '@/composables/useToast'
import BaseIcon from '@/components/ui/BaseIcon.vue'

const { toast } = useToast()

const types = [
  { key: 'all', label: '全部' },
  { key: 'phone', label: '手机号' },
  { key: 'email', label: '邮箱号' },
  { key: 'wechat', label: '微信号' },
  { key: 'address', label: '实际地址' },
]

const coordType = ref('all')
const coordSearch = ref('')
const searchInput = ref('')
const currentPage = ref(1)
const pageSize = 8

const miniStats = computed(() => [
  { label: '坐标总数', value: coords.length, icon: 'address-book', color: 'primary' },
  { label: '手机号', value: coords.filter((c) => c.type === 'phone').length, icon: 'phone', color: 'success' },
  { label: '邮箱号', value: coords.filter((c) => c.type === 'email').length, icon: 'mail', color: 'warning' },
  { label: '微信号', value: coords.filter((c) => c.type === 'wechat').length, icon: 'message-circle', color: 'danger' },
])

const miniColorMap = {
  primary: 'bg-primary-50 dark:bg-primary-500/10 text-primary-500',
  success: 'bg-success-light dark:bg-success/10 text-success',
  warning: 'bg-warning-light dark:bg-warning/10 text-warning',
  danger: 'bg-danger-light dark:bg-danger/10 text-danger',
}

const typeCounts = computed(() => ({
  all: coords.length,
  phone: coords.filter((c) => c.type === 'phone').length,
  email: coords.filter((c) => c.type === 'email').length,
  wechat: coords.filter((c) => c.type === 'wechat').length,
  address: coords.filter((c) => c.type === 'address').length,
}))

const filtered = computed(() => {
  let list = coords
  if (coordType.value !== 'all') list = list.filter((c) => c.type === coordType.value)
  const kw = coordSearch.value.trim().toLowerCase()
  if (kw) list = list.filter((c) => c.user.toLowerCase().includes(kw))
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

function switchType(key) {
  coordType.value = key
  currentPage.value = 1
}

function onSearch() {
  coordSearch.value = searchInput.value
  currentPage.value = 1
}

function goPage(p) {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
}

function editCoord(id) {
  const c = coords.find((x) => x.id === id)
  if (!c) return
  toast(`已发起对 ${c.user} 的「${coordTypeMap[c.type].label}」远程修改请求`, 'info')
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
    <div>
      <div class="flex items-center gap-2 text-xs text-ink-muted dark:text-ink-darkMuted mb-1">
        <router-link to="/" class="hover:text-primary-500">首页</router-link>
        <BaseIcon name="chevron-right" :size="12" />
        <span>信件模块</span>
        <BaseIcon name="chevron-right" :size="12" />
        <span class="text-ink dark:text-ink-dark">坐标管理</span>
      </div>
      <h1 class="text-xl font-bold tracking-tight flex items-center gap-2">
        <BaseIcon name="address-book" :size="20" class="text-primary-500" /> 坐标管理
      </h1>
      <p class="text-xs text-ink-muted dark:text-ink-darkMuted mt-1">
        管理用户的联系方式坐标（手机号 / 邮箱号 / 微信号 / 实际地址），对应数据表
        <code class="font-mono px-1.5 py-0.5 rounded bg-canvas dark:bg-surface-darker text-primary-500">user_coord</code>
      </p>
    </div>
    <div class="flex items-center gap-2">
      <button class="btn btn-ghost px-3 py-2 rounded-lg border border-line dark:border-line-dark text-sm flex items-center gap-1.5" @click="toast('已导出坐标数据', 'success')">
        <BaseIcon name="download" :size="16" /> 导出
      </button>
    </div>
  </div>

  <!-- 统计小卡 -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
    <div
      v-for="m in miniStats"
      :key="m.label"
      class="bg-surface dark:bg-surface-dark rounded-xl border border-line dark:border-line-dark p-3 flex items-center gap-3"
    >
      <div class="w-10 h-10 rounded-lg grid place-items-center flex-shrink-0" :class="miniColorMap[m.color]">
        <BaseIcon :name="m.icon" :size="20" />
      </div>
      <div class="min-w-0">
        <p class="text-xs text-ink-muted dark:text-ink-darkMuted truncate">{{ m.label }}</p>
        <p class="text-lg font-bold leading-tight">{{ m.value.toLocaleString() }}</p>
      </div>
    </div>
  </div>

  <!-- 主表格 -->
  <div class="bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark shadow-card overflow-hidden">
    <!-- 类型筛选 + 搜索 -->
    <div class="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-line dark:border-line-dark">
      <div class="flex items-center gap-1 p-1 rounded-lg bg-canvas dark:bg-surface-darker overflow-x-auto">
        <button
          v-for="t in types"
          :key="t.key"
          class="px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap"
          :class="
            coordType === t.key
              ? 'bg-surface dark:bg-surface-dark shadow-sm text-primary-500'
              : 'text-ink-muted dark:text-ink-darkMuted hover:text-ink dark:hover:text-ink-dark'
          "
          @click="switchType(t.key)"
        >
          {{ t.label }}
          <span class="ml-1" :class="coordType === t.key ? 'text-primary-500' : 'opacity-70'">{{ typeCounts[t.key] }}</span>
        </button>
      </div>
      <div class="flex items-center gap-2">
        <div class="relative w-full sm:w-72">
          <BaseIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-darkMuted" />
          <input
            v-model="searchInput"
            type="text"
            placeholder="按用户名称搜索，如 EARTH-12138"
            class="w-full pl-9 pr-3 py-2 rounded-lg bg-canvas dark:bg-surface-darker border border-transparent focus:border-primary-500 focus:bg-surface dark:focus:bg-surface-dark text-sm focus:outline-none transition"
            @input="onSearch"
          />
        </div>
        <button class="btn btn-ghost px-3 py-2 rounded-lg border border-line dark:border-line-dark text-sm flex items-center gap-1.5" @click="toast('数据已刷新', 'success')">
          <BaseIcon name="refresh-cw" :size="16" />
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="table-head bg-canvas/60 dark:bg-surface-darker/60">
          <tr class="text-left text-xs uppercase tracking-wider text-ink-muted dark:text-ink-darkMuted">
            <th class="px-4 py-3">ID</th>
            <th class="px-4 py-3">用户</th>
            <th class="px-4 py-3">坐标类型</th>
            <th class="px-4 py-3">内容</th>
            <th class="px-4 py-3">创建时间</th>
            <th class="px-4 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line dark:divide-line-dark">
          <tr v-for="c in paged" :key="c.id" class="data-row">
            <td class="px-4 py-3 font-mono text-xs text-ink-muted dark:text-ink-darkMuted">#{{ c.id }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1.5">
                <span class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 grid place-items-center text-[10px] text-white font-bold">{{ c.user[0] }}</span>
                <span class="font-mono text-xs">{{ c.user }}</span>
              </span>
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md" :class="coordTypeMap[c.type].cls">
                <BaseIcon :name="coordTypeMap[c.type].icon" :size="14" /> {{ coordTypeMap[c.type].label }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :class="c.type === 'address' ? 'text-sm' : 'font-mono text-xs'">{{ c.content }}</span>
            </td>
            <td class="px-4 py-3 text-xs text-ink-muted dark:text-ink-darkMuted whitespace-nowrap">{{ c.createdAt }}</td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <button
                class="btn btn-ghost px-2.5 py-1.5 rounded-md text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 inline-flex items-center gap-1"
                title="远程修改"
                @click="editCoord(c.id)"
              >
                <BaseIcon name="pencil-line" :size="14" /> 远程修改
              </button>
            </td>
          </tr>

          <tr v-if="paged.length === 0">
            <td colspan="6" class="py-16">
              <div class="flex flex-col items-center justify-center text-center empty-illus py-8">
                <div class="w-16 h-16 rounded-full bg-canvas dark:bg-surface-darker grid place-items-center mb-3">
                  <BaseIcon name="contact" :size="28" class="text-ink-muted dark:text-ink-darkMuted" />
                </div>
                <p class="text-sm font-medium">暂无坐标数据</p>
                <p class="text-xs text-ink-muted dark:text-ink-darkMuted mt-1">尝试更换类型筛选或用户名称关键词</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="flex items-center justify-between p-4 border-t border-line dark:border-line-dark text-sm">
      <p class="text-xs text-ink-muted dark:text-ink-darkMuted">
        显示 {{ filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filtered.length) }} / 共 {{ filtered.length }} 条
      </p>
      <div class="flex items-center gap-1">
        <button
          class="px-2.5 py-1.5 rounded-md border border-line dark:border-line-dark text-xs hover:bg-canvas dark:hover:bg-surface-darker disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="currentPage === 1"
          @click="goPage(currentPage - 1)"
        >
          上一页
        </button>
        <button
          v-for="p in totalPages"
          :key="p"
          class="px-3 py-1.5 rounded-md text-xs font-medium"
          :class="p === currentPage ? 'bg-primary-500 text-white' : 'px-2.5 py-1.5 rounded-md border border-line dark:border-line-dark hover:bg-canvas dark:hover:bg-surface-darker'"
          @click="goPage(p)"
        >
          {{ p }}
        </button>
        <button
          class="px-2.5 py-1.5 rounded-md border border-line dark:border-line-dark text-xs hover:bg-canvas dark:hover:bg-surface-darker disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="currentPage === totalPages"
          @click="goPage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>
