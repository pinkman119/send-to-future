<template>
  <header class="app-header">
    <button class="icon-btn hamburger" title="菜单" @click="$emit('toggle-sidebar')">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
    </button>

    <div class="header-spacer"></div>

    <!-- 暗黑模式切换 -->
    <button class="icon-btn" :title="theme.isDark ? '切换为明亮模式' : '切换为暗黑模式'" @click="theme.toggle()">
      <svg v-if="theme.isDark" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>

    <!-- 用户信息下拉 -->
    <div class="user-menu">
      <button class="user-trigger" @click="open = !open">
        <span class="avatar">{{ initial }}</span>
        <span class="user-meta d-none d-md-block">
          <span class="name">{{ auth.user?.name }}</span>
          <span class="role d-block">{{ auth.user?.role }}</span>
        </span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-muted)">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div v-if="open" class="dropdown-panel" @click.stop>
        <div class="dd-header">
          <div style="font-weight: 600">{{ auth.user?.name }}</div>
          <div class="text-muted" style="font-size: 0.8rem">{{ auth.user?.email }}</div>
        </div>
        <button class="dd-item" @click="open = false">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
          个人资料
        </button>
        <button class="dd-item" @click="open = false">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L16.5 3h-3l-.5 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2L13 21h3l.5-2.5a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" />
          </svg>
          账户设置
        </button>
        <div style="height: 1px; background: var(--border-color); margin: 0.4rem 0"></div>
        <button class="dd-item danger" @click="logout">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          退出登录
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

defineEmits(['toggle-sidebar'])

const auth = useAuthStore()
const theme = useThemeStore()
const router = useRouter()
const open = ref(false)

// 头像取昵称首字。
const initial = computed(() => (auth.user?.name || '管').slice(0, 1))

/** 关闭下拉并退出登录，跳回登录页。 */
function logout() {
  open.value = false
  auth.logout()
  router.push({ name: 'login' })
}

// 点击外部关闭用户下拉菜单。
function onDocClick() {
  open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>
