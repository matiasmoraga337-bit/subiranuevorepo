import { Router } from 'express'
import Game from '../models/Game.js'
import { authMiddleware } from '../middleware/auth.js'
import { clamp, generateContextHash, buildGamePrompt } from '../services/gemini.js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Dialogue from '../models/Dialogue.js'
import { fixedEvents, minigameEvents } from '../data/events.js'

const router = Router()
router.use(authMiddleware)

function applyDailyConsumption(game) {
  game.food = clamp(game.food - 1, 0, game.maxStat)
  game.water = clamp(game.water - 1, 0, game.maxStat)
  game.health = clamp(game.health - 4, 0, game.maxHealth)
  game.morale = clamp(game.morale - 3, 0, game.maxMorale)

  if (game.food <= 0) game.health = clamp(game.health - 4, 0, game.maxHealth)
  if (game.water <= 0) game.health = clamp(game.health - 6, 0, game.maxHealth)
  if (game.food <= 0 && game.water <= 0) game.morale = clamp(game.morale - 2, 0, game.maxMorale)
}

function getFixedEvent(day, flags = {}) {
  const events = fixedEvents[day]
  if (!events) return null
  if (!Array.isArray(events)) return events
  for (const ev of events) {
    if (ev.requiresFlags && ev.requiresFlags.every(f => flags[f])) return ev
    if (ev.requiresFlag && flags[ev.requiresFlag]) return ev
    if (ev.requiresNoFlag && !flags[ev.requiresNoFlag]) return ev
  }
  return events[events.length - 1]
}

function getMinigame(day) {
  return minigameEvents[day] || null
}

const LOCATION_IMAGES = {
  casa: 'casa_con_tablones',
  calle: 'plaza',
  supermercado: 'superme',
  farmacia: 'FARMACIA1',
  refugio: 'casa_con_tablones',
  rescate: 'helicóptero_irse',
}

function getDayContext(day) {
  if (day <= 3) return 'Primeros días. El jugador está en su casa refugiado. Afuera hay caos: saqueos, incendios, gritos. La casa es el único lugar seguro.'
  if (day <= 7) return 'Días intermedios. Los recursos empiezan a escasear. El jugador sigue en casa pero la situación empeora. Puede oír bombardeos lejanos.'
  if (day <= 11) return 'Días avanzados. El refugio está desgastado. El hambre y la sed apremian. La radio anuncia que el rescate se acerca.'
  return 'Días finales. El jugador está al borde del colapso. El helicóptero de rescate llegará pronto. La tensión es máxima dentro de la casa.'
}

function extractAndParseJSON(text) {
  const clean = (s) => s.replace(/: *\+(\d)/g, ': $1').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')

  // Intento 1: parse directo
  try { return JSON.parse(clean(text)) } catch {}

  // Intento 2: extraer primer objeto JSON válido
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try { return JSON.parse(clean(text.slice(firstBrace, lastBrace + 1))) } catch {}
  }

  // Intento 3: quitar bloques markdown y reintentar
  const noMarkdown = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  try { return JSON.parse(clean(noMarkdown)) } catch {}
  const b2 = noMarkdown.indexOf('{')
  const e2 = noMarkdown.lastIndexOf('}')
  if (b2 >= 0 && e2 > b2) {
    try { return JSON.parse(clean(noMarkdown.slice(b2, e2 + 1))) } catch {}
  }

  throw new Error(`JSON inválido. Respuesta cruda: ${text.substring(0, 300)}`)
}

const FALLBACK_EVENTS = [
  {
    title: 'SILENCIO INQUIETANTE',
    location: 'casa',
    image: 'casa_con_tablones',
    segments: [
      { text: 'El día transcurre en calma tensa. Afuera solo se escucha el viento entre los escombros.' },
      { text: 'Revisas tus suministros. Por ahora, estás a salvo. Pero sabes que la calma nunca dura.' },
    ],
    decisions: [
      { text: 'Descansar y recuperar fuerzas', effects: { food: 0, water: 0, health: 3, morale: 5 }, result: 'Te recuestas contra la pared. El silencio te envuelve. Mañana será otro día.' },
      { text: 'Reforzar el refugio', effects: { food: 0, water: 0, health: -2, morale: 3 }, result: 'Tablones y clavos. El refugio está más seguro. Te duelen los brazos pero te sientes productivo.' },
    ],
  },
  {
    title: 'RUIDOS EN LA OSCURIDAD',
    location: 'casa',
    image: 'casa_con_tablones',
    segments: [
      { text: 'La noche cae y con ella llegan los sonidos. Algo se arrastra por el pasillo del edificio. Rasguños. Pasos. Tu corazón se acelera.' },
      { text: 'Te quedas inmóvil, conteniendo la respiración. Los ruidos se alejan lentamente. ¿Era una persona o algo peor? No quieres averiguarlo.' },
    ],
    decisions: [
      { text: 'Investigar el pasillo', effects: { food: 0, water: 0, health: -5, morale: 3 }, result: 'Con un palo en la mano, abres la puerta. El pasillo está vacío. Solo encuentras huellas de sangre fresca.' },
      { text: 'Atrancar la puerta', effects: { food: 0, water: 0, health: 0, morale: -3 }, result: 'Refuerzas la puerta con muebles. No sabes qué había afuera, pero estás a salvo. La curiosidad te carcome.' },
    ],
  },
  {
    title: 'HAMBRE PUNZANTE',
    location: 'casa',
    image: 'casa_con_tablones',
    segments: [
      { text: 'El estómago te gruñe con fuerza. Abres la alacena: quedan muy pocas cosas. La desesperación comienza a instalarse.' },
      { text: 'Recuerdas que debajo del fregadero guardaste una lata para emergencias. Pero si la abres ahora, no tendrás nada para mañana.' },
    ],
    decisions: [
      { text: 'Abrir la lata ahora', effects: { food: 1, water: 0, health: 2, morale: 5 }, result: 'La lata de frijoles sabe a gloria. El hambre cede por ahora. Pero sientes culpa por ceder tan pronto.' },
      { text: 'Guardarla para peores momentos', effects: { food: 0, water: 0, health: -3, morale: -2 }, result: 'Cierras la alacena. La lata sigue ahí. Tu cuerpo te grita que la abras, pero tu mente sabe que mañana podría ser peor.' },
    ],
  },
  {
    title: 'MENSAJE EN LA PARED',
    location: 'casa',
    image: 'casa_con_tablones',
    segments: [
      { text: 'Algo te despierta en medio de la noche. Hay un nuevo mensaje pintado con aerosol en la pared de enfrente, visible por la ventana.' },
      { text: '"ZONA DE RESCATE A 5 KM — MARTES AL AMANECER". No sabes si es real o una trampa de saqueadores. El martes es mañana.' },
    ],
    decisions: [
      { text: 'Prepararte para ir al amanecer', effects: { food: 0, water: 0, health: 0, morale: 8 }, result: 'Preparas una mochila con lo justo. La esperanza te inunda. Solo esperas que no sea una emboscada.' },
      { text: 'Ignorarlo, es muy arriesgado', effects: { food: 0, water: 0, health: 0, morale: -5 }, result: 'Te alejas de la ventana. "Seguro es una trampa", murmuras. Pero una parte de ti se pregunta si acabas de perder tu única oportunidad.' },
    ],
  },
  {
    title: 'EL DIARIO',
    location: 'casa',
    image: 'casa_con_tablones',
    segments: [
      { text: 'Entre los escombros de un armario, encuentras un diario viejo. Perteneció al dueño anterior del departamento.' },
      { text: 'Las últimas páginas describen ubicaciones de suministros ocultos en el edificio. También hablan de un búnker secreto...' },
    ],
    decisions: [
      { text: 'Buscar el búnker en el edificio', effects: { food: 3, water: 2, health: -4, morale: 8 }, result: 'Bajas a los estacionamientos subterráneos. Encuentras un cuarto oculto con provisiones. ¡Un hallazgo increíble! Pero casi te atrapa un infectado.' },
      { text: 'Quedarte, es demasiado peligroso', effects: { food: 0, water: 0, health: 0, morale: -2 }, result: 'Guardas el diario en tu bolsillo. Quizás más adelante te animes a explorar. Por ahora, la seguridad es lo primero.' },
    ],
  },
]

function getFallbackEvent(day) {
  const ev = { ...FALLBACK_EVENTS[day % FALLBACK_EVENTS.length] }
  ev.day = day
  ev.type = 'ai'
  return ev
}

async function generateAIEvent(game) {
  try {
    const dayContext = getDayContext(game.day)
    const prompt = buildGamePrompt(
      game.day, game.flags, game.food, game.water, game.health, game.morale,
      `${game.eventsThisDay} eventos hoy`,
      dayContext
    )
    const contextHash = generateContextHash(game.day, game.flags, game.food, game.water, game.health, game.morale)

    const cached = await Dialogue.findOne({ contextHash })
    if (cached) {
      const enriched = { ...cached.response, type: 'ai', cached: true }
      if (!enriched.image) enriched.image = LOCATION_IMAGES[enriched.location] || 'casa_con_tablones'
      if (!enriched.day) enriched.day = game.day
      return enriched
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const response = extractAndParseJSON(text)

    if (!response.image) {
      response.image = LOCATION_IMAGES[response.location] || 'casa_con_tablones'
    }
    response.day = game.day

    await Dialogue.findOneAndUpdate(
      { contextHash },
      { contextHash, prompt, response, model: 'gemini-2.5-flash', tokensUsed: result.response.usageMetadata?.totalTokenCount || 0 },
      { upsert: true, new: true }
    )

    return { ...response, type: 'ai', cached: false }
  } catch (err) {
    console.error('Error generando evento IA:', err.message)
    return getFallbackEvent(game.day)
  }
}

router.post('/', async (req, res) => {
  try {
    const game = await Game.create({
      userId: req.userId,
      day: 0,
      phase: 'intro',
      food: 6,
      water: 4,
      health: 80,
      morale: 70,
      currentEvent: fixedEvents[0],
      currentSegment: 0,
      eventsThisDay: 1,
    })

    res.status(201).json(game.toJSON())
  } catch (err) {
    res.status(500).json({ error: 'Error al crear partida' })
  }
})

router.get('/user', async (req, res) => {
  try {
    const games = await Game.find({ userId: req.userId }).sort({ updatedAt: -1 })
    res.json(games.map(g => g.toJSON()))
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener partidas' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, userId: req.userId })
    if (!game) return res.status(404).json({ error: 'Partida no encontrada' })
    res.json(game.toJSON())
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener partida' })
  }
})

router.put('/:id/start', async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, userId: req.userId })
    if (!game) return res.status(404).json({ error: 'Partida no encontrada' })

    if (game.day !== 0) return res.status(400).json({ error: 'La partida ya fue iniciada' })

    game.day = 1
    applyDailyConsumption(game)

    if (game.health <= 0 || game.morale <= 0) {
      game.phase = 'gameover'
      game.gameOverReason = game.health <= 0 ? 'health' : 'morale'
      game.status = 'lost'
      await game.save()
      return res.json(game.toJSON())
    }

    game.eventsThisDay = 0
    await advanceToNextEvent(game)
    await game.save()
    res.json(game.toJSON())
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar el día' })
  }
})

router.put('/:id/advance-segment', async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, userId: req.userId })
    if (!game) return res.status(404).json({ error: 'Partida no encontrada' })

    if (!game.currentEvent) return res.status(400).json({ error: 'No hay evento activo' })

    const isLastSegment = game.currentSegment >= game.currentEvent.segments.length - 1

    if (isLastSegment) {
      if (game.currentEvent.decisions) {
        game.phase = 'decision'
      } else if (game.currentEvent.type === 'intro') {
        game.currentSegment = game.currentEvent.segments.length - 1
      } else {
        await handleEventEnd(game)
      }
    } else {
      game.currentSegment++
    }

    await game.save()
    res.json(game.toJSON())
  } catch (err) {
    res.status(500).json({ error: 'Error al avanzar segmento' })
  }
})

router.put('/:id/decision', async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, userId: req.userId })
    if (!game) return res.status(404).json({ error: 'Partida no encontrada' })

    const { decisionIndex } = req.body
    const event = game.currentEvent
    if (!event || !event.decisions) {
      return res.status(400).json({ error: 'No hay decisiones disponibles' })
    }

    const decision = event.decisions[decisionIndex]
    if (!decision) return res.status(400).json({ error: 'Decisión inválida' })

    if (decision.random) {
      const success = Math.random() < decision.successRate
      const effects = success ? decision.effects.success : decision.effects.failure
      applyEffects(game, effects)
      game.decisionResult = { text: success ? decision.successResult : decision.failureResult, success }
    } else {
      applyEffects(game, decision.effects)
      if (decision.setsFlag) {
        game.flags = { ...game.flags, [decision.setsFlag]: true }
      }
      game.decisionResult = { text: decision.result, success: true }
    }

    game.journal.push({
      day: game.day,
      type: 'decision',
      title: event.title,
      decision: decision.text,
      result: game.decisionResult.text,
      success: game.decisionResult.success,
      effects: decision.random
        ? (game.decisionResult.success ? decision.effects.success : decision.effects.failure)
        : decision.effects,
      timestamp: new Date(),
    })

    game.phase = 'result'
    game.markModified('flags')
    game.markModified('journal')

    if (game.health <= 0 || game.morale <= 0) {
      game.phase = 'gameover'
      game.gameOverReason = game.health <= 0 ? 'health' : 'morale'
      game.status = 'lost'
    }

    await game.save()
    res.json(game.toJSON())
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar decisión' })
  }
})

router.put('/:id/continue', async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, userId: req.userId })
    if (!game) return res.status(404).json({ error: 'Partida no encontrada' })

    game.decisionResult = null
    await handleEventEnd(game)
    await game.save()
    res.json(game.toJSON())
  } catch (err) {
    res.status(500).json({ error: 'Error al continuar' })
  }
})

router.put('/:id/minigame', async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, userId: req.userId })
    if (!game) return res.status(404).json({ error: 'Partida no encontrada' })

    const { result } = req.body
    const event = game.currentEvent
    const outcome = result === 'win' ? event.win : event.lose

    applyEffects(game, outcome)

    game.journal.push({
      day: game.day,
      type: 'minijuego',
      title: event.title,
      description: outcome.message || `Resultado: ${result}`,
      effects: outcome,
      timestamp: new Date(),
    })
    game.markModified('journal')

    if (game.health <= 0 || game.morale <= 0) {
      game.phase = 'gameover'
      game.gameOverReason = game.health <= 0 ? 'health' : 'morale'
      game.status = 'lost'
      game.decisionResult = null
      await game.save()
      return res.json(game.toJSON())
    }

    game.decisionResult = null
    game.day++

    if (game.day > 15) {
      game.phase = 'victory'
      game.status = 'won'
      await game.save()
      return res.json(game.toJSON())
    }

    applyDailyConsumption(game)

    if (game.health <= 0 || game.morale <= 0) {
      game.phase = 'gameover'
      game.gameOverReason = game.health <= 0 ? 'health' : 'morale'
      game.status = 'lost'
      await game.save()
      return res.json(game.toJSON())
    }

    game.eventsThisDay = 0
    await advanceToNextEvent(game)
    await game.save()
    res.json(game.toJSON())
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar minijuego' })
  }
})

async function handleEventEnd(game) {
  game.eventsThisDay++

  if (game.eventsThisDay >= game.maxEventsPerDay) {
    game.day++

    if (game.day > 15) {
      if (game.health > 0 && game.morale > 0) {
        game.phase = 'victory'
        game.status = 'won'
      } else {
        game.phase = 'gameover'
        game.gameOverReason = game.health <= 0 ? 'health' : 'morale'
        game.status = 'lost'
      }
      return
    }

    applyDailyConsumption(game)

    if (game.health <= 0 || game.morale <= 0) {
      game.phase = 'gameover'
      game.gameOverReason = game.health <= 0 ? 'health' : 'morale'
      game.status = 'lost'
      return
    }

    game.eventsThisDay = 0
  }

  await advanceToNextEvent(game)
}

async function advanceToNextEvent(game) {
  if (game.eventsThisDay === 0) {
    const minigame = getMinigame(game.day)
    if (minigame) {
      game.currentEvent = { ...minigame }
      game.phase = 'minigame'
      game.currentSegment = 0
      game.eventsThisDay = game.maxEventsPerDay
      return
    }

    const fixedEvent = getFixedEvent(game.day, game.flags || {})
    if (fixedEvent) {
      game.currentEvent = { ...fixedEvent, type: 'fixed' }
      game.phase = 'story'
      game.currentSegment = 0
      return
    }
  }

  const aiEvent = await generateAIEvent(game)
  game.currentEvent = aiEvent
  game.phase = 'story'
  game.currentSegment = 0
}

function applyEffects(game, effects) {
  if (!effects) return
  if (effects.food) game.food = clamp(game.food + effects.food, 0, game.maxStat)
  if (effects.water) game.water = clamp(game.water + effects.water, 0, game.maxStat)
  if (effects.health) game.health = clamp(game.health + effects.health, 0, game.maxHealth)
  if (effects.morale) game.morale = clamp(game.morale + effects.morale, 0, game.maxMorale)
}

export default router
