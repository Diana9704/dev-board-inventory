<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background: #001529">
      <div class="logo">
        <el-icon><Cpu /></el-icon> <span>开发板管理</span>
      </div>
      <el-menu :default-active="$route.path" router background-color="#001529" text-color="rgba(255,255,255,0.7)" active-text-color="#fff">
        <el-menu-item index="/dashboard"><el-icon><Odometer /></el-icon><span>数据概览</span></el-menu-item>
        <el-menu-item index="/inventory"><el-icon><Box /></el-icon><span>库存管理</span></el-menu-item>
        <el-menu-item v-if="userStore.isAdmin" index="/import"><el-icon><Upload /></el-icon><span>批量导入</span></el-menu-item>
        <el-menu-item v-if="userStore.isAdmin" index="/accounts"><el-icon><UserFilled /></el-icon><span>账号管理</span></el-menu-item>
        <el-menu-item v-if="!userStore.isGuest" index="/profile"><el-icon><User /></el-icon><span>个人中心</span></el-menu-item>
        <el-menu-item v-if="!userStore.isGuest" index="/logs"><el-icon><Timer /></el-icon><span>操作日志</span></el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="display:flex;align-items:center;justify-content:space-between;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.1)">
        <span></span>
        <div style="display:flex;align-items:center;gap:12px">
          <el-tag v-if="userStore.isGuest" type="info"><el-icon><User /></el-icon> 访客模式</el-tag>
          <el-dropdown v-if="!userStore.isGuest">
            <span style="cursor:pointer">{{ userStore.user?.name }} <el-icon><ArrowDown /></el-icon></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/profile')">个人中心</el-dropdown-item>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button v-if="userStore.isGuest" size="small" @click="handleLogout">退出访客</el-button>
        </div>
      </el-header>
      <el-main style="background:#f0f2f5;padding:24px">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.logo { height: 64px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); }
.logo .el-icon { margin-right: 8px; font-size: 24px; }
</style>
