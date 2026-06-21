<template>
  <div class="stat-bar">
    <div class="stat-label">
      <span class="stat-icon">{{ icon }}</span>
      <span class="stat-name">{{ name }}</span>
    </div>
    <div class="stat-track">
      <div
        class="stat-fill"
        :class="fillClass"
        :style="{ width: percentage + '%' }"
      ></div>
    </div>
    <div class="stat-value">{{ value }}/{{ max }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  icon: { type: String, required: true },
  value: { type: Number, required: true },
  max: { type: Number, required: true },
})

const percentage = computed(() => {
  return Math.max(0, Math.min(100, (props.value / props.max) * 100))
})

const fillClass = computed(() => {
  if (percentage.value <= 20) return 'critical'
  if (percentage.value <= 40) return 'low'
  if (percentage.value <= 60) return 'medium'
  return 'high'
})
</script>

<style scoped>
.stat-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 90px;
}

.stat-icon {
  font-size: 12px;
}

.stat-name {
  color: #f0f0f0;
}

.stat-track {
  flex: 1;
  height: 12px;
  background: #2a2a2a;
  border: 2px solid #4a4a4a;
  position: relative;
  image-rendering: pixelated;
}

.stat-fill {
  height: 100%;
  transition: width 0.5s ease;
  image-rendering: pixelated;
}

.stat-fill.high { background: #4ade80; }
.stat-fill.medium { background: #fbbf24; }
.stat-fill.low { background: #f97316; }
.stat-fill.critical { background: #ef4444; animation: pulse 0.5s infinite; }

.stat-value {
  color: #aaa;
  min-width: 40px;
  text-align: right;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@media (max-width: 768px) {
  .stat-bar {
    font-size: 6px;
  }
  .stat-label {
    min-width: 70px;
  }
  .stat-icon {
    font-size: 10px;
  }
}
</style>
