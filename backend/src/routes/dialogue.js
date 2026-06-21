import { Router } from 'express'
import Dialogue from '../models/Dialogue.js'
import { generateContextHash, buildGamePrompt } from '../services/gemini.js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.post('/generate', async (req, res) => {
  try {
    const { day, flags, food, water, health, morale, context } = req.body

    const prompt = buildGamePrompt(day, flags, food, water, health, morale, context || '')
    const contextHash = generateContextHash(day, flags, food, water, health, morale)

    const cached = await Dialogue.findOne({ contextHash })
    if (cached) {
      return res.json({ ...cached.response, cached: true })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const response = JSON.parse(cleanJson)

    await Dialogue.create({
      contextHash,
      prompt,
      response,
      model: 'gemini-2.5-flash',
      tokensUsed: result.response.usageMetadata?.totalTokenCount || 0,
    })

    res.json({ ...response, cached: false })
  } catch (err) {
    console.error('Error en diálogo IA:', err.message)

    res.json({
      type: 'ai',
      title: 'SILENCIO INQUIETANTE',
      location: 'casa',
      segments: [
        { text: 'El día transcurre en calma tensa. Afuera solo se escucha el viento entre los escombros.' },
        { text: 'Revisas tus suministros. Por ahora, estás a salvo.' },
      ],
      decisions: [
        { text: 'Descansar', effects: { food: 0, water: 0, health: 3, morale: 5 }, result: 'Te recuestas. El silencio te envuelve.' },
        { text: 'Reforzar refugio', effects: { food: 0, water: 0, health: -2, morale: 3 }, result: 'Clavas tablones. El refugio está más seguro.' },
      ],
    })
  }
})

router.get('/cache/stats', async (req, res) => {
  try {
    const count = await Dialogue.countDocuments()
    res.json({ cachedDialogues: count })
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

export default router
