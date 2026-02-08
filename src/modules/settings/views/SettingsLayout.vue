<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@modules/auth/stores'
import { ThemeToggle } from '@shared/components'

/**
 * SettingsLayout
 * Layout for settings pages with sidebar navigation
 * - All users: Mi Perfil
 * - Admin only: Usuarios, Roles
 */

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isUserMenuOpen = ref(false)

const allMenuItems = [
  {
    id: 'profile',
    label: 'Mi Perfil',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    to: '/settings/profile',
    adminOnly: false,
  },
  {
    id: 'users',
    label: 'Usuarios',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    to: '/settings/users',
    adminOnly: true,
  },
  {
    id: 'roles',
    label: 'Roles',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    to: '/settings/roles',
    adminOnly: true,
  },
]

const menuItems = computed(() =>
  allMenuItems.filter((item) => !item.adminOnly || authStore.isAdmin)
)

const pageTitle = computed(() => {
  const item = allMenuItems.find((i) => i.to === route.path)
  return item?.label ?? 'Configuración'
})

const isActive = (path: string) => route.path === path

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

const goToApplications = () => {
  closeUserMenu()
  router.push('/applications')
}

const goToProfile = () => {
  closeUserMenu()
  router.push('/settings/profile')
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
  <div class="min-h-screen flex flex-col" style="background-color: var(--color-background);">
    <!-- Header -->
    <header class="bg-surface border-b sticky top-0 z-40" style="border-color: var(--color-border);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo & Back -->
          <div class="flex items-center gap-4">
            <button
              @click="goToApplications"
              class="p-2 rounded-lg hover-surface"
              style="color: var(--color-text-secondary);"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div class="flex items-center gap-3">
              <img 
                src="/images/logo.jpg" 
                alt="MARKAP Homes" 
                class="h-10 w-auto object-contain"
              />
              <div class="hidden sm:block">
                <h1 class="font-semibold" style="color: var(--color-text-primary);">{{ pageTitle }}</h1>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <ThemeToggle />
            <!-- User menu (always visible with name and avatar) -->
            <div class="relative user-menu-container">
            <button
              @click="toggleUserMenu"
              class="flex items-center gap-3 p-2 rounded-lg hover-surface"
            >
              <div class="text-right hidden sm:block">
                <p class="text-sm font-medium" style="color: var(--color-text-primary);">{{ authStore.userFullName }}</p>
                <p class="text-xs" style="color: var(--color-text-muted);">{{ authStore.user?.email }}</p>
              </div>
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0"
                style="background-color: var(--color-primary);"
              >
                {{ authStore.userInitials }}
              </div>
              <svg 
                class="w-4 h-4 transition-transform flex-shrink-0"
                :class="{ 'rotate-180': isUserMenuOpen }"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style="color: var(--color-text-muted);"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              leave-active-class="transition-all duration-150 ease-in"
              enter-from-class="opacity-0 scale-95 -translate-y-1"
              leave-to-class="opacity-0 scale-95 -translate-y-1"
            >
              <div
                v-if="isUserMenuOpen"
                class="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-lg border py-2 z-50"
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
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover-surface mx-1 rounded-lg"
                    style="color: var(--color-text-primary);"
                  >
                    <svg class="w-5 h-5" style="color: var(--color-text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mi Perfil
                  </button>

                  <button
                    v-if="authStore.isAdmin"
                    @click="goToApplications"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover-surface mx-1 rounded-lg"
                    style="color: var(--color-text-primary);"
                  >
                    <svg class="w-5 h-5" style="color: var(--color-text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Ir a Aplicaciones
                  </button>
                </div>

                <!-- Logout -->
                <div class="border-t pt-1" style="border-color: var(--color-border);">
                  <button
                    @click="handleLogout"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover-danger mx-1 rounded-lg"
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
      </div>
    </header>

    <!-- Mobile Navigation (tabs) -->
    <div class="md:hidden border-b bg-surface" style="border-color: var(--color-border);">
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
    <div class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full">
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
                  : 'hover-surface',
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

    <!-- Footer -->
    <footer class="py-4 text-center border-t mt-auto" style="border-color: var(--color-border);">
      <p class="text-xs" style="color: var(--color-text-muted);">
        MARKAP S.A.C. © {{ new Date().getFullYear() }} - Sistema Integral de Gestión Empresarial
      </p>
    </footer>
  </div>
</template>
