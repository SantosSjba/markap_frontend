<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@modules/auth/stores'
import { applicationsService } from '../services'
import type { Application } from '../types'

/**
 * ApplicationsView
 * Shows available applications for the user after login
 */

const router = useRouter()
const authStore = useAuthStore()

const applications = ref<Application[]>([])
const isLoading = ref(true)
const error = ref('')

// Icon mapping based on icon name
const DEFAULT_ICON_PATH = 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'

const iconPaths: Record<string, string> = {
  key: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  home: DEFAULT_ICON_PATH,
  palette: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  package: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  calculator: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
}

const getIconPath = (iconName: string | null): string => {
  if (!iconName) return DEFAULT_ICON_PATH
  return iconPaths[iconName] || DEFAULT_ICON_PATH
}

const loadApplications = async () => {
  isLoading.value = true
  error.value = ''

  try {
    applications.value = await applicationsService.getMyApplications()
  } catch (err) {
    console.error('Failed to load applications:', err)
    error.value = 'Error al cargar las aplicaciones'
  } finally {
    isLoading.value = false
  }
}

const navigateToApp = (app: Application) => {
  if (app.url) {
    router.push(app.url)
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/auth/login')
}

onMounted(() => {
  loadApplications()
})
</script>

<template>
  <div class="min-h-screen" style="background-color: #0a0a0a;">
    <!-- Header -->
    <header class="border-b" style="border-color: #1a1a1a;">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center gap-3">
            <div 
              class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
              style="background-color: var(--color-primary);"
            >
              M
            </div>
            <div>
              <h1 class="text-white font-semibold">MARKAPP</h1>
              <p class="text-xs" style="color: #666;">Sistema Integral</p>
            </div>
          </div>

          <!-- User menu -->
          <div class="flex items-center gap-4">
            <div class="text-right hidden sm:block">
              <p class="text-sm text-white">{{ authStore.userFullName }}</p>
              <p class="text-xs" style="color: #666;">{{ authStore.user?.email }}</p>
            </div>
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
              style="background-color: var(--color-primary); color: white;"
            >
              {{ authStore.userInitials }}
            </div>
            <button
              @click="handleLogout"
              class="text-sm px-3 py-1.5 rounded-lg transition-colors"
              style="color: #888; background-color: transparent;"
              @mouseenter="($event.target as HTMLElement).style.backgroundColor = '#1a1a1a'"
              @mouseleave="($event.target as HTMLElement).style.backgroundColor = 'transparent'"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Welcome message -->
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-white mb-2">
          Bienvenida, {{ authStore.user?.firstName }}
        </h2>
        <p style="color: #888;">Selecciona la aplicación a la que deseas acceder</p>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <svg class="animate-spin h-8 w-8" style="color: var(--color-primary);" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center py-12">
        <p style="color: var(--color-error);">{{ error }}</p>
        <button 
          @click="loadApplications"
          class="mt-4 px-4 py-2 rounded-lg"
          style="background-color: var(--color-primary); color: white;"
        >
          Reintentar
        </button>
      </div>

      <!-- Applications grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          v-for="app in applications"
          :key="app.id"
          @click="navigateToApp(app)"
          class="group text-left p-6 rounded-xl border transition-all duration-200 hover:scale-[1.02]"
          style="background-color: #141414; border-color: #2a2a2a;"
          @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = app.color || '#0BB0BE'"
          @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'"
        >
          <div class="flex items-start justify-between mb-4">
            <!-- Icon -->
            <div 
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              :style="{ backgroundColor: (app.color || '#0BB0BE') + '20' }"
            >
              <svg 
                class="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                :style="{ color: app.color || '#0BB0BE' }"
              >
                <path 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="1.5" 
                  :d="getIconPath(app.icon)" 
                />
              </svg>
            </div>

            <!-- Arrow -->
            <svg 
              class="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style="color: #666;"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <!-- Content -->
          <h3 class="font-semibold text-white mb-1">{{ app.name }}</h3>
          <p class="text-sm mb-4 line-clamp-2" style="color: #888;">
            {{ app.description }}
          </p>

          <!-- Stats -->
          <div class="flex items-center gap-4 text-sm">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" style="background-color: var(--color-success);"></span>
              <span style="color: var(--color-success);">{{ app.activeCount }}</span>
              <span style="color: #666;">activos</span>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" style="background-color: var(--color-warning);"></span>
              <span style="color: var(--color-warning);">{{ app.pendingCount }}</span>
              <span style="color: #666;">pendientes</span>
            </span>
          </div>
        </button>
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-8 text-center">
      <p class="text-sm" style="color: #444;">
        MARKAP S.A.C. - Sistema Integral de Gestión Empresarial
      </p>
    </footer>
  </div>
</template>
