<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

interface Action {
  id: string
  label: string
  description: string
  route: { name: string }
  accent: string
  accentLight: string
  icon: string
}

const router = useRouter()

const actions: Action[] = [
  {
    id: 'nueva-propiedad',
    label: 'Nueva Propiedad',
    description: 'Agregar inmueble',
    route: { name: 'ventas-propiedades-nueva' },
    accent: 'var(--color-primary)',
    accentLight: 'var(--color-primary-light)',
    icon: 'lucide:building-2',
  },
  {
    id: 'nuevo-cliente',
    label: 'Nuevo Cliente',
    description: 'Registrar cliente',
    route: { name: 'ventas-clientes-nuevo' },
    accent: '#10b981',
    accentLight: 'rgba(16,185,129,0.12)',
    icon: 'lucide:user-plus',
  },
  {
    id: 'negociaciones',
    label: 'Pipeline',
    description: 'Estado de ventas',
    route: { name: 'ventas-negociaciones' },
    accent: '#6366f1',
    accentLight: 'rgba(99,102,241,0.12)',
    icon: 'lucide:git-branch',
  },
  {
    id: 'propiedades',
    label: 'Propiedades',
    description: 'Listado de inmuebles',
    route: { name: 'ventas-propiedades' },
    accent: '#f59e0b',
    accentLight: 'rgba(245,158,11,0.12)',
    icon: 'lucide:layout-grid',
  },
  {
    id: 'reportes',
    label: 'Reportes',
    description: 'Métricas de ventas',
    route: { name: 'ventas-reportes' },
    accent: '#f97316',
    accentLight: 'rgba(249,115,22,0.12)',
    icon: 'lucide:bar-chart-3',
  },
  {
    id: 'comisiones',
    label: 'Comisiones',
    description: 'Seguimiento',
    route: { name: 'ventas-comisiones' },
    accent: '#0ea5e9',
    accentLight: 'rgba(14,165,233,0.12)',
    icon: 'lucide:percent',
  },
]

function navigate(action: Action) {
  router.push(action.route)
}
</script>

<template>
  <div>
    <h3 class="text-sm font-semibold mb-3" :style="{ color: 'var(--color-text-primary)' }">
      Acciones Rápidas
    </h3>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <button
        v-for="action in actions"
        :key="action.id"
        type="button"
        class="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-150 hover-surface-strong text-center group"
        :style="{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }"
        @click="navigate(action)"
      >
        <div
          class="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-150 group-hover:scale-110"
          :style="{ backgroundColor: action.accentLight }"
        >
          <Icon
            :icon="action.icon"
            :width="20"
            :height="20"
            :style="{ color: action.accent }"
          />
        </div>
        <div>
          <p class="text-xs font-semibold leading-tight" :style="{ color: 'var(--color-text-primary)' }">
            {{ action.label }}
          </p>
          <p class="text-xs leading-tight mt-0.5 hidden sm:block" :style="{ color: 'var(--color-text-muted)' }">
            {{ action.description }}
          </p>
        </div>
      </button>
    </div>
  </div>
</template>
