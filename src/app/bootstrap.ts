import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createAppRouter } from './router/index'
import { installServices } from './providers/services'
import { setupHttpSession } from './providers/http-session'
import { setupVueQuery } from '@shared/infrastructure/query/vue-query'
import { initTheme } from '@shared/presentation/composables/useTheme'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import '../assets/css/main.css'
import { useAuthStore } from '@modules/auth/presentation/stores/auth.store'
// Styles

// Initialize theme (sync composable state, inline script in index.html prevents flash)
initTheme()

// Create app instance
const app = createApp(App)

// Create Pinia store
const pinia = createPinia()

// Use plugins
installServices(app)
app.use(pinia)
setupVueQuery(app)
setupHttpSession(pinia)

// Initialize auth state from localStorage before mounting

const authStore = useAuthStore()
void authStore.initializeAuth()
app.use(createAppRouter())

// Errores inesperados de la interfaz: detalle en consola, mensaje comprensible al usuario.
let lastUiErrorAt = 0
app.config.errorHandler = (error, _instance, info) => {
  console.error('[app]', info, error)
  if (Date.now() - lastUiErrorAt < 3000) return
  lastUiErrorAt = Date.now()
  void markapAlert.toast.error(
    'Ocurrió un problema en la pantalla',
    getApiErrorMessage(
      error,
      'No se pudo completar la acción. Recarga la página e inténtalo nuevamente',
    ),
  )
}

// Mount app
app.mount('#app')
