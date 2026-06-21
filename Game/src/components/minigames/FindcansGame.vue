<template>
  <div class="minigame-container">
    <h2 class="minigame-title">
      🔪 ESCAPA DE LOS ASALTANTES
    </h2>

    <div class="game-area">

      <!-- VIDAS -->
      <div class="lives">
        <span v-for="n in lives" :key="n">❤️</span>
      </div>

      <!-- JUGADOR -->
      <div
        class="player"
        :style="{ left: playerX + '%' }"
      ></div>

      <!-- ENEMIGOS -->
      <div
        v-for="enemy in enemies"
        :key="enemy.id"
        class="enemy"
        :style="{
          left: enemy.x + '%',
          top: enemy.y + '%'
        }"
      >
        🔪
      </div>

      <!-- GAME OVER -->
      <div
        v-if="!gameActive && lives <= 0"
        class="game-over"
      >
        <h3>GAME OVER</h3>
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
      Usa ← → o A/D para moverte.<br>
      Esquiva los cuchillos y sobrevive 20 segundos.
    </div>

    <!-- BOTÓN -->
    <button
      v-if="!gameActive && lives > 0"
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

const gameStore = useGameStore()

const emit = defineEmits(['complete'])

const playerX = ref(50)
const enemies = ref([])
const lives = ref(3)
const timeLeft = ref(20)
const gameActive = ref(true)

let enemyId = 0
let enemyInterval = null
let gameInterval = null

// SPAWN ENEMIGOS
const spawnEnemy = () => {

  if (!gameActive.value) return

  enemies.value.push({
    id: ++enemyId,
    x: Math.random() * 90,
    y: -5,
    speed: 1 + Math.random() * 1.5,
  })
}

// ACTUALIZAR ENEMIGOS
const updateEnemies = () => {

  enemies.value = enemies.value.filter((enemy) => {

    enemy.y += enemy.speed

    // COLISIÓN
    if (enemy.y > 86 && enemy.y < 96) {

      const distance = Math.abs(playerX.value - enemy.x)

      if (distance < 5) {

        lives.value--

        // MUERTE
        if (lives.value <= 0) {

          gameActive.value = false

          clearInterval(enemyInterval)
          clearInterval(gameInterval)

          setTimeout(() => {

            emit('complete', 'lose')

            gameStore.health = 0
            gameStore.gameOverReason = 'health'
            gameStore.phase = 'gameover'

          }, 200)
        }

        return false
      }
    }

    return enemy.y < 100
  })
}

// MOVIMIENTO
const handleKeyPress = (e) => {

  if (!gameActive.value) return

  if (e.key === 'ArrowLeft' || e.key === 'a') {
    playerX.value = Math.max(2, playerX.value - 6)
  }

  if (e.key === 'ArrowRight' || e.key === 'd') {
    playerX.value = Math.min(94, playerX.value + 6)
  }
}

// TIMER
const updateTimer = () => {

  if (!gameActive.value) return

  if (timeLeft.value > 0) {

    timeLeft.value -= 0.1

    updateEnemies()

  } else {

    gameActive.value = false

    clearInterval(enemyInterval)
    clearInterval(gameInterval)

    setTimeout(() => {
      emit('complete', 'win')
    }, 500)
  }
}

// CONTINUAR
const emitResult = () => {
  emit('complete', 'win')
}

// MOUNT
onMounted(() => {

  window.addEventListener('keydown', handleKeyPress)

  enemyInterval = setInterval(spawnEnemy, 700)

  gameInterval = setInterval(updateTimer, 100)
})

// UNMOUNT
onBeforeUnmount(() => {

  window.removeEventListener('keydown', handleKeyPress)

  clearInterval(enemyInterval)
  clearInterval(gameInterval)
})
</script>

<style scoped>
.minigame-container {
  background: #111;
  border: 3px solid #00ff00;
  padding: 1.5rem;
  font-family: 'Courier New', monospace;
  max-width: 700px;
  margin: 0 auto;
}

.minigame-title {
  color: #ffff00;
  text-align: center;
  text-shadow: 0 0 10px #ff8800;
  margin-bottom: 1rem;
}

.game-area {
  position: relative;
  width: 100%;
  height: 340px;
  background: linear-gradient(180deg, #1a0a2e 0%, #2d1040 60%, #0a0a0a 100%);
  border: 2px solid #00ff00;
  overflow: hidden;
  margin-bottom: 1rem;
}

.player {
  position: absolute;
  bottom: 12px;
  width: 32px;
  height: 32px;
  background: #00ff66;
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
  transition: left 0.08s;
  filter: drop-shadow(0 0 6px #00ff66);
  z-index: 10;
}

.item {
  position: absolute;
  width: 34px;
  height: 34px;
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  animation: float 2s ease-in-out infinite;
  filter: drop-shadow(0 0 6px currentColor);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.game-stats {
  position: absolute;
  top: 10px;
  right: 12px;
  color: #00ff66;
  font-weight: bold;
  display: flex;
  gap: 1rem;
  font-size: 0.95rem;
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
  border: 2px solid #ffff00;
  color: #ffff00;
  z-index: 20;
}

.game-over h3 {
  font-size: 2rem;
  margin: 0;
  text-shadow: 0 0 10px rgba(255, 255, 0, 0.7);
}

.game-over p {
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.instructions {
  color: #88ff88;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-align: center;
}

.continue-btn {
  display: block;
  margin: 0 auto;
  padding: 0.8rem 2rem;
  background: #00ff66;
  color: #000;
  border: 2px solid #00ff66;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.continue-btn:hover {
  background: #000;
  color: #00ff66;
}
.enemy {
  position: absolute;
  font-size: 1.8rem;
  z-index: 5;
}
.lives {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 2rem;
  z-index: 20;
}
</style>