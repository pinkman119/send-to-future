<template>
  <aside class="app-sidebar">
    <div class="brand">
      <span class="logo">星</span>
      <span>寄给未来 · 后台</span>
    </div>
    <nav class="sidebar-menu">
      <div class="menu-section">概览</div>
      <router-link
        to="/"
        class="menu-item"
        :class="{ active: route.name === 'dashboard' }"
        @click="$emit('navigate')"
      >
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
        <span class="label">首页</span>
      </router-link>

      <div class="menu-section">信件管理</div>
      <router-link
        to="/letters/review"
        class="menu-item"
        :class="{ active: route.name === 'letter-review' }"
        @click="$emit('navigate')"
      >
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16v16H4z" />
          <path d="M4 7l8 5 8-5" />
        </svg>
        <span class="label">审核管理</span>
        <span v-if="pendingCount > 0" class="menu-badge">{{ pendingCount }}</span>
      </router-link>

      <router-link
        to="/coords"
        class="menu-item"
        :class="{ active: route.name === 'coord-manage' }"
        @click="$emit('navigate')"
      >
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        <span class="label">坐标管理</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { pendingLetters } from '@/stores/data'

defineEmits(['navigate'])

const route = useRoute()
// 待审核信件数量（status=0），用于菜单徽标提示。
const pendingCount = pendingLetters
</script>
