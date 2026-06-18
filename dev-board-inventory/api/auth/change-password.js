import bcrypt from 'bcryptjs'
import { supabase } from '../_utils/supabase.js'
import { verifyToken, jsonResponse, errorResponse } from '../_utils/helpers.js'

export async function POST(req) {
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
