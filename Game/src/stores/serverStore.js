import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../api/index.js'

export const useServerStore = defineStore('server', () => {
  const user = ref(null)

  const isLoggedIn = computed(() => !!user.value)

  async function register(username, password) {
    const data = await api.auth.register(username, password)
    user.value = data.user
    return data
  }

  async function login(username, password) {
    const data = await api.auth.login(username, password)
    user.value = data.user
    return data
  }

  async function fetchMe() {
    try {
      const data = await api.auth.me()
      user.value = data.user
    } catch {
      logout()
    }
  }

  async function logout() {
    try { await api.auth.logout() } catch { /* ignorar error de red */ }
    user.value = null
  }

  return { user, isLoggedIn, register, login, fetchMe, logout }
})
