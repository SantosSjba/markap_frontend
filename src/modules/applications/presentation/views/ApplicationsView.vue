<script setup lang="ts">
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@modules/auth/presentation/stores/auth.store'
import ThemeToggle from '@shared/presentation/components/ui/ThemeToggle.vue'
import UserDropdown from '@app/layouts/components/header/UserDropdown.vue'
import { useMyApplications } from '../composables/useApplications'
import type { Application } from '../../domain/application.types'
const router = useRouter()
const authStore = useAuthStore()

const { data: applications, isLoading, error, refetch } = useMyApplications()


// Labels descriptivos por slug de aplicación
const statsLabels: Record<string, { active: string; pending: string }> = {
  alquileres: { active: 'contratos activos', pending: 'pagos pendientes' },
  ventas: { active: 'procesos activos', pending: 'pagos pendientes' },
  interiorismo: { active: 'proyectos activos', pending: 'proyectos en cotización' },
  arquitectura: { active: 'proyectos activos', pending: 'proyectos en cotización' },
  produccion: { active: 'órdenes en planta', pending: 'OC pendientes' },
  contabilidad: { active: 'asientos del mes', pending: 'comprobantes sin emitir' },
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

</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="sticky top-0 z-99 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <img src="/images/logo_bg_removed.png" alt="MARKAP Homes" class="h-12 w-auto object-contain" />
          </div>

          <div class="flex items-center gap-3">
            <ThemeToggle />
            <UserDropdown profile-to="/settings/profile" />
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div class="text-center mb-8">
        <h2 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white/90">
          Bienvenido, {{ authStore.user?.firstName }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400">Selecciona la aplicación a la que deseas acceder</p>
      </div>

      <!-- Loading -->
      <LoadingState v-if="isLoading" class="py-12" />

      <!-- Error -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-error-500 dark:text-error-400">Error al cargar las aplicaciones</p>
        <BaseButton @click="() => refetch()" size="sm" class="mt-4">Reintentar</BaseButton>
      </div>

      <!-- Applications grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          v-for="app in (applications ?? [])"
          :key="app.id"
          @click="navigateToApp(app)"
          class="card group p-5 text-start transition-all duration-200 hover:border-brand-300 hover:shadow-theme-md md:p-6 dark:hover:border-brand-800"
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
              class="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-gray-500"
            />
          </div>

          <!-- Content -->
          <h3 class="font-semibold mb-1 text-gray-800 dark:text-white/90">{{ app.name }}</h3>
          <p class="text-sm mb-4 line-clamp-2 text-gray-500 dark:text-gray-400">{{ app.description }}</p>

          <!-- Stats -->
          <div class="flex items-center gap-4 text-sm">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-success-500"></span>
              <span class="text-success-600 dark:text-success-500">{{ app.activeCount }}</span>
              <span class="text-gray-400 dark:text-gray-500">{{ getStatsLabels(app.slug).active }}</span>
            </span>
            <span v-if="app.pendingCount > 0" class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-warning-500"></span>
              <span class="text-warning-600 dark:text-orange-400">{{ app.pendingCount }}</span>
              <span class="text-gray-400 dark:text-gray-500">{{ getStatsLabels(app.slug).pending }}</span>
            </span>
          </div>
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="!isLoading && !error && (applications ?? []).length === 0" class="text-center py-12">
        <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-brand-50 dark:bg-brand-500/12">
          <Icon icon="lucide:layout-grid" class="w-8 h-8 text-brand-500 dark:text-brand-400" />
        </div>
        <h3 class="text-lg font-medium mb-2 text-gray-800 dark:text-white/90">No tienes aplicaciones asignadas</h3>
        <p class="text-gray-500 dark:text-gray-400">Contacta al administrador para solicitar acceso.</p>
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-4 text-center border-t mt-auto border-gray-200 dark:border-gray-800">
      <p class="text-xs text-gray-400 dark:text-gray-500">
        MARKAP S.A.C. © {{ new Date().getFullYear() }} - Sistema Integral de Gestión Empresarial
      </p>
    </footer>
  </div>
</template>
