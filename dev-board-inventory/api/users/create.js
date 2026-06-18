import bcrypt from 'bcryptjs'
import { supabase } from '../_utils/supabase.js'
import { requireAdmin, generateId, jsonResponse, errorResponse } from '../_utils/helpers.js'

export async function POST(req) {
  try {
    const admin = requireAdmin(req)
    const { name, username } = await req.json()

    if (!name || !username) {
      return errorResponse('请输入姓名和账号', 400)
    }
    if (!/^[a-z0-9]+$/.test(username)) {
      return errorResponse('账号只能包含小写字母和数字', 400)
    }

    const { data: existing } = await supabase.from('users').select('*').eq('username', username).single()
    if (existing) {
      return errorResponse('账号已存在', 400)
    }

    const hash = bcrypt.hashSync('123456', 10)
    const id = generateId()
    const now = new Date().toISOString()

    await supabase.from('users').insert({
      id, username, name, password: hash,
      role: 'owner', status: 'active', created_at: now, must_change_password: true
    })

    await supabase.from('logs').insert({
      id: generateId(),
      user_id: admin.id,
      username: admin.username,
      name: admin.name,
      action: '创建账号',
      detail: `创建负责人账号 ${username} (${name})`,
      time: now
    })

    return jsonResponse({ id, message: '创建成功' })
  } catch (err) {
    return errorResponse(err.message, 500)
  }
}
