<script setup lang="ts">
/**
 * DashboardAccionesRapidas
 * Grid de botones de acceso rápido a las acciones más frecuentes.
 * Usa @iconify/vue para iconos vectoriales de alta calidad.
 */
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

interface Action {
  id: string
  label: string
  description: string
  route: { name: string }
  accent: string
  accentLight: string
  icon: string  // nombre de icono Iconify: "colección:nombre"
}

const router = useRouter()

const actions: Action[] = [
  {
    id: 'nuevo-contrato',
    label: 'Nuevo Contrato',
    description: 'Registrar un alquiler',
    route: { name: 'alquileres-contratos-nuevo' },
    accent: 'var(--color-primary)',
    accentLight: 'var(--color-primary-light)',
    icon: 'lucide:plus-circle',
  },
  {
    id: 'contratos',
    label: 'Contratos',
    description: 'Ver todos los contratos',
    route: { name: 'alquileres-contratos' },
    accent: '#3B82F6',
    accentLight: 'rgba(59,130,246,0.12)',
    icon: 'lucide:file-text',
  },
  {
    id: 'clientes',
    label: 'Clientes',
    description: 'Gestionar clientes',
    route: { name: 'alquileres-clientes' },
    accent: '#10b981',
    accentLight: 'rgba(16,185,129,0.12)',
    icon: 'lucide:users',
  },
  {
    id: 'propiedades',
    label: 'Propiedades',
    description: 'Ver propiedades',
    route: { name: 'alquileres-propiedades' },
    accent: '#f59e0b',
    accentLight: 'rgba(245,158,11,0.12)',
    icon: 'lucide:building-2',
  },
  {
    id: 'cobranzas',
    label: 'Cobranzas',
    description: 'Pagos de alquiler',
    route: { name: 'alquileres-cobranzas' },
    accent: '#6366f1',
    accentLight: 'rgba(99,102,241,0.12)',
    icon: 'lucide:credit-card',
  },
  {
    id: 'reportes',
    label: 'Reportes',
    description: 'Análisis y métricas',
    route: { name: 'alquileres-reportes' },
    accent: '#f97316',
    accentLight: 'rgba(249,115,22,0.12)',
    icon: 'lucide:bar-chart-3',
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
