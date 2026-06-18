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

    await supabase.from('users').update({ role: 'admin' }).eq('id', id)

    await supabase.from('logs').insert({
      id: generateId(),
      user_id: admin.id,
      username: admin.username,
      name: admin.name,
      action: '权限变更',
      detail: `将 ${user.username} 升级为超级管理员`,
      time: new Date().toISOString()
    })

    return jsonResponse({ message: '升级成功' })
  } catch (err) {
    return errorResponse(err.message, 500)
  }
}
