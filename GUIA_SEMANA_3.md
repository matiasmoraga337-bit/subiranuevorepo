# GUIA SEMANA 3 — Integración Frontend-Backend + Docker + Entrega

**Fechas:** Lunes 29 de junio → Jueves 2 de julio  
**Objetivo:** Conectar el gameStore al backend para modo online, dockerizar todo, verificar tests, documentar y entregar.

---

## DIA 10 — Lunes 29 de junio: gameStore online + App.vue modo servidor

### Contexto

El `gameStore.js` actual solo funciona en modo local. Hay que agregarle `serverGameId` y métodos que deleguen las acciones al backend cuando se está en modo online. También hay que actualizar `App.vue` para que soporte ambos modos.

---

### Paso 10.1: Actualizar `gameStore.js`

**Archivo:** `Game/src/stores/gameStore.js`

Los cambios principales son:

#### A) Agregar el import del API

Busca:
```js
import { fixedEvents, randomEvents, minigameEvents } from '../data/events.js'
```

Agrega debajo:
```js
import { api } from '../api/index.js'
```

#### B) Agregar `serverGameId` al state

Busca:
```js
    journal: [],
```

Agrega debajo:
```js
    serverGameId: null,
```

#### C) Unificar valores iniciales

Busca en `state` y cambia:
```js
    food: 6,
    water: 4,
    health: 80,
    morale: 70,
```

Y en `startGame()`, busca y cambia los mismos valores:
```js
    this.food = 6
    this.water = 4
    this.health = 80
    this.morale = 70
```

> **Nota:** Si tu gameStore actual usa 10/8/100/100, cambia todo a 6/4/80/70 para que coincida con el backend.

#### D) Modificar `advanceSegment` para delegar al servidor

Reemplaza la función `advanceSegment` completa por:

```js
    advanceSegment() {
      if (this.serverGameId) {
        this.advanceSegmentServer()
        return
      }

      if (!this.currentEvent) return

      const isLastSegment = this.currentSegment >= this.currentEvent.segments.length - 1

      if (isLastSegment) {
        if (this.currentEvent.type === 'intro') {
          this.day = 1
          this.advanceDay()
        } else if (this.currentEvent.decisions) {
          this.phase = 'decision'
        } else {
          if (this.currentEvent.effects) {
            this.applyEffects(this.currentEvent.effects)
          }
          this.addToJournal({
            type: 'evento',
            title: this.currentEvent.title || 'Evento aleatorio',
            description: this.currentEvent.segments.map((s) => s.text).join(' '),
          })
          this.day++
          this.advanceDay()
        }
      } else {
        this.currentSegment++
      }
    },
```

#### E) Modificar `makeDecision` para delegar al servidor

Reemplaza el inicio de la función (agrega el check al principio):

```js
    makeDecision(decisionIndex) {
      if (this.serverGameId) {
        this.makeDecisionServer(decisionIndex)
        return
      }

      const event = this.currentEvent
      // ... el resto queda igual
```

#### F) Modificar `continueAfterResult`

Agrega al principio:
```js
    continueAfterResult() {
      if (this.serverGameId) {
        this.continueAfterResultServer()
        return
      }
      // ... el resto queda igual
```

#### G) Modificar `completeMinigame`

Agrega al principio:
```js
    completeMinigame(result) {
      if (this.serverGameId) {
        this.completeMinigameServer(result)
        return
      }
      // ... el resto queda igual
```

#### H) Agregar los métodos de servidor y helpers

Agrega esto ANTES del último `}` de cierre de `actions` (antes de `reset`):

```js
    applyServerState(serverState) {
      if (!serverState) return
      this.day = serverState.day ?? this.day
      this.phase = serverState.phase ?? this.phase
      this.food = serverState.food ?? this.food
      this.water = serverState.water ?? this.water
      this.health = serverState.health ?? this.health
      this.morale = serverState.morale ?? this.morale
      this.currentEvent = serverState.currentEvent ?? this.currentEvent
      this.currentSegment = serverState.currentSegment ?? this.currentSegment
      this.decisionResult = serverState.decisionResult ?? this.decisionResult
      this.flags = serverState.flags ?? this.flags
      this.journal = serverState.journal ?? this.journal
      this.gameOverReason = serverState.gameOverReason ?? this.gameOverReason
    },

    async startGameServer() {
      try {
        const data = await api.games.create()
        this.serverGameId = data._id
        this.applyServerState(data)
      } catch (err) {
        console.error('Error al crear partida en servidor:', err)
        this.startGame()
      }
    },

    async startGameOnServer() {
      if (!this.serverGameId) return
      try {
        const data = await api.games.start(this.serverGameId)
        this.applyServerState(data)
      } catch (err) {
        console.error('Error al iniciar partida en servidor:', err)
      }
    },

    async advanceSegmentServer() {
      if (!this.serverGameId) return
      try {
        const data = await api.games.advanceSegment(this.serverGameId)
        this.applyServerState(data)
      } catch (err) {
        console.error('Error al avanzar segmento en servidor:', err)
      }
    },

    async makeDecisionServer(index) {
      if (!this.serverGameId) return
      try {
        const data = await api.games.makeDecision(this.serverGameId, index)
        this.applyServerState(data)
      } catch (err) {
        console.error('Error al tomar decisión en servidor:', err)
      }
    },

    async continueAfterResultServer() {
      if (!this.serverGameId) return
      try {
        const data = await api.games.continue(this.serverGameId)
        this.applyServerState(data)
      } catch (err) {
        console.error('Error al continuar en servidor:', err)
      }
    },

    async completeMinigameServer(result) {
      if (!this.serverGameId) return
      try {
        const data = await api.games.completeMinigame(this.serverGameId, result)
        this.applyServerState(data)
      } catch (err) {
        console.error('Error al completar minijuego en servidor:', err)
      }
    },
```

#### I) Modificar `reset` para limpiar `serverGameId`

Reemplaza la función `reset` por:

```js
    reset() {
      this.serverGameId = null
      this.$reset()
    },
```

---

### Paso 10.2: Actualizar `App.vue` — Modo online

#### A) Agregar botón ONLINE en menú

Si no lo hiciste en el Día 9, en la sección del menú agrega:

```html
<button v-if="server.isLoggedIn" class="menu-btn primary online-btn" @click="handleNewGameOnline">
  NUEVA PARTIDA ONLINE
</button>
```

#### B) Agregar badge ONLINE en header

Busca en el header:
```html
<span class="day-counter" ...>
```

Agrega debajo (o cerca):
```html
<span v-if="game.serverGameId" class="online-badge" title="Partida guardada en el servidor">ONLINE</span>
```

#### C) Modificar `handleStart` para usar servidor cuando corresponda

Busca la función `handleStart` y reemplázala por:

```js
function handleStart() {
  audio.playClick()
  if (game.serverGameId) {
    game.startGameOnServer()
  } else {
    game.day = 1
    game.advanceDay()
  }
}
```

#### D) Modificar `handleRestart`

Busca y reemplaza:

```js
function handleRestart() {
  audio.playClick()
  showJournal.value = false
  game.reset()
  game.startGame()
}
```

---

### Paso 10.3: Actualizar `vite.config.js` — Agregar proxy

**Archivo:** `Game/vite.config.js`

Agrega la configuración de proxy para que en desarrollo las llamadas a `/api` vayan al backend sin problemas de CORS:

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,vue}'],
      exclude: ['src/tests/**', 'src/main.js'],
    },
  },
})
```

> **¿Por qué el proxy?** Durante desarrollo, el frontend corre en `localhost:5173` y el backend en `localhost:3000`. Sin el proxy, las llamadas `fetch('/api/...')` irían a `localhost:5173/api/...` y fallarían. Con el proxy, Vite redirige cualquier request que empiece con `/api` al backend en `localhost:3000`.

---

### Cómo verifico que está bien

```powershell
# Terminal 1: Backend
Set-Location -LiteralPath "Backend"
pnpm dev

# Terminal 2: Frontend
Set-Location -LiteralPath "Game"
pnpm dev
```

**Prueba en el navegador:**
1. Abre `http://localhost:5173`
2. Haz clic en "INICIAR SESION" → Regístrate o inicia sesión
3. En el menú, deberías ver "NUEVA PARTIDA ONLINE" (en amarillo/naranja)
4. Haz clic → Debería iniciar la intro (día 0) como siempre
5. Haz clic en "COMENZAR SUPERVIVENCIA" → Deberías ver "ONLINE" en el header
6. Juega normalmente: avanzar segmentos, tomar decisiones, etc.
7. Recarga la página → Deberías seguir logueado (la cookie persiste)

**Prueba con curl para verificar el proxy de Vite:**
```powershell
# Con el frontend corriendo, esto debería funcionar:
curl http://localhost:5173/api/health
# → {"status":"ok"}
```

---

### Commit

```
feat(frontend): conectar gameStore con backend para modo online
```

---

## DIA 11 — Martes 30 de junio: Docker Compose y Dockerfiles

### Contexto

Hay que dockerizar los 3 servicios (MongoDB, backend, frontend) y crear la orquestación con Docker Compose.

---

### Paso 11.1: Crear `compose.yml` en la raíz

**Archivo:** `compose.yml` (en la raíz del repo `Solemne2/`)

```yaml
services:
  mongodb:
    image: mongo:7
    container_name: 15dias-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_DATABASE: 15dias
      MONGO_INITDB_ROOT_USERNAME: Admin
      MONGO_INITDB_ROOT_PASSWORD: contraseñasegura

  backend:
    build: ./backend
    container_name: 15dias-backend
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
    environment:
      PORT: 3000
      MONGODB_URI: mongodb://Admin:contrase%C3%B1asegura@mongodb:27017/15dias?authSource=admin
      JWT_SECRET: ${JWT_SECRET:-cambia-esto-por-un-secreto-real}
      GEMINI_API_KEY: ${GEMINI_API_KEY}

  frontend:
    build: ./Game
    container_name: 15dias-frontend
    ports:
      - "5173:4173"
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://localhost:3000/api

volumes:
  mongo-data:
```

**Explicación:**
- `mongodb`: MongoDB 7 con autenticación (user Admin, password contraseñasegura). Los datos persisten en un volumen.
- `backend`: Se construye desde `./backend/`. Expone puerto 3000. Depende de mongodb.
- `frontend`: Se construye desde `./Game/`. Expone puerto 5173 (mapeado al 4173 interno). Depende del backend.
- `contrase%C3%B1asegura` es la versión URL-encoded de `contraseñasegura` (la ñ se codifica).

---

### Paso 11.2: Crear `docker-compose.prod.yml` (producción)

**Archivo:** `docker-compose.prod.yml` (en la raíz)

```yaml
services:
  mongodb:
    image: mongo:7
    container_name: 15dias-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_DATABASE: 15dias
      MONGO_INITDB_ROOT_USERNAME: Admin
      MONGO_INITDB_ROOT_PASSWORD: contraseñasegura

  backend:
    image: matias0512/15dias-backend:latest
    container_name: 15dias-backend
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
    environment:
      PORT: 3000
      MONGODB_URI: mongodb://Admin:contrase%C3%B1asegura@mongodb:27017/15dias?authSource=admin
      JWT_SECRET: ${JWT_SECRET:-cambia-esto-por-un-secreto-real}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      ALLOWED_ORIGIN: ${ALLOWED_ORIGIN:-http://localhost:5173}

  frontend:
    image: matias0512/15dias-frontend:latest
    container_name: 15dias-frontend
    ports:
      - "5173:4173"
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://localhost:3000/api

volumes:
  mongo-data:
```

> **Diferencia con compose.yml:** Usa imágenes pre-built de DockerHub en vez de construir desde el código fuente. Cambia `matias0512` por tu usuario de DockerHub.

---

### Paso 11.3: Crear `backend/Dockerfile`

**Archivo:** `Backend/Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]
```

---

### Paso 11.4: Crear `backend/.dockerignore`

**Archivo:** `Backend/.dockerignore`

```
node_modules/
coverage/
.env
.git
```

---

### Paso 11.5: Actualizar `Game/Dockerfile` para producción

**Archivo:** `Game/Dockerfile` — Reemplaza TODO el contenido:

```dockerfile
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 4173

CMD ["pnpm", "preview", "--host", "0.0.0.0"]
```

**Explicación:**
- Antes: corría `pnpm dev` (servidor de desarrollo, puerto 5173).
- Ahora: corre `pnpm build` (genera archivos optimizados en `dist/`) y luego `pnpm preview` (servidor de producción, puerto 4173).

---

### Paso 11.6: Mover imágenes a `public/`

Actualmente las imágenes están en `Game/src/assets/Imagen/`. En producción, Vite solo incluye assets importados desde JS. Las imágenes referenciadas dinámicamente deben estar en `public/`.

```powershell
# Asegúrate de que la carpeta existe
New-Item -ItemType Directory -Path "Game\public\Imagen\" -Force

# Copia todas las imágenes
Copy-Item -LiteralPath "Game\src\assets\Imagen\*.png" -Destination "Game\public\Imagen\"
```

---

### Paso 11.7: Crear `.env` raíz

**Archivo:** `.env` (en la raíz `Solemne2/`)

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/15dias
JWT_SECRET=cambia-esto-por-un-secreto-real
GEMINI_API_KEY=TU_API_KEY_DE_GEMINI
```

---

### Cómo verifico que está bien

```powershell
# Asegúrate de que Docker Desktop está corriendo

# Construir y levantar todo
docker compose up --build

# Deberías ver 3 servicios iniciándose:
# - 15dias-mongo
# - 15dias-backend
# - 15dias-frontend

# Verificar que los 3 contenedores están corriendo
docker ps

# Probar el backend
curl http://localhost:3000/api/health
# → {"status":"ok"}

# Abrir el frontend en el navegador
# http://localhost:5173
```

Si todo funciona, detén los contenedores:

```powershell
docker compose down
```

---

### Commit

```
docker: configurar Docker Compose y Dockerfiles para produccion
```

---

## DIA 12 — Miércoles 1 de julio: Tests, build y corrección de bugs

### Paso 12.1: Actualizar tests del frontend

**Archivo:** `Game/src/tests/gameStore.spec.js`

Busca en el archivo los valores iniciales y actualízalos si dicen 10/8/100/100. Deben coincidir con los nuevos valores:

```js
expect(store.food).toBe(6)    // antes era 10
expect(store.water).toBe(4)   // antes era 8
expect(store.health).toBe(80) // antes era 100
expect(store.morale).toBe(70) // antes era 100
```

---

### Paso 12.2: Verificar que todos los tests pasan

```powershell
# Frontend tests (19 tests)
Set-Location -LiteralPath "Game"
pnpm test
# → 19 tests passed

# Backend tests (29 tests)
Set-Location -LiteralPath "Backend"
pnpm test
# → 29 tests passed
```

**Total: 48 tests deben pasar.**

Si algún test falla, revisa el error:
- Si es por valores iniciales: actualiza los expects en el test.
- Si es por funciones que no existen: asegúrate de haber agregado todos los métodos al gameStore.

---

### Paso 12.3: Build de producción del frontend

```powershell
Set-Location -LiteralPath "Game"
pnpm build
```

Esto genera la carpeta `dist/` con los archivos optimizados. Verifica que no haya errores en la terminal.

---

### Paso 12.4: Corrección de bugs comunes

#### Bug: Ciclo día 0 → día 1 → día 0 en modo online

**Causa:** El botón "COMENZAR SUPERVIVENCIA" llama a `handleStart()`, que en modo local hace `game.day = 1; game.advanceDay()`. Pero en modo online debe llamar a `game.startGameOnServer()` que hace `PUT /:id/start`.

**Solución:** Ya está implementado en el Paso 10.2-C. Asegúrate de que `handleStart` tenga:

```js
function handleStart() {
  audio.playClick()
  if (game.serverGameId) {
    game.startGameOnServer()
  } else {
    game.day = 1
    game.advanceDay()
  }
}
```

#### Bug: Imágenes no se ven en producción

**Causa:** Las imágenes están en `src/assets/Imagen/` y se referencian con `import.meta.glob`. En el build de producción, Vite les cambia el nombre.

**Solución:** Asegúrate de que las imágenes también estén en `public/Imagen/` (Paso 11.6). El componente `SceneArt.vue` intenta resolver desde `src/assets/Imagen/` primero, y si no encuentra, usa un fallback CSS.

#### Bug: Gemini devuelve JSON con errores de sintaxis

**Causa:** A veces Gemini agrega `+15` en vez de `15` o deja trailing commas.

**Solución:** La función `extractAndParseJSON` en `Backend/src/routes/games.js` ya maneja estos casos (4 intentos de parseo). Si sigue fallando, revisa que esté implementada correctamente (Paso 6.3 del Día 6).

---

### Cómo verifico que está bien

```powershell
# 1. Tests
Set-Location -LiteralPath "Game"; pnpm test
Set-Location -LiteralPath "Backend"; pnpm test
# Deben pasar 19 + 29 = 48 tests

# 2. Build
Set-Location -LiteralPath "Game"; pnpm build
# No debe haber errores

# 3. Lint
Set-Location -LiteralPath "Game"; pnpm lint
Set-Location -LiteralPath "Backend"; pnpm lint
# No debe haber errores

# 4. Flujo completo con Docker
docker compose up --build
# Probar en navegador: registrar, crear partida online, jugar día 0 y 1
# Verificar que los recursos se actualizan correctamente
# Verificar que el diario se llena
```

---

### Commit

```
test: actualizar tests, verificar cobertura y corregir bugs
```

---

## DIA 13 — Jueves 2 de julio: Documentación final y ENTREGA

### Paso 13.1: Actualizar `README.md` raíz

**Archivo:** `README.md` (en la raíz)

El README debe incluir:

```markdown
# 🏚 15 Días — Juego de Supervivencia Post-Apocalíptico

Juego fullstack de supervivencia narrativa desarrollado con Vue 3 + Express + MongoDB + Google Gemini.

## 🎮 Descripción

Sobrevive 15 días en tu departamento después de un brote apocalíptico. 
Administrá comida, agua, salud y moral. Cada decisión importa. 
El rescate en helicóptero llega el día 15... si lográs sobrevivir.

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3 (Composition API) + Pinia + Vite |
| Estilos | NES.css + Pixelium Design + CSS retro |
| Backend | Express 5 + Node.js 20 |
| Base de datos | MongoDB 7 + Mongoose |
| Autenticación | JWT con cookies httpOnly |
| IA | Google Gemini 2.5 Flash |
| Testing | Vitest (48 tests total) |
| CI/CD | GitHub Actions |
| Contenedores | Docker + Docker Compose |
| Registro | DockerHub |

## 🚀 Cómo ejecutar

### Con Docker Compose (recomendado)

```bash
# 1. Clonar el repo
git clone https://github.com/DiegoUC-01/Solemne2.git
cd Solemne2

# 2. Crear archivo .env con tu API key de Gemini
echo "GEMINI_API_KEY=tu_api_key" > .env

# 3. Levantar los servicios
docker compose up --build

# 4. Abrir en navegador
# http://localhost:5173
```

### Desarrollo local

```bash
# Terminal 1: MongoDB
docker run -d --name mongo-dev -p 27017:27017 mongo:7

# Terminal 2: Backend
cd backend
pnpm install
pnpm dev

# Terminal 3: Frontend
cd Game
pnpm install
pnpm dev
```

## 🧪 Tests

```bash
# Frontend (19 tests)
cd Game && pnpm test

# Backend (29 tests)
cd backend && pnpm test
```

## 📦 DockerHub

- Frontend: `matias0512/15dias-frontend:latest`
- Backend: `matias0512/15dias-backend:latest`

## 📁 Estructura del proyecto

```
Solemne2/
├── compose.yml               # Docker Compose desarrollo
├── docker-compose.prod.yml   # Docker Compose producción (imágenes DockerHub)
├── DESIGN.md                 # Documento de diseño
├── PLANNING.md               # Planificación
├── README.md                 # Este archivo
├── .github/workflows/        # CI/CD
├── Game/                     # Frontend (Vue 3 + Vite)
│   ├── src/
│   │   ├── api/              # Cliente HTTP
│   │   ├── components/       # Componentes Vue
│   │   ├── composables/      # Composables (audio)
│   │   ├── data/             # Eventos narrativos
│   │   ├── stores/           # Pinia stores
│   │   └── tests/            # Tests frontend
│   └── public/               # Assets públicos
└── backend/                  # Backend (Express + MongoDB)
    └── src/
        ├── config/           # Conexión DB
        ├── middleware/        # Auth JWT
        ├── models/           # Schemas Mongoose
        ├── routes/           # Endpoints REST
        ├── services/         # Gemini IA
        └── tests/            # Tests backend
```
```

---

### Paso 13.2: Revisar `DESIGN.md`

Abre `DESIGN.md` y verifica que contenga:

- [x] Arquitectura fullstack (frontend ↔ backend ↔ MongoDB ↔ Gemini)
- [x] Diagrama de componentes o descripción de la arquitectura
- [x] Modelos de datos (User, Game, Dialogue)
- [x] Endpoints REST documentados
- [x] Justificación del servicio externo (Gemini)

Si falta algo, agrégalo.

---

### Paso 13.3: Actualizar `PLANNING.md` con resultados finales

Abre `PLANNING.md` y marca todas las tareas como completadas. Para cada día, en la columna "Logrado", escribe ✅.

---

### Paso 13.4: Push final a GitHub

```powershell
# Revisar estado actual
git status

# Agregar todos los cambios nuevos
git add .

# Verificar que no se incluye .env ni node_modules
git status

# Commit final de documentación
git commit -m "docs: finalizar documentacion y preparar entrega final"

# Push
git push origin main
```

---

### Paso 13.5: Verificar CI/CD en GitHub Actions

1. Ve a tu repo en GitHub → pestaña **Actions**
2. Deberías ver el workflow `CI/CD Fullstack` ejecutándose
3. Espera a que los 3 jobs terminen (lint+test frontend, lint+test backend, build+push)
4. Verifica que todos están en verde ✅
5. Si build-and-push falla, revisa que los secrets `DOCKER_USERNAME` y `DOCKER_TOKEN` estén configurados

---

### Paso 13.6: Verificar imágenes en DockerHub

1. Ve a https://hub.docker.com
2. Busca tus repositorios `15dias-frontend` y `15dias-backend`
3. Deberías ver el tag `latest` con un push reciente

---

### Paso 13.7: Probar `docker-compose.prod.yml`

```powershell
# Bajar cualquier contenedor previo
docker compose down

# Levantar con la versión de producción
docker compose -f docker-compose.prod.yml up

# Verificar que funciona igual
# http://localhost:5173
```

---

### Commit

```
docs: finalizar documentacion y preparar entrega final
```

---

## Lista de verificación para la entrega final

Antes de enviar el correo al profesor, verifica:

- [ ] `git status` no muestra archivos sin commitear
- [ ] `.env` y `node_modules/` NO están en el repo (confirmar con `git status`)
- [ ] GitHub Actions pasa los 3 jobs en verde
- [ ] `docker compose up --build` levanta los 3 servicios sin errores
- [ ] Puedes registrarte, iniciar sesión, crear partida online, jugar día 0 y día 1
- [ ] Modo local (sin login) también funciona
- [ ] Tests: 48/48 pasan (`pnpm test` en Game y Backend)
- [ ] `README.md` tiene instrucciones claras
- [ ] `DESIGN.md` está completo y sin typo en el nombre
- [ ] `PLANNING.md` tiene todas las tareas marcadas ✅
- [ ] DockerHub tiene las 2 imágenes (`15dias-frontend:latest`, `15dias-backend:latest`)
- [ ] `docker-compose.prod.yml` funciona con las imágenes de DockerHub

### Correo al profesor

```
Asunto: Entrega Solemne 3 — 15 Días

Integrantes:
- Diego Alvarez
- Matias Moraga

Repositorio: https://github.com/DiegoUC-01/Solemne2

DockerHub:
- https://hub.docker.com/r/matias0512/15dias-frontend
- https://hub.docker.com/r/matias0512/15dias-backend

Instrucciones para ejecutar: Ver README.md en el repositorio.
```

---

## Resumen final del proyecto

| Indicador | Valor |
|---|---|
| **Tests frontend** | 19 |
| **Tests backend** | 29 |
| **Tests totales** | 48 |
| **Endpoints REST** | 14 |
| **Modelos MongoDB** | 3 (User, Game, Dialogue) |
| **Servicios Docker** | 3 (mongo, backend, frontend) |
| **Días de contenido narrativo** | 15 (día 0 al 15) |
| **Minijuegos** | 3 (catchRain, findCans, escape) |
| **Eventos fallback IA** | 5 eventos rotativos |
| **Commits totales** | 13 |

---

[← Semana 2](./GUIA_SEMANA_2.md) | [Volver al PLANNING.md](./PLANNING.md)
