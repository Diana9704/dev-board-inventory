import { supabase } from '../_utils/supabase.js'
import { verifyToken, jsonResponse, errorResponse } from '../_utils/helpers.js'

export async function GET(req) {
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
