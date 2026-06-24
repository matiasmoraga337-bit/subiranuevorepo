# 15 Días — Juego de Supervivencia

> *Toma de decisiones en un mundo post-apocalíptico. Cada elección tiene consecuencias.*

Desarrollado por **Diego Alvarez** y **Matias Moraga**.

---

## Descripción

Tras el estallido de una epidemia global, las calles quedaron vacías y el caos se apoderó de la ciudad. Como sobreviviente refugiado en tu hogar, debes tomar decisiones críticas **día a día** durante 15 días, hasta que llegue el operativo de rescate.

Cada decisión afecta tus recursos: **comida, agua, salud y moral**. No siempre existe una opción correcta. El objetivo es simple: **sobrevivir**.

---

## Mecánicas del Juego

El juego avanza por días. En cada uno ocurre un evento narrativo al que debes responder eligiendo entre dos opciones. Tus recursos se consumen diariamente y las consecuencias de tus decisiones se acumulan.

### Sistema de Recursos

| Recurso | Valor Inicial | Máximo | Efecto si llega a 0 |
|---------|:---:|:---:|---------------------|
|  Comida | 6 | 20 | −12 salud por día |
|  Agua | 4 | 20 | −15 salud por día |
|  Salud | 80 | 100 | **Game Over** |
|  Moral | 70 | 100 | **Game Over** (depresión) |

### Minijuegos

En los días 5, 10 y 15 aparecen minijuegos interactivos:

- **Día 5 — Recoger agua de lluvia:** Mueve el balde para atrapar gotas de lluvia.
- **Día 10 — Evitar asaltantes:** Esquiva a los asaltantes en el supermercado.
- **Día 15 — Escape final:** El helicóptero de rescate llegó. No lo pierdas.

### Modos de juego

- **Modo local:** Juego offline con todos los eventos narrativos precargados.
- **Modo online:** Requiere registro/login. Partidas guardadas en servidor con persistencia en MongoDB. Eventos adicionales generados por IA (Google Gemini).

---

## Tecnologías

| Tecnología | Propósito |
|------------|-----------|
| Vue.js 3 (Composition API) | Framework frontend |
| Pinia | Estado global del juego |
| Vite | Build tool |
| Express 5 | Backend REST API |
| MongoDB + Mongoose | Base de datos |
| Google Gemini 2.5 Flash | Generación de eventos narrativos con IA |
| JWT + bcrypt | Autenticación de usuarios |
| NES.css | Estilos retro Nintendo NES |
| Pixelium Design | Componentes pixel art para Vue 3 |
| Web Audio API | Sistema de audio 8-bit |
| Vitest | Testing unitario |
| oxlint | Linter |
| Docker + Docker Compose | Containerización y orquestación |
| GitHub Actions | CI/CD |

---

## Instalación y Ejecución Local

### Prerrequisitos

- Node.js 20+
- pnpm
- MongoDB 7 (solo para modo online)

### Frontend (modo local)

```bash
git clone https://github.com/matiasmoraga337-bit/subiranuevorepo.git
cd subiranuevorepo

# Frontend
cd Game
pnpm install
pnpm dev
```

Abre `http://localhost:5173`. El modo local no requiere backend ni MongoDB.

### Backend (modo online)

```bash
cd subiranuevorepo/backend
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus claves reales (JWT_SECRET, GEMINI_API_KEY)

pnpm dev
```

El backend corre en `http://localhost:3000`. Necesita MongoDB corriendo en `localhost:27017`.

### Ejecutar ambos juntos

```bash
# Terminal 1 — Backend
cd subiranuevorepo/backend
pnpm dev

# Terminal 2 — Frontend
cd subiranuevorepo/Game
pnpm dev
```

---

## Ejecución con Docker Compose (producción)

```bash
# Descargar archivo de orquestación
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/matiasmoraga337-bit/subiranuevorepo/main/docker-compose.prod.yml" -OutFile "docker-compose.prod.yml"

# Levantar el frontend (backend y MongoDB están en la nube)
docker compose -f docker-compose.prod.yml up -d
```

Esto levanta:
- **Frontend** en `localhost:5173` (imagen desde DockerHub)
- **Backend** en Render: `one5dias-backend.onrender.com`
- **MongoDB** en Atlas (nube)

Para detener: `docker compose -f docker-compose.prod.yml down`

---

## Testing

```bash
# Frontend
cd Game
pnpm test

# Backend
cd backend
pnpm test
```

**Resultados:** 19 tests frontend + 29 tests backend = 48 tests pasando.

---

## Estructura del Proyecto

```
subiranuevorepo/
├── compose.yml              # Orquestación Docker desarrollo (3 servicios)
├── DESIGN.md                # Documento de diseño fullstack
├── PLANNING.md              # Planificación semanal
├── README.md
├── .github/workflows/
│   └── main.yml             # CI/CD: lint, test, build y push a DockerHub
├── Game/                    # Frontend Vue 3
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── api/index.js
│       ├── stores/
│       │   ├── gameStore.js
│       │   └── serverStore.js
│       ├── components/
│       │   ├── StatBar.vue
│       │   ├── StoryText.vue
│       │   ├── DecisionButtons.vue
│       │   ├── PixelBackground.vue
│       │   ├── SceneArt.vue
│       │   └── minigames/
│       ├── composables/useAudio.js
│       ├── data/events.js
│       ├── assets/
│       │   ├── Imagen/
│       │   └── styles/retro.css
│       └── tests/gameStore.spec.js
└── backend/                 # Backend Express 5
    ├── Dockerfile
    ├── package.json
    ├── .env.example
    └── src/
        ├── index.js
        ├── config/db.js
        ├── middleware/auth.js
        ├── models/
        │   ├── User.js
        │   ├── Game.js
        │   └── Dialogue.js
        ├── routes/
        │   ├── auth.js
        │   ├── games.js
        │   └── dialogue.js
        ├── services/gemini.js
        ├── data/events.js
        └── tests/
            ├── auth.spec.js
            ├── games.spec.js
            └── gemini.spec.js
```

---

## Links

- **Repositorio:** [github.com/matiasmoraga337-bit/subiranuevorepo](https://github.com/matiasmoraga337-bit/subiranuevorepo)
- **Backend (Render):** [one5dias-backend.onrender.com](https://one5dias-backend.onrender.com)
- **DockerHub Frontend:** [matias0512/15dias-frontend](https://hub.docker.com/r/matias0512/15dias-frontend)
- **DockerHub Backend:** [matias0512/15dias-backend](https://hub.docker.com/r/matias0512/15dias-backend)

---

*Proyecto desarrollado como Solemne 3 — 2026*
