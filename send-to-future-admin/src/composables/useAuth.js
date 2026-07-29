import { ref } from 'vue'

const STORAGE_AUTH = 'sl_auth'

const raw = localStorage.getItem(STORAGE_AUTH)
const auth = ref(raw ? JSON.parse(raw) : null)

function persist() {
  if (auth.value) {
    localStorage.setItem(STORAGE_AUTH, JSON.stringify(auth.value))
  } else {
    localStorage.removeItem(STORAGE_AUTH)
  }
}

export function useAuth() {
  const isLoggedIn = ref(!!auth.value)

  function login(email) {
    auth.value = {
      email,
      name: '星河管理员',
      role: '超级管理员',
      avatar: null,
      loginAt: new Date().toISOString(),
    }
    isLoggedIn.value = true
    persist()
  }

  function logout() {
    auth.value = null
    isLoggedIn.value = false
    persist()
  }

  return { auth, isLoggedIn, login, logout }
}
