<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@features/auth/stores'
import { ThemeToggle } from '@shared/components'
import { useMyApplications } from '../composables'
import type { Application } from '../types'

const router = useRouter()
const authStore = useAuthStore()

const { data: applications, isLoading, error, refetch } = useMyApplications()

const isUserMenuOpen = ref(false)

// Labels descriptivos por slug de aplicación
const statsLabels: Record<string, { active: string; pending: string }> = {
  alquileres: { active: 'contratos activos', pending: 'pagos pendientes' },
}
const DEFAULT_LABELS = { active: 'activos', pending: 'pendientes' }

const getStatsLabels = (slug: string) => statsLabels[slug] ?? DEFAULT_LABELS

// Mapeo de icon name del backend → iconify icon id
const iconMap: Record<string, string> = {
  key: 'lucide:key-round',
  home: 'lucide:home',
  palette: 'lucide:palette',
  building: 'lucide:building-2',
  package: 'lucide:package',
  calculator: 'lucide:calculator',
  alquileres: 'lucide:house',
  factura: 'lucide:file-text',
  ventas: 'lucide:shopping-cart',
  inventario: 'lucide:boxes',
}
const DEFAULT_ICON = 'lucide:layout-grid'

const getIcon = (iconName: string | null): string =>
  iconName ? (iconMap[iconName] ?? DEFAULT_ICON) : DEFAULT_ICON

const navigateToApp = (app: Application) => {
  if (app.url) router.push(app.url)
}

const toggleUserMenu = () => { isUserMenuOpen.value = !isUserMenuOpen.value }
const closeUserMenu = () => { isUserMenuOpen.value = false }
const goToProfile = () => { closeUserMenu(); router.push('/settings/profile') }
const goToSettings = () => { closeUserMenu(); router.push('/settings') }
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
    <header class="bg-surface border-b" style="border-color: var(--color-border);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <img src="/images/logo.jpg" alt="MARKAP Homes" class="h-12 w-auto object-contain" />
          </div>

          <div class="flex items-center gap-2">
            <ThemeToggle />
            <!-- User menu -->
            <div class="relative user-menu-container">
              <button @click="toggleUserMenu" class="flex items-center gap-3 p-2 rounded-lg hover-surface">
                <div class="text-right hidden sm:block">
                  <p class="text-sm font-medium" style="color: var(--color-text-primary);">{{ authStore.userFullName }}</p>
                  <p class="text-xs" style="color: var(--color-text-muted);">{{ authStore.user?.email }}</p>
                </div>
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white" style="background-color: var(--color-primary);">
                  {{ authStore.userInitials }}
                </div>
                <Icon
                  icon="lucide:chevron-down"
                  class="w-4 h-4 transition-transform"
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
                    <button @click="goToProfile" class="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover-surface mx-1 rounded-lg" style="color: var(--color-text-primary);">
                      <Icon icon="lucide:user" class="w-5 h-5" :style="{ color: 'var(--color-text-muted)' }" />
                      Mi Perfil
                    </button>
                    <button @click="goToSettings" class="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover-surface mx-1 rounded-lg" style="color: var(--color-text-primary);">
                      <Icon icon="lucide:settings" class="w-5 h-5" :style="{ color: 'var(--color-text-muted)' }" />
                      Configuración
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

    <!-- Main content -->
    <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold mb-2" style="color: var(--color-text-primary);">
          Bienvenido, {{ authStore.user?.firstName }}
        </h2>
        <p style="color: var(--color-text-secondary);">Selecciona la aplicación a la que deseas acceder</p>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <Icon icon="svg-spinners:ring-resize" class="w-10 h-10" :style="{ color: 'var(--color-primary)' }" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-12">
        <p style="color: var(--color-error);">Error al cargar las aplicaciones</p>
        <button @click="() => refetch()" class="btn-primary mt-4 px-6 py-2 rounded-lg">Reintentar</button>
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
              :style="{ backgroundColor: (app.color || 'var(--color-primary)') + '20' }"
            >
              <Icon
                :icon="getIcon(app.icon)"
                class="w-6 h-6"
                :style="{ color: app.color || 'var(--color-primary)' }"
              />
            </div>

            <!-- Arrow -->
            <Icon
              icon="lucide:chevron-right"
              class="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
              :style="{ color: 'var(--color-text-muted)' }"
            />
          </div>

          <!-- Content -->
          <h3 class="font-semibold mb-1" style="color: var(--color-text-primary);">{{ app.name }}</h3>
          <p class="text-sm mb-4 line-clamp-2" style="color: var(--color-text-secondary);">{{ app.description }}</p>

          <!-- Stats -->
          <div class="flex items-center gap-4 text-sm">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" style="background-color: var(--color-success);"></span>
              <span style="color: var(--color-success);">{{ app.activeCount }}</span>
              <span style="color: var(--color-text-muted);">{{ getStatsLabels(app.slug).active }}</span>
            </span>
            <span v-if="app.pendingCount > 0" class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" style="background-color: var(--color-warning);"></span>
              <span style="color: var(--color-warning);">{{ app.pendingCount }}</span>
              <span style="color: var(--color-text-muted);">{{ getStatsLabels(app.slug).pending }}</span>
            </span>
          </div>
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="!isLoading && !error && (applications ?? []).length === 0" class="text-center py-12">
        <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background-color: var(--color-primary-light);">
          <Icon icon="lucide:layout-grid" class="w-8 h-8" :style="{ color: 'var(--color-primary)' }" />
        </div>
        <h3 class="text-lg font-medium mb-2" style="color: var(--color-text-primary);">No tienes aplicaciones asignadas</h3>
        <p style="color: var(--color-text-secondary);">Contacta al administrador para solicitar acceso.</p>
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
