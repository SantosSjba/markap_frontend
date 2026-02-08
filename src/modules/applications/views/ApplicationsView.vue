<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@modules/auth/stores'
import { useMyApplications } from '../composables'
import type { Application } from '../types'

/**
 * ApplicationsView
 * Shows available applications for the user after login
 * Uses TanStack Query for data fetching
 */

const router = useRouter()
const authStore = useAuthStore()

// TanStack Query
const { data: applications, isLoading, error, refetch } = useMyApplications()

const isUserMenuOpen = ref(false)

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

const navigateToApp = (app: Application) => {
  if (app.url) {
    router.push(app.url)
  }
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

const goToProfile = () => {
  closeUserMenu()
  router.push('/settings/profile')
}

const goToSettings = () => {
  closeUserMenu()
  router.push('/settings')
}

const handleLogout = () => {
  closeUserMenu()
  authStore.logout()
  router.push('/auth/login')
}

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu-container')) {
    closeUserMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background-color: var(--color-background);">
    <!-- Header -->
    <header class="bg-white border-b" style="border-color: var(--color-border);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <img 
              src="/images/logo.jpg" 
              alt="MARKAP Homes" 
              class="h-12 w-auto object-contain"
            />
          </div>

          <!-- User menu -->
          <div class="relative user-menu-container">
            <button
              @click="toggleUserMenu"
              class="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-gray-50"
            >
              <div class="text-right hidden sm:block">
                <p class="text-sm font-medium" style="color: var(--color-text-primary);">{{ authStore.userFullName }}</p>
                <p class="text-xs" style="color: var(--color-text-muted);">{{ authStore.user?.email }}</p>
              </div>
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                style="background-color: var(--color-primary);"
              >
                {{ authStore.userInitials }}
              </div>
              <svg 
                class="w-4 h-4 transition-transform"
                :class="{ 'rotate-180': isUserMenuOpen }"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style="color: var(--color-text-muted);"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown menu -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              leave-active-class="transition-all duration-150 ease-in"
              enter-from-class="opacity-0 scale-95 -translate-y-1"
              leave-to-class="opacity-0 scale-95 -translate-y-1"
            >
              <div
                v-if="isUserMenuOpen"
                class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border py-2 z-50"
                style="border-color: var(--color-border);"
              >
                <!-- User info -->
                <div class="px-4 py-3 border-b" style="border-color: var(--color-border);">
                  <p class="text-sm font-medium" style="color: var(--color-text-primary);">{{ authStore.userFullName }}</p>
                  <p class="text-xs" style="color: var(--color-text-muted);">{{ authStore.user?.email }}</p>
                </div>

                <!-- Menu items -->
                <div class="py-1">
                  <button
                    @click="goToProfile"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                    style="color: var(--color-text-primary);"
                  >
                    <svg class="w-5 h-5" style="color: var(--color-text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mi Perfil
                  </button>

                  <button
                    @click="goToSettings"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                    style="color: var(--color-text-primary);"
                  >
                    <svg class="w-5 h-5" style="color: var(--color-text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Configuración
                  </button>
                </div>

                <!-- Logout -->
                <div class="border-t pt-1" style="border-color: var(--color-border);">
                  <button
                    @click="handleLogout"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-red-50"
                    style="color: var(--color-error);"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <!-- Welcome message -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold mb-2" style="color: var(--color-text-primary);">
          Bienvenido, {{ authStore.user?.firstName }}
        </h2>
        <p style="color: var(--color-text-secondary);">Selecciona la aplicación a la que deseas acceder</p>
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
        <p style="color: var(--color-error);">Error al cargar las aplicaciones</p>
        <button 
          @click="() => refetch()"
          class="btn-primary mt-4 px-6 py-2 rounded-lg"
        >
          Reintentar
        </button>
      </div>

      <!-- Applications grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          v-for="app in (applications ?? [])"
          :key="app.id"
          @click="navigateToApp(app)"
          class="card group text-left p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
        >
          <div class="flex items-start justify-between mb-4">
            <!-- Icon -->
            <div 
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              :style="{ backgroundColor: (app.color || 'var(--color-primary)') + '15' }"
            >
              <svg 
                class="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                :style="{ color: app.color || 'var(--color-primary)' }"
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
              style="color: var(--color-text-muted);"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <!-- Content -->
          <h3 class="font-semibold mb-1" style="color: var(--color-text-primary);">{{ app.name }}</h3>
          <p class="text-sm mb-4 line-clamp-2" style="color: var(--color-text-secondary);">
            {{ app.description }}
          </p>

          <!-- Stats -->
          <div class="flex items-center gap-4 text-sm">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" style="background-color: var(--color-success);"></span>
              <span style="color: var(--color-success);">{{ app.activeCount }}</span>
              <span style="color: var(--color-text-muted);">activos</span>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" style="background-color: var(--color-warning);"></span>
              <span style="color: var(--color-warning);">{{ app.pendingCount }}</span>
              <span style="color: var(--color-text-muted);">pendientes</span>
            </span>
          </div>
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="!isLoading && !error && (applications ?? []).length === 0" class="text-center py-12">
        <div 
          class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style="background-color: var(--color-primary-light);"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-primary);">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 class="text-lg font-medium mb-2" style="color: var(--color-text-primary);">
          No tienes aplicaciones asignadas
        </h3>
        <p style="color: var(--color-text-secondary);">
          Contacta al administrador para solicitar acceso.
        </p>
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-4 text-center border-t mt-auto" style="border-color: var(--color-border);">
      <p class="text-xs" style="color: var(--color-text-muted);">
        MARKAP S.A.C. © {{ new Date().getFullYear() }} - Sistema Integral de Gestión Empresarial
      </p>
    </footer>
  </div>
</template>
