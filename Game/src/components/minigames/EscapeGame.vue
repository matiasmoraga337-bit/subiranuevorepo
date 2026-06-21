<template>
  <div class="minigame-container">

    <h2 class="minigame-title">
      🚁 ESCAPE FINAL
    </h2>

    <div class="game-area">

      <!-- HELICÓPTERO -->
      <div class="helicopter">
        🚁
      </div>

      <!-- ZONA DE ESCAPE -->
      <div class="escape-zone">
        ESCAPE
      </div>

      <!-- VIDAS -->
      <div class="lives">
        <span v-for="n in lives" :key="n">❤️</span>
      </div>

      <!-- JUGADOR -->
      <div
        class="player"
        :style="{
          left: playerX + '%',
          bottom: playerY + '%'
        }"
      ></div>

      <!-- BOMBAS -->
      <div
        v-for="bomb in bombs"
        :key="bomb.id"
        class="bomb"
        :style="{
          left: bomb.x + '%',
          top: bomb.y + '%'
        }"
      >
        💣
      </div>

      <!-- VICTORIA -->
      <div
        v-if="escaped"
        class="game-over"
      >
        <h3>¡RESCATADO!</h3>

        <p>
          Alcanzaste el helicóptero
        </p>
      </div>

      <!-- STATS -->
      <div class="game-stats">

        <span>
          Tiempo: {{ Math.ceil(timeLeft) }}s
        </span>

      </div>

    </div>

    <!-- INSTRUCCIONES -->
    <div class="instructions">
      Usa ← → ↑ ↓ o WASD.<br>
      Esquiva bombas y llega al helicóptero.
    </div>

    <!-- BOTÓN SOLO SI GANA -->
    <button
      v-if="escaped"
      class="continue-btn"
      @click="emitResult"
    >
      Continuar
    </button>

  </div>
</template>

<script setup>
import { useGameStore } from '../../stores/gameStore'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits(['complete'])

const gameStore = useGameStore()

const playerX = ref(50)
const playerY = ref(5)

const bombs = ref([])

const escaped = ref(false)

const lives = ref(3)

const timeLeft = ref(20)

const gameActive = ref(true)

let bombId = 0
let bombInterval = null
let gameInterval = null

const spawnBomb = () => {

  if (!gameActive.value || timeLeft.value <= 0) return

  bombs.value.push({
    x: Math.random() * 88 + 2,
    y: 15,

    // MÁS LENTO
    speed: 0.7 + Math.random() * 1.1,

    id: ++bombId,
  })
}

const triggerGameOver = () => {

  gameActive.value = false

  clearInterval(bombInterval)
  clearInterval(gameInterval)

  setTimeout(() => {

    gameStore.health = 0
    gameStore.gameOverReason = 'health'
    gameStore.phase = 'gameover'

  }, 200)
}

const updateBombs = () => {

  bombs.value = bombs.value.filter((bomb) => {

    // MOVER BOMBA
    bomb.y += bomb.speed

    // POSICIÓN REAL DEL JUGADOR
    const playerRealY = 100 - playerY.value

    // DISTANCIAS
    const xDistance = Math.abs(playerX.value - bomb.x)
    const yDistance = Math.abs(playerRealY - bomb.y)

    // ZONA SEGURA CERCA DEL HELICÓPTERO
    const safeZone = playerY.value > 80

    // COLISIÓN REAL
    if (
      !safeZone &&
      xDistance < 2 &&
      yDistance < 3
    ) {

      lives.value--

      // ELIMINAR BOMBA
      if (lives.value <= 0) {

        triggerGameOver()
      }

      return false
    }

    // DESAPARECER BOMBAS
    return bomb.y < 92
  })

  // ESCAPE
  if (
    playerY.value > 84 &&
    playerX.value > 42 &&
    playerX.value < 58
  ) {

    escaped.value = true

    gameActive.value = false

    clearInterval(bombInterval)
    clearInterval(gameInterval)

    setTimeout(() => {
      emit('complete', 'win')
    }, 500)
  }
}
const handleKeyPress = (e) => {

  if (!gameActive.value) return

  if (
    e.key === 'ArrowLeft' ||
    e.key === 'a' ||
    e.key === 'A'
  ) {
    playerX.value = Math.max(2, playerX.value - 4)
  }

  else if (
    e.key === 'ArrowRight' ||
    e.key === 'd' ||
    e.key === 'D'
  ) {
    playerX.value = Math.min(94, playerX.value + 4)
  }

  else if (
    e.key === 'ArrowUp' ||
    e.key === 'w' ||
    e.key === 'W'
  ) {
    playerY.value = Math.min(90, playerY.value + 4)
  }

  else if (
    e.key === 'ArrowDown' ||
    e.key === 's' ||
    e.key === 'S'
  ) {
    playerY.value = Math.max(0, playerY.value - 4)
  }
}

const updateTimer = () => {

  if (!gameActive.value) return

  if (timeLeft.value > 0) {

    timeLeft.value -= 0.1

    updateBombs()

  } else {

    triggerGameOver()
  }
}

const emitResult = () => {
  emit('complete', escaped.value ? 'win' : 'lose')
}

onMounted(() => {

  bombInterval = setInterval(spawnBomb, 650)

  gameInterval = setInterval(updateTimer, 100)

  window.addEventListener('keydown', handleKeyPress)
})

onBeforeUnmount(() => {

  window.removeEventListener('keydown', handleKeyPress)

  clearInterval(bombInterval)
  clearInterval(gameInterval)
})
</script>

<style scoped>
.minigame-container {
  background: #111;
  border: 3px solid #ff6600;
  padding: 1.5rem;
  font-family: 'Courier New', monospace;
  max-width: 700px;
  margin: 0 auto;
}

.minigame-title {
  color: #ff6600;
  text-align: center;
  text-shadow: 0 0 10px #ff4400;
  margin-bottom: 1rem;
}

.game-area {
  position: relative;
  width: 100%;
  height: 420px;
  background: linear-gradient(180deg, #1a0030 0%, #330020 60%, #0a0a0a 100%);
  border: 2px solid #ff6600;
  overflow: hidden;
  margin-bottom: 1rem;
}

.helicopter {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 3.2rem;
  filter: drop-shadow(0 0 12px rgba(255, 200, 0, 0.6));
  animation: hover 1s ease-in-out infinite;
  z-index: 2;
}

@keyframes hover {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-10px); }
}

.player {
  position: absolute;
  width: 28px;
  height: 28px;
  background: #ffff00;
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
  transition: all 0.08s;
  filter: drop-shadow(0 0 8px #ffff00);
  z-index: 10;
}

.bomb {
  position: absolute;
  font-size: 1.6rem;
  filter: drop-shadow(0 0 6px rgba(255, 80, 0, 0.8));
  z-index: 5;
}

.game-stats {
  position: absolute;
  top: 10px;
  right: 12px;
  color: #ffff00;
  font-weight: bold;
  display: flex;
  gap: 1rem;
  font-size: 0.95rem;
  text-shadow: 0 0 4px rgba(255, 255, 0, 0.5);
  z-index: 5;
}

.game-over {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.92);
  padding: 2rem;
  text-align: center;
  border: 2px solid #ff6600;
  color: #ff6600;
  z-index: 20;
}

.game-over h3 {
  font-size: 2rem;
  margin: 0;
  text-shadow: 0 0 10px rgba(255, 102, 0, 0.7);
}

.game-over p {
  font-size: 1.1rem;
  margin-top: 0.5rem;
  color: #ffaa44;
}

.instructions {
  color: #ffaa66;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-align: center;
}

.continue-btn {
  display: block;
  margin: 0 auto;
  padding: 0.8rem 2rem;
  background: #ff6600;
  color: #000;
  border: 2px solid #ff6600;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.continue-btn:hover {
  background: #000;
  color: #ff6600;
}
.lives {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 2rem;
  z-index: 20;
}
</style>