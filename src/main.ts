import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setupVueQuery } from '@core/plugins'
import { initTheme, markapAlert } from '@shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

// Styles
import './assets/css/main.css'

// Initialize theme (sync composable state, inline script in index.html prevents flash)
initTheme()

// Create app instance
const app = createApp(App)

// Create Pinia store
const pinia = createPinia()

// Use plugins
app.use(pinia)
app.use(router)
setupVueQuery(app)

// Initialize auth state from localStorage before mounting
import { useAuthStore } from '@modules/auth'
const authStore = useAuthStore()
authStore.initializeAuth()

// Errores inesperados de la interfaz: detalle en consola, mensaje comprensible al usuario.
let lastUiErrorAt = 0
app.config.errorHandler = (error, _instance, info) => {
  console.error('[app]', info, error)
  if (Date.now() - lastUiErrorAt < 3000) return
  lastUiErrorAt = Date.now()
  void markapAlert.toast.error(
    'Ocurrió un problema en la pantalla',
    getApiErrorMessage(error, 'No se pudo completar la acción. Recarga la página e inténtalo nuevamente'),
  )
}

// Mount app
app.mount('#app')
