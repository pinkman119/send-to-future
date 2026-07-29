<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useAuth } from '@/composables/useAuth'
import BaseIcon from '@/components/ui/BaseIcon.vue'

defineProps({
  collapsed: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle-sidebar'])

const router = useRouter()
const { isDark, toggle: toggleTheme } = useTheme()
const { auth, logout } = useAuth()

const userMenuOpen = ref(false)
const userMenuRef = ref(null)

function onDocClick(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    userMenuOpen.value = false
  }
}

function handleLogout() {
  logout()
  router.push('/login')
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 h-[65px] bg-surface dark:bg-surface-dark border-b border-line dark:border-line-dark z-40 flex items-center px-4 lg:px-6"
  >
    <!-- 左：折叠 + Logo -->
    <div class="flex items-center gap-3">
      <button
        class="w-9 h-9 rounded-lg hover:bg-canvas dark:hover:bg-surface-darker grid place-items-center text-ink-muted dark:text-ink-darkMuted"
        aria-label="折叠菜单"
        @click="emit('toggle-sidebar')"
      >
        <BaseIcon name="menu" :size="20" />
      </button>
      <router-link to="/" class="flex items-center gap-2.5">
        <div
          class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 grid place-items-center shadow-glow"
        >
          <BaseIcon name="orbit" :size="20" class="text-white" />
        </div>
        <div class="hidden sm:block">
          <p class="text-base font-bold leading-none tracking-tight">星信</p>
          <p class="text-[10px] text-ink-muted dark:text-ink-darkMuted mt-0.5">Stellar Letters Admin</p>
        </div>
      </router-link>
    </div>

    <!-- 中：搜索（隐藏在小屏） -->
    <div class="hidden md:flex flex-1 max-w-md mx-8">
      <div class="relative w-full">
        <BaseIcon
          name="search"
          :size="16"
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-darkMuted"
        />
        <input
          type="text"
          placeholder="搜索信件、用户、坐标…"
          class="w-full pl-10 pr-16 py-2 rounded-lg bg-canvas dark:bg-surface-darker border border-transparent focus:border-primary-500 focus:bg-surface dark:focus:bg-surface-dark text-sm focus:outline-none transition"
        />
        <kbd
          class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded border border-line dark:border-line-dark text-ink-muted dark:text-ink-darkMuted"
          >⌘K</kbd
        >
      </div>
    </div>

    <!-- 右：操作区 -->
    <div class="flex items-center gap-1 ml-auto">
      <!-- 主题切换 -->
      <button
        class="w-9 h-9 rounded-lg hover:bg-canvas dark:hover:bg-surface-darker grid place-items-center text-ink-muted dark:text-ink-darkMuted"
        aria-label="切换主题"
        @click="toggleTheme"
      >
        <BaseIcon v-if="isDark" name="sun" :size="20" class="text-amber-400" />
        <BaseIcon v-else name="moon" :size="20" />
      </button>

      <!-- 通知 -->
      <button
        class="relative w-9 h-9 rounded-lg hover:bg-canvas dark:hover:bg-surface-darker grid place-items-center text-ink-muted dark:text-ink-darkMuted"
        aria-label="通知"
      >
        <BaseIcon name="bell" :size="20" />
        <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger pulse-dot"></span>
      </button>

      <!-- 分隔线 -->
      <div class="hidden sm:block w-px h-6 bg-line dark:bg-line-dark mx-2"></div>

      <!-- 用户菜单 -->
      <div ref="userMenuRef" class="relative">
        <button
          class="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-canvas dark:hover:bg-surface-darker"
          @click="userMenuOpen = !userMenuOpen"
        >
          <div
            class="w-8 h-8 rounded-full avatar-gradient grid place-items-center text-white text-sm font-bold"
          >
            星
          </div>
          <div class="hidden sm:block text-left">
            <p class="text-sm font-semibold leading-none">{{ auth?.name || '管理员' }}</p>
            <p class="text-[11px] text-ink-muted dark:text-ink-darkMuted mt-0.5">
              {{ auth?.role || '管理员' }}
            </p>
          </div>
          <BaseIcon name="chevron-down" :size="16" class="text-ink-muted dark:text-ink-darkMuted hidden sm:block" />
        </button>

        <!-- 下拉菜单 -->
        <transition name="dropdown">
          <div
            v-if="userMenuOpen"
            class="absolute right-0 top-[calc(100%+8px)] w-60 bg-surface dark:bg-surface-dark border border-line dark:border-line-dark rounded-xl shadow-dropdown py-2 z-50"
          >
            <div class="px-4 py-3 border-b border-line dark:border-line-dark">
              <p class="text-sm font-semibold">{{ auth?.name || '管理员' }}</p>
              <p class="text-xs text-ink-muted dark:text-ink-darkMuted mt-0.5">{{ auth?.email }}</p>
            </div>
            <div class="py-1">
              <router-link
                to="/"
                class="flex items-center gap-3 px-4 py-2 text-sm hover:bg-canvas dark:hover:bg-surface-darker cursor-pointer"
              >
                <BaseIcon name="user-circle" :size="16" class="text-ink-muted dark:text-ink-darkMuted" /> 个人资料
              </router-link>
              <router-link
                to="/"
                class="flex items-center gap-3 px-4 py-2 text-sm hover:bg-canvas dark:hover:bg-surface-darker cursor-pointer"
              >
                <BaseIcon name="settings" :size="16" class="text-ink-muted dark:text-ink-darkMuted" /> 账号设置
              </router-link>
              <router-link
                to="/"
                class="flex items-center gap-3 px-4 py-2 text-sm hover:bg-canvas dark:hover:bg-surface-darker cursor-pointer"
              >
                <BaseIcon name="help-circle" :size="16" class="text-ink-muted dark:text-ink-darkMuted" /> 帮助中心
              </router-link>
            </div>
            <div class="border-t border-line dark:border-line-dark pt-1">
              <button
                class="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-danger-light dark:hover:bg-danger/10"
                @click="handleLogout"
              >
                <BaseIcon name="log-out" :size="16" /> 退出登录
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.18s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
