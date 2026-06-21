import { ref } from 'vue'

const audioContext = ref(null)
const isMuted = ref(false)
const isMusicPlaying = ref(false)
let musicOscillator = null
let musicGain = null

function getAudioContext() {
  if (!audioContext.value) {
    audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioContext.value.state === 'suspended') {
    audioContext.value.resume()
  }
  return audioContext.value
}

function playTone(frequency, duration, type = 'square', volume = 0.1) {
  if (isMuted.value) return

  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

  gainNode.gain.setValueAtTime(volume, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration)
}

function playClick() {
  playTone(800, 0.05, 'square', 0.05)
}

function playDamage() {
  playTone(200, 0.3, 'sawtooth', 0.1)
  setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.08), 100)
}

function playVictory() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.4, 'square', 0.08), i * 150)
  })
}

function playGameOver() {
  const notes = [400, 350, 300, 200]
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.5, 'sawtooth', 0.08), i * 200)
  })
}

function playRandomEvent() {
  playTone(600, 0.1, 'sine', 0.06)
  setTimeout(() => playTone(900, 0.1, 'sine', 0.06), 100)
}

function startMusic() {
  if (isMuted.value || isMusicPlaying.value) return

  const ctx = getAudioContext()
  musicGain = ctx.createGain()
  musicGain.gain.setValueAtTime(0.02, ctx.currentTime)
  musicGain.connect(ctx.destination)

  function playAmbientNote() {
    if (!isMusicPlaying.value || isMuted.value) return

    const freq = 80 + Math.random() * 120
    const osc = ctx.createOscillator()
    const noteGain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)

    noteGain.gain.setValueAtTime(0, ctx.currentTime)
    noteGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.5)
    noteGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2)

    osc.connect(noteGain)
    noteGain.connect(musicGain)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 2)

    setTimeout(playAmbientNote, 1500 + Math.random() * 2000)
  }

  isMusicPlaying.value = true
  playAmbientNote()
}

function stopMusic() {
  isMusicPlaying.value = false
  if (musicGain) {
    musicGain.disconnect()
    musicGain = null
  }
}

function toggleMute() {
  isMuted.value = !isMuted.value
  if (isMuted.value) {
    stopMusic()
  }
}

export function useAudio() {
  return {
    isMuted,
    isMusicPlaying,
    playClick,
    playDamage,
    playVictory,
    playGameOver,
    playRandomEvent,
    startMusic,
    stopMusic,
    toggleMute,
  }
}