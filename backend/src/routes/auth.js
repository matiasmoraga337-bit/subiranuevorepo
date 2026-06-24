import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
}

function setTokenCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(409).json({ error: 'El usuario ya existe' })
    }

    const user = await User.create({ username, password })
    const token = generateToken(user._id)

    setTokenCookie(res, token)
    res.status(201).json({ user: user.toJSON() })
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar usuario' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' })
    }

    const user = await User.findOne({ username })
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const valid = await user.comparePassword(password)
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const token = generateToken(user._id)
    setTokenCookie(res, token)
    res.json({ user: user.toJSON() })
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    res.json({ user: user.toJSON() })
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuario' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ message: 'Sesión cerrada' })
})

export default router
