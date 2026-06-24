import { supabase } from '../_utils/supabase.js'
import { verifyToken, generateId, jsonResponse, errorResponse } from '../_utils/helpers.js'

export async function POST(req) {
  try {
    const user = verifyToken(req)
    const { model, stock, ownerId } = await req.json()

    if (!model || stock === undefined) {
      return errorResponse('请提供型号和库存', 400)
    }

    let finalOwnerId = user.role === 'owner' ? user.id : ownerId
    if (!finalOwnerId) {
      return errorResponse('请选择负责人', 400)
    }

    const { data: existing } = await supabase
      .from('boards')
      .select('*')
      .ilike('model', model)
      .eq('owner_id', finalOwnerId)
      .single()

    if (existing) {
      return errorResponse('该负责人已拥有此型号', 400)
    }

    const id = generateId()
    const now = new Date().toISOString()
    const { error } = await supabase.from('boards').insert({
      id, model, stock, owner_id: finalOwnerId,
      created_at: now, updated_at: now, updated_by: user.name
    })

    if (error) throw error

    await supabase.from('logs').insert({
      id: generateId(),
      user_id: user.id,
      username: user.username,
      name: user.name,
      action: '新增型号',
      detail: `新增开发板型号 ${model}，库存 ${stock}`,
      time: now
    })

    return jsonResponse({ id, message: '新增成功' })
  } catch (err) {
    return errorResponse(err.message, 500)
  }
}
