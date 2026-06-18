import { supabase } from '../_utils/supabase.js'
import { verifyToken, generateId, jsonResponse, errorResponse } from '../_utils/helpers.js'

export async function DELETE(req) {
  try {
    const user = verifyToken(req)
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()

    const { data: board } = await supabase.from('boards').select('*').eq('id', id).single()
    if (!board) {
      return errorResponse('型号不存在', 404)
    }

    if (user.role === 'owner' && board.owner_id !== user.id) {
      return errorResponse('无权删除此型号', 403)
    }

    await supabase.from('boards').delete().eq('id', id)

    await supabase.from('logs').insert({
      id: generateId(),
      user_id: user.id,
      username: user.username,
      name: user.name,
      action: '删除型号',
      detail: `删除开发板型号 ${board.model}`,
      time: new Date().toISOString()
    })

    return jsonResponse({ message: '删除成功' })
  } catch (err) {
    return errorResponse(err.message, 500)
  }
}
