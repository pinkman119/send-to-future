<script setup>
import { useRoute } from 'vue-router'
import { pendingLettersCount } from '@/data/mock'
import BaseIcon from '@/components/ui/BaseIcon.vue'

defineProps({
  collapsed: { type: Boolean, default: false },
})

const route = useRoute()

function isActive(path) {
  return route.path === path
}
</script>

<template>
  <aside
    id="sidebar"
    class="fixed top-[65px] left-0 bottom-0 w-[265px] bg-surface dark:bg-surface-dark border-r border-line dark:border-line-dark z-30 flex flex-col transition-[width] duration-200"
    :class="{ 'sidebar-collapsed': collapsed }"
  >
    <nav class="flex-1 overflow-y-auto py-4 px-3">
      <p class="nav-section-title px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted dark:text-ink-darkMuted">主菜单</p>

      <router-link
        to="/"
        class="nav-item relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink dark:text-ink-dark hover:bg-canvas dark:hover:bg-surface-darker mb-0.5"
        :class="{ active: isActive('/') }"
      >
        <BaseIcon name="layout-dashboard" :size="20" class="nav-icon text-ink-muted dark:text-ink-darkMuted" />
        <span class="nav-label">首页</span>
      </router-link>

      <p class="nav-section-title px-3 mt-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted dark:text-ink-darkMuted">信件模块</p>

      <router-link
        to="/letter-audit"
        class="nav-item relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink dark:text-ink-dark hover:bg-canvas dark:hover:bg-surface-darker mb-0.5"
        :class="{ active: isActive('/letter-audit') }"
      >
        <BaseIcon name="shield-check" :size="20" class="nav-icon text-ink-muted dark:text-ink-darkMuted" />
        <span class="nav-label">审核管理</span>
        <span
          v-if="pendingLettersCount > 0"
          class="nav-badge ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-danger-light dark:bg-danger/15 text-danger"
          >{{ pendingLettersCount }}</span
        >
      </router-link>

      <router-link
        to="/coord-manage"
        class="nav-item relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink dark:text-ink-dark hover:bg-canvas dark:hover:bg-surface-darker mb-0.5"
        :class="{ active: isActive('/coord-manage') }"
      >
        <BaseIcon name="map-pin" :size="20" class="nav-icon text-ink-muted dark:text-ink-darkMuted" />
        <span class="nav-label">坐标管理</span>
      </router-link>

      <p class="nav-section-title px-3 mt-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted dark:text-ink-darkMuted">其他</p>

      <div
        class="nav-item relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink dark:text-ink-dark hover:bg-canvas dark:hover:bg-surface-darker mb-0.5 cursor-default opacity-60"
      >
        <BaseIcon name="users" :size="20" class="nav-icon text-ink-muted dark:text-ink-darkMuted" />
        <span class="nav-label">用户管理</span>
        <span class="nav-badge ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-canvas dark:bg-surface-darker text-ink-muted dark:text-ink-darkMuted">待开放</span>
      </div>
      <div
        class="nav-item relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink dark:text-ink-dark hover:bg-canvas dark:hover:bg-surface-darker mb-0.5 cursor-default opacity-60"
      >
        <BaseIcon name="settings" :size="20" class="nav-icon text-ink-muted dark:text-ink-darkMuted" />
        <span class="nav-label">系统设置</span>
        <span class="nav-badge ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-canvas dark:bg-surface-darker text-ink-muted dark:text-ink-darkMuted">待开放</span>
      </div>
    </nav>

    <!-- Sidebar 底部 -->
    <div class="sidebar-footer p-4 border-t border-line dark:border-line-dark">
      <div class="rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 p-4 text-white relative overflow-hidden">
        <div class="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/10"></div>
        <div class="absolute -right-8 top-8 w-20 h-20 rounded-full bg-white/5"></div>
        <div class="relative">
          <BaseIcon name="sparkles" :size="20" class="mb-2" />
          <p class="text-sm font-semibold">星信 Pro</p>
          <p class="text-[11px] text-white/80 mt-0.5">解锁高级审核流程</p>
          <button class="mt-3 w-full py-1.5 rounded-md bg-white/20 hover:bg-white/30 text-xs font-medium transition">立即升级</button>
        </div>
      </div>
    </div>
  </aside>
</template>
