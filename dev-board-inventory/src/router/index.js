import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue') },
      { path: 'inventory', name: 'Inventory', component: () => import('@/views/Inventory.vue') },
      { path: 'import', name: 'Import', component: () => import('@/views/Import.vue'), meta: { admin: true } },
      { path: 'accounts', name: 'Accounts', component: () => import('@/views/Accounts.vue'), meta: { admin: true } },
      { path: 'profile', name: 'Profile', component: () => import('@/views/Profile.vue') },
      { path: 'logs', name: 'Logs', component: () => import('@/views/Logs.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.public) {
    next()
    return
  }

  if (!userStore.token && !userStore.isGuest) {
    next('/login')
    return
  }

  if (to.meta.admin && userStore.role !== 'admin' && !userStore.isGuest) {
    next('/dashboard')
    return
  }

  if (userStore.isGuest && to.meta.admin) {
    next('/dashboard')
    return
  }

  next()
})

export default router
