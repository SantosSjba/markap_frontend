<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@features/auth/stores'
import { ThemeToggle } from '@shared/components'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isUserMenuOpen = ref(false)

const allMenuItems = [
  {
    id: 'profile',
    label: 'Mi Perfil',
    icon: 'lucide:user',
    to: '/settings/profile',
    adminOnly: false,
  },
  {
    id: 'users',
    label: 'Usuarios',
    icon: 'lucide:users',
    to: '/settings/users',
    adminOnly: true,
  },
  {
    id: 'roles',
    label: 'Roles',
    icon: 'lucide:shield-check',
    to: '/settings/roles',
    adminOnly: true,
  },
  {
    id: 'role-applications',
    label: 'Roles y aplicaciones',
    icon: 'lucide:layout-grid',
    to: '/settings/role-applications',
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

const toggleUserMenu = () => { isUserMenuOpen.value = !isUserMenuOpen.value }
const closeUserMenu = () => { isUserMenuOpen.value = false }
const goToApplications = () => { closeUserMenu(); router.push('/applications') }
const goToProfile = () => { closeUserMenu(); router.push('/settings/profile') }
const handleLogout = () => { closeUserMenu(); authStore.logout(); router.push('/auth/login') }

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu-container')) closeUserMenu()
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background-color: var(--color-background);">
    <!-- Header -->
    <header class="bg-surface border-b sticky top-0 z-40" style="border-color: var(--color-border);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo & Back -->
          <div class="flex items-center gap-4">
            <button @click="goToApplications" class="p-2 rounded-lg hover-surface" style="color: var(--color-text-secondary);">
              <Icon icon="lucide:arrow-left" class="w-5 h-5" />
            </button>
            <div class="flex items-center gap-3">
              <img src="/images/logo.jpg" alt="MARKAP Homes" class="h-10 w-auto object-contain" />
              <div class="hidden sm:block">
                <h1 class="font-semibold" style="color: var(--color-text-primary);">{{ pageTitle }}</h1>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <ThemeToggle />
            <div class="relative user-menu-container">
              <button @click="toggleUserMenu" class="flex items-center gap-3 p-2 rounded-lg hover-surface">
                <div class="text-right hidden sm:block">
                  <p class="text-sm font-medium" style="color: var(--color-text-primary);">{{ authStore.userFullName }}</p>
                  <p class="text-xs" style="color: var(--color-text-muted);">{{ authStore.user?.email }}</p>
                </div>
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0" style="background-color: var(--color-primary);">
                  {{ authStore.userInitials }}
                </div>
                <Icon
                  icon="lucide:chevron-down"
                  class="w-4 h-4 transition-transform flex-shrink-0"
                  :class="{ 'rotate-180': isUserMenuOpen }"
                  :style="{ color: 'var(--color-text-muted)' }"
                />
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
                  <div class="px-4 py-3 border-b" style="border-color: var(--color-border);">
                    <p class="text-sm font-medium" style="color: var(--color-text-primary);">{{ authStore.userFullName }}</p>
                    <p class="text-xs" style="color: var(--color-text-muted);">{{ authStore.user?.email }}</p>
                  </div>

                  <div class="py-1">
                    <button @click="goToProfile" class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover-surface mx-1 rounded-lg" style="color: var(--color-text-primary);">
                      <Icon icon="lucide:user" class="w-5 h-5" :style="{ color: 'var(--color-text-muted)' }" />
                      Mi Perfil
                    </button>
                    <button v-if="authStore.isAdmin" @click="goToApplications" class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover-surface mx-1 rounded-lg" style="color: var(--color-text-primary);">
                      <Icon icon="lucide:layout-grid" class="w-5 h-5" :style="{ color: 'var(--color-text-muted)' }" />
                      Ir a Aplicaciones
                    </button>
                  </div>

                  <div class="border-t pt-1" style="border-color: var(--color-border);">
                    <button @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover-danger mx-1 rounded-lg" style="color: var(--color-error);">
                      <Icon icon="lucide:log-out" class="w-5 h-5" />
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
            <Icon :icon="item.icon" class="w-4 h-4" />
            {{ item.label }}
          </router-link>
        </nav>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full">
      <div class="flex gap-8">
        <!-- Sidebar (desktop) -->
        <aside class="w-64 flex-shrink-0 hidden md:block">
          <nav class="card p-2 sticky top-24">
            <router-link
              v-for="item in menuItems"
              :key="item.id"
              :to="item.to"
              :class="[
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive(item.to) ? 'font-medium' : 'hover-surface',
              ]"
              :style="{
                backgroundColor: isActive(item.to) ? 'var(--color-primary-light)' : '',
                color: isActive(item.to) ? 'var(--color-primary-dark)' : 'var(--color-text-primary)',
              }"
            >
              <Icon
                :icon="item.icon"
                class="w-5 h-5"
                :style="{ color: isActive(item.to) ? 'var(--color-primary)' : 'var(--color-text-muted)' }"
              />
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
