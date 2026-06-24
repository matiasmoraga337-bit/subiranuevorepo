# GUIA SEMANA 1 — Backend Foundation

**Fechas:** Martes 16 de junio → Viernes 19 de junio  
**Objetivo:** Dejar la estructura fullstack lista, modelos Mongoose poblados, auth JWT funcionando y CI/CD configurado.

---

## DIA 1 — Martes 16 de junio: Reorganizar estructura del proyecto

### Lo que tienes que hacer

Tu proyecto actual tiene archivos sueltos sin `.gitignore` raíz, el `README.md` está dentro de `Game/`, el archivo de diseño se llama `DESING.md` (con typo), y no hay `.gitattributes`.

---

### Paso 1.1: Crear `.gitignore` en la raíz

Crea el archivo en la carpeta raíz de tu repo (`Solemne2/`):

```
node_modules/
dist/
.env
*.log
.DS_Store
coverage/
```

**Archivo:** `C:\Users\Matias\Desktop\juego\juego actual\Solemne2\.gitignore`

---

### Paso 1.2: Crear `.gitattributes` en la raíz

```
# Auto detect text files and perform LF normalization
* text=auto
```

**Archivo:** `C:\Users\Matias\Desktop\juego\juego actual\Solemne2\.gitattributes`

---

### Paso 1.3: Renombrar `DESING.md` → `DESIGN.md`

En la terminal, dentro de `Solemne2/`:

```powershell
Rename-Item -LiteralPath "DESING.md" -NewName "DESIGN.md"
```

---

### Paso 1.4: Eliminar `PLANNING_BACKEND.md` (ya se unificó todo en PLANNING.md)

```powershell
Remove-Item -LiteralPath "PLANNING_BACKEND.md"
```

---

### Paso 1.5: Verificar estructura final

Tu repo debe verse así desde la raíz:

```
Solemne2/
├── .gitattributes
├── .gitignore
├── DESIGN.md
├── PLANNING.md
├── README.md              (lo creaste en el paso anterior)
├── .github/workflows/
│   ├── build.yml
│   ├── lint.yml
│   ├── main.yml
│   └── test.yml
├── Backend/
│   └── ... (modelos vacíos por ahora)
└── Game/
    └── ... (frontend)
```

---

### Cómo verifico que está bien

```powershell
# Listar raíz
Get-ChildItem -LiteralPath "." 

# Verificar que DESING.md ya no existe
Test-Path -LiteralPath "DESING.md"   # Debe devolver False

# Verificar que DESIGN.md sí existe
Test-Path -LiteralPath "DESIGN.md"   # Debe devolver True

# Verificar que PLANNING_BACKEND.md fue eliminado
Test-Path -LiteralPath "PLANNING_BACKEND.md"   # Debe devolver False
```

---

### Commit

```
chore: reorganizar estructura fullstack del proyecto
```

---

## DIA 2 — Miércoles 17 de junio: Modelos Mongoose

### Contexto

Los archivos en `Backend/src/models/` están **vacíos** (0 líneas). Hay que poblarlos con los schemas completos de Mongoose.

---

### Paso 2.1: Modelo `User.js`

**Archivo:** `Backend/src/models/User.js`

```js
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

export default mongoose.model('User', userSchema)
```

**Explicación:**
- `pre('save')`: Antes de guardar, hashea la contraseña con bcrypt (10 rondas de salt).
- `isModified('password')`: Solo re-hashea si la contraseña cambió (no en cada save).
- `comparePassword`: Método para verificar contraseña en login.
- `toJSON`: Elimina el campo password cuando el objeto se serializa a JSON (nunca se envía al frontend).

---

### Paso 2.2: Modelo `Game.js`

**Archivo:** `Backend/src/models/Game.js`

```js
import mongoose from 'mongoose'

const journalEntrySchema = new mongoose.Schema({
  day: Number,
  type: { type: String, enum: ['evento', 'decision', 'minijuego'] },
  title: String,
  decision: String,
  result: String,
  description: String,
  effects: mongoose.Schema.Types.Mixed,
  success: Boolean,
  timestamp: { type: Date, default: Date.now },
})

const gameSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: Number, default: 0 },
  phase: {
    type: String,
    enum: ['menu', 'intro', 'story', 'decision', 'result', 'minigame', 'victory', 'gameover'],
    default: 'intro',
  },
  food: { type: Number, default: 6 },
  water: { type: Number, default: 4 },
  health: { type: Number, default: 80 },
  morale: { type: Number, default: 70 },
  maxStat: { type: Number, default: 20 },
  maxHealth: { type: Number, default: 100 },
  maxMorale: { type: Number, default: 100 },
  flags: { type: mongoose.Schema.Types.Mixed, default: {} },
  journal: [journalEntrySchema],
  currentEvent: { type: mongoose.Schema.Types.Mixed, default: null },
  currentSegment: { type: Number, default: 0 },
  decisionResult: { type: mongoose.Schema.Types.Mixed, default: null },
  usedRandomEvents: [Number],
  gameOverReason: { type: String, default: null },
  eventsThisDay: { type: Number, default: 0 },
  maxEventsPerDay: { type: Number, default: 3 },
  status: {
    type: String,
    enum: ['active', 'won', 'lost'],
    default: 'active',
  },
}, { timestamps: true })

gameSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.__v
  return obj
}

export default mongoose.model('Game', gameSchema)
```

**Explicación:**
- `flags`: Objeto Mixed para guardar decisiones que afectan la historia (ej: `{ refugees: true }`).
- `journal`: Array de subdocumentos con cada entrada del diario.
- `currentEvent`: El evento narrativo actual (objeto JSON dinámico).
- `eventsThisDay` / `maxEventsPerDay`: Permite múltiples eventos por día (máx 3).
- `status`: active, won, lost.

---

### Paso 2.3: Modelo `Dialogue.js`

**Archivo:** `Backend/src/models/Dialogue.js`

```js
import mongoose from 'mongoose'

const dialogueSchema = new mongoose.Schema({
  contextHash: { type: String, required: true, unique: true, index: true },
  prompt: { type: String, required: true },
  response: { type: mongoose.Schema.Types.Mixed, required: true },
  model: { type: String, default: 'gemini-2.5-flash' },
  tokensUsed: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.model('Dialogue', dialogueSchema)
```

**Explicación:**
- `contextHash`: SHA256 del estado del juego. Sirve como clave de caché para no llamar a Gemini dos veces con el mismo contexto.
- `response`: Mixed porque es un objeto JSON con title, segments, decisions, etc.
- `index: true`: Índice en MongoDB para búsquedas rápidas por hash.

---

### Cómo verifico que está bien

```powershell
# Ir a la carpeta backend
Set-Location -LiteralPath "Backend"

# Instalar dependencias (si no lo has hecho)
pnpm install

# Iniciar MongoDB localmente (si tienes Docker)
docker run -d --name mongo-test -p 27017:27017 mongo:7

# Verificar que Mongoose se conecta sin errores
# Crea un archivo temporal test-db.js:
```

Crea `Backend/test-db.js`:

```js
import './src/config/db.js'
import User from './src/models/User.js'
import Game from './src/models/Game.js'
import Dialogue from './src/models/Dialogue.js'

try {
  await mongoose.connect('mongodb://localhost:27017/15dias-test')
  console.log('✓ Conexion OK')
  
  const user = await User.create({ username: 'test', password: '123456' })
  console.log('✓ User creado:', user.toJSON())
  
  await user.deleteOne()
  console.log('✓ User eliminado')
  
  await mongoose.disconnect()
  console.log('✓ Desconectado')
} catch (err) {
  console.error('✗ Error:', err.message)
}
```

Luego ejecuta:

```powershell
node test-db.js
```

Deberías ver 4 checks verdes. Luego borra el archivo de prueba.

---

### Commit

```
feat(backend): implementar modelos Mongoose - User, Game, Dialogue
```

---

## DIA 3 — Jueves 18 de junio: Autenticación JWT

### Contexto

El backend actual solo tiene `src/index.js` con un health check. Hay que agregar middleware de auth y rutas completas de autenticación.

---

### Paso 3.1: Crear middleware `auth.js`

**Archivo:** `Backend/src/middleware/auth.js` (carpeta `middleware` no existe, créala)

```js
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
```

**Explicación:**
- Lee el JWT desde la cookie `token` (httpOnly).
- Verifica con `JWT_SECRET`.
- Si es válido, setea `req.userId` para que las rutas protegidas sepan quién es el usuario.
- Si falla, devuelve 401.

---

### Paso 3.2: Crear rutas `auth.js`

**Archivo:** `Backend/src/routes/auth.js` (carpeta `routes` no existe, créala)

```js
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
}

function setTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
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
```

**Explicación de las 4 rutas:**
- `POST /api/auth/register` — Crea usuario, genera JWT, lo pone en cookie.
- `POST /api/auth/login` — Verifica credenciales, genera JWT, lo pone en cookie.
- `GET /api/auth/me` — (Protegida) Devuelve datos del usuario autenticado.
- `POST /api/auth/logout` — Limpia la cookie.

---

### Paso 3.3: Actualizar `index.js`

**Archivo:** `Backend/src/index.js`

Reemplaza TODO el contenido actual por:

```js
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
```

**ATENCIÓN:** Las rutas `/api/games` y `/api/dialogue` van a fallar al iniciar porque los archivos no existen todavía. Por ahora podes comentarlas o crear archivos vacíos temporales:

Crea `Backend/src/routes/games.js` temporal:
```js
import { Router } from 'express'
const router = Router()
router.get('/', (req, res) => res.json([]))
export default router
```

Crea `Backend/src/routes/dialogue.js` temporal:
```js
import { Router } from 'express'
const router = Router()
router.get('/', (req, res) => res.json([]))
export default router
```

**Nota:** Estos archivos los reemplazarás con el código real en la Semana 2.

---

### Cómo verifico que está bien

**Paso 1:** Asegúrate de tener MongoDB corriendo:

```powershell
# Si no tienes MongoDB local, usa Docker:
docker run -d --name mongo-dev -p 27017:27017 mongo:7
```

**Paso 2:** Crea el archivo `.env` en `Backend/`:

```
MONGODB_URI=mongodb://localhost:27017/15dias
JWT_SECRET=cambia-esto-por-un-secreto-real
PORT=3000
```

**Paso 3:** Inicia el backend:

```powershell
Set-Location -LiteralPath "Backend"
pnpm dev
```

Deberías ver:
```
MongoDB conectado
Backend corriendo en http://localhost:3000
```

**Paso 4:** En OTRA terminal, prueba con curl (o usa Postman/Thunder Client):

```powershell
# Health check
curl http://localhost:3000/api/health
# → {"status":"ok"}

# Registrar usuario
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"username":"diego","password":"123456"}' `
  -c cookies.txt
# → {"user":{"_id":"...","username":"diego",...}}

# Ver usuario logueado (usa la cookie guardada)
curl http://localhost:3000/api/auth/me -b cookies.txt
# → {"user":{"_id":"...","username":"diego",...}}

# Logout
curl -X POST http://localhost:3000/api/auth/logout -b cookies.txt
# → {"message":"Sesión cerrada"}

# Login de nuevo
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"diego","password":"123456"}' `
  -c cookies.txt
# → {"user":{"_id":"...","username":"diego",...}}
```

Si los 4 endpoints responden correctamente, el auth está funcionando.

---

### Commit

```
feat(backend): implementar autenticacion JWT con cookies httpOnly
```

---

## DIA 4 — Viernes 19 de junio: CI/CD unificado

### Contexto

Actualmente tienes 4 archivos de workflow separados: `build.yml`, `lint.yml`, `test.yml`, `main.yml`. Hay que unificarlos en un solo `main.yml` que además haga push real a DockerHub.

---

### Paso 4.1: Reemplazar `.github/workflows/main.yml`

Borra los 3 archivos antiguos (`build.yml`, `lint.yml`, `test.yml`) y reemplaza `main.yml` por:

**Archivo:** `.github/workflows/main.yml`

```yaml
name: CI/CD Fullstack

on:
  push:
    branches: [main, master]

jobs:
  lint-and-test-frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./Game
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          cache-dependency-path: './Game/pnpm-lock.yaml'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test

  lint-and-test-backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          cache-dependency-path: './backend/pnpm-lock.yaml'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test

  build-and-push:
    needs: [lint-and-test-frontend, lint-and-test-backend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Log in to DockerHub
        uses: docker/login-action@v4
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}

      - name: Build and push frontend
        uses: docker/build-push-action@v6
        with:
          context: ./Game
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/15dias-frontend:latest

      - name: Build and push backend
        uses: docker/build-push-action@v6
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/15dias-backend:latest
```

**Explicación de los 3 jobs:**
1. **lint-and-test-frontend** — Instala deps de `Game/`, corre linter y vitest.
2. **lint-and-test-backend** — Instala deps de `backend/`, corre linter y vitest.
3. **build-and-push** — Solo corre si los 2 anteriores pasan. Hace login en DockerHub y pushea las imágenes.

---

### Paso 4.2: Eliminar workflows antiguos

```powershell
Remove-Item -LiteralPath ".github\workflows\build.yml"
Remove-Item -LiteralPath ".github\workflows\lint.yml"
Remove-Item -LiteralPath ".github\workflows\test.yml"
```

---

### Paso 4.3: Configurar secrets en GitHub

1. Ve a tu repo en GitHub → Settings → Secrets and variables → Actions
2. Agrega estos secrets:
   - `DOCKER_USERNAME` → tu usuario de DockerHub (ej: `matias0512`)
   - `DOCKER_TOKEN` → un access token de DockerHub (generalo en hub.docker.com → Account Settings → Security → New Access Token)

---

### Cómo verifico que está bien

Haz un push a `main` y revisa la pestaña Actions en GitHub. Deberías ver 3 jobs ejecutándose. Los 2 de lint+test deben pasar (el backend va a fallar por ahora si no hay tests — es normal, lo arreglaremos en la Semana 2).

Para probar localmente que la sintaxis YAML es válida:

```powershell
# Instalar act (simulador de GitHub Actions local)
# O simplemente valida la sintaxis en:
# https://jsonformatter.org/yaml-validator
```

---

### Commit

```
ci: unificar workflows y agregar CI/CD con push a DockerHub
```

---

## Resumen de lo que deberías tener al final de la Semana 1

| Archivo | Estado |
|---|---|
| `.gitignore` (raíz) | Creado |
| `.gitattributes` | Creado |
| `DESIGN.md` | Renombrado (sin typo) |
| `PLANNING.md` | Actualizado |
| `Backend/src/models/User.js` | Poblado (25 líneas) |
| `Backend/src/models/Game.js` | Poblado (52 líneas) |
| `Backend/src/models/Dialogue.js` | Poblado (11 líneas) |
| `Backend/src/middleware/auth.js` | Creado |
| `Backend/src/routes/auth.js` | Creado (register, login, me, logout) |
| `Backend/src/index.js` | Actualizado con todas las rutas |
| `.github/workflows/main.yml` | Unificado con 3 jobs |
| `.github/workflows/build.yml` | Eliminado |
| `.github/workflows/lint.yml` | Eliminado |
| `.github/workflows/test.yml` | Eliminado |

### Verificación final de la semana

```powershell
# 1. Backend enciende sin errores
Set-Location -LiteralPath "Backend"
pnpm dev
# Ctrl+C para detener

# 2. Auth funciona con curl (probar register, login, me, logout)

# 3. Estructura de archivos correcta
Get-ChildItem -Recurse -Depth 2 -LiteralPath ".."
```

---

[← Volver al PLANNING.md](./PLANNING.md) | [Semana 2 →](./GUIA_SEMANA_2.md)
