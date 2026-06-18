import bcrypt from 'bcryptjs'
import { supabase } from '../_utils/supabase.js'
import { generateToken, jsonResponse, errorResponse } from '../_utils/helpers.js'

export async function POST(req) {
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
