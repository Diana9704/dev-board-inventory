import { supabase } from '../_utils/supabase.js'
import { requireAdmin, jsonResponse, errorResponse } from '../_utils/helpers.js'

export async function GET(req) {
  try {
    requireAdmin(req)
    const url = new URL(req.url)
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
