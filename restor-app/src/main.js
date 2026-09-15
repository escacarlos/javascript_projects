import './assets/main.css'

import { createApp } from 'vue'
import { router } from './router'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import { store } from './store/store'
import {
  getTokenInfoAndLoadUser,
  TOKEN_STORAGE_KEY,
  clearLocalSession,
} from './services/authService'

/**
 * Restore session from localStorage (étape 5): token + getTokenInfo + données profil.
 */
async function restoreAuthFromStorage() {
  const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!savedToken) return

  store.token = savedToken
  try {
    await getTokenInfoAndLoadUser()
  } catch {
    if (store.token) clearLocalSession()
  }
}

async function bootstrap() {
  await restoreAuthFromStorage()
  const app = createApp(App)
  app.use(router)
  await router.isReady()
  app.mount('#app')
}

bootstrap()
