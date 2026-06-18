import bcrypt from 'bcryptjs'
import { supabase } from '../_utils/supabase.js'
import { requireAdmin, generateId, jsonResponse, errorResponse } from '../_utils/helpers.js'

export async function POST(req) {
  try {
    const admin = requireAdmin(req)
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()

    const { data: user } = await supabase.from('users').select('*').eq('id', id).single()
    if (!user) {
      return errorResponse('用户不存在', 404)
    }

    const hash = bcrypt.hashSync('123456', 10)
    await supabase.from('users').update({ password: hash, must_change_password: true }).eq('id', id)

    await supabase.from('logs').insert({
      id: generateId(),
      user_id: admin.id,
      username: admin.username,
      name: admin.name,
      action: '重置密码',
      detail: `重置用户 ${user.username} 的密码`,
      time: new Date().toISOString()
    })

    return jsonResponse({ message: '密码已重置为 123456' })
  } catch (err) {
    return errorResponse(err.message, 500)
  }
}
