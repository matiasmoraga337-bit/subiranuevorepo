<template>
  <div class="decision-buttons">
    <button
      v-for="(decision, index) in decisions"
      :key="index"
      class="decision-btn"
      :class="decisionClass(decision)"
      @click="$emit('select', index)"
    >
      {{ decision.text }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  decisions: { type: Array, required: true },
})
defineEmits(['select'])

function decisionClass(decision) {
  if (decision.random) return 'decision-risky'
  if (decision.effects?.food < 0 || decision.effects?.health < 0 || decision.effects?.morale < 0) return 'decision-bad'
  return 'decision-good'
}
</script>

<style scoped>
.decision-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px;
  overflow-y: auto;
}

.decision-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(6px, 0.9vw, 9px);
  padding: 10px 14px;
  border: 3px solid #4a4a6a;
  cursor: pointer;
  text-align: left;
  color: #e0e0e0;
  transition: all 0.12s;
  line-height: 1.4;
  white-space: normal;
  background: #1a1a2e;
}

.decision-btn:hover {
  transform: translateX(4px);
}

.decision-good {
  border-color: #4ade80;
  color: #4ade80;
  background: rgba(74, 222, 128, 0.05);
}
.decision-good:hover {
  background: rgba(74, 222, 128, 0.12);
  box-shadow: 0 0 10px rgba(74, 222, 128, 0.2);
}

.decision-bad {
  border-color: #ef4444;
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.05);
}
.decision-bad:hover {
  background: rgba(239, 68, 68, 0.12);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
}

.decision-risky {
  border-color: #fbbf24;
  color: #fcd34d;
  background: rgba(251, 191, 36, 0.05);
}
.decision-risky:hover {
  background: rgba(251, 191, 36, 0.12);
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.2);
}
</style>