import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)
  const isGuest = ref(false)

  const isLoggedIn = computed(() => !!token.value || isGuest.value)
  const role = computed(() => user.value?.role || (isGuest.value ? 'guest' : ''))
  const isAdmin = computed(() => role.value === 'admin')

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password })
    token.value = res.data.token
    user.value = res.data.user
    isGuest.value = false
    localStorage.setItem('token', res.data.token)
    return res.data
  }

  function enterGuest() {
    isGuest.value = true
    token.value = ''
    user.value = { name: '访客', role: 'guest' }
    localStorage.removeItem('token')
  }

  function logout() {
    token.value = ''
    user.value = null
    isGuest.value = false
    localStorage.removeItem('token')
  }

  async function fetchProfile() {
    if (isGuest.value) return
    const res = await api.get('/auth/me')
    user.value = res.data
    return res.data
  }

  return { token, user, isGuest, isLoggedIn, role, isAdmin, login, enterGuest, logout, fetchProfile }
})
