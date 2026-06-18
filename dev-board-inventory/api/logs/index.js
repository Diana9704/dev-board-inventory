import { supabase } from '../_utils/supabase.js'
import { verifyToken, jsonResponse, errorResponse } from '../_utils/helpers.js'

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
