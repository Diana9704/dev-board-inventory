<template>
  <div>
    <h2 style="margin-bottom: 24px">个人中心</h2>
    <el-card style="max-width: 600px">
      <h3 style="margin-bottom: 16px">基本信息</h3>
      <div style="margin-bottom: 16px"><strong>账号：</strong>{{ userStore.user?.username }}</div>
      <div style="margin-bottom: 16px"><strong>姓名：</strong>{{ userStore.user?.name }}</div>
      <div style="margin-bottom: 16px"><strong>角色：</strong>
        <el-tag :type="userStore.user?.role === 'admin' ? 'danger' : 'success'">{{ userStore.user?.role === 'admin' ? '超级管理员' : '板块负责人' }}</el-tag>
      </div>
      <div style="margin-bottom: 24px"><strong>状态：</strong>
        <el-tag :type="userStore.user?.status === 'active' ? 'success' : 'info'">{{ userStore.user?.status === 'active' ? '启用' : '禁用' }}</el-tag>
      </div>
      <el-divider />
      <h3 style="margin-bottom: 16px">修改密码</h3>
      <el-form :model="form" label-width="100px" @submit.prevent="handleChangePassword">
        <el-form-item label="原密码">
          <el-input v-model="form.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="form.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="form.confirmPassword" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleChangePassword">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

async function handleChangePassword() {
  if (!form.oldPassword || !form.newPassword) {
    ElMessage.warning('请输入原密码和新密码')
    return
  }
  if (form.newPassword.length < 6) {
    ElMessage.warning('新密码至少6位')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  try {
    await api.post('/auth/change-password', { oldPassword: form.oldPassword, newPassword: form.newPassword })
    ElMessage.success('密码修改成功')
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
  } catch (e) {}
}
</script>
