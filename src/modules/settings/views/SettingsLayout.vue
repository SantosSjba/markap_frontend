<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@modules/auth/stores'

/**
 * SettingsLayout
 * Layout for settings pages with sidebar navigation
 */

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isUserMenuOpen = ref(false)

const menuItems = [
  {
    id: 'profile',
    label: 'Mi Perfil',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    to: '/settings/profile',
  },
  {
    id: 'users',
    label: 'Usuarios',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    to: '/settings/users',
  },
  {
    id: 'roles',
    label: 'Roles',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    to: '/settings/roles',
  },
]

const isActive = (path: string) => route.path === path

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

const goToApplications = () => {
  router.push('/applications')
}

const handleLogout = () => {
  closeUserMenu()
  authStore.logout()
  router.push('/auth/login')
}

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
  <div class="min-h-screen" style="background-color: var(--color-background);">
    <!-- Header -->
    <header class="bg-white border-b sticky top-0 z-40" style="border-color: var(--color-border);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo & Back -->
          <div class="flex items-center gap-4">
            <button
              @click="goToApplications"
              class="p-2 rounded-lg transition-colors hover:bg-gray-100"
              style="color: var(--color-text-secondary);"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div class="flex items-center gap-3">
              <div 
                class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
                style="background-color: var(--color-primary);"
              >
                M
              </div>
              <div>
                <h1 class="font-semibold" style="color: var(--color-text-primary);">Configuración</h1>
                <p class="text-xs" style="color: var(--color-text-muted);">MARKAP</p>
              </div>
            </div>
          </div>

          <!-- User menu -->
          <div class="relative user-menu-container">
            <button
              @click="toggleUserMenu"
              class="flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-gray-50"
            >
              <div 
                class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white"
                style="background-color: var(--color-primary);"
              >
                {{ authStore.userInitials }}
              </div>
            </button>

            <!-- Dropdown -->
            <Transition
              enter-active-class="transition-all duration-200"
              leave-active-class="transition-all duration-150"
              enter-from-class="opacity-0 scale-95"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-if="isUserMenuOpen"
                class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50"
                style="border-color: var(--color-border);"
              >
                <button
                  @click="handleLogout"
                  class="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-50"
                  style="color: var(--color-error);"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile Navigation (tabs) -->
    <div class="md:hidden border-b bg-white" style="border-color: var(--color-border);">
      <div class="max-w-7xl mx-auto px-4">
        <nav class="flex overflow-x-auto scrollbar-hide -mb-px">
          <router-link
            v-for="item in menuItems"
            :key="item.id"
            :to="item.to"
            :class="[
              'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              isActive(item.to) ? 'border-current' : 'border-transparent',
            ]"
            :style="{
              color: isActive(item.to) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }"
          >
            <svg 
              class="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="item.icon" />
            </svg>
            {{ item.label }}
          </router-link>
        </nav>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div class="flex gap-8">
        <!-- Sidebar (desktop only) -->
        <aside class="w-64 flex-shrink-0 hidden md:block">
          <nav class="card p-2 sticky top-24">
            <router-link
              v-for="item in menuItems"
              :key="item.id"
              :to="item.to"
              :class="[
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive(item.to)
                  ? 'font-medium'
                  : 'hover:bg-gray-50',
              ]"
              :style="{
                backgroundColor: isActive(item.to) ? 'var(--color-primary-light)' : '',
                color: isActive(item.to) ? 'var(--color-primary-dark)' : 'var(--color-text-primary)',
              }"
            >
              <svg 
                class="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                :style="{ color: isActive(item.to) ? 'var(--color-primary)' : 'var(--color-text-muted)' }"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="item.icon" />
              </svg>
              {{ item.label }}
            </router-link>
          </nav>
        </aside>

        <!-- Main content -->
        <main class="flex-1 min-w-0">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>
