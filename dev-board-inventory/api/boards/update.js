import { supabase } from '../_utils/supabase.js'
import { verifyToken, generateId, jsonResponse, errorResponse } from '../_utils/helpers.js'

export async function PUT(req) {
  try {
    const user = verifyToken(req)
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    const { stock } = await req.json()

    if (stock === undefined || stock < 0) {
      return errorResponse('库存必须为非负整数', 400)
    }

    const { data: board } = await supabase.from('boards').select('*').eq('id', id).single()
    if (!board) {
      return errorResponse('型号不存在', 404)
    }
    if (user.role === 'owner' && board.owner_id !== user.id) {
      return errorResponse('无权编辑此型号', 403)
    }

    const now = new Date().toISOString()
    await supabase.from('boards').update({ stock, updated_at: now, updated_by: user.name }).eq('id', id)

    await supabase.from('logs').insert({
      id: generateId(),
      user_id: user.id,
      username: user.username,
      name: user.name,
      action: '编辑库存',
      detail: `将 ${board.model} 库存修改为 ${stock}`,
      time: now
    })

    return jsonResponse({ message: '更新成功' })
  } catch (err) {
    return errorResponse(err.message, 500)
  }
}
