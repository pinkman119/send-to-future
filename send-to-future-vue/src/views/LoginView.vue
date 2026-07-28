<template>
  <div class="auth-container">
    <!-- 品牌侧栏 -->
    <aside class="auth-aside">
      <div class="brand-lg">
        <span class="logo">星</span>
        <span>寄给未来</span>
      </div>

      <div>
        <div class="aside-title">连接此刻与未来的<br />每一封心意</div>
        <p class="aside-desc">
          管理控制台帮助运营团队审核信件、洞察用户增长与付费情况，并对用户坐标进行集中管理。
        </p>
        <div class="aside-feat">
          <div class="feat-item">
            <span class="chk"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5 9-11" /></svg></span>
            信件审核与批量管理
          </div>
          <div class="feat-item">
            <span class="chk"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5 9-11" /></svg></span>
            用户增长与付费收入看板
          </div>
          <div class="feat-item">
            <span class="chk"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5 9-11" /></svg></span>
            用户坐标集中维护
          </div>
        </div>
      </div>

      <div class="aside-foot">© 2026 寄给未来 · 管理后台</div>
    </aside>

    <!-- 表单区 -->
    <main class="auth-main">
      <div class="login-card">
        <div class="login-logo">星</div>
        <h1 class="login-title">欢迎回来</h1>
        <p class="login-sub">登录管理控制台，管理用户、信件与坐标。</p>

        <form @submit.prevent="onSubmit">
          <label class="form-label">登录密码</label>
          <input
            v-model="password"
            type="password"
            class="form-control"
            placeholder="请输入任意密码（随机密码即可）"
            autocomplete="off"
          />
          <p v-if="error" class="login-error">{{ error }}</p>

          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1.25rem">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
            登 录
          </button>
        </form>

        <div class="login-hint">
          演示环境：输入任意密码即可进入后台（随机密码登录）。后续将对接真实鉴权接口。
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const password = ref('')
const error = ref('')

/** 提交登录：随机密码校验通过后跳转首页或来源页。 */
function onSubmit() {
  error.value = ''
  try {
    auth.login(password.value)
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (e) {
    error.value = e.message
  }
}
</script>

<style scoped>
.login-error {
  color: var(--danger);
  font-size: 0.82rem;
  margin: 0.5rem 0 0;
}
</style>
