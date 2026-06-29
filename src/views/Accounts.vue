<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px">
      <h2>账号管理</h2>
      <el-button type="primary" @click="dialogVisible = true"><el-icon><Plus /></el-icon> 新增负责人</el-button>
    </div>
    <el-card>
      <div style="display: flex; gap: 12px; margin-bottom: 16px">
        <el-input v-model="search" placeholder="搜索账号或姓名..." style="width: 300px" @keyup.enter="loadUsers">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="loadUsers">搜索</el-button>
      </div>
      <el-table :data="users" style="width: 100%">
        <el-table-column prop="username" label="账号" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column label="角色">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'success'">{{ row.role === 'admin' ? '超级管理员' : '板块负责人' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status === 'active' ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button type="warning" size="small" @click="handleReset(row)">重置密码</el-button>
            <el-button :type="row.status === 'active' ? 'danger' : 'success'" size="small" @click="handleToggle(row)">
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button v-if="row.role === 'owner'" type="primary" size="small" @click="handlePromote(row)">升级</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增负责人账号" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="如：张三" />
        </el-form-item>
        <el-form-item label="账号">
          <el-input v-model="form.username" placeholder="拼音小写，如：zhangsan" />
        </el-form-item>
        <el-form-item label="初始密码">
          <el-input modelValue="123456" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const users = ref([])
const search = ref('')
const dialogVisible = ref(false)
const form = ref({ name: '', username: '' })

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

async function loadUsers() {
  const params = {}
  if (search.value) params.search = search.value
  const res = await api.get('/users', { params })
  users.value = res.data
}

async function handleSave() {
  try {
    await api.post('/users', form.value)
    ElMessage.success('创建成功')
    dialogVisible.value = false
    form.value = { name: '', username: '' }
    loadUsers()
  } catch (e) {}
}

async function handleReset(row) {
  try {
    await ElMessageBox.confirm(`确定要重置 ${row.username} 的密码吗？`, '确认', { type: 'warning' })
    await api.post(`/users/${row.id}/reset-password`)
    ElMessage.success('密码已重置为 123456')
  } catch (e) {}
}

async function handleToggle(row) {
  const action = row.status === 'active' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}该账号吗？`, '确认', { type: 'warning' })
    await api.post(`/users/${row.id}/toggle-status`)
    ElMessage.success(`账号已${action}`)
    loadUsers()
  } catch (e) {}
}

async function handlePromote(row) {
  try {
    await ElMessageBox.confirm(`确定要将 ${row.username} 升级为超级管理员吗？`, '确认', { type: 'warning' })
    await api.post(`/users/${row.id}/promote`)
    ElMessage.success('升级成功')
    loadUsers()
  } catch (e) {}
}

onMounted(() => {
  loadUsers()
})
</script>
