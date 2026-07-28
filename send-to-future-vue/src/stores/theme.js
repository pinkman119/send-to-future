import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 主题状态：管理明亮/暗黑模式，偏好持久化到 localStorage。
 */
export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem('stf_theme') === 'dark')

  /** 将当前主题应用到 <html data-theme> 属性上。 */
  function apply() {
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  }

  /** 初始化主题（应用启动时调用）。 */
  function init() {
    apply()
  }

  /** 切换明暗模式并持久化。 */
  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem('stf_theme', isDark.value ? 'dark' : 'light')
    apply()
  }

  return { isDark, init, toggle }
})
