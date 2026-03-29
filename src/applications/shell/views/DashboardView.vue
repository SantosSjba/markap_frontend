<script setup lang="ts">
import { BaseCard } from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { useAuthStore } from '@features/auth/stores'

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
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Bienvenido, {{ authStore.user?.firstName || 'Usuario' }}
      </h1>
      <p class="text-gray-600 mt-1">
        Aquí tienes un resumen de tu actividad reciente.
      </p>
    </div>

    <!-- Stats grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <BaseCard
        v-for="stat in stats"
        :key="stat.label"
        padding="lg"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stat.value }}</p>
            <p class="text-sm text-green-500 mt-1">{{ stat.change }}</p>
          </div>
          <div class="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-500">
            <AppIcon icon="lucide:users" :size="24" color="currentColor" />
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Content sections -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent activity -->
      <BaseCard padding="lg">
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
        </template>

        <div class="space-y-4">
          <div v-for="i in 5" :key="i" class="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
            <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
              <AppIcon icon="lucide:clipboard-list" :size="20" color="currentColor" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">Nueva actividad #{{ i }}</p>
              <p class="text-xs text-gray-500">Hace {{ i }} hora{{ i > 1 ? 's' : '' }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Quick actions -->
      <BaseCard padding="lg">
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
        </template>

        <div class="grid grid-cols-2 gap-4">
          <button
            v-for="action in ['Nuevo Usuario', 'Nuevo Producto', 'Ver Reportes', 'Configuración']"
            :key="action"
            class="p-4 border border-[var(--color-border)] rounded-lg hover-surface text-left"
          >
            <p class="font-medium text-gray-900">{{ action }}</p>
            <p class="text-sm text-gray-500 mt-1">Acceso rápido</p>
          </button>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
