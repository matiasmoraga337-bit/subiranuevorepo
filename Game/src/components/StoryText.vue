<template>
  <div class="story-text" @click="handleClick" tabindex="0">
    <p class="story-content">{{ displayedText }}<span v-if="isTyping" class="cursor">&#9608;</span></p>
    <div v-if="!isTyping && isComplete" class="continue-hint">
      &#9660; Haz clic para continuar &#9660;
    </div>
    <div v-else-if="isTyping && !isComplete" class="typing-hint">
      &#9656; ... &#9668;
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  text: { type: String, required: true },
  speed: { type: Number, default: 35 },
})

const emit = defineEmits(['complete', 'skip'])

const displayedText = ref('')
const isTyping = ref(false)
const isComplete = ref(false)
let timer = null
let fullText = ''

function start(text) {
  stop()
  fullText = text
  displayedText.value = ''
  isTyping.value = true
  isComplete.value = false

  let index = 0

  timer = setInterval(() => {
    if (index < fullText.length) {
      displayedText.value += fullText[index]
      index++
    } else {
      stop()
      isComplete.value = true
    }
  }, props.speed)
}

function skip() {
  stop()
  displayedText.value = fullText
  isComplete.value = true
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  isTyping.value = false
}

function handleClick() {
  if (isTyping.value) {
    skip()
    emit('skip')
  } else if (isComplete.value) {
    emit('complete')
  }
}

watch(() => props.text, (newText) => {
  if (newText) {
    start(newText)
  }
})

onMounted(() => {
  if (props.text) {
    start(props.text)
  }
})

onBeforeUnmount(() => {
  stop()
})

defineExpose({ skip })
</script>

<style scoped>
.story-text {
  cursor: pointer;
  user-select: none;
  padding: 20px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  outline: none;
}

.story-content {
  font-family: 'VT323', monospace;
  font-size: 1.4rem;
  color: #e0e0e0;
  line-height: 1.6;
  margin: 0;
  text-shadow: 0 0 8px rgba(74, 222, 128, 0.3);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.cursor {
  animation: blink 0.7s infinite;
  color: #4ade80;
}

.continue-hint {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.6rem;
  color: #4ade80;
  margin-top: 16px;
  animation: pulse 1s infinite;
  text-align: center;
}

.typing-hint {
  font-family: 'VT323', monospace;
  font-size: 1rem;
  color: #666;
  margin-top: 8px;
  animation: blink 1s infinite;
  text-align: center;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: translateY(0); }
  50% { opacity: 0.4; transform: translateY(3px); }
}

@media (max-width: 768px) {
  .story-content {
    font-size: 1.1rem;
  }
  .continue-hint {
    font-size: 0.5rem;
  }
}
</style>