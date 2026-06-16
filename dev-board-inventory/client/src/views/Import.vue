<template>
  <div>
    <h2 style="margin-bottom: 24px">批量导入数据</h2>
    <el-card>
      <h3 style="margin-bottom: 16px">导入说明</h3>
      <p style="color: rgba(0,0,0,0.65); margin-bottom: 16px">
        请上传 Excel 文件（.xlsx/.xls），表格必须包含以下列：
      </p>
      <el-table :data="[{name:'张三',username:'zhangsan',model:'STM32F103',stock:50,note:''}]" style="margin-bottom: 24px">
        <el-table-column prop="name" label="负责人姓名" />
        <el-table-column prop="username" label="负责人账号（拼音小写）" />
        <el-table-column prop="model" label="开发板型号" />
        <el-table-column prop="stock" label="当日库存量（可发货）" />
        <el-table-column prop="note" label="备注" />
      </el-table>
      <el-upload
        drag
        action="/api/import"
        :headers="uploadHeaders"
        accept=".xlsx,.xls"
        :on-success="handleSuccess"
        :on-error="handleError"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 .xlsx, .xls 格式</div>
        </template>
      </el-upload>
      <el-card v-if="result" style="margin-top: 24px">
        <h3>导入结果</h3>
        <p style="margin: 8px 0"><span style="color: #52c41a">成功：{{ result.success }} 条</span></p>
        <p v-if="result.failed" style="margin: 8px 0"><span style="color: #ff4d4f">失败：{{ result.failed }} 条</span></p>
        <details v-if="result.errors?.length">
          <summary>查看错误明细</summary>
          <ul style="margin-top: 8px; color: #ff4d4f">
            <li v-for="err in result.errors" :key="err">{{ err }}</li>
          </ul>
        </details>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const result = ref(null)

const uploadHeaders = computed(() => {
  if (userStore.token) {
    return { Authorization: `Bearer ${userStore.token}` }
  }
  return {}
})

function handleSuccess(res) {
  result.value = res
  ElMessage.success(`导入完成，成功 ${res.success} 条`)
}

function handleError(err) {
  const msg = err.response?.data?.message || '导入失败'
  ElMessage.error(msg)
}
</script>
