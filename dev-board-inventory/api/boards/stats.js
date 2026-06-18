import { supabase } from '../_utils/supabase.js'
import { jsonResponse, errorResponse } from '../_utils/helpers.js'

export async function GET(req) {
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
