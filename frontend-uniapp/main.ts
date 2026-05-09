import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import 'virtual:uno.css'
import './src/styles/theme.css'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  app.use(createPinia())
  return { app }
}
