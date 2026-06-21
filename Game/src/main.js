import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import 'nes.css/css/nes.min.css'
import '@pixelium/web-vue/dist/pixelium-vue.css'
import './assets/styles/retro.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
