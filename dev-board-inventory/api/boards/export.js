import XLSX from 'xlsx'
import { supabase } from '../_utils/supabase.js'
import { jsonResponse, errorResponse } from '../_utils/helpers.js'

export async function GET(req) {
  try {
    const { data: boards, error } = await supabase
      .from('boards')
      .select('*, users(name)')
      .order('updated_at', { ascending: false })

    if (error) throw error

    const exportData = boards.map(b => ({
      '开发板型号': b.model,
      '负责人': b.users?.name || '-',
      '当前库存': b.stock,
      '最后修改时间': b.updated_at ? new Date(b.updated_at).toLocaleString('zh-CN') : '-',
      '操作人': b.updated_by || '-'
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '库存台账')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=库存台账_${new Date().toLocaleDateString('zh-CN')}.xlsx`
      }
    })
  } catch (err) {
    return errorResponse(err.message, 500)
  }
}
