import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setupVueQuery } from '@core/plugins'

// Styles
import './assets/css/main.css'

// Create app instance
const app = createApp(App)

// Create Pinia store
const pinia = createPinia()

// Use plugins
app.use(pinia)
app.use(router)
setupVueQuery(app)

// Initialize auth state from localStorage before mounting
import { useAuthStore } from '@modules/auth/stores'
const authStore = useAuthStore()
authStore.initializeAuth()

// Mount app
app.mount('#app')
