<template>
  <div class="scene-art">
    <div v-if="imageUrl" class="scene-image-wrapper">
      <img :src="imageUrl" :alt="image" class="scene-image" />
      <div class="scene-overlay"></div>
    </div>
    <div v-else :class="['scene-bg-fallback', locationClass]">
      <div class="scene-bg"></div>
      <div class="scene-overlay"></div>
    </div>
    <div class="scene-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  location: {
    type: String,
    default: 'casa',
  },
  image: {
    type: String,
    default: null,
  },
})

const locationClass = computed(() => `scene-${props.location}`)

const imageUrl = computed(() => {
  if (!props.image) return null
  return `/Imagen/${props.image}.png`
})
</script>

<style scoped>
.scene-art {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.scene-image-wrapper {
  position: absolute;
  inset: 0;
}

.scene-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  image-rendering: auto;
}

.scene-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6) 100%);
  pointer-events: none;
  z-index: 1;
}

.scene-bg-fallback {
  position: absolute;
  inset: 0;
}

.scene-bg {
  position: absolute;
  inset: 0;
  transition: opacity 0.5s;
}

.scene-content {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
}

.scene-casa .scene-bg {
  background:
    radial-gradient(ellipse at 30% 20%, rgba(255, 200, 100, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(100, 150, 255, 0.05) 0%, transparent 40%),
    linear-gradient(180deg, #0d0d1a 0%, #1a1a2e 30%, #16213e 70%, #0a1628 100%);
}

.scene-calle .scene-bg {
  background:
    radial-gradient(ellipse at 50% 10%, rgba(200, 150, 100, 0.08) 0%, transparent 40%),
    linear-gradient(180deg, #1a0d0d 0%, #2d1b1b 30%, #1a1a1a 60%, #0d0d0d 100%);
}

.scene-supermercado .scene-bg {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 255, 150, 0.06) 0%, transparent 40%),
    radial-gradient(ellipse at 80% 30%, rgba(255, 150, 150, 0.04) 0%, transparent 30%),
    linear-gradient(180deg, #1a1a0d 0%, #2d2d1b 40%, #1a1a1a 70%, #0d0d0d 100%);
}

.scene-farmacia .scene-bg {
  background:
    radial-gradient(ellipse at 50% 40%, rgba(150, 255, 200, 0.06) 0%, transparent 40%),
    linear-gradient(180deg, #0d1a1a 0%, #1b2d2d 40%, #1a2a1a 70%, #0d0d0d 100%);
}

.scene-refugio .scene-bg {
  background:
    radial-gradient(ellipse at 50% 50%, rgba(150, 200, 150, 0.08) 0%, transparent 40%),
    linear-gradient(180deg, #0d1a0d 0%, #1b2d1b 40%, #1a1a1a 70%, #0d0d0d 100%);
}

.scene-rescate .scene-bg {
  background:
    radial-gradient(ellipse at 50% 20%, rgba(100, 200, 255, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 30% 30%, rgba(255, 255, 200, 0.08) 0%, transparent 30%),
    linear-gradient(180deg, #1a3a5e 0%, #2a5a8e 30%, #4a8abe 60%, #1a3a5e 100%);
}
</style>