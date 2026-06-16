<template>
  <div>
    <h2 style="margin-bottom: 24px">数据概览</h2>
    <el-row :gutter="24" style="margin-bottom: 24px">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card>
          <div style="display: flex; align-items: center; gap: 16px">
            <div style="width: 48px; height: 48px; border-radius: 8px; background: #e6f7ff; color: #1890ff; display: flex; align-items: center; justify-content: center; font-size: 24px">
              <el-icon><Cpu /></el-icon>
            </div>
            <div>
              <h3 style="font-size: 24px; font-weight: bold">{{ stats.totalModels }}</h3>
              <p style="color: rgba(0,0,0,0.45); font-size: 14px">开发板型号总数</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card>
          <div style="display: flex; align-items: center; gap: 16px">
            <div style="width: 48px; height: 48px; border-radius: 8px; background: #f6ffed; color: #52c41a; display: flex; align-items: center; justify-content: center; font-size: 24px">
              <el-icon><Box /></el-icon>
            </div>
            <div>
              <h3 style="font-size: 24px; font-weight: bold">{{ stats.totalStock }}</h3>
              <p style="color: rgba(0,0,0,0.45); font-size: 14px">库存总量</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card>
          <div style="display: flex; align-items: center; gap: 16px">
            <div style="width: 48px; height: 48px; border-radius: 8px; background: #fff7e6; color: #fa8c16; display: flex; align-items: center; justify-content: center; font-size: 24px">
              <el-icon><User /></el-icon>
            </div>
            <div>
              <h3 style="font-size: 24px; font-weight: bold">{{ stats.totalOwners }}</h3>
              <p style="color: rgba(0,0,0,0.45); font-size: 14px">负责人数量</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card>
          <div style="display: flex; align-items: center; gap: 16px">
            <div style="width: 48px; height: 48px; border-radius: 8px; background: #fff2f0; color: #f5222d; display: flex; align-items: center; justify-content: center; font-size: 24px">
              <el-icon><Clock /></el-icon>
            </div>
            <div>
              <h3 style="font-size: 24px; font-weight: bold">{{ stats.todayOps }}</h3>
              <p style="color: rgba(0,0,0,0.45); font-size: 14px">今日操作数</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-card v-if="!userStore.isGuest">
      <template #header><h3>最近操作记录</h3></template>
      <el-empty v-if="!logs.length" description="暂无操作记录" />
      <div v-else>
        <div v-for="log in logs" :key="log.id" style="padding: 12px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center">
          <div>
            <el-tag :type="log.role === 'admin' ? 'danger' : 'success'">{{ log.name || '系统' }}</el-tag>
            {{ log.action }} {{ log.detail }}
          </div>
          <div style="color: rgba(0,0,0,0.45); font-size: 13px">{{ formatDate(log.time) }}</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import api from '@/api'

const userStore = useUserStore()
const stats = ref({ totalModels: 0, totalStock: 0, totalOwners: 0, todayOps: 0 })
const logs = ref([])

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

async function loadStats() {
  const res = await api.get('/boards/stats')
  stats.value = res.data
}

async function loadLogs() {
  if (userStore.isGuest) return
  const res = await api.get('/logs?pageSize=5')
  logs.value = res.data.data || []
}

onMounted(() => {
  loadStats()
  loadLogs()
})
</script>
