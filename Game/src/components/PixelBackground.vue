<template>
  <div class="pixel-background" :class="locationClass">
    <div class="bg-layer"></div>
    <div class="crt-overlay"></div>
    <div class="scanlines"></div>
    <div class="vignette"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  location: {
    type: String,
    default: 'casa',
  },
})

const locationClass = computed(() => `location-${props.location}`)
</script>

<style scoped>
.pixel-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.bg-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.location-casa .bg-layer {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.location-casa .bg-layer::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255, 255, 255, 0.02) 40px, rgba(255, 255, 255, 0.02) 41px),
    repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255, 255, 255, 0.02) 40px, rgba(255, 255, 255, 0.02) 41px);
}

.location-calle .bg-layer {
  background: linear-gradient(180deg, #2d1b2e 0%, #1a1a2e 50%, #0a0a0a 100%);
}

.location-calle .bg-layer::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: repeating-linear-gradient(90deg, #333 0px, #333 20px, #444 20px, #444 40px);
  opacity: 0.3;
}

.location-supermercado .bg-layer {
  background: linear-gradient(180deg, #2e2d1b 0%, #1a1a2e 50%, #0a0a0a 100%);
}

.location-farmacia .bg-layer {
  background: linear-gradient(180deg, #1b2e2d 0%, #1a1a2e 50%, #0a0a0a 100%);
}

.location-refugio .bg-layer {
  background: linear-gradient(180deg, #1a2e1b 0%, #1a1a2e 50%, #0a0a0a 100%);
}

.location-rescate .bg-layer {
  background: linear-gradient(180deg, #1a3a5e 0%, #2a5a8e 50%, #4a8abe 100%);
  animation: sunrise 3s ease;
}

@keyframes sunrise {
  from { filter: brightness(0.3); }
  to { filter: brightness(1); }
}

.crt-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.4) 100%);
  pointer-events: none;
  z-index: 1;
}

.scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
  z-index: 2;
}

.vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.7) 100%);
  pointer-events: none;
  z-index: 3;
}
</style>