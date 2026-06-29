<template>
  <div>
    <h2 style="margin-bottom: 24px">操作日志</h2>
    <el-card>
      <div style="display: flex; gap: 12px; margin-bottom: 16px">
        <el-input v-model="search" placeholder="搜索操作内容..." style="width: 300px" @keyup.enter="loadLogs">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="loadLogs">搜索</el-button>
      </div>
      <el-empty v-if="!logs.length" description="暂无操作记录" />
      <div v-else>
        <div v-for="log in logs" :key="log.id" style="padding: 12px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center">
          <div>
            <el-tag :type="log.role === 'admin' ? 'danger' : 'success'">{{ log.name || '系统' }}</el-tag>
            <strong>{{ log.action }}</strong> {{ log.detail || '' }}
          </div>
          <div style="color: rgba(0,0,0,0.45); font-size: 13px">{{ formatDate(log.time) }}</div>
        </div>
      </div>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        style="margin-top: 16px; justify-content: flex-end"
        @current-change="loadLogs"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const logs = ref([])
const search = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

async function loadLogs() {
  const params = { page: page.value, pageSize: pageSize.value }
  if (search.value) params.search = search.value
  const res = await api.get('/logs', { params })
  logs.value = res.data.data || []
  total.value = res.data.total || 0
}

onMounted(() => {
  loadLogs()
})
</script>
