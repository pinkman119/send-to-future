<template>
  <div>
    <div class="page-head">
      <nav class="breadcrumb">
        <a href="javascript:void(0)">首页</a>
        <span class="sep">/</span>
        <span>信件管理</span>
        <span class="sep">/</span>
        <span class="current">审核管理</span>
      </nav>
      <div class="page-head-row">
        <div>
          <h1 class="page-title">信件审核管理</h1>
          <p class="page-sub">审核 status=0 的待审信件，支持批量通过 / 批量拒绝。</p>
        </div>
        <div class="page-toolbar">
          <span class="badge warning"><span class="dot"></span>{{ pendingLetters.length }} 封待审核</span>
        </div>
      </div>
    </div>

    <!-- 批量操作工具栏 -->
    <div class="card mb-4">
      <div class="card-body d-flex align-center gap-3" style="flex-wrap: wrap">
        <div class="search-box" style="max-width: 300px">
          <svg class="search-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input v-model="keyword" class="form-control" placeholder="搜索信件编号 / 发送者 / 关键词" />
        </div>
        <span class="text-muted">已选 {{ selectedIds.size }} 项</span>
        <div class="flex-1"></div>
        <button class="btn btn-success" :disabled="selectedIds.size === 0" @click="batchApprove">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          批量通过审核
        </button>
        <button class="btn btn-danger" :disabled="selectedIds.size === 0" @click="batchReject">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          批量拒绝审核
        </button>
      </div>
    </div>

    <!-- 待审信件列表 -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">待审核信件</h2>
        <label class="d-flex align-center gap-2 text-muted" style="cursor: pointer; font-size: 0.85rem">
          <input type="checkbox" :checked="allChecked" @change="toggleAll" />
          全选
        </label>
      </div>
      <div class="card-body" style="padding: 0">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 48px"></th>
              <th>信件编号</th>
              <th>发送者</th>
              <th>内容摘要</th>
              <th>关键词</th>
              <th>渠道</th>
              <th>提交时间</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="letter in filteredPending" :key="letter.letter_id">
              <td>
                <input type="checkbox" :value="letter.letter_id" v-model="selectedIdsArray" />
              </td>
              <td class="nowrap">{{ letter.letter_no }}</td>
              <td>{{ getNickname(letter.sender_id) }}</td>
              <td style="max-width: 280px">{{ letter.content }}</td>
              <td>{{ letter.keyword || '—' }}</td>
              <td>{{ CHANNEL_TEXT[letter.channel_code] }}</td>
              <td class="nowrap">{{ letter.create_time }}</td>
              <td><span class="badge warning"><span class="dot"></span>审核中</span></td>
            </tr>
            <tr v-if="filteredPending.length === 0">
              <td class="empty" colspan="8">🎉 暂无待审核信件，队列已清空</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { pendingLetters, updateLettersStatus } from '@/stores/data'
import { getNickname, CHANNEL_TEXT } from '@/mock/data'

// 选中的信件 id（使用数组以便 v-model 绑定复选框）。
const selectedIdsArray = ref([])
const selectedIds = computed(() => new Set(selectedIdsArray.value))

// 关键词搜索：编号 / 发送者昵称 / 关键词。
const keyword = ref('')
const filteredPending = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return pendingLetters.value
  return pendingLetters.value.filter((l) => {
    const nick = getNickname(l.sender_id).toLowerCase()
    return (
      l.letter_no.toLowerCase().includes(k) ||
      nick.includes(k) ||
      (l.keyword || '').toLowerCase().includes(k)
    )
  })
})

// 是否全选（仅针对当前过滤后的待审列表）。
const allChecked = computed({
  get: () => filteredPending.value.length > 0 && selectedIdsArray.value.length === filteredPending.value.length,
  set: (val) => {
    selectedIdsArray.value = val ? filteredPending.value.map((l) => l.letter_id) : []
  }
})

/** 切换全选。 */
function toggleAll(e) {
  allChecked.value = e.target.checked
}

/** 批量通过审核：status -> 1（旅行中）。 */
function batchApprove() {
  updateLettersStatus(selectedIdsArray.value, 1)
  selectedIdsArray.value = []
}

/** 批量拒绝审核：status -> 3（审核驳回）。 */
function batchReject() {
  updateLettersStatus(selectedIdsArray.value, 3)
  selectedIdsArray.value = []
}
</script>
