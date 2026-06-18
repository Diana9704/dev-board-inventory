<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px">
      <h2>库存管理</h2>
      <el-button v-if="!userStore.isGuest" type="primary" @click="openAddDialog"><el-icon><Plus /></el-icon> 新增型号</el-button>
    </div>
    <el-card>
      <div style="display: flex; gap: 12px; margin-bottom: 16px">
        <el-input v-model="search" placeholder="搜索型号或负责人..." style="width: 300px" @keyup.enter="handleSearch">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleExport"><el-icon><Download /></el-icon> 导出Excel</el-button>
      </div>
      <el-table :data="boards" style="width: 100%">
        <el-table-column prop="model" label="开发板型号" />
        <el-table-column prop="owner_name" label="负责人" />
        <el-table-column prop="stock" label="当前库存" />
        <el-table-column label="最后修改时间">
          <template #default="{ row }">{{ formatDate(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column prop="updated_by" label="操作人" />
        <el-table-column v-if="!userStore.isGuest" label="操作" width="180">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        style="margin-top: 16px; justify-content: flex-end"
        @current-change="loadBoards"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑库存' : '新增开发板型号'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="开发板型号" v-if="!isEdit">
          <el-input v-model="form.model" placeholder="如：STM32F103" />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
        <el-form-item label="绑定负责人" v-if="!isEdit && userStore.isAdmin">
          <el-select v-model="form.ownerId" placeholder="请选择负责人">
            <el-option v-for="o in owners" :key="o.id" :label="o.name" :value="o.id" />
          </el-select>
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
import { useUserStore } from '@/stores/user'
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const userStore = useUserStore()
const boards = ref([])
const owners = ref([])
const search = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({ model: '', stock: 0, ownerId: '' })
const editId = ref('')

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

async function loadBoards() {
  const params = { page: page.value, pageSize: pageSize.value }
  if (search.value) params.search = search.value
  const res = await api.get('/boards', { params })
  boards.value = res.data
  total.value = res.data.length
}

async function loadOwners() {
  const res = await api.get('/users/owners')
  owners.value = res.data
}

function handleSearch() {
  page.value = 1
  loadBoards()
}

function openAddDialog() {
  isEdit.value = false
  form.value = { model: '', stock: 0, ownerId: '' }
  dialogVisible.value = true
  loadOwners()
}

function openEditDialog(row) {
  isEdit.value = true
  editId.value = row.id
  form.value = { model: row.model, stock: row.stock, ownerId: row.owner_id }
  dialogVisible.value = true
}

async function handleSave() {
  try {
    if (isEdit.value) {
      await api.put(`/boards/${editId.value}`, { stock: form.value.stock })
      ElMessage.success('更新成功')
    } else {
      await api.post('/boards', form.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadBoards()
  } catch (e) {}
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除 "${row.model}" 吗？`, '确认删除', { type: 'warning' })
    await api.delete(`/boards/${row.id}`)
    ElMessage.success('删除成功')
    loadBoards()
  } catch (e) {}
}

async function handleExport() {
  const res = await api.get('/boards/export', { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `库存台账_${new Date().toLocaleDateString('zh-CN')}.xlsx`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  ElMessage.success('导出成功')
}

onMounted(() => {
  loadBoards()
})
</script>
