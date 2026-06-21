<template>
  <div class="minigame-container">
    <h2 class="minigame-title">💧 RECOGER AGUA DE LLUVIA</h2>

    <div class="game-area" ref="gameArea">
      <div
        v-for="drop in raindrops"
        :key="drop.id"
        class="raindrop"
        :style="{
          left: drop.x + '%',
          top: drop.y + '%',
        }"
      ></div>

      <div class="bucket" :style="{ left: bucketX + '%' }">
        🪣
      </div>

      <div
        v-if="timeLeft <= 0 || waterCollected >= maxWater"
        class="game-over"
      >
        <h3>{{ waterCollected >= winThreshold ? '¡EXCELENTE!' : '¡INSUFICIENTE!' }}</h3>
        <p>Agua recolectada: {{ waterCollected }}/{{ maxWater }}</p>
      </div>

      <div class="game-stats">
        <span>Tiempo: {{ Math.ceil(timeLeft) }}s</span>
        <span>Agua: {{ waterCollected }}/{{ maxWater }}</span>
      </div>
    </div>

    <div class="instructions">
      Usa ← → o A/D para mover el cubo. Recolecta al menos {{ Math.ceil(winThreshold) }} gotas.
    </div>

    <button
      v-if="timeLeft <= 0 || waterCollected >= maxWater"
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

const bucketX = ref(50)
const raindrops = ref([])
const waterCollected = ref(0)
const maxWater = ref(15)
const winThreshold = ref(7.5)
const timeLeft = ref(25)
const gameActive = ref(true)
let raindropId = 0
let rainInterval = null
let gameInterval = null

const checkWin = () => {
  if (waterCollected.value >= maxWater.value) {
    gameActive.value = false
    clearInterval(rainInterval)
    clearInterval(gameInterval)
  }
}

const spawnRaindrop = () => {
  if (gameActive.value && timeLeft.value > 0) {
    raindrops.value.push({
      x: Math.random() * 90 + 2,
      y: -2,
      speed: 2.2 + Math.random() * 2.8,
      id: ++raindropId,
    })
  }
}

const updateRain = () => {
  raindrops.value = raindrops.value.filter((drop) => {
    drop.y += drop.speed

    if (drop.y > 82 && drop.y < 96) {
      const bucketCenter = bucketX.value
      const bucketWidth = 6
      const distance = Math.abs(bucketCenter - drop.x)

      if (distance < bucketWidth) {
        waterCollected.value++
        checkWin()
        return false
      }
    }

    return drop.y < 100
  })
}

const emitResult = () => {
  emit('complete', waterCollected.value >= winThreshold.value ? 'win' : 'lose')
}

const handleKeyPress = (e) => {
  if (!gameActive.value) return

  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    bucketX.value = Math.max(2, bucketX.value - 6)
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    bucketX.value = Math.min(94, bucketX.value + 6)
  }
}

const updateTimer = () => {

  if (!gameActive.value) return

  if (timeLeft.value > 0) {

    timeLeft.value -= 0.1

    updateRain()

  } else {

    gameActive.value = false

    clearInterval(rainInterval)
    clearInterval(gameInterval)

    // SI NO LLEGASTE A 15 → GAME OVER
    if (waterCollected.value < maxWater.value) {

      setTimeout(() => {

        gameStore.health = 0
        gameStore.gameOverReason = 'health'
        gameStore.phase = 'gameover'

      }, 200)

    } else {

      // GANAR
      setTimeout(() => {
        emit('complete', 'win')
      }, 300)
    }
  }
}

onMounted(() => {

  rainInterval = setInterval(spawnRaindrop, 600)

  gameInterval = setInterval(updateTimer, 80)

  window.addEventListener('keydown', handleKeyPress)
})

onBeforeUnmount(() => {

  window.removeEventListener('keydown', handleKeyPress)

  clearInterval(rainInterval)

  clearInterval(gameInterval)
})
</script>

<style scoped>
.minigame-container {
  background: #0a0a1a;
  border: 3px solid #00ccff;
  padding: 1.5rem;
  font-family: 'Courier New', monospace;
  max-width: 700px;
  margin: 0 auto;
}

.minigame-title {
  color: #00ccff;
  text-align: center;
  text-shadow: 0 0 10px #0088ff;
  margin-bottom: 1rem;
}

.game-area {
  position: relative;
  width: 100%;
  height: 380px;
  background: linear-gradient(180deg, #0a1128 0%, #162040 60%, #0a0a0a 100%);
  border: 2px solid #00ccff;
  overflow: hidden;
  margin-bottom: 1rem;
}

.raindrop {
  position: absolute;
  width: 6px;
  height: 12px;
  background: linear-gradient(180deg, #88eeff, #00aacc);
  border-radius: 0 0 50% 50%;
  box-shadow:
    0 0 4px #00ccff,
    0 0 8px #0088ff,
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
}

.bucket {
  position: absolute;
  bottom: 8px;
  font-size: 2.2rem;
  transition: left 0.08s;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.4));
  z-index: 10;
}

.game-stats {
  position: absolute;
  top: 10px;
  right: 12px;
  color: #00ccff;
  font-weight: bold;
  display: flex;
  gap: 1rem;
  font-size: 0.95rem;
  text-shadow: 0 0 4px rgba(0, 204, 255, 0.5);
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
  border: 2px solid #00ccff;
  color: #00ccff;
  z-index: 20;
}

.game-over h3 {
  font-size: 2rem;
  margin: 0;
  text-shadow: 0 0 10px rgba(0, 204, 255, 0.7);
}

.game-over p {
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.instructions {
  color: #88ccff;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-align: center;
}

.continue-btn {
  display: block;
  margin: 0 auto;
  padding: 0.8rem 2rem;
  background: #00ccff;
  color: #000;
  border: 2px solid #00ccff;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.continue-btn:hover {
  background: #000;
  color: #00ccff;
}
</style>