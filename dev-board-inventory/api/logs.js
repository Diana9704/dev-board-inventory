import jwt from 'jsonwebtoken'
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
  try {
    const user = verifyToken(req)
    const url = new URL(req.url)
    const search = url.searchParams.get('search')
    const page = parseInt(url.searchParams.get('page')) || 1
    const pageSize = parseInt(url.searchParams.get('pageSize')) || 10

    let query = supabase.from('logs').select('*', { count: 'exact' }).order('time', { ascending: false })

    if (user.role === 'owner') {
      query = query.eq('user_id', user.id)
    }

    if (search) {
      query = query.or(`action.ilike.%${search}%,detail.ilike.%${search}%`)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) throw error

    return jsonResponse({ data: data || [], total: count || 0, page, pageSize })
  } catch (err) {
    return errorResponse(err.message, 500)
  }
}
