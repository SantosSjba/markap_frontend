<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@features/auth/stores'
import { usePropertyStats } from '@applications/alquileres/propiedades/composables/useProperties'
import { useClientStats } from '@applications/alquileres/clientes/composables/useClients'
import DashboardKpiCard from '@applications/alquileres/views/components/DashboardKpiCard.vue'
import VentasDashboardAccionesRapidas from './components/VentasDashboardAccionesRapidas.vue'
import AppIcon from '@shared/components/ui/AppIcon.vue'

const authStore = useAuthStore()
const propertyStatsQuery = usePropertyStats('ventas')
const clientStatsQuery = useClientStats('ventas')

const loading = computed(
  () => propertyStatsQuery.isPending.value || clientStatsQuery.isPending.value
)

const propiedadesEnVenta = computed(() => propertyStatsQuery.data.value?.available ?? 0)
const clientesActivos = computed(() => clientStatsQuery.data.value?.active ?? 0)

const greetingHour = new Date().getHours()
const greeting =
  greetingHour < 12 ? 'Buenos días' : greetingHour < 19 ? 'Buenas tardes' : 'Buenas noches'
const firstName = computed(() => authStore.user?.firstName ?? 'Usuario')

/** Actividad de ejemplo hasta existir API de timeline de ventas */
const actividadReciente = [
  {
    titulo: 'Venta cerrada',
    detalle: 'Casa en La Molina — S/ 850,000',
    tiempo: 'Hace 1 día',
    accent: 'var(--color-success)',
    bg: 'var(--color-success-light)',
  },
  {
    titulo: 'Negociación avanzada',
    detalle: 'Departamento Surco — S/ 420,000',
    tiempo: 'Hace 2 días',
    accent: 'var(--color-primary)',
    bg: 'var(--color-primary-light)',
  },
  {
    titulo: 'Nueva visita',
    detalle: 'Cliente interesado en San Isidro',
    tiempo: 'Hace 3 días',
    accent: '#6366f1',
    bg: 'rgba(99,102,241,0.12)',
  },
  {
    titulo: 'Propiedad publicada',
    detalle: 'Terreno en Cieneguilla',
    tiempo: 'Hace 4 días',
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
  },
]
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          {{ greeting }}, {{ firstName }} 👋
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Administración de propiedades en venta
        </p>
      </div>
      <p class="text-sm shrink-0" :style="{ color: 'var(--color-text-muted)' }">
        {{
          new Date().toLocaleDateString('es-PE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        }}
      </p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardKpiCard
        title="Propiedades en venta"
        :value="propiedadesEnVenta"
        :loading="loading"
        accent="primary"
      >
        <template #icon><AppIcon icon="lucide:home" :size="20" /></template>
      </DashboardKpiCard>

      <DashboardKpiCard
        title="Clientes activos"
        :value="clientesActivos"
        :loading="loading"
        accent="success"
      >
        <template #icon><AppIcon icon="lucide:users" :size="20" /></template>
      </DashboardKpiCard>

      <DashboardKpiCard
        title="Ventas del mes"
        value="—"
        subtitle="Módulo en desarrollo"
        :loading="false"
        accent="gold"
      >
        <template #icon><AppIcon icon="lucide:circle-dollar-sign" :size="20" /></template>
      </DashboardKpiCard>

      <DashboardKpiCard
        title="Negociaciones"
        value="—"
        subtitle="Módulo en desarrollo"
        :loading="false"
        accent="warning"
      >
        <template #icon><AppIcon icon="lucide:handshake" :size="20" /></template>
      </DashboardKpiCard>
    </div>

    <VentasDashboardAccionesRapidas />

    <div
      class="rounded-xl border p-5"
      :style="{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }"
    >
      <h3 class="text-sm font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">
        Actividad reciente
      </h3>
      <p class="text-xs mb-4" :style="{ color: 'var(--color-text-muted)' }">
        Vista previa; se conectará al historial real de ventas.
      </p>
      <ul class="space-y-3">
        <li
          v-for="(item, idx) in actividadReciente"
          :key="idx"
          class="flex gap-3 items-start rounded-lg p-3 border"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }"
        >
          <div
            class="w-2 h-2 rounded-full mt-1.5 shrink-0"
            :style="{ backgroundColor: item.accent }"
          />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">
              {{ item.titulo }}
            </p>
            <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              {{ item.detalle }}
            </p>
            <p class="text-xs mt-1" :style="{ color: 'var(--color-text-muted)' }">
              {{ item.tiempo }}
            </p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
