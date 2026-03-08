<script setup lang="ts">
/**
 * DashboardAccionesRapidas
 * Grid de botones de acceso rápido a las acciones más frecuentes.
 */
import { useRouter } from 'vue-router'

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
    id: 'nuevo-contrato',
    label: 'Nuevo Contrato',
    description: 'Registrar un alquiler',
    route: { name: 'alquileres-contratos-nuevo' },
    accent: 'var(--color-primary)',
    accentLight: 'var(--color-primary-light)',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
      d="M12 4v16m8-8H4" />`,
  },
  {
    id: 'contratos',
    label: 'Contratos',
    description: 'Ver todos los contratos',
    route: { name: 'alquileres-contratos' },
    accent: 'var(--color-info, #3B82F6)',
    accentLight: 'var(--color-info-light, #EFF6FF)',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />`,
  },
  {
    id: 'clientes',
    label: 'Clientes',
    description: 'Gestionar clientes',
    route: { name: 'alquileres-clientes' },
    accent: 'var(--color-success)',
    accentLight: 'var(--color-success-light)',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />`,
  },
  {
    id: 'propiedades',
    label: 'Propiedades',
    description: 'Ver propiedades',
    route: { name: 'alquileres-propiedades' },
    accent: 'var(--color-accent-gold)',
    accentLight: 'var(--color-accent-gold-light)',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />`,
  },
  {
    id: 'reportes',
    label: 'Reportes',
    description: 'Análisis y métricas',
    route: { name: 'alquileres-reportes' },
    accent: 'var(--color-warning)',
    accentLight: 'var(--color-warning-light)',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />`,
  },
  {
    id: 'agentes',
    label: 'Agentes',
    description: 'Gestionar agentes',
    route: { name: 'alquileres-agentes' },
    accent: 'var(--color-error)',
    accentLight: 'var(--color-error-light)',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />`,
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
          <svg
            class="w-5 h-5"
            :style="{ color: action.accent }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            v-html="action.icon"
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
