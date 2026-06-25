import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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

function requireAdmin(req) {
  const user = verifyToken(req)
  if (user.role !== 'admin') {
    throw new Error('权限不足')
  }
  return user
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

  // /api/users - 用户列表（admin only）
  if (path === '/api/users') {
    try {
      requireAdmin(req)
      const search = url.searchParams.get('search')
      let query = supabase.from('users').select('id, username, name, role, status, created_at').order('created_at', { ascending: false })
      if (search) {
        query = query.or(`username.ilike.%${search}%,name.ilike.%${search}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return jsonResponse(data || [])
    } catch (err) {
      return errorResponse(err.message, 500)
    }
  }

  // /api/users/owners - 活跃的负责人列表
  if (path === '/api/users/owners') {
    try {
      verifyToken(req)
      const { data, error } = await supabase
        .from('users')
        .select('id, username, name')
        .eq('role', 'owner')
        .eq('status', 'active')
        .order('name')
      if (error) throw error
      return jsonResponse(data || [])
    } catch (err) {
      return errorResponse(err.message, 500)
    }
  }

  return errorResponse('Not Found', 404)
}

export async function POST(req) {
  const url = new URL(req.url)
  const path = url.pathname

  // /api/users - 创建用户
  if (path === '/api/users') {
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

  // /api/users/:id/reset-password
  if (path.endsWith('/reset-password')) {
    try {
      const admin = requireAdmin(req)
      const id = path.split('/')[3]
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

  // /api/users/:id/toggle-status
  if (path.endsWith('/toggle-status')) {
    try {
      const admin = requireAdmin(req)
      const id = path.split('/')[3]
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

  // /api/users/:id/promote
  if (path.endsWith('/promote')) {
    try {
      const admin = requireAdmin(req)
      const id = path.split('/')[3]
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

  return errorResponse('Not Found', 404)
}
