<script setup>
import { ref, computed, watch } from 'vue'
import { letters } from '@/data/mock'
import { useToast } from '@/composables/useToast'
import BaseIcon from '@/components/ui/BaseIcon.vue'

const { toast } = useToast()

const tabs = [
  { key: 'pending', label: '待审核' },
  { key: 'passed', label: '已通过' },
  { key: 'rejected', label: '已拒绝' },
  { key: 'all', label: '全部' },
]

const letterFilter = ref('pending')
const letterSearch = ref('')
const searchInput = ref('')
const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = 8

const statusMap = {
  0: { label: '待审核', cls: 'bg-warning-light dark:bg-warning/15 text-warning' },
  1: { label: '已通过', cls: 'bg-success-light dark:bg-success/15 text-success' },
  2: { label: '已拒绝', cls: 'bg-danger-light dark:bg-danger/15 text-danger' },
}

const counts = computed(() => ({
  pending: letters.filter((l) => l.status === 0).length,
  passed: letters.filter((l) => l.status === 1).length,
  rejected: letters.filter((l) => l.status === 2).length,
  all: letters.length,
}))

const filtered = computed(() => {
  let list = letters
  if (letterFilter.value === 'pending') list = list.filter((l) => l.status === 0)
  else if (letterFilter.value === 'passed') list = list.filter((l) => l.status === 1)
  else if (letterFilter.value === 'rejected') list = list.filter((l) => l.status === 2)
  const kw = letterSearch.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (l) =>
        l.id.toLowerCase().includes(kw) ||
        l.title.toLowerCase().includes(kw) ||
        l.sender.toLowerCase().includes(kw) ||
        l.receiver.toLowerCase().includes(kw),
    )
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

// 当前页可勾选的待审核信件
const pagePending = computed(() => paged.value.filter((l) => l.status === 0))
const allSelected = computed(
  () => pagePending.value.length > 0 && pagePending.value.every((l) => selectedIds.value.includes(l.id)),
)

const showBatchBar = computed(() => letterFilter.value === 'pending' && selectedIds.value.length > 0)

function switchTab(key) {
  letterFilter.value = key
  selectedIds.value = []
  currentPage.value = 1
}

function onSearch() {
  letterSearch.value = searchInput.value
  currentPage.value = 1
}

function toggleSelect(id, checked) {
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id]
  } else {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
  }
}

function toggleAll(checked) {
  if (checked) {
    const ids = pagePending.value.map((l) => l.id)
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...ids]))
  } else {
    const pageIds = pagePending.value.map((l) => l.id)
    selectedIds.value = selectedIds.value.filter((x) => !pageIds.includes(x))
  }
}

function clearSelection() {
  selectedIds.value = []
}

function singleAudit(id, action) {
  const letter = letters.find((l) => l.id === id)
  if (!letter) return
  letter.status = action === 'pass' ? 1 : 2
  toast(`信件 ${id} 已${action === 'pass' ? '通过' : '拒绝'}审核`, action === 'pass' ? 'success' : 'warning')
}

function batchAudit(action) {
  if (selectedIds.value.length === 0) return
  const n = selectedIds.value.length
  selectedIds.value.forEach((id) => {
    const l = letters.find((x) => x.id === id)
    if (l && l.status === 0) l.status = action === 'pass' ? 1 : 2
  })
  selectedIds.value = []
  toast(`已${action === 'pass' ? '通过' : '拒绝'} ${n} 封信件审核`, action === 'pass' ? 'success' : 'warning')
}

function goPage(p) {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
}
</script>

<template>
  <!-- 页面头 -->
  <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
    <div>
      <div class="flex items-center gap-2 text-xs text-ink-muted dark:text-ink-darkMuted mb-1">
        <router-link to="/" class="hover:text-primary-500">首页</router-link>
        <BaseIcon name="chevron-right" :size="12" />
        <span>信件模块</span>
        <BaseIcon name="chevron-right" :size="12" />
        <span class="text-ink dark:text-ink-dark">审核管理</span>
      </div>
      <h1 class="text-xl font-bold tracking-tight flex items-center gap-2">
        <BaseIcon name="shield-check" :size="20" class="text-primary-500" /> 信件审核管理
      </h1>
    </div>
    <div class="flex items-center gap-2">
      <button class="btn btn-ghost px-3 py-2 rounded-lg border border-line dark:border-line-dark text-sm flex items-center gap-1.5" @click="toast('已导出 CSV', 'success')">
        <BaseIcon name="download" :size="16" /> 导出
      </button>
      <button class="btn btn-ghost px-3 py-2 rounded-lg border border-line dark:border-line-dark text-sm flex items-center gap-1.5" @click="toast('数据已刷新', 'success')">
        <BaseIcon name="refresh-cw" :size="16" /> 刷新
      </button>
    </div>
  </div>

  <!-- 主体卡片 -->
  <div class="bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark shadow-card overflow-hidden">
    <!-- Tab + 搜索 -->
    <div class="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-line dark:border-line-dark">
      <div class="flex items-center gap-1 p-1 rounded-lg bg-canvas dark:bg-surface-darker">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="px-3 py-1.5 rounded-md text-xs font-medium transition"
          :class="
            letterFilter === t.key
              ? 'bg-surface dark:bg-surface-dark shadow-sm text-primary-500'
              : 'text-ink-muted dark:text-ink-darkMuted hover:text-ink dark:hover:text-ink-dark'
          "
          @click="switchTab(t.key)"
        >
          {{ t.label }}
          <span class="ml-1" :class="letterFilter === t.key ? 'text-primary-500' : 'opacity-70'">{{ counts[t.key] }}</span>
        </button>
      </div>
      <div class="relative w-full sm:w-64">
        <BaseIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-darkMuted" />
        <input
          v-model="searchInput"
          type="text"
          placeholder="搜索信件 ID / 标题 / 行星编号"
          class="w-full pl-9 pr-3 py-2 rounded-lg bg-canvas dark:bg-surface-darker border border-transparent focus:border-primary-500 focus:bg-surface dark:focus:bg-surface-dark text-sm focus:outline-none transition"
          @input="onSearch"
        />
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div
      class="items-center justify-between gap-3 px-4 py-3 bg-primary-50 dark:bg-primary-500/10 border-b border-primary-100 dark:border-primary-500/20"
      :class="showBatchBar ? 'flex' : 'hidden'"
    >
      <div class="flex items-center gap-2 text-sm">
        <BaseIcon name="check-square" :size="16" class="text-primary-500" />
        <span>已选择 <span class="font-bold text-primary-600 dark:text-primary-400">{{ selectedIds.length }}</span> 项</span>
        <button class="ml-2 text-xs text-ink-muted dark:text-ink-darkMuted hover:text-primary-500" @click="clearSelection">取消选择</button>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn btn-success px-3 py-1.5 rounded-md bg-success text-white text-xs font-medium flex items-center gap-1.5" @click="batchAudit('pass')">
          <BaseIcon name="check" :size="14" /> 批量通过审核
        </button>
        <button class="btn btn-danger px-3 py-1.5 rounded-md bg-danger text-white text-xs font-medium flex items-center gap-1.5" @click="batchAudit('reject')">
          <BaseIcon name="x" :size="14" /> 批量拒绝审核
        </button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="table-head bg-canvas/60 dark:bg-surface-darker/60">
          <tr class="text-left text-xs uppercase tracking-wider text-ink-muted dark:text-ink-darkMuted">
            <th class="px-4 py-3 w-10">
              <input
                v-if="letterFilter === 'pending' && pagePending.length > 0"
                type="checkbox"
                class="cb"
                :checked="allSelected"
                @change="toggleAll($event.target.checked)"
              />
            </th>
            <th class="px-4 py-3">信件 ID</th>
            <th class="px-4 py-3">寄件人</th>
            <th class="px-4 py-3">收件人</th>
            <th class="px-4 py-3">信件标题</th>
            <th class="px-4 py-3">付费</th>
            <th class="px-4 py-3">状态</th>
            <th class="px-4 py-3">创建时间</th>
            <th class="px-4 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line dark:divide-line-dark">
          <tr v-for="l in paged" :key="l.id" class="data-row" :class="{ selected: selectedIds.includes(l.id) }">
            <td class="px-4 py-3">
              <input
                v-if="l.status === 0"
                type="checkbox"
                class="cb"
                :checked="selectedIds.includes(l.id)"
                @change="toggleSelect(l.id, $event.target.checked)"
              />
            </td>
            <td class="px-4 py-3 font-mono text-xs text-ink-muted dark:text-ink-darkMuted">{{ l.id }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1.5">
                <span class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 grid place-items-center text-[10px] text-white font-bold">{{ l.sender[0] }}</span>
                <span class="font-mono text-xs">{{ l.sender }}</span>
              </span>
            </td>
            <td class="px-4 py-3 font-mono text-xs">{{ l.receiver }}</td>
            <td class="px-4 py-3 max-w-xs">
              <p class="font-medium truncate">{{ l.title }}</p>
              <p class="text-xs text-ink-muted dark:text-ink-darkMuted mt-0.5 flex items-center gap-1">
                <BaseIcon name="map-pin" :size="12" /> {{ l.coords }}
              </p>
            </td>
            <td class="px-4 py-3">
              <span v-if="l.paid" class="inline-flex items-center gap-1 text-xs font-semibold text-success">
                <BaseIcon name="badge-dollar-sign" :size="14" /> ¥{{ l.amount }}
              </span>
              <span v-else class="text-xs text-ink-muted dark:text-ink-darkMuted">免费</span>
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md" :class="statusMap[l.status].cls">
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span> {{ statusMap[l.status].label }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-ink-muted dark:text-ink-darkMuted whitespace-nowrap">{{ l.createdAt }}</td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <template v-if="l.status === 0">
                <button class="btn btn-ghost p-1.5 rounded-md hover:bg-success-light dark:hover:bg-success/15 hover:text-success" title="通过" @click="singleAudit(l.id, 'pass')">
                  <BaseIcon name="check" :size="16" />
                </button>
                <button class="btn btn-ghost p-1.5 rounded-md hover:bg-danger-light dark:hover:bg-danger/15 hover:text-danger" title="拒绝" @click="singleAudit(l.id, 'reject')">
                  <BaseIcon name="x" :size="16" />
                </button>
              </template>
              <button class="btn btn-ghost p-1.5 rounded-md hover:bg-canvas dark:hover:bg-surface-darker" title="查看" @click="toast('查看信件详情：' + l.id, 'info')">
                <BaseIcon name="eye" :size="16" />
              </button>
            </td>
          </tr>

          <tr v-if="paged.length === 0">
            <td colspan="9" class="py-16">
              <div class="flex flex-col items-center justify-center text-center empty-illus py-8">
                <div class="w-16 h-16 rounded-full bg-canvas dark:bg-surface-darker grid place-items-center mb-3">
                  <BaseIcon name="inbox" :size="28" class="text-ink-muted dark:text-ink-darkMuted" />
                </div>
                <p class="text-sm font-medium">暂无符合条件的信件</p>
                <p class="text-xs text-ink-muted dark:text-ink-darkMuted mt-1">试试调整筛选条件或搜索关键词</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="flex items-center justify-between p-4 border-t border-line dark:border-line-dark text-sm">
      <p class="text-xs text-ink-muted dark:text-ink-darkMuted">共 <span>{{ filtered.length }}</span> 条</p>
      <div class="flex items-center gap-1">
        <button
          class="px-2.5 py-1.5 rounded-md border border-line dark:border-line-dark text-xs hover:bg-canvas dark:hover:bg-surface-darker disabled:opacity-40"
          :disabled="currentPage === 1"
          @click="goPage(currentPage - 1)"
        >
          上一页
        </button>
        <button
          v-for="p in totalPages"
          :key="p"
          class="px-3 py-1.5 rounded-md text-xs font-medium"
          :class="
            p === currentPage
              ? 'bg-primary-500 text-white'
              : 'px-2.5 py-1.5 rounded-md border border-line dark:border-line-dark hover:bg-canvas dark:hover:bg-surface-darker'
          "
          @click="goPage(p)"
        >
          {{ p }}
        </button>
        <button
          class="px-2.5 py-1.5 rounded-md border border-line dark:border-line-dark text-xs hover:bg-canvas dark:hover:bg-surface-darker disabled:opacity-40"
          :disabled="currentPage === totalPages"
          @click="goPage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>
