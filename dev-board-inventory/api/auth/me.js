import { verifyToken, jsonResponse, errorResponse } from '../_utils/helpers.js'

export async function GET(req) {
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
