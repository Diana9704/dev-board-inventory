import XLSX from 'xlsx'
import bcrypt from 'bcryptjs'
import { supabase } from '../_utils/supabase.js'
import { requireAdmin, generateId, jsonResponse, errorResponse } from '../_utils/helpers.js'

export async function POST(req) {
  try {
    const admin = requireAdmin(req)
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) {
      return errorResponse('请上传文件', 400)
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

    if (rows.length < 2) {
      return errorResponse('文件数据为空', 400)
    }

    let success = 0, failed = 0, errors = []

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row[0] || !row[1] || !row[2]) {
        failed++
        errors.push(`第 ${i + 1} 行：数据不完整`)
        continue
      }

      const name = String(row[0]).trim()
      const username = String(row[1]).trim().toLowerCase()
      const model = String(row[2]).trim()
      const stock = parseInt(row[3])

      if (!/^[a-z0-9]+$/.test(username)) {
        failed++
        errors.push(`第 ${i + 1} 行：账号格式错误`)
        continue
      }

      if (isNaN(stock) || stock < 0) {
        failed++
        errors.push(`第 ${i + 1} 行：库存必须为非负整数`)
        continue
      }

      let { data: user } = await supabase.from('users').select('*').eq('username', username).single()
      if (!user) {
        const hash = bcrypt.hashSync('123456', 10)
        const userId = generateId()
        await supabase.from('users').insert({
          id: userId, username, name, password: hash,
          role: 'owner', status: 'active', created_at: new Date().toISOString(), must_change_password: true
        })
        user = { id: userId }
      }

      const { data: existingBoard } = await supabase
        .from('boards')
        .select('*')
        .ilike('model', model)
        .eq('owner_id', user.id)
        .single()

      if (existingBoard) {
        await supabase.from('boards').update({
          stock, updated_at: new Date().toISOString(), updated_by: '系统导入'
        }).eq('id', existingBoard.id)
      } else {
        await supabase.from('boards').insert({
          id: generateId(), model, stock, owner_id: user.id,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(), updated_by: '系统导入'
        })
      }

      success++
    }

    await supabase.from('logs').insert({
      id: generateId(),
      user_id: admin.id,
      username: admin.username,
      name: admin.name,
      action: '批量导入',
      detail: `成功导入 ${success} 条，失败 ${failed} 条`,
      time: new Date().toISOString()
    })

    return jsonResponse({ success, failed, errors: errors.slice(0, 20) })
  } catch (err) {
    return errorResponse(err.message, 500)
  }
}
