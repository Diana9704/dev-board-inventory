import { supabase } from '../_utils/supabase.js'
import { jsonResponse, errorResponse } from '../_utils/helpers.js'

export async function GET(req) {
  try {
    const url = new URL(req.url)
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
