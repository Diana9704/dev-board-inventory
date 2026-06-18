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

    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    await supabase.from('users').update({ status: newStatus }).eq('id', id)

    const action = newStatus === 'active' ? '启用账号' : '禁用账号'
    await supabase.from('logs').insert({
      id: generateId(),
      user_id: admin.id,
      username: admin.username,
      name: admin.name,
      action,
      detail: `${action} ${user.username}`,
      time: new Date().toISOString()
    })

    return jsonResponse({ message: `账号已${newStatus === 'active' ? '启用' : '禁用'}` })
  } catch (err) {
    return errorResponse(err.message, 500)
  }
}
