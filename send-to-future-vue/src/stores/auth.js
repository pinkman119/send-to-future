import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 鉴权状态：静态前端阶段采用「随机密码即可登录」的模拟鉴权，
 * token 与用户信息持久化到 localStorage，刷新后保持登录态。
 */
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('stf_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('stf_user') || 'null'))
  const isAuthenticated = ref(!!token.value)

  /**
   * 模拟登录：仅校验密码非空（随机密码即可），成功后写入管理员信息。
   * @param {string} password - 登录密码（任意非空字符串）
   * @throws {Error} 密码为空时抛出
   */
  function login(password) {
    if (!password || !password.trim()) {
      throw new Error('请输入登录密码')
    }
    user.value = {
      id: 1,
      name: '星空管理员',
      role: '超级管理员',
      email: 'admin@send-to-future.app'
    }
    token.value = 'mock-token-' + Date.now()
    isAuthenticated.value = true
    localStorage.setItem('stf_token', token.value)
    localStorage.setItem('stf_user', JSON.stringify(user.value))
  }

  /** 退出登录并清理本地凭证。 */
  function logout() {
    token.value = ''
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem('stf_token')
    localStorage.removeItem('stf_user')
  }

  return { token, user, isAuthenticated, login, logout }
})
