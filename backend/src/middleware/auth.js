import jwt from 'jsonwebtoken'

export function authMiddleware(req, res, next) {
  const token = req.cookies.token
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}
