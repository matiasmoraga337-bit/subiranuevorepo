# Planificación Backend & Fullstack — Solemne 3

## Integrantes del Grupo
- Diego Alvarez
- Matias Moraga

## Repositorio GitHub
[https://github.com/DiegoUC-01/Solemne2]

## Tecnologías Principales
- **Frontend:** Vue.js 3 + Pinia + Vite
- **Backend:** Node.js 20 + Express 5
- **Base de datos:** MongoDB 7 + Mongoose 8
- **IA externa:** Google Gemini API (gemini-2.5-flash)
- **Autenticación:** JWT + bcryptjs
- **Testing:** Vitest (frontend y backend)
- **Linter:** oxlint
- **CI/CD:** GitHub Actions
- **Containerización:** Docker + Docker Compose

---

## Semana 1 — Infraestructura, CI/CD y Setup (16 jun – 22 jun)

> **Objetivo:** Tener repo funcional desde el día 1. GitHub Actions corriendo en cada push. Docker funcionando. Documentación base lista.

### Tareas planificadas:

**Repositorio y estructura:**
- [x] Crear estructura de carpetas del proyecto:
  ```
  Solemne2/
  ├── .github/workflows/main.yml
  ├── backend/
  │   ├── Dockerfile
  │   ├── package.json
  │   ├── .env.example
  │   ├── .gitignore
  │   └── src/
  │       ├── config/db.js
  │       ├── models/User.js
  │       ├── models/Game.js
  │       └── models/Dialogue.js
  ├── Game/              (existente)
  └── compose.yml
  ```
- [x] Crear `.env.example`. 
- [x] Crear `.gitignore` del backend. 

**CI/CD — GitHub Actions :**
- [ ] Crear `.github/workflows/main.yml`:
  - Job `lint-and-test-frontend`
  - Job `lint-and-test-backend` 
  - Job `build-and-push` 

**Docker :**
- [ ] Crear `backend/Dockerfile` 
- [ ] Actualizar `Game/Dockerfile` 
- [ ] Crear `compose.yml` en raíz:

**Documentación :**
- [x] Actualizar `DESIGN.md` con arquitectura fullstack.
- [x] Crear `PLANNING_BACKEND.md` (este archivo).
- [ ] Enviar correo al profesor con integrantes y link al repositorio

**Modelos MongoDB :**
- [ ] `models/User.js` — username, email, password (bcrypt), timestamps
- [ ] `models/Game.js` — día, fase, recursos, flags, journal, eventos, estado
- [ ] `models/Dialogue.js` — contextHash, prompt, response, model, tokensUsed

**Configuración inicial:**
- [x] `config/db.js` — conexión a MongoDB con Mongoose
- [x] `package.json` del backend con todas las dependencias declaradas

### Objetivo de la semana:
> CI/CD corriendo en cada push, Docker Compose levanta 3 servicios (aunque backend aún vacío), documentación lista, modelos definidos. El repo ya muestra estructura profesional.

### Lo que se logró completar:

### Lo que NO se logró:
—

### Notas:
—

---

## Semana 2 — Backend Core: Auth, Lógica de Juego, Gemini (23 jun – 29 jun)

> **Objetivo:** Backend completamente funcional. Cada capa se commitea y pushea por separado para que CI/CD valide incrementalmente.

### Tareas planificadas:

**Auth:**
- [ ] Crear `middleware/auth.js`. 
- [ ] Crear `routes/auth.js`.
- [ ] Crear `src/index.js`.
- [ ] Crear `src/tests/auth.spec.js`

**Lógica de juego:**
- [ ] Crear `routes/games.js`
- [ ] Eventos fijos del juego original (días 0, 1, 2, 3, 4, 6)
- [ ] Minijuegos (día 5: catchRain, día 10: findCans, día 15: escape)
- [ ] Sistema de eventos múltiples por día.
**Endpoints de juego:**
- [ ] `POST /api/games`
- [ ] `GET /api/games/user`
- [ ] `GET /api/games/:id` 
- [ ] `PUT /api/games/:id/start` 
- [ ] `PUT /api/games/:id/advance-segment` 
- [ ] `PUT /api/games/:id/decision` 
- [ ] `PUT /api/games/:id/continue` 
- [ ] `PUT /api/games/:id/minigame`

**Tests de lógica de juego:**
- [ ] Crear `src/tests/games.spec.js`

**Día: Integración Gemini + Caché:**
- [ ] Crear `services/gemini.js`:
  - `clamp()` — utilidad de rango
  - `buildGamePrompt(day, flags, food, water, health, morale, previousEvents)` — prompt contextual en español pidiendo JSON estructurado
  - `generateContextHash()` — SHA256 de día + flags + recursos para clave de caché
- [ ] Crear `routes/dialogue.js`:
  - `POST /api/dialogue/generate`:
    1. Calcular contextHash
    2. Buscar en colección dialogues
    3. Si existe → devolver cacheado
    4. Si no → llamar a Gemini, guardar en MongoDB, devolver
  - `GET /api/dialogue/cache/stats` — contador de diálogos en caché
- [ ] Fallback: si Gemini falla, devuelve evento genérico predefinido
- [ ] Crear `src/tests/gemini.spec.js` :

### Objetivo de la semana:
> Backend funcional de extremo a extremo: auth, lógica de juego completa, 8 endpoints de partida, integración con Gemini cacheada. 29 tests pasando. CI/CD verde en cada push.

### Lo que se logró completar:


### Lo que NO se logró:
—

### Notas:
—

c

## Semana 3 — Integración Frontend, Testing Final y Entrega (30 jun – 2 jul)

> **Objetivo:** Frontend conectado al backend. Tests pasando en ambos lados. Todo funcional con Docker Compose. Entrega final.

### Tareas planificadas:

**Cliente HTTP del frontend:**
- [ ] Crear `src/api/index.js` — cliente HTTP para consumir backend

**Día: Store de autenticación y juego online:**
- [ ] Crear `src/stores/serverStore.js`:
- [ ] Modificar `src/stores/gameStore.js`
**Configuración de Vite:**
- [ ] Actualizar `vite.config.js`:
  - Agregar `server.proxy`: `/api` → `http://localhost:3000`
  - Desarrollo local sin CORS, frontend en :5173, backend en :3000

**: Verificación y tests finales:**
- [ ] Instalar dependencias backend: `pnpm install`
- [ ] Ejecutar tests backend: `pnpm test` 
- [ ] Ejecutar tests frontend: `pnpm test`
- [ ] Verificar estructura de archivos completa
- [ ] Verificar que CI/CD detecta ambos proyectos

**Día 3: Entrega final:**
- [ ] Revisar DESIGN.md completo y actualizado
- [ ] Revisar PLANNING_BACKEND.md con todas las semanas completadas
- [ ] Último push a GitHub → CI/CD ejecuta todo el pipeline
- [ ] Verificar que las imágenes quedaron publicadas en DockerHub
- [ ] Enviar entrega final (si aplica)

### Objetivo de la semana:
> Proyecto fullstack robusto. Frontend y backend integrados. 48 tests pasando. Docker Compose funcional. CI/CD completo. Entrega final.

### Lo que se logró completar:

### Lo que NO se logró:
—

### Notas:
—

---
