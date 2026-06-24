# PLANNING.md — 15 Días (Solemne 3)

**Integrantes:** Diego Alvarez, Matias Moraga  
**Repo:** [github.com/matiasmoraga337-bit/subiranuevorepo](https://github.com/matiasmoraga337-bit/subiranuevorepo)  
**Entrega final:** 2 de julio de 2026

---

## Semana 1 — Martes 9 de junio

| Tareas planificadas | Logrado | No logrado / Motivo |
|---|---|---|
| Revisar evaluación Solemne 2 e identificar mejoras | ✅ Lista de mejoras documentada en DESIGN.md | |
| Actualizar DESIGN.md con arquitectura fullstack | ✅ Arquitectura, endpoints, servicio externo documentados | |
| Elegir servicio REST externo (Google Gemini) | ✅ Gemini 2.5 Flash seleccionado, documentado con justificación | |
| Crear PLANNING.md inicial | ✅ | |
| Definir modelo de datos MongoDB (users, games, dialogues) | ✅ Modelos definidos en DESIGN.md sección 4 | |
| Configurar pnpm y .gitignore fullstack | ✅ | |

---

## Semana 2 — Lunes 16 de junio

| Tareas planificadas | Logrado | No logrado / Motivo |
|---|---|---|
| Implementar backend Express con estructura de carpetas | ✅ `backend/src/` con config, models, routes, services, middleware | |
| Implementar modelo User (registro/login con bcrypt + JWT) | ✅ Auth completo: register, login, me, logout | |
| Implementar modelo Game (estado completo de partida) | ✅ Schema con day, phase, recursos, flags, journal, eventos | |
| Implementar modelo Dialogue (caché de IA) | ✅ Cacheo por contextHash | |
| Implementar endpoints REST /api/auth y /api/games | ✅ CRUD de partidas, advance-segment, decision, continue, minigame | |
| Conectar backend a MongoDB | ✅ Mongoose, conexión en db.js | |
| Integrar Google Gemini API | ✅ Servicio gemini.js con buildGamePrompt y caché | |
| Implementar middleware de autenticación JWT | ✅ authMiddleware en routes protegidas | |

---

## Semana 3 — Lunes 22 de junio

| Tareas planificadas | Logrado | No logrado / Motivo |
|---|---|---|
| Integrar frontend con backend (API layer) | ✅ `api/index.js` con fetch a todos los endpoints | |
| Implementar serverStore (auth state) | ✅ Login, registro, logout en frontend | |
| Adaptar gameStore para modo online (serverGameId) | ✅ Dual mode: local + server con applyServerState | |
| Actualizar App.vue con pantallas de login/registro/selección de partida | ✅ Fases menu, login, register, selección de partidas | |
| Dockerizar frontend (Dockerfile + .dockerignore) | ✅ | |
| Dockerizar backend (Dockerfile + .dockerignore) | ✅ | |
| Crear compose.yml (mongodb + backend + frontend) | ✅ 3 servicios orquestados con variables de entorno | |
| Configurar GitHub Actions CI/CD (main.yml) | ✅ Lint + test frontend y backend, build + push a DockerHub | |

---

## Semana 4 — Viernes 26 de junio a Miércoles 2 de julio

| Tareas planificadas | Logrado | No logrado / Motivo |
|---|---|---|
| Portar eventos narrativos completos (15 días) al backend | ✅ `backend/src/data/events.js` con flags-aware matching | |
| Arreglar bug del ciclo día 0 → día 1 → día 0 en modo online | ✅ handleStart() ahora llama a PUT /start del servidor | |
| Mejorar prompt de Gemini con contexto de día e imágenes | ✅ getDayContext() + LOCATION_IMAGES mapping | |
| Arreglar parseo de JSON de Gemini (+15, trailing commas) | ✅ extractAndParseJSON() con 4 intentos de parseo | |
| Agregar fallbacks variados de IA (5 eventos distintos) | ✅ FALLBACK_EVENTS rotativos por día | |
| Configurar autenticación en MongoDB | ✅ Admin:contraseñasegura en compose.yml y URI | |
| Sanitizar respuestas cacheadas de IA (image, day) | ✅ Enriquecimiento on-read del caché | |
| Crear README.md completo (backend, Compose, DockerHub) | ✅ | |
| Renombrar DESING.md → DESIGN.md | ✅ | |
| Unificar valores iniciales frontend/backend (6/4/80/70) | ✅ Sincronizado en store, modelo y tests | |
| Verificar tests (48/48 pasando) y build de producción | ✅ Frontend 19/19, Backend 29/29, Vite build OK | |
| Completar documentación y entregables finales | ✅ | |

---

## Controles de avance

| Fecha | Estudiante | Tema evaluado | Nota |
|-------|-----------|---------------|------|
| Clase 1 (9 jun) | Ambos | DESIGN.md, planificación inicial | — |
| Clase 2 (16 jun) | Ambos | Backend REST, modelos MongoDB | — |
| Clase 3 (22 jun) | Ambos | Integración fullstack, Docker, CI/CD | — |
| Clase 4 (2 jul) | Ambos | Entrega final, revisión completa | — |
