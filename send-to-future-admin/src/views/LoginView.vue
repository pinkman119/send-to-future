<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import BaseIcon from '@/components/ui/BaseIcon.vue'

const router = useRouter()
const { toggle: toggleTheme } = useTheme()
const { login } = useAuth()
const { toast } = useToast()

const email = ref('admin@stellarletters.app')
const password = ref('')
const remember = ref(true)
const showPwd = ref(false)
const errorMsg = ref('')
const errorVisible = ref(false)
const loading = ref(false)
const formRef = ref(null)

function togglePwd() {
  showPwd.value = !showPwd.value
}

function submit() {
  errorVisible.value = false
  if (!email.value.trim()) {
    errorMsg.value = '请输入邮箱账号'
    errorVisible.value = true
    shake()
    return
  }
  if (!password.value) {
    errorMsg.value = '请输入密码（任意非空即可）'
    errorVisible.value = true
    shake()
    return
  }

  loading.value = true
  setTimeout(() => {
    login(email.value.trim())
    router.push('/')
  }, 600)
}

function shake() {
  if (!formRef.value) return
  formRef.value.classList.add('shake')
  setTimeout(() => formRef.value && formRef.value.classList.remove('shake'), 400)
}
</script>

<template>
  <div class="min-h-screen grid lg:grid-cols-2 bg-canvas dark:bg-canvas-dark">
    <!-- 左侧品牌视觉区 -->
    <aside class="relative hidden lg:block brand-canvas overflow-hidden">
      <div class="aurora"></div>

      <!-- 轨道装饰 -->
      <div class="orbit" style="width: 520px; height: 520px; left: -120px; top: 50%; transform: translateY(-50%)"></div>
      <div class="orbit" style="width: 760px; height: 760px; left: -240px; top: 50%; transform: translateY(-50%)"></div>
      <div class="orbit-dot" style="left: 360px; top: 50%"></div>
      <div class="orbit-dot" style="left: 500px; top: 38%; background: #7c3aed; box-shadow: 0 0 12px rgba(124, 58, 237, 0.8)"></div>

      <div class="relative h-full flex flex-col justify-between p-12 text-white">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 grid place-items-center shadow-glow">
            <BaseIcon name="orbit" :size="24" class="text-white" />
          </div>
          <div>
            <p class="text-lg font-bold tracking-tight">星信</p>
            <p class="text-xs text-white/60">Stellar Letters</p>
          </div>
        </div>

        <!-- Slogan -->
        <div class="max-w-md">
          <h1 class="text-4xl font-extrabold leading-tight tracking-tight">让每封信件<br />穿越星河抵达</h1>
          <p class="mt-4 text-white/70 leading-relaxed">
            星信管理后台 · 一站式审核信件内容、追踪坐标轨迹、洞察运营数据。基于 Metronic 8 设计语言打造。
          </p>

          <!-- 特性 -->
          <div class="mt-10 grid grid-cols-2 gap-5">
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded-lg bg-white/10 grid place-items-center backdrop-blur">
                <BaseIcon name="shield-check" :size="16" class="text-primary-300" />
              </div>
              <div>
                <p class="text-sm font-semibold">安全审核</p>
                <p class="text-xs text-white/55 mt-0.5">批量审核流程</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded-lg bg-white/10 grid place-items-center backdrop-blur">
                <BaseIcon name="map-pin" :size="16" class="text-primary-300" />
              </div>
              <div>
                <p class="text-sm font-semibold">坐标管理</p>
                <p class="text-xs text-white/55 mt-0.5">轨迹可视化</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded-lg bg-white/10 grid place-items-center backdrop-blur">
                <BaseIcon name="bar-chart-3" :size="16" class="text-primary-300" />
              </div>
              <div>
                <p class="text-sm font-semibold">数据洞察</p>
                <p class="text-xs text-white/55 mt-0.5">实时运营指标</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded-lg bg-white/10 grid place-items-center backdrop-blur">
                <BaseIcon name="moon-star" :size="16" class="text-primary-300" />
              </div>
              <div>
                <p class="text-sm font-semibold">暗色模式</p>
                <p class="text-xs text-white/55 mt-0.5">护眼夜观星象</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部 -->
        <p class="text-xs text-white/40">© 2026 Stellar Letters · 管理后台 v1.0</p>
      </div>
    </aside>

    <!-- 右侧表单区 -->
    <main class="relative flex items-center justify-center p-6 sm:p-12 bg-canvas dark:bg-canvas-dark">
      <!-- 顶部右侧：暗色切换 -->
      <button
        class="absolute top-6 right-6 w-10 h-10 rounded-lg border border-line dark:border-line-dark grid place-items-center hover:bg-white dark:hover:bg-surface-dark transition"
        aria-label="切换主题"
        @click="toggleTheme"
      >
        <BaseIcon name="sun" :size="20" class="hidden dark:block text-amber-400" />
        <BaseIcon name="moon" :size="20" class="block dark:hidden text-ink-muted" />
      </button>

      <div class="w-full max-w-md fade-in">
        <!-- 移动端 Logo -->
        <div class="lg:hidden flex items-center gap-3 mb-8">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 grid place-items-center shadow-glow">
            <BaseIcon name="orbit" :size="24" class="text-white" />
          </div>
          <div>
            <p class="text-lg font-bold tracking-tight text-ink dark:text-ink-dark">星信</p>
            <p class="text-xs text-ink-muted dark:text-ink-darkMuted">Stellar Letters</p>
          </div>
        </div>

        <div class="mb-8">
          <h2 class="text-2xl font-bold tracking-tight">欢迎回来 👋</h2>
          <p class="mt-2 text-sm text-ink-muted dark:text-ink-darkMuted">输入任意密码即可登录管理后台（演示模式）</p>
        </div>

        <form ref="formRef" class="space-y-5" novalidate @submit.prevent="submit">
          <!-- 邮箱 -->
          <div>
            <label class="block text-sm font-medium mb-2 text-ink dark:text-ink-dark">邮箱账号</label>
            <div class="relative">
              <BaseIcon
                name="mail"
                :size="18"
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-darkMuted"
              />
              <input
                v-model="email"
                type="email"
                placeholder="your@email.com"
                class="field-input w-full pl-11 pr-4 py-3 rounded-lg bg-white dark:bg-surface-dark border border-line dark:border-line-dark text-sm text-ink dark:text-ink-dark placeholder:text-ink-muted/60 dark:placeholder:text-ink-darkMuted/60 focus:outline-none"
              />
            </div>
          </div>

          <!-- 密码 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-ink dark:text-ink-dark">密码</label>
              <a
                href="#"
                class="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                @click.prevent="toast('演示模式：任意密码即可登录')"
                >忘记密码？</a
              >
            </div>
            <div class="relative">
              <BaseIcon
                name="lock"
                :size="18"
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-darkMuted"
              />
              <input
                v-model="password"
                :type="showPwd ? 'text' : 'password'"
                placeholder="输入任意密码"
                class="field-input w-full pl-11 pr-12 py-3 rounded-lg bg-white dark:bg-surface-dark border border-line dark:border-line-dark text-sm text-ink dark:text-ink-dark placeholder:text-ink-muted/60 dark:placeholder:text-ink-darkMuted/60 focus:outline-none"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-darkMuted hover:text-ink dark:hover:text-ink-dark"
                @click="togglePwd"
              >
                <BaseIcon :name="showPwd ? 'eye-off' : 'eye'" :size="18" />
              </button>
            </div>
            <p class="mt-2 text-xs text-ink-muted dark:text-ink-darkMuted">提示：本演示版本下，任意非空密码均可登录。</p>
          </div>

          <!-- 记住我 -->
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                v-model="remember"
                type="checkbox"
                class="w-4 h-4 rounded border-line dark:border-line-dark text-primary-500 focus:ring-primary-500"
              />
              <span class="text-sm text-ink dark:text-ink-dark">记住我</span>
            </label>
            <span class="text-xs text-ink-muted dark:text-ink-darkMuted">管理员登录</span>
          </div>

          <!-- 错误提示 -->
          <div
            v-show="errorVisible"
            class="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400"
          >
            <BaseIcon name="alert-circle" :size="16" class="flex-shrink-0" />
            <span>{{ errorMsg }}</span>
          </div>

          <!-- 提交按钮 -->
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full py-3 rounded-lg bg-primary-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-80"
          >
            <template v-if="loading">
              <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
              <span>正在登录…</span>
            </template>
            <template v-else>
              <span>登录管理后台</span>
              <BaseIcon name="arrow-right" :size="16" />
            </template>
          </button>
        </form>

        <!-- 底部信息 -->
        <div class="mt-8 pt-6 border-t border-line dark:border-line-dark">
          <p class="text-xs text-center text-ink-muted dark:text-ink-darkMuted">
            登录即表示您同意
            <a href="#" class="text-primary-600 dark:text-primary-400 hover:underline">服务条款</a>
            与
            <a href="#" class="text-primary-600 dark:text-primary-400 hover:underline">隐私政策</a>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
