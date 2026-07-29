import { ref, watch } from 'vue'

const STORAGE_THEME = 'sl_theme'

const isDark = ref(localStorage.getItem(STORAGE_THEME) === 'dark')

function applyTheme(value) {
  document.documentElement.classList.toggle('dark', value)
}

// 初始化应用主题
applyTheme(isDark.value)
document.documentElement.classList.add('theme-transition')

watch(isDark, (value) => {
  localStorage.setItem(STORAGE_THEME, value ? 'dark' : 'light')
  applyTheme(value)
})

export function useTheme() {
  function toggle() {
    isDark.value = !isDark.value
  }
  return { isDark, toggle }
}
