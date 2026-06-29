<template>
  <div class="login-page">
    <div class="login-box">
      <h2><el-icon><Cpu /></el-icon> 开发板库存管理系统</h2>
      <el-form @submit.prevent="handleLogin">
        <el-form-item>
          <el-input v-model="form.username" placeholder="请输入账号" prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.remember">记住登录状态（15天）</el-checkbox>
        </el-form-item>
        <el-button type="primary" style="width:100%" @click="handleLogin" :loading="loading">登录</el-button>
      </el-form>
      <div class="guest-entry">
        <el-button style="width:100%;margin-top:16px" @click="handleGuest">访客模式</el-button>
        <p class="guest-hint">无需登录，仅可查看数据</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const form = reactive({ username: '', password: '', remember: false })

async function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}

function handleGuest() {
  userStore.enterGuest()
  ElMessage.info('已进入访客模式，仅可查看数据')
  router.push('/dashboard')
}
</script>

<style scoped>
.login-page { height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.login-box { background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 400px; }
.login-box h2 { text-align: center; margin-bottom: 24px; color: rgba(0,0,0,0.85); }
.guest-entry { margin-top: 16px; text-align: center; }
.guest-hint { font-size: 12px; color: rgba(0,0,0,0.45); margin-top: 8px; }
</style>
