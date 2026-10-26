<script setup lang="ts">
import ActionCard from '@shared/presentation/components/ui/ActionCard.vue'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { useAuthStore } from '@modules/auth/presentation/stores/auth.store'
/**
 * DashboardView
 * Main dashboard page
 */

const authStore = useAuthStore()

const stats = [
  { label: 'Usuarios', value: '1,234', change: '+12%', icon: 'users' },
  { label: 'Ventas', value: '$45,678', change: '+8%', icon: 'chart' },
  { label: 'Pedidos', value: '567', change: '+23%', icon: 'box' },
  { label: 'Productos', value: '89', change: '+5%', icon: 'package' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome message -->
    <PageHeader
      :title="`Bienvenido, ${authStore.user?.firstName || 'Usuario'}`"
      subtitle="Aquí tienes un resumen de tu actividad reciente."
    />

    <!-- Stats grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
      <StatsCard v-for="stat in stats" :key="stat.label" :title="stat.label" :value="stat.value">
        <template #icon>
          <AppIcon icon="lucide:users" />
        </template>
      </StatsCard>
    </div>

    <!-- Content sections -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent activity -->
      <BaseCard padding="lg">
        <template #header>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Actividad Reciente</h3>
        </template>

        <div class="space-y-4">
          <div v-for="i in 5" :key="i" class="flex items-center gap-4 border-b border-gray-100 py-2 last:border-0 dark:border-gray-800">
            <div class="flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <AppIcon icon="lucide:clipboard-list" :size="20" color="currentColor" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">Nueva actividad #{{ i }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Hace {{ i }} hora{{ i > 1 ? 's' : '' }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Quick actions -->
      <BaseCard padding="lg">
        <template #header>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Acciones Rápidas</h3>
        </template>

        <div class="grid grid-cols-2 gap-4">
          <ActionCard v-for="action in ['Nuevo Usuario', 'Nuevo Producto', 'Ver Reportes', 'Configuración']" :key="action" :title="action" description="Acceso rápido" />
        </div>
      </BaseCard>
    </div>
  </div>
</template>
