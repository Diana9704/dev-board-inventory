import jwt from 'jsonwebtoken'
import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const JWT_SECRET = process.env.JWT_SECRET || 'dev-board-default-secret'

function verifyToken(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('未提供认证令牌')
  }
  return jwt.verify(authHeader.substring(7), JWT_SECRET)
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

function errorResponse(message, status = 400) {
  return jsonResponse({ message }, status)
}

export async function GET(req) {
  const url = new URL(req.url)
  const path = url.pathname

  // /api/boards - 获取库存列表（支持访客）
  if (path === '/api/boards') {
    try {
      const search = url.searchParams.get('search')
      let query = supabase
        .from('boards')
        .select('*, users(name, username)')
        .order('updated_at', { ascending: false })

      if (search) {
        query = query.or(`model.ilike.%${search}%,users.name.ilike.%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error

      const formatted = data.map(b => ({
        ...b,
        owner_name: b.users?.name,
        owner_username: b.users?.username
      }))

      return jsonResponse(formatted)
    } catch (err) {
      return errorResponse(err.message, 500)
    }
  }

  // /api/boards/stats - 统计数据（支持访客）
  if (path === '/api/boards/stats') {
    try {
      const { count: totalModels } = await supabase.from('boards').select('*', { count: 'exact', head: true })
      const { data: stockData } = await supabase.from('boards').select('stock')
      const totalStock = stockData?.reduce((sum, b) => sum + (b.stock || 0), 0) || 0
      const { count: totalOwners } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'owner')

      const today = new Date().toISOString().split('T')[0]
      const { count: todayOps } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .gte('time', today)

      return jsonResponse({ totalModels: totalModels || 0, totalStock, totalOwners: totalOwners || 0, todayOps: todayOps || 0 })
    } catch (err) {
      return errorResponse(err.message, 500)
    }
  }

  // /api/boards/export - 导出Excel（支持访客）
  if (path === '/api/boards/export') {
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

  return errorResponse('Not Found', 404)
}

export async function POST(req) {
  const url = new URL(req.url)
  const path = url.pathname

  // /api/boards - 新增型号
  if (path === '/api/boards') {
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

  return errorResponse('Not Found', 404)
}

export async function PUT(req) {
  const url = new URL(req.url)
  const path = url.pathname

  // /api/boards/:id - 编辑库存
  if (path.startsWith('/api/boards/')) {
    try {
      const user = verifyToken(req)
      const id = path.split('/').pop()
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

  return errorResponse('Not Found', 404)
}

export async function DELETE(req) {
  const url = new URL(req.url)
  const path = url.pathname

  // /api/boards/:id - 删除型号
  if (path.startsWith('/api/boards/')) {
    try {
      const user = verifyToken(req)
      const id = path.split('/').pop()

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

  return errorResponse('Not Found', 404)
}
