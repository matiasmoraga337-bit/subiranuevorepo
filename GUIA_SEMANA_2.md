# GUIA SEMANA 2 — Lógica de Juego + Gemini + Tests

**Fechas:** Lunes 22 de junio → Viernes 26 de junio  
**Objetivo:** Implementar toda la lógica del juego en el backend, integrar Google Gemini, escribir tests y conectar el frontend al backend.

---

## DIA 5 — Lunes 22 de junio: Lógica de juego (Parte 1)

### Contexto

El archivo `Backend/src/routes/games.js` tiene un placeholder vacío. Hay que implementar las rutas principales del CRUD de juego más la lógica de avance y decisiones.

Antes de empezar, necesitas copiar el archivo de eventos al backend para que la lógica server-side pueda acceder a los mismos eventos que el frontend.

---

### Paso 5.1: Copiar `events.js` al backend

Copia el archivo desde el frontend:

```powershell
Copy-Item -LiteralPath "Game\src\data\events.js" -Destination "Backend\src\data\events.js"
```

Si la carpeta `Backend\src\data\` no existe, créala:

```powershell
New-Item -ItemType Directory -Path "Backend\src\data\" -Force
```

---

### Paso 5.2: Implementar `games.js` (rutas del juego)

**Archivo:** `Backend/src/routes/games.js` — Reemplaza todo el contenido placeholder por:

```js
import { Router } from 'express'
import Game from '../models/Game.js'
import { authMiddleware } from '../middleware/auth.js'
import { fixedEvents, minigameEvents } from '../data/events.js'

const router = Router()
router.use(authMiddleware)

// =====================
// FUNCIONES AUXILIARES
// =====================

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

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

function applyEffects(game, effects) {
  if (!effects) return
  if (effects.food) game.food = clamp(game.food + effects.food, 0, game.maxStat)
  if (effects.water) game.water = clamp(game.water + effects.water, 0, game.maxStat)
  if (effects.health) game.health = clamp(game.health + effects.health, 0, game.maxHealth)
  if (effects.morale) game.morale = clamp(game.morale + effects.morale, 0, game.maxMorale)
}

// =====================
// RUTAS CRUD DE PARTIDA
// =====================

// POST /api/games — Crear nueva partida (día 0, intro)
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

// GET /api/games/user — Listar partidas del usuario
router.get('/user', async (req, res) => {
  try {
    const games = await Game.find({ userId: req.userId }).sort({ updatedAt: -1 })
    res.json(games.map(g => g.toJSON()))
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener partidas' })
  }
})

// GET /api/games/:id — Obtener una partida
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, userId: req.userId })
    if (!game) return res.status(404).json({ error: 'Partida no encontrada' })
    res.json(game.toJSON())
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener partida' })
  }
})

// PUT /api/games/:id/start — Iniciar día 1
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

// PUT /api/games/:id/advance-segment — Avanzar segmento narrativo
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

// PUT /api/games/:id/decision — Procesar decisión
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

    // Decisiones con riesgo (random)
    if (decision.random) {
      const success = Math.random() < decision.successRate
      const effects = success ? decision.effects.success : decision.effects.failure
      applyEffects(game, effects)
      game.decisionResult = {
        text: success ? decision.successResult : decision.failureResult,
        success,
      }
    } else {
      // Decisiones normales (efectos fijos)
      applyEffects(game, decision.effects)
      if (decision.setsFlag) {
        game.flags = { ...game.flags, [decision.setsFlag]: true }
      }
      game.decisionResult = { text: decision.result, success: true }
    }

    // Registrar en el diario
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

    // Verificar game over
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

// =====================
// GESTIÓN DE EVENTOS
// =====================

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
    // Primer evento del día: revisar si es minijuego
    const minigame = getMinigame(game.day)
    if (minigame) {
      game.currentEvent = { ...minigame }
      game.phase = 'minigame'
      game.currentSegment = 0
      game.eventsThisDay = game.maxEventsPerDay
      return
    }

    // Buscar evento fijo del día
    const fixedEvent = getFixedEvent(game.day, game.flags || {})
    if (fixedEvent) {
      game.currentEvent = { ...fixedEvent, type: 'fixed' }
      game.phase = 'story'
      game.currentSegment = 0
      return
    }
  }

  // Si no hay eventos fijos, cargar un random (por ahora placeholder)
  // En el Día 7 esto se reemplazará con eventos IA
  game.currentEvent = getFallbackEvent(game.day)
  game.phase = 'story'
  game.currentSegment = 0
}

// Fallback temporal (se mejora en el Día 7 con Gemini)
const TEMP_FALLBACK = {
  title: 'DIA TRANQUILO',
  location: 'casa',
  image: 'casa_con_tablones',
  segments: [
    { text: 'El dia transcurre sin novedades. Afuera solo se escucha el viento.' },
    { text: 'Revisas tus suministros. Por ahora, todo en orden.' },
  ],
  decisions: [
    {
      text: 'Descansar',
      effects: { food: 0, water: 0, health: 3, morale: 5 },
      result: 'Te recuestas. El silencio te envuelve.',
    },
    {
      text: 'Reforzar refugio',
      effects: { food: 0, water: 0, health: -2, morale: 3 },
      result: 'Aseguras ventanas con tablones. Te sientes mas seguro.',
    },
  ],
}

function getFallbackEvent(day) {
  return { ...TEMP_FALLBACK, day, type: 'ai' }
}

export default router
```

---

### Cómo verifico que está bien

**Paso 1:** Inicia MongoDB y el backend:

```powershell
# Terminal 1: MongoDB
docker run -d --name mongo-dev -p 27017:27017 mongo:7

# Terminal 2: Backend
Set-Location -LiteralPath "Backend"
pnpm dev
```

**Paso 2:** Prueba el ciclo completo con curl:

```powershell
# 1. Registrarse y guardar cookie
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"username":"test","password":"123456"}' `
  -c cookies.txt

# 2. Crear partida
curl -X POST http://localhost:3000/api/games -b cookies.txt
# Respuesta: { "_id": "...", "day": 0, "phase": "intro", ... }
# Guarda el _id, lo necesitas para los siguientes pasos

# 3. Avanzar segmentos de intro (son 4 segmentos)
curl -X PUT http://localhost:3000/api/games/AQUI_EL_ID/advance-segment -b cookies.txt
# Repite 3 veces más (4 en total)

# 4. Después del 4to advance-segment, day debería seguir en 0
# pero si haces click en "COMENZAR SUPERVIVENCIA" (llama a start):
curl -X PUT http://localhost:3000/api/games/AQUI_EL_ID/start -b cookies.txt
# Debería devolver day:1, phase:"story"

# 5. Listar partidas del usuario
curl http://localhost:3000/api/games/user -b cookies.txt
```

---

### Commit

```
feat(backend): implementar logica de juego - creacion, inicio, avance y decisiones
```

---

## DIA 6 — Martes 23 de junio: Lógica de juego (Parte 2)

### Paso 6.1: Agregar rutas `continue` y `minigame` + fallbacks + parseo JSON

Abre `Backend/src/routes/games.js` y agrega estas rutas **antes** del `export default router` (después de la ruta `decision`):

```js
// PUT /api/games/:id/continue — Continuar después del resultado
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

// PUT /api/games/:id/minigame — Procesar resultado de minijuego
router.put('/:id/minigame', async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, userId: req.userId })
    if (!game) return res.status(404).json({ error: 'Partida no encontrada' })

    const { result } = req.body  // 'win' o 'lose'
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
```

---

### Paso 6.2: Reemplazar fallback temporal por 5 eventos narrativos variados

Busca la función `getFallbackEvent` y el `TEMP_FALLBACK` que pusiste en el Día 5. Reemplázalos por:

```js
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
```

---

### Paso 6.3: Agregar `extractAndParseJSON` (necesario para el Día 7)

Agrega esta función **después de los FALLBACK_EVENTS y antes de las rutas**:

```js
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
```

---

### Cómo verifico que está bien

```powershell
# Continuar el ciclo del Día 5:
# Partida ya creada, ya en fase story del día 1

# 1. Avanzar segmentos hasta llegar a decision
curl -X PUT http://localhost:3000/api/games/ID/advance-segment -b cookies.txt
curl -X PUT http://localhost:3000/api/games/ID/advance-segment -b cookies.txt

# 2. Tomar decisión
curl -X PUT http://localhost:3000/api/games/ID/decision `
  -H "Content-Type: application/json" `
  -d '{"decisionIndex":0}' `
  -b cookies.txt
# → Debe devolver phase: "result"

# 3. Continuar después del resultado
curl -X PUT http://localhost:3000/api/games/ID/continue -b cookies.txt
# → Debe avanzar al siguiente evento o día
```

---

### Commit

```
feat(backend): implementar logica de juego - minijuegos, continuacion y finalizacion
```

---

## DIA 7 — Miércoles 24 de junio: Integrar Google Gemini

### Contexto

Vas a crear el servicio que se comunica con Google Gemini para generar eventos narrativos dinámicos. También crearás las rutas de diálogo con caché en MongoDB.

---

### Paso 7.1: Crear servicio `gemini.js`

**Archivo:** `Backend/src/services/gemini.js` (carpeta `services` no existe, créala)

```js
import crypto from 'crypto'

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function generateContextHash(day, flags, food, water, health, morale) {
  const data = JSON.stringify({ day, flags, food, water, health, morale })
  return crypto.createHash('sha256').update(data).digest('hex')
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

function buildGamePrompt(day, flags, food, water, health, morale, previousEvents, dayContext) {
  const flagSummary = Object.entries(flags || {})
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(', ') || 'ninguno'

  const stage = day <= 4 ? 'supervivencia temprana: el caos reina, hay saqueos, el jugador se está adaptando' :
    day <= 9 ? 'mitad del camino: los recursos escasean, la tensión crece, aparecen amenazas externas' :
    'recta final: el rescate se acerca, la desesperación y el agotamiento son extremos'

  return `
Eres el narrador de un juego de supervivencia post-apocalíptico llamado "15 Días".
El jugador está en el día ${day} de 15, esperando un rescate en helicóptero.
IMPORTANTE: El jugador está dentro de su CASA/REFUGIO la mayor parte del tiempo. Solo sale en ocasiones especiales.

CONTEXTO NARRATIVO: ${dayContext || `Día ${day} en el refugio. Etapa: ${stage}`}

Estado actual:
- Comida: ${food}/20
- Agua: ${water}/20  
- Salud: ${health}/100
- Moral: ${morale}/100
- Eventos previos hoy: ${previousEvents || 'ninguno'}
- Flags de historia: ${flagSummary}

Genera UN nuevo evento narrativo para este día. La historia DEBE transcurrir en el refugio/casa (location: "casa") a menos que el contexto indique explícitamente otra ubicación. El evento debe tener:
1. Un título corto y dramático (máximo 40 caracteres)
2. Una ubicación (casa, calle, supermercado, farmacia, refugio)
3. Una imagen: usa "casa_con_tablones" para eventos en casa, "superme" para supermercado, "FARMACIA1" para farmacia, "plaza" para calle, "antes_final" para días finales, "helicóptero_irse" para rescate
4. De 2 a 3 párrafos de narración inmersiva en español, COHERENTE con la imagen/ubicación elegida
5. Dos decisiones que el jugador puede tomar, cada una con:
   - Texto descriptivo de la acción (máximo 60 caracteres)
   - Efectos sobre los recursos (objeto con food, water, health, morale como números)
   - Texto de resultado (qué pasa si elige esa opción)

Responde SOLO con un objeto JSON válido, sin markdown ni texto adicional:
{
  "title": "...",
  "location": "casa",
  "image": "casa_con_tablones",
  "segments": [{"text": "..."}, {"text": "..."}],
  "decisions": [
    {
      "text": "...",
      "effects": {"food": 0, "water": 0, "health": 0, "morale": 0},
      "result": "..."
    }
  ]
}`
}

export { clamp, generateContextHash, buildGamePrompt, LOCATION_IMAGES, getDayContext }
```

---

### Paso 7.2: Crear rutas `dialogue.js`

**Archivo:** `Backend/src/routes/dialogue.js`

```js
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

    // Revisar caché
    const cached = await Dialogue.findOne({ contextHash })
    if (cached) {
      return res.json({ ...cached.response, cached: true })
    }

    // Llamar a Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Parsear JSON
    const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const response = JSON.parse(cleanJson)

    // Guardar en caché
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

    // Fallback
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
```

---

### Paso 7.3: Integrar `generateAIEvent()` en `games.js`

Abre `Backend/src/routes/games.js` y:

**1.** Agrega estos imports al inicio (reemplaza los imports actuales):

```js
import { Router } from 'express'
import Game from '../models/Game.js'
import { authMiddleware } from '../middleware/auth.js'
import { clamp, generateContextHash, buildGamePrompt, LOCATION_IMAGES, getDayContext } from '../services/gemini.js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Dialogue from '../models/Dialogue.js'
import { fixedEvents, minigameEvents } from '../data/events.js'
```

**2.** Busca la función `advanceToNextEvent` y reemplaza la línea que dice:

```js
  game.currentEvent = getFallbackEvent(game.day)
```

Por:

```js
  const aiEvent = await generateAIEvent(game)
  game.currentEvent = aiEvent
```

**3.** Agrega la función `generateAIEvent` ANTES de `advanceToNextEvent`:

```js
async function generateAIEvent(game) {
  try {
    const dayContext = getDayContext(game.day)
    const prompt = buildGamePrompt(
      game.day, game.flags, game.food, game.water, game.health, game.morale,
      `${game.eventsThisDay} eventos hoy`,
      dayContext
    )
    const contextHash = generateContextHash(game.day, game.flags, game.food, game.water, game.health, game.morale)

    // Revisar caché de diálogos
    const cached = await Dialogue.findOne({ contextHash })
    if (cached) {
      const enriched = { ...cached.response, type: 'ai', cached: true }
      if (!enriched.image) enriched.image = LOCATION_IMAGES[enriched.location] || 'casa_con_tablones'
      if (!enriched.day) enriched.day = game.day
      return enriched
    }

    // Llamar a Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const response = extractAndParseJSON(text)

    // Enriquecer respuesta si falta imagen
    if (!response.image) {
      response.image = LOCATION_IMAGES[response.location] || 'casa_con_tablones'
    }
    response.day = game.day

    // Guardar en caché
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
```

**IMPORTANTE:** La función `advanceToNextEvent` ahora es `async`, así que también tenés que ponerle `async`:

```js
async function advanceToNextEvent(game) {
```

---

### Paso 7.4: Agregar `GEMINI_API_KEY` al `.env`

Abre `Backend/.env` y agrega (o actualiza):

```
GEMINI_API_KEY=TU_API_KEY_DE_GEMINI
```

> Para conseguir una API key: ve a https://aistudio.google.com/apikey, crea una y cópiala.

---

### Cómo verifico que está bien

```powershell
# 1. Asegúrate de que el backend está corriendo con la API key
Set-Location -LiteralPath "Backend"
pnpm dev

# 2. Crear partida (día 0, intro)
curl -X POST http://localhost:3000/api/games -b cookies.txt

# 3. Iniciar día 1
curl -X PUT http://localhost:3000/api/games/ID/start -b cookies.txt
# → day:1, phase: "story"

# 4. Avanzar segmentos del día 1 hasta que se acaben
# Cada vez que se acaban los segmentos y pasan 3 eventos, avanza al día siguiente
# En días sin eventos fijos (como día 4, 6, 7, 8...), Gemini generará eventos

# 5. Probar el endpoint de diálogo directamente
curl -X POST http://localhost:3000/api/dialogue/generate `
  -H "Content-Type: application/json" `
  -d '{"day":5,"flags":{},"food":5,"water":3,"health":70,"morale":60}' `
  -b cookies.txt
# → Debería devolver un evento generado por IA con title, segments, decisions

# 6. Ver estadísticas del caché
curl http://localhost:3000/api/dialogue/cache/stats -b cookies.txt
# → {"cachedDialogues": 1} (o más si generaste varios)
```

---

### Commit

```
feat(backend): integrar Google Gemini para generacion de eventos narrativos
```

---

## DIA 8 — Jueves 25 de junio: Tests del backend

### Paso 8.1: Crear tests de auth

**Archivo:** `Backend/src/tests/auth.spec.js`

```js
import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'

const SECRET = 'test-secret'

describe('Auth — JWT', () => {
  it('genera un token válido con userId', () => {
    const token = jwt.sign({ userId: 'abc123' }, SECRET, { expiresIn: '7d' })
    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')
  })

  it('decodifica el token correctamente', () => {
    const token = jwt.sign({ userId: 'abc123' }, SECRET, { expiresIn: '7d' })
    const decoded = jwt.verify(token, SECRET)
    expect(decoded.userId).toBe('abc123')
  })

  it('rechaza un token inválido', () => {
    expect(() => jwt.verify('token-falso', SECRET)).toThrow()
  })

  it('rechaza token firmado con otro secret', () => {
    const token = jwt.sign({ userId: 'abc123' }, 'otro-secret')
    expect(() => jwt.verify(token, SECRET)).toThrow()
  })

  it('rechaza token expirado', () => {
    const token = jwt.sign({ userId: 'abc123' }, SECRET, { expiresIn: '0s' })
    // Esperar un poco para que expire
    expect(() => jwt.verify(token, SECRET)).toThrow()
  })
})
```

---

### Paso 8.2: Crear tests de lógica de juegos

**Archivo:** `Backend/src/tests/games.spec.js`

```js
import { describe, it, expect } from 'vitest'

// Clamp: copia de la función real
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

const INITIAL_RESOURCES = { food: 6, water: 4, health: 80, morale: 70 }

describe('Games — Lógica de juego', () => {
  describe('applyDailyConsumption()', () => {
    it('consume 1 comida, 1 agua, -4 salud, -3 moral', () => {
      let food = 6, water = 4, health = 80, morale = 70

      food = clamp(food - 1, 0, 20)
      water = clamp(water - 1, 0, 20)
      health = clamp(health - 4, 0, 100)
      morale = clamp(morale - 3, 0, 100)

      if (food <= 0) health = clamp(health - 4, 0, 100)
      if (water <= 0) health = clamp(health - 6, 0, 100)
      if (food <= 0 && water <= 0) morale = clamp(morale - 2, 0, 100)

      expect(food).toBe(5)
      expect(water).toBe(3)
      expect(health).toBe(76)
      expect(morale).toBe(67)
    })

    it('si food=0, aplica penalización extra de salud (-4)', () => {
      let food = 0, health = 80
      health = clamp(health - 4, 0, 100)
      if (food <= 0) health = clamp(health - 4, 0, 100)
      expect(health).toBe(72)
    })

    it('si water=0, aplica penalización extra de salud (-6)', () => {
      let water = 0, health = 80
      health = clamp(health - 4, 0, 100)
      if (water <= 0) health = clamp(health - 6, 0, 100)
      expect(health).toBe(70)
    })
  })

  describe('Efectos de decisiones', () => {
    it('aplica efectos positivos correctamente', () => {
      let food = 5, water = 3, health = 70, morale = 60
      const effects = { food: 2, water: 1, health: 5, morale: 10 }

      food = clamp(food + (effects.food || 0), 0, 20)
      water = clamp(water + (effects.water || 0), 0, 20)
      health = clamp(health + (effects.health || 0), 0, 100)
      morale = clamp(morale + (effects.morale || 0), 0, 100)

      expect(food).toBe(7)
      expect(water).toBe(4)
      expect(health).toBe(75)
      expect(morale).toBe(70)
    })

    it('aplica efectos negativos y no baja de 0 (clamping)', () => {
      let health = 3
      health = clamp(health + (-10), 0, 100)
      expect(health).toBe(0)
    })
  })

  describe('Detección de game over', () => {
    it('game over si health <= 0', () => {
      const health = 0
      const morale = 50
      expect(health <= 0 || morale <= 0).toBe(true)
    })

    it('game over si morale <= 0', () => {
      const health = 50
      const morale = 0
      expect(health <= 0 || morale <= 0).toBe(true)
    })

    it('no es game over si ambos > 0', () => {
      expect(50 <= 0 || 50 <= 0).toBe(false)
    })
  })

  describe('Detección de victoria', () => {
    it('victoria si day > 15 con recursos > 0', () => {
      const day = 16
      const health = 10
      const morale = 10
      expect(day > 15 && health > 0 && morale > 0).toBe(true)
    })
  })

  describe('Manejo de flags', () => {
    it('puede setear y leer flags', () => {
      const flags = {}
      flags.refugees = true
      expect(flags.refugees).toBe(true)
    })
  })
})
```

---

### Paso 8.3: Crear tests de Gemini

**Archivo:** `Backend/src/tests/gemini.spec.js`

```js
import { describe, it, expect } from 'vitest'
import { clamp, generateContextHash, buildGamePrompt } from '../services/gemini.js'

describe('Gemini — Utilidades', () => {
  describe('clamp()', () => {
    it('devuelve el valor si está dentro del rango', () => {
      expect(clamp(5, 0, 10)).toBe(5)
    })

    it('devuelve el mínimo si el valor está por debajo', () => {
      expect(clamp(-5, 0, 10)).toBe(0)
    })

    it('devuelve el máximo si el valor está por encima', () => {
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('funciona en los bordes', () => {
      expect(clamp(0, 0, 10)).toBe(0)
      expect(clamp(10, 0, 10)).toBe(10)
    })
  })

  describe('generateContextHash()', () => {
    it('genera un hash válido (64 caracteres hex)', () => {
      const hash = generateContextHash(5, {}, 5, 3, 70, 60)
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]+$/)
    })

    it('diferentes contextos generan diferentes hashes', () => {
      const hash1 = generateContextHash(5, {}, 5, 3, 70, 60)
      const hash2 = generateContextHash(6, {}, 5, 3, 70, 60)
      expect(hash1).not.toBe(hash2)
    })

    it('el mismo contexto genera el mismo hash', () => {
      const hash1 = generateContextHash(5, { refugees: true }, 4, 2, 50, 40)
      const hash2 = generateContextHash(5, { refugees: true }, 4, 2, 50, 40)
      expect(hash1).toBe(hash2)
    })
  })

  describe('buildGamePrompt()', () => {
    it('contiene información del estado del juego', () => {
      const prompt = buildGamePrompt(5, {}, 5, 3, 70, 60, 'ninguno', 'contexto de prueba')
      expect(prompt).toContain('5')
      expect(prompt).toContain('Comida')
      expect(prompt).toContain('Salud')
      expect(prompt).toContain('contexto de prueba')
    })

    it('maneja flags vacíos', () => {
      const prompt = buildGamePrompt(5, {}, 5, 3, 70, 60)
      expect(prompt).toContain('ninguno')
    })
  })
})
```

---

### Cómo verifico que está bien

```powershell
Set-Location -LiteralPath "Backend"

# Correr todos los tests del backend
pnpm test
```

Deberías ver algo como:

```
✓ Auth — JWT (5 tests)
✓ Games — Lógica de juego (11 tests)
✓ Gemini — Utilidades (8 tests)

Tests: 24 passed
```

---

### Commit

```
test(backend): agregar tests unitarios de auth, games y gemini
```

---

## DIA 9 — Viernes 26 de junio: Cliente HTTP y Auth en frontend

### Contexto

Ahora conectamos el frontend con el backend. Creamos el módulo API, el store de servidor y las pantallas de login/register en App.vue.

---

### Paso 9.1: Crear `api/index.js` (cliente HTTP)

**Archivo:** `Game/src/api/index.js` (carpeta `api` no existe, créala)

```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function request(path, options = {}) {
  const url = `${API_URL}${path}`
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    },
  })

  if (res.status === 401) {
    throw new Error('Sesión expirada')
  }

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Error en la petición')
  }

  return data
}

export const api = {
  auth: {
    async register(username, password) {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
    },
    async login(username, password) {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
    },
    async me() {
      return request('/auth/me')
    },
    async logout() {
      return request('/auth/logout', { method: 'POST' })
    },
  },

  games: {
    async create() {
      return request('/games', { method: 'POST' })
    },
    async list() {
      return request('/games/user')
    },
    async get(id) {
      return request(`/games/${id}`)
    },
    async start(id) {
      return request(`/games/${id}/start`, { method: 'PUT' })
    },
    async advanceSegment(id) {
      return request(`/games/${id}/advance-segment`, { method: 'PUT' })
    },
    async makeDecision(id, decisionIndex) {
      return request(`/games/${id}/decision`, {
        method: 'PUT',
        body: JSON.stringify({ decisionIndex }),
      })
    },
    async continue(id) {
      return request(`/games/${id}/continue`, { method: 'PUT' })
    },
    async completeMinigame(id, result) {
      return request(`/games/${id}/minigame`, {
        method: 'PUT',
        body: JSON.stringify({ result }),
      })
    },
  },

  dialogue: {
    async generate(context) {
      return request('/dialogue/generate', {
        method: 'POST',
        body: JSON.stringify(context),
      })
    },
    async cacheStats() {
      return request('/dialogue/cache/stats')
    },
  },
}
```

---

### Paso 9.2: Crear `serverStore.js`

**Archivo:** `Game/src/stores/serverStore.js`

```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../api/index.js'

export const useServerStore = defineStore('server', () => {
  const user = ref(null)

  const isLoggedIn = computed(() => !!user.value)

  async function register(username, password) {
    const data = await api.auth.register(username, password)
    user.value = data.user
    return data
  }

  async function login(username, password) {
    const data = await api.auth.login(username, password)
    user.value = data.user
    return data
  }

  async function fetchMe() {
    try {
      const data = await api.auth.me()
      user.value = data.user
    } catch {
      logout()
    }
  }

  async function logout() {
    try { await api.auth.logout() } catch { /* ignorar error de red */ }
    user.value = null
  }

  return { user, isLoggedIn, register, login, fetchMe, logout }
})
```

---

### Paso 9.3: Actualizar `App.vue` — Agregar login/register

**IMPORTANTE:** Este es el cambio más grande en el frontend. Vas a modificar `Game/src/App.vue`.

Los cambios necesarios son:

**A) Agregar el import de `serverStore`** en el `<script setup>`:

Busca:
```js
import { useGameStore } from './stores/gameStore.js'
```

Agrega debajo:
```js
import { useServerStore } from './stores/serverStore.js'
```

**B) Inicializar el store**:

Busca:
```js
const game = useGameStore()
```

Agrega debajo:
```js
const server = useServerStore()
```

**C) Agregar variables reactivas para auth**:

Busca:
```js
const showMinigameIntro = ref(true)
```

Agrega debajo:
```js
const authUsername = ref('')
const authPassword = ref('')
const authError = ref('')
```

**D) Agregar `onMounted`**:

Agrega después de las variables:
```js
onMounted(() => {
  server.fetchMe()
})
```

Asegúrate de que `onMounted` esté en el import de vue:
```js
import { ref, computed, watch, onMounted } from 'vue'
```

**E) Agregar badge de usuario y botones de login/logout en el header**:

Busca en el `<template>`:
```html
<span class="day-counter" v-if="...">
  DIA {{ game.day }}/15
</span>
```

Agrega **antes** de esa línea:
```html
<span v-if="server.isLoggedIn" class="user-badge" :title="server.user?.username">
  {{ server.user?.username }}
</span>
```

**F) En la sección del menú, agregar opciones de login y partida online**:

Busca en el menú:
```html
<button class="menu-btn primary" @click="handleNewGame">
  NUEVA PARTIDA (LOCAL)
</button>
```

Agrega debajo:
```html
<button v-if="server.isLoggedIn" class="menu-btn primary online-btn" @click="handleNewGameOnline">
  NUEVA PARTIDA ONLINE
</button>
```

Y después de los botones de reglas/configuración, agrega:
```html
<button v-if="!server.isLoggedIn" class="menu-btn" @click="game.phase = 'login'; authError = ''">
  INICIAR SESION
</button>
```

**G) Agregar pantallas de login y register**:

Busca el cierre del `v-else-if="game.phase === 'settings'"` y agrega **después del `</div>` de settings**:

```html
<div v-else-if="game.phase === 'login'" class="auth-screen">
  <div class="auth-content">
    <h2 class="auth-title">INICIAR SESION</h2>
    <p v-if="authError" class="auth-error">{{ authError }}</p>
    <form class="auth-form" @submit.prevent="handleLogin">
      <input v-model="authUsername" type="text" placeholder="Usuario" class="auth-input" />
      <input v-model="authPassword" type="password" placeholder="Contraseña" class="auth-input" />
      <button type="submit" class="menu-btn primary">ENTRAR</button>
    </form>
    <p class="auth-switch">
      ¿No tienes cuenta?
      <button class="link-btn" @click="game.phase = 'register'; authError = ''">REGISTRATE</button>
    </p>
    <button class="menu-btn" @click="goToMenu">VOLVER</button>
  </div>
</div>

<div v-else-if="game.phase === 'register'" class="auth-screen">
  <div class="auth-content">
    <h2 class="auth-title">REGISTRO</h2>
    <p v-if="authError" class="auth-error">{{ authError }}</p>
    <form class="auth-form" @submit.prevent="handleRegister">
      <input v-model="authUsername" type="text" placeholder="Usuario" class="auth-input" />
      <input v-model="authPassword" type="password" placeholder="Contraseña" class="auth-input" />
      <button type="submit" class="menu-btn primary">CREAR CUENTA</button>
    </form>
    <p class="auth-switch">
      ¿Ya tienes cuenta?
      <button class="link-btn" @click="game.phase = 'login'; authError = ''">INICIA SESION</button>
    </p>
    <button class="menu-btn" @click="goToMenu">VOLVER</button>
  </div>
</div>
```

**H) Agregar funciones de auth en `<script setup>`**:

```js
async function handleLogin() {
  try {
    authError.value = ''
    await server.login(authUsername.value, authPassword.value)
    authUsername.value = ''
    authPassword.value = ''
    goToMenu()
  } catch (err) {
    authError.value = err.message || 'Error al iniciar sesión'
  }
}

async function handleRegister() {
  try {
    authError.value = ''
    if (authPassword.value.length < 6) {
      authError.value = 'La contraseña debe tener al menos 6 caracteres'
      return
    }
    await server.register(authUsername.value, authPassword.value)
    authUsername.value = ''
    authPassword.value = ''
    goToMenu()
  } catch (err) {
    authError.value = err.message || 'Error al registrarse'
  }
}

async function handleLogout() {
  await server.logout()
  audio.playClick()
  game.reset()
  goToMenu()
}

async function handleNewGameOnline() {
  audio.playClick()
  audio.startMusic()
  game.reset()
  await game.startGameServer()
}
```

**I) Agregar botón de logout en el header**:

Busca en el header:
```html
<button class="header-btn mute-btn" ...>
```

Agrega **antes**:
```html
<button v-if="server.isLoggedIn" class="header-btn" @click="handleLogout">
  SALIR
</button>
<button v-else-if="game.phase === 'menu'" class="header-btn" @click="game.phase = 'login'; authError = ''">
  LOGIN
</button>
```

**J) Agregar estilos CSS** al final del bloque `<style scoped>`:

```css
.user-badge {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(6px, 0.8vw, 8px);
  color: #4ade80;
}

.online-badge {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(5px, 0.7vw, 7px);
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.15);
  padding: 2px 6px;
  border: 1px solid #fbbf24;
}

.online-btn {
  background: #f59e0b !important;
  color: #0a0a0a !important;
  border-color: #d97706 !important;
}

.online-btn:hover {
  background: #d97706 !important;
  transform: scale(1.05);
}

.auth-screen {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.auth-content {
  text-align: center;
  padding: 20px;
  max-width: 400px;
  width: 100%;
}

.auth-title {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(14px, 2.5vw, 22px);
  color: #4ade80;
  margin: 0 0 20px 0;
  text-shadow: 0 0 15px rgba(74, 222, 128, 0.5);
}

.auth-error {
  font-family: 'VT323', monospace;
  font-size: clamp(14px, 1.8vw, 18px);
  color: #ef4444;
  margin: 0 0 16px 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.auth-input {
  font-family: 'VT323', monospace;
  font-size: clamp(16px, 2vw, 20px);
  padding: 10px 16px;
  background: #1a1a2e;
  color: #e0e0e0;
  border: 3px solid #4a4a6a;
  outline: none;
  width: 100%;
  max-width: 300px;
  box-sizing: border-box;
}

.auth-input:focus {
  border-color: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.3);
}

.auth-switch {
  font-family: 'VT323', monospace;
  font-size: clamp(14px, 1.5vw, 17px);
  color: #888;
  margin: 12px 0;
}

.link-btn {
  background: none;
  border: none;
  font-family: 'VT323', monospace;
  font-size: inherit;
  color: #4ade80;
  cursor: pointer;
  text-decoration: underline;
}

.link-btn:hover {
  color: #22c55e;
}
```

---

### Cómo verifico que está bien

```powershell
# Terminal 1: Backend
Set-Location -LiteralPath "Backend"
pnpm dev

# Terminal 2: Frontend (en otra carpeta)
Set-Location -LiteralPath "Game"
pnpm dev

# Abre http://localhost:5173 en el navegador
```

Deberías ver:
1. El menú principal con el botón "INICIAR SESION"
2. Al hacer clic, una pantalla de login con campos usuario/contraseña
3. También puedes ir a registro
4. Al registrarte o iniciar sesión, vuelves al menú
5. En el header aparece tu nombre de usuario
6. El botón "SALIR" cierra sesión

---

### Commit

```
feat(frontend): implementar cliente HTTP y store de autenticacion
```

---

## Resumen de lo que deberías tener al final de la Semana 2

| Archivo | Estado |
|---|---|
| `Backend/src/data/events.js` | Copiado del frontend |
| `Backend/src/routes/games.js` | ~490 líneas, lógica completa |
| `Backend/src/routes/dialogue.js` | Creado con Gemini + caché |
| `Backend/src/services/gemini.js` | Creado (clamp, hash, prompt) |
| `Backend/src/tests/auth.spec.js` | 5 tests |
| `Backend/src/tests/games.spec.js` | 11 tests |
| `Backend/src/tests/gemini.spec.js` | 8 tests |
| `Game/src/api/index.js` | Creado (cliente HTTP) |
| `Game/src/stores/serverStore.js` | Creado |
| `Game/src/App.vue` | Login, register, user badge |

### Verificación final

```powershell
# Backend tests
Set-Location -LiteralPath "Backend"
pnpm test
# → 24 tests passed

# Backend corriendo con Gemini
# Asegúrate de que GEMINI_API_KEY está en .env
pnpm dev

# Frontend
Set-Location -LiteralPath "Game"
pnpm dev
# → Abre el navegador, prueba login/register
```

---

[← Semana 1](./GUIA_SEMANA_1.md) | [Semana 3 →](./GUIA_SEMANA_3.md)
