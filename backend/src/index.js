import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { connectDB } from './config/db.js'
import authRoutes from './routes/auth.js'
import gameRoutes from './routes/games.js'
import dialogueRoutes from './routes/dialogue.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/games', gameRoutes)
app.use('/api/dialogue', dialogueRoutes)

async function start() {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`Backend corriendo en http://localhost:${PORT}`)
  })
}

start()
