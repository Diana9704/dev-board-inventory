import { jsonResponse } from './_utils/helpers.js'

export async function GET(req) {
  return jsonResponse({ status: 'ok', time: new Date().toISOString() })
}
