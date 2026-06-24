<template>
  <div class="game-container">
    <PixelBackground :location="currentLocation" />

    <div class="game-ui">
      <header class="game-header">
        <h1 class="game-title">15 DIAS</h1>
        <div class="header-controls">
          <span v-if="server.isLoggedIn" class="user-badge" :title="server.user?.username">
            {{ server.user?.username }}
          </span>
          <span class="day-counter" v-if="game.phase !== 'menu' && game.phase !== 'rules' && game.phase !== 'settings' && game.phase !== 'login' && game.phase !== 'register'">
            DIA {{ game.day }}/15
          </span>
          <span v-if="game.serverGameId" class="online-badge" title="Partida guardada en el servidor">ONLINE</span>
          
          <button v-if="server.isLoggedIn" class="header-btn" @click="handleLogout">
            SALIR
          </button>
          <button v-else-if="game.phase === 'menu'" class="header-btn" @click="game.phase = 'login'; authError = ''">
            LOGIN
          </button>
          <button class="header-btn" @click="goToMenu">
            INICIO
          </button>
          <button class="header-btn mute-btn" @click="audio.toggleMute">
            {{ audio.isMuted.value ? '🔇' : '🔊' }}
          </button>
        </div>
      </header>

      <div class="game-body">
        <main class="game-main">
          <div v-if="game.phase === 'menu'" class="menu-screen">
            <div class="menu-content">
              <div class="menu-title-block">
                <h1 class="menu-title">Desesperación</h1>
                <h2 class="menu-number">15 Dias</h2>
                <p class="menu-subtitle">Sobrevive hasta el rescate</p>
              </div>
              <nav class="menu-nav">
                <button class="menu-btn primary" @click="handleNewGame">
                  NUEVA PARTIDA (LOCAL)
                </button>
                <button v-if="server.isLoggedIn" class="menu-btn primary online-btn" @click="handleNewGameOnline">
                  NUEVA PARTIDA ONLINE
                </button>
                <button class="menu-btn" @click="game.phase = 'rules'">
                  REGLAS
                </button>
                <button class="menu-btn" @click="game.phase = 'settings'">
                  CONFIGURACION
                </button>
                <button v-if="!server.isLoggedIn" class="menu-btn" @click="game.phase = 'login'; authError = ''">
                  INICIAR SESION
                </button>
              </nav>
              <div class="menu-footer">
                <p>Empezo la Tercera Guerra Mundial, tú unico objetivo sobrevivir.</p>
              </div>
            </div>
          </div>

          <div v-else-if="game.phase === 'rules'" class="rules-screen">
            <div class="rules-content">
              <h2 class="rules-title">REGLAS DE SUPERVIVENCIA</h2>
              <div class="rules-list">
                <div class="rule-item">
                  <h3>📺 Sobrevive 15 dias</h3>
                  <p>El rescate llegara en 15 dias. Debes mantener tus recursos con vida hasta entonces.</p>
                </div>
                <div class="rule-item">
                  <h3>🍖 Gestiona tus recursos</h3>
                  <p>Cada dia consumes comida y agua. Si llegan a cero, tu salud se resiente.</p>
                </div>
                <div class="rule-item">
                  <h3>❤️ Salud y Moral</h3>
                  <p>Si tu salud o moral llegan a 0, es Game Over. Cuidalos con decisiones sabias.</p>
                </div>
                <div class="rule-item">
                  <h3>🤝 Las decisiones importan</h3>
                  <p>Cada decision afecta tus recursos. Algunas tienen riesgo de exito/fracaso.</p>
                </div>
                <div class="rule-item">
                  <h3>📖 Consulta tu diario</h3>
                  <p>Tu diario registra cada decision y evento. Aprende de tus errores.</p>
                </div>
              </div>
              <button class="menu-btn" @click="goToMenu">VOLVER</button>
            </div>
          </div>

          <div v-else-if="game.phase === 'settings'" class="settings-screen">
            <div class="settings-content">
              <h2 class="settings-title">CONFIGURACION</h2>
              <div class="settings-list">
                <div class="setting-item">
                  <label>Sonido</label>
                  <button class="toggle-btn" @click="audio.toggleMute">
                    {{ audio.isMuted.value ? 'APAGADO' : 'ENCENDIDO' }}
                  </button>
                </div>
                <div class="setting-item">
                  <label>Velocidad de texto</label>
                  <div class="speed-control">
                    <button class="speed-btn" :class="{ active: textSpeed === 'slow' }" @click="textSpeed = 'slow'">LENTA</button>
                    <button class="speed-btn" :class="{ active: textSpeed === 'normal' }" @click="textSpeed = 'normal'">NORMAL</button>
                    <button class="speed-btn" :class="{ active: textSpeed === 'fast' }" @click="textSpeed = 'fast'">RAPIDA</button>
                  </div>
                </div>
              </div>
              <button class="menu-btn" @click="goToMenu">VOLVER</button>
            </div>
          </div>

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

          <div v-else-if="game.phase === 'intro'" class="gameplay-layout intro-layout">
            <div class="scene-area">
              <SceneArt location="casa" image="noticiadia0">
                <div class="scene-label">🏠 TU DEPARTAMENTO</div>
              </SceneArt>
            </div>
            <div class="text-area">
              <div class="tv-frame">
                <div class="tv-screen">
                  <div class="tv-static"></div>
                  <div class="tv-content">
                    <StoryText
                      v-if="game.currentEvent && game.currentEvent.segments[game.currentSegment]"
                      :key="'intro-' + game.currentSegment"
                      :text="game.currentEvent.segments[game.currentSegment].text"
                      :speed="speedValue"
                      @complete="onStoryComplete"
                    />
                  </div>
                </div>
              </div>
              <div class="intro-start">
                <button class="start-btn" @click="handleStart">
                  COMENZAR SUPERVIVENCIA
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="game.phase === 'story'" class="gameplay-layout story-layout">
            <div class="scene-area">
              <SceneArt :location="game.currentEvent?.location || 'casa'" :image="game.currentEvent?.image">
                <div class="scene-label">{{ locationEmoji }} {{ game.currentEvent?.location?.toUpperCase() }}</div>
              </SceneArt>
            </div>
            <div class="text-area">
              <div class="event-header">
                <h2 class="event-title">{{ game.currentEvent?.title }}</h2>
              </div>
              <StoryText
                v-if="game.currentEvent && game.currentEvent.segments[game.currentSegment]"
                :key="'story-' + game.day + '-' + game.currentSegment"
                :text="game.currentEvent.segments[game.currentSegment].text"
                :speed="speedValue"
                @complete="onStoryComplete"
              />
            </div>
          </div>

          <div v-else-if="game.phase === 'decision'" class="gameplay-layout decision-layout">
            <div class="scene-area">
              <SceneArt :location="game.currentEvent?.location || 'casa'" :image="game.currentEvent?.image">
                <div class="scene-label">{{ locationEmoji }} {{ game.currentEvent?.location?.toUpperCase() }}</div>
              </SceneArt>
            </div>
            <div class="text-area">
              <div class="event-header">
                <h2 class="event-title">{{ game.currentEvent?.title }}</h2>
              </div>
              <p class="decision-prompt">¿Que haces?</p>
              <DecisionButtons
                :decisions="game.currentEvent?.decisions || []"
                @select="handleDecision"
              />
            </div>
          </div>

          <div v-else-if="game.phase === 'result'" class="gameplay-layout result-layout">
            <div class="scene-area">
              <SceneArt :location="game.currentEvent?.location || 'casa'" :image="game.currentEvent?.image" />
            </div>
            <div class="text-area">
              <div class="result-content">
                <p class="result-text">{{ game.decisionResult?.text }}</p>
                <button class="continue-btn" @click="game.continueAfterResult()">
                  CONTINUAR
                </button>
              </div>
            </div>
          </div>

  <div v-else-if="game.phase === 'minigame'" class="minigame-screen">

  <div
    v-if="showMinigameIntro"
    class="minigame-intro"
  >
    <h2>{{ game.currentEvent?.title }}</h2>

    <p>
      {{ game.currentEvent?.description || 'Preparate para el minijuego, cuidado que si pierdes, moriras.' }}
    </p>

    <button @click="showMinigameIntro = false">
      COMENZAR
    </button>
  </div>

  <template v-else>

    <CatchRainGame
      v-if="game.currentEvent?.type === 'catchRain'"
      @complete="handleMinigameComplete"
    />

    <FindCansGame
      v-else-if="game.currentEvent?.type === 'findCans'"
      @complete="handleMinigameComplete"
    />

    <EscapeGame
      v-else-if="game.currentEvent?.type === 'escape'"
      @complete="handleMinigameComplete"
    />

    <div v-else class="minigame-fallback">
      <p>Minijuego no disponible</p>

      <button
        class="continue-btn"
        @click="game.advanceDay()"
      >
        CONTINUAR
      </button>
    </div>

  </template>

</div>

          <div v-else-if="game.phase === 'gameover'" class="gameover-screen">
            <div class="gameover-content">
              <h2 class="gameover-title">GAME OVER</h2>
              <p class="gameover-reason">
                {{ game.gameOverReason === 'health' ? 'Tu salud llego a cero.' : 'Tu moral llego a cero.' }}
              </p>
              <p class="gameover-stats">Sobreviviste {{ game.survivalDays }} dias</p>
              <div class="gameover-buttons">
                <button class="restart-btn" @click="handleRestart">
                  INTENTAR DE NUEVO
                </button>
                <button class="menu-btn" @click="goToMenu">MENU PRINCIPAL</button>
              </div>
            </div>
          </div>

          <div v-else-if="game.phase === 'victory'" class="victory-screen">
            <div class="victory-content">
              <h2 class="victory-title">¡RESCATADO!</h2>
              <p class="victory-text">Has sobrevivido 15 dias</p>
              <div class="victory-stats">
                <p>Comida restante: {{ game.food }}</p>
                <p>Agua restante: {{ game.water }}</p>
                <p>Salud final: {{ game.health }}</p>
                <p>Moral final: {{ game.morale }}</p>
              </div>
              <div class="victory-buttons">
                <button class="restart-btn" @click="handleRestart">
                  JUGAR DE NUEVO
                </button>
                <button class="menu-btn" @click="goToMenu">MENU PRINCIPAL</button>
              </div>
            </div>
          </div>
        </main>

        

        <aside v-if="showJournal && game.phase !== 'menu' && game.phase !== 'rules' && game.phase !== 'settings'" class="side-panel journal-panel">
          <div class="panel-header">
            <h3>DIARIO</h3>
            <button class="panel-close" @click="showJournal = false">×</button>
          </div>
          <div class="panel-body">
            <div v-if="game.journal.length === 0" class="empty-msg">
              <p>No hay entradas todavia.</p>
            </div>
            <div v-else class="journal-list">
              <div
                v-for="(entry, index) in game.journal"
                :key="index"
                class="journal-entry"
                :class="entry.type"
              >
                <div class="entry-day">Dia {{ entry.day }}</div>
                <div class="entry-title">{{ entry.title }}</div>
                <div v-if="entry.decision" class="entry-decision">
                  → <strong>{{ entry.decision }}</strong>
                </div>
                <div v-if="entry.result" class="entry-result">
                  {{ entry.result }}
                </div>
                <div v-if="entry.description" class="entry-desc">
                  {{ truncate(entry.description, 100) }}
                </div>
                <div v-if="entry.effects" class="entry-effects">
                  <span v-if="entry.effects.food" :class="entry.effects.food > 0 ? 'gain' : 'loss'">
                    {{ entry.effects.food > 0 ? '+' : '' }}{{ entry.effects.food }} comida
                  </span>
                  <span v-if="entry.effects.water" :class="entry.effects.water > 0 ? 'gain' : 'loss'">
                    {{ entry.effects.water > 0 ? '+' : '' }}{{ entry.effects.water }} agua
                  </span>
                  <span v-if="entry.effects.health" :class="entry.effects.health > 0 ? 'gain' : 'loss'">
                    {{ entry.effects.health > 0 ? '+' : '' }}{{ entry.effects.health }} salud
                  </span>
                  <span v-if="entry.effects.morale" :class="entry.effects.morale > 0 ? 'gain' : 'loss'">
                    {{ entry.effects.morale > 0 ? '+' : '' }}{{ entry.effects.morale }} moral
                  </span>
                </div>
                
              </div>
            </div>
          </div>
        </aside>
      </div>

      <footer v-if="game.phase !== 'menu' && game.phase !== 'rules' && game.phase !== 'settings'" class="game-footer">
        <div class="stats-grid">
          <StatBar name="Comida" icon="🍖" :value="game.food" :max="game.maxStat" />
          <StatBar name="Agua" icon="💧" :value="game.water" :max="game.maxStat" />
          <StatBar name="Salud" icon="❤" :value="game.health" :max="game.maxHealth" />
          <StatBar name="Moral" icon="★" :value="game.morale" :max="game.maxMorale" />
        </div>
        <div class="footer-actions">
          <button class="footer-btn" @click="showJournal = !showJournal" :class="{ active: showJournal }">
            📖 DIARIO
          </button>
        </div>
      </footer>
    </div>

    <div v-if="game.aiLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">GENERANDO...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useGameStore } from './stores/gameStore.js'
import { useServerStore } from './stores/serverStore.js'
import { useAudio } from './composables/useAudio.js'
import PixelBackground from './components/PixelBackground.vue'
import SceneArt from './components/SceneArt.vue'
import StatBar from './components/StatBar.vue'
import StoryText from './components/StoryText.vue'
import DecisionButtons from './components/DecisionButtons.vue'
import CatchRainGame from './components/minigames/CatchRainGame.vue'
import FindCansGame from './components/minigames/FindcansGame.vue'
import EscapeGame from './components/minigames/EscapeGame.vue'

const game = useGameStore()
const server = useServerStore()
const audio = useAudio()
const showJournal = ref(false)
const textSpeed = ref('normal')
const showMinigameIntro = ref(true)
const authUsername = ref('')
const authPassword = ref('')
const authError = ref('')

onMounted(() => {
  server.fetchMe()
})



const speedValue = computed(() => {
  switch (textSpeed.value) {
    case 'slow': return 50
    case 'fast': return 15
    default: return 35
  }
})

const locationEmoji = computed(() => {
  const emojis = {
    casa: '🏠',
    calle: '🏚',
    supermercado: '🛒',
    farmacia: '💊',
    refugio: '⛺',
    rescate: '🚁',
  }
  return emojis[game.currentEvent?.location] || '🏚'
})

const currentLocation = computed(() => {
  return game.currentEvent?.location || 'casa'
})

function truncate(str, len) {
  if (!str) return ''
  return str.length > len ? str.substring(0, len) + '...' : str
}

function goToMenu() {
  audio.playClick()
  game.phase = 'menu'
  showJournal.value = false
}

function onStoryComplete() {
  audio.playClick()
  game.advanceSegment()
}

function handleNewGame() {
  audio.playClick()
  audio.startMusic()
  game.reset()
  game.startGame()
}

async function handleNewGameOnline() {
  audio.playClick()
  audio.startMusic()
  game.reset()
  await game.startGameServer()
}

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

function handleStart() {
  audio.playClick()
  if (game.serverGameId) {
    game.startGameOnServer()
  } else {
    game.day = 1
    game.advanceDay()
  }
}

function handleDecision(index) {
  audio.playClick()
  game.makeDecision(index)

  const decision = game.currentEvent?.decisions[index]
  const effects = decision?.random
    ? (Math.random() < decision.successRate ? decision.effects.success : decision.effects.failure)
    : decision?.effects

  const hasNegative = effects?.health < 0 || effects?.morale < 0
  if (hasNegative) {
    setTimeout(() => audio.playDamage(), 200)
  }
}

function handleMinigameComplete(result) {
  showMinigameIntro.value = true
  
  audio.playClick()
  if (result === 'win') {
    audio.playVictory()
  } else {
    audio.playDamage()
  }
  game.completeMinigame(result)
}

function handleRestart() {
  audio.playClick()
  showJournal.value = false
  game.reset()
  game.startGame()
}

watch(() => game.phase, (newPhase) => {
  if (newPhase === 'victory') {
    audio.playVictory()
  } else if (newPhase === 'gameover') {
    audio.playGameOver()
  } else if (newPhase === 'story' && game.currentEvent?.type === 'random') {
    audio.playRandomEvent()
  }
})
</script>

<style scoped>
.game-container {
  width: 100%;
  height: 100vh;
  position: relative;
  background: #0a0a0a;
  overflow: hidden;
  font-family: 'VT323', monospace;
}

.game-ui {
  position: relative;
  z-index: 10;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.9);
  border-bottom: 2px solid #333;
  flex-shrink: 0;
}

.game-title {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(8px, 1.2vw, 14px);
  color: #4ade80;
  margin: 0;
  text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.day-counter {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(7px, 1vw, 10px);
  color: #fbbf24;
}

.header-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(6px, 0.9vw, 8px);
  padding: 4px 8px;
  background: #1a1a2e;
  color: #aaa;
  border: 2px solid #444;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.header-btn:hover, .header-btn.active {
  background: #2a2a4e;
  border-color: #4ade80;
  color: #4ade80;
}

.mute-btn {
  font-size: 14px;
  padding: 3px 6px;
}

.game-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.game-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.gameplay-layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

.scene-area {
  flex: 1.2;
  min-width: 0;
  position: relative;
}

.text-area {
  flex: 0.8;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.6);
  border-left: 2px solid #333;
}

.scene-label {
  position: absolute;
  bottom: 10px;
  left: 10px;
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(6px, 0.8vw, 9px);
  color: rgba(255, 255, 255, 0.6);
  z-index: 10;
  background: rgba(0, 0, 0, 0.5);
  padding: 4px 8px;
}

.event-header {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.7);
  border-bottom: 2px solid #333;
  flex-shrink: 0;
}

.event-title {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(9px, 1.3vw, 14px);
  color: #ef4444;
  margin: 0;
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}

.decision-prompt {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(8px, 1vw, 11px);
  color: #fbbf24;
  text-align: center;
  padding: 10px;
  flex-shrink: 0;
}

.result-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
  gap: 16px;
  overflow-y: auto;
}

.result-text {
  font-family: 'VT323', monospace;
  font-size: clamp(14px, 1.8vw, 20px);
  color: #e0e0e0;
  text-align: center;
  max-width: 500px;
  line-height: 1.5;
}

.continue-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(8px, 1vw, 10px);
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
}

.continue-btn:hover {
  background: #2563eb;
}

.intro-layout {
  flex-direction: column;
}

.intro-layout .scene-area {
  flex: 1.4;
  border-bottom: 2px solid #333;
}

.intro-layout .text-area {
  flex: 1;
  border-left: none;
  overflow-y: auto;
  background: transparent;
}

.story-layout, .decision-layout, .result-layout {
  flex-direction: row;
}

.tv-frame {
  background: #2a2a2a;
  border: 3px solid #444;
  border-radius: 6px;
  padding: 6px;
  margin: 12px;
}

.tv-screen {
  background: #0a0a0a;
  border: 2px solid #333;
  min-height: 100px;
  position: relative;
}

.tv-static {
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 1;
}

.tv-content {
  position: relative;
  z-index: 2;
}

.intro-start {
  display: flex;
  justify-content: center;
  padding: 10px;
}

.start-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(8px, 1vw, 12px);
  padding: 12px 24px;
  background: #4ade80;
  color: #0a0a0a;
  border: none;
  cursor: pointer;
  animation: pulse 1.5s infinite;
}

.start-btn:hover {
  background: #22c55e;
  transform: scale(1.05);
}

.gameover-screen, .victory-screen, .minigame-screen {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  overflow-y: auto;
}

.minigame-fallback {
  text-align: center;
  color: #aaa;
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
}

.gameover-content, .victory-content {
  text-align: center;
  padding: 20px;
}

.gameover-title {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(18px, 3.5vw, 32px);
  color: #ef4444;
  margin: 0 0 16px 0;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
}

.victory-title {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(16px, 3vw, 28px);
  color: #4ade80;
  margin: 0 0 16px 0;
  text-shadow: 0 0 20px rgba(74, 222, 128, 0.8);
}

.gameover-reason, .victory-text {
  font-family: 'VT323', monospace;
  font-size: clamp(16px, 2vw, 22px);
  color: #ccc;
  margin: 0 0 8px 0;
}

.gameover-stats {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(8px, 1vw, 10px);
  color: #888;
  margin-bottom: 20px;
}

.victory-stats {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(7px, 0.9vw, 10px);
  color: #aaa;
  margin-bottom: 20px;
  line-height: 2;
}

.restart-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(9px, 1.2vw, 12px);
  padding: 12px 24px;
  background: #4ade80;
  color: #0a0a0a;
  border: none;
  cursor: pointer;
  margin: 4px;
}

.restart-btn:hover {
  background: #22c55e;
  transform: scale(1.05);
}

.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 6px solid rgba(255, 255, 255, 0.1);
  border-top: 6px solid #fbbf24;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  margin-top: 20px;
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  color: #fbbf24;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.gameover-buttons, .victory-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.game-footer {
  background: rgba(0, 0, 0, 0.9);
  border-top: 2px solid #333;
  padding: 6px 12px;
  flex-shrink: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px 12px;
}

.footer-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  justify-content: center;
}

.footer-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(6px, 0.8vw, 8px);
  padding: 4px 10px;
  background: #1a1a2e;
  color: #aaa;
  border: 2px solid #444;
  cursor: pointer;
}

.footer-btn:hover, .footer-btn.active {
  background: #2a2a4e;
  border-color: #4ade80;
  color: #4ade80;
}

.side-panel {
  width: 280px;
  background: rgba(10, 10, 20, 0.95);
  border-left: 2px solid #333;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 2px solid #333;
  flex-shrink: 0;
}

.panel-header h3 {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #fbbf24;
  margin: 0;
}

.panel-close {
  background: none;
  border: 1px solid #555;
  color: #888;
  cursor: pointer;
  font-size: 16px;
  padding: 0 6px;
  line-height: 1.2;
}

.panel-close:hover {
  color: #ef4444;
  border-color: #ef4444;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-msg {
  text-align: center;
  color: #555;
  font-size: 16px;
  padding: 30px 0;
}



.journal-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.journal-entry {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #333;
  padding: 8px;
}

.journal-entry.decision {
  border-left: 3px solid #4ade80;
}

.journal-entry.evento {
  border-left: 3px solid #3b82f6;
}

.journal-entry.minijuego {
  border-left: 3px solid #a855f7;
}

.entry-day {
  font-family: 'Press Start 2P', monospace;
  font-size: 6px;
  color: #fbbf24;
  margin-bottom: 3px;
}

.entry-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #e0e0e0;
  margin-bottom: 4px;
}

.entry-decision {
  font-size: 13px;
  color: #aaa;
  margin-bottom: 3px;
}

.entry-decision strong {
  color: #4ade80;
}

.entry-result {
  font-size: 13px;
  color: #ccc;
  margin-bottom: 4px;
  line-height: 1.3;
}

.entry-desc {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
  font-style: italic;
}

.entry-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-family: 'Press Start 2P', monospace;
  font-size: 6px;
}

.entry-effects .gain { color: #4ade80; }
.entry-effects .loss { color: #ef4444; }



@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.menu-screen {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.menu-content {
  text-align: center;
  padding: 20px;
}

.menu-title-block {
  margin-bottom: 40px;
}

.menu-title {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(20px, 4vw, 42px);
  color: #ef4444;
  margin: 0;
  text-shadow: 0 0 30px rgba(239, 68, 68, 0.6);
  letter-spacing: 4px;
}

.menu-number {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(36px, 8vw, 80px);
  color: #4ade80;
  margin: 8px 0;
  text-shadow: 0 0 40px rgba(74, 222, 128, 0.8);
  line-height: 1.2;
}

.menu-subtitle {
  font-family: 'VT323', monospace;
  font-size: clamp(14px, 2vw, 22px);
  color: #888;
  margin: 10px 0 0 0;
}

.menu-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.menu-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(9px, 1.2vw, 12px);
  padding: 12px 32px;
  background: #1a1a2e;
  color: #e0e0e0;
  border: 3px solid #4a4a6a;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 220px;
}

.menu-btn:hover {
  background: #2a2a4e;
  border-color: #4ade80;
  transform: translateX(4px);
  box-shadow: 0 0 12px rgba(74, 222, 128, 0.3);
}

.menu-btn.primary {
  background: #4ade80;
  color: #0a0a0a;
  border-color: #22c55e;
  font-size: clamp(10px, 1.3vw, 14px);
  padding: 14px 36px;
}

.menu-btn.primary:hover {
  background: #22c55e;
  transform: scale(1.05);
}

.menu-footer {
  margin-top: 50px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.menu-footer p {
  font-family: 'VT323', monospace;
  font-size: clamp(13px, 1.5vw, 17px);
  color: #666;
  line-height: 1.5;
}

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

.rules-screen, .settings-screen {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
  padding: 30px 20px;
}

.rules-content, .settings-content {
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.rules-title, .settings-title {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(14px, 2.5vw, 22px);
  color: #fbbf24;
  margin: 0 0 30px 0;
  text-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
  margin-bottom: 30px;
}

.rule-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #333;
  border-left: 3px solid #4ade80;
  padding: 12px 16px;
}

.rule-item h3 {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(8px, 1vw, 10px);
  color: #4ade80;
  margin: 0 0 8px 0;
}

.rule-item p {
  font-family: 'VT323', monospace;
  font-size: clamp(14px, 1.8vw, 18px);
  color: #aaa;
  margin: 0;
  line-height: 1.4;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.setting-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #333;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.setting-item label {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(8px, 1vw, 10px);
  color: #e0e0e0;
}

.toggle-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(7px, 0.9vw, 9px);
  padding: 6px 14px;
  background: #4ade80;
  color: #0a0a0a;
  border: none;
  cursor: pointer;
}

.speed-control {
  display: flex;
  gap: 6px;
}

.speed-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(6px, 0.8vw, 8px);
  padding: 5px 10px;
  background: #1a1a2e;
  color: #aaa;
  border: 2px solid #444;
  cursor: pointer;
}

.speed-btn.active {
  background: #4ade80;
  color: #0a0a0a;
  border-color: #22c55e;
}

@media (max-width: 900px) {
  .gameplay-layout {
    flex-direction: column;
  }
  .scene-area {
    flex: 0.5;
    min-height: 150px;
  }
  .text-area {
    flex: 1;
    border-left: none;
    border-top: 2px solid #333;
    overflow-y: auto;
  }
  .side-panel {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 85%;
    max-width: 300px;
    z-index: 100;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.8);
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 4px 8px;
  }
  .game-header {
    padding: 4px 8px;
  }
  .game-footer {
    padding: 4px 8px;
  }
  .scene-area {
    min-height: 120px;
  }
}
</style>