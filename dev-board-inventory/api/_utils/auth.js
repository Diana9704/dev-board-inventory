import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-board-default-secret'

export function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '15d' })
}

export function verifyToken(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('未提供认证令牌')
  }
  return jwt.verify(authHeader.substring(7), JWT_SECRET)
}

export function requireAdmin(req) {
  const user = verifyToken(req)
  if (user.role !== 'admin') {
    throw new Error('需要管理员权限')
  }
  return user
}
