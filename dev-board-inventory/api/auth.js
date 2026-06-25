import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const JWT_SECRET = process.env.JWT_SECRET || 'dev-board-default-secret'

function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '15d' })
}

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

export async function POST(req) {
  const url = new URL(req.url)
  const path = url.pathname

  // /api/auth/login
  if (path === '/api/auth/login') {
    try {
      const { username, password } = await req.json()
      if (!username || !password) {
        return errorResponse('请输入账号和密码', 400)
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      if (error || !user) {
        return errorResponse('账号不存在', 401)
      }
      if (user.status !== 'active') {
        return errorResponse('账号已被禁用', 401)
      }

      const valid = bcrypt.compareSync(password, user.password)
      if (!valid) {
        return errorResponse('密码错误', 401)
      }

      const token = generateToken(user)
      return jsonResponse({
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          status: user.status,
          mustChangePassword: user.must_change_password
        }
      })
    } catch (err) {
      return errorResponse(err.message, 500)
    }
  }

  // /api/auth/change-password
  if (path === '/api/auth/change-password') {
    try {
      const user = verifyToken(req)
      const { oldPassword, newPassword } = await req.json()

      if (!oldPassword || !newPassword || newPassword.length < 6) {
        return errorResponse('请提供原密码和至少6位的新密码', 400)
      }

      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!dbUser || !bcrypt.compareSync(oldPassword, dbUser.password)) {
        return errorResponse('原密码错误', 401)
      }

      const hash = bcrypt.hashSync(newPassword, 10)
      await supabase.from('users').update({ password: hash, must_change_password: false }).eq('id', user.id)

      return jsonResponse({ message: '密码修改成功' })
    } catch (err) {
      return errorResponse(err.message, 500)
    }
  }

  return errorResponse('Not Found', 404)
}

export async function GET(req) {
  const url = new URL(req.url)
  const path = url.pathname

  // /api/auth/me
  if (path === '/api/auth/me') {
    try {
      const user = verifyToken(req)
      return jsonResponse({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        status: user.status
      })
    } catch (err) {
      return errorResponse(err.message, 401)
    }
  }

  return errorResponse('Not Found', 404)
}
