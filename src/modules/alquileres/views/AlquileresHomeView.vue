<script setup lang="ts">
/**
 * AlquileresHomeView
 * Dashboard / Home de la aplicación Alquileres
 */

const stats = [
  { label: 'Propiedades Activas', value: '45', change: '+3', icon: 'building' },
  { label: 'Contratos Vigentes', value: '42', change: '+2', icon: 'file-text' },
  { label: 'Ingresos del Mes', value: 'S/ 125,400', change: '+12%', icon: 'dollar-sign' },
  { label: 'Cobranzas Pendientes', value: '8', change: '-2', icon: 'clock' },
]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold" style="color: var(--color-text-primary);">
        Homes Alquileres
      </h1>
      <p class="text-sm mt-1" style="color: var(--color-text-secondary);">
        Gestión de propiedades en alquiler
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="card p-4 flex items-center justify-between"
      >
        <div>
          <p class="text-sm" style="color: var(--color-text-secondary);">
            {{ stat.label }}
          </p>
          <p class="text-xl font-bold mt-1" style="color: var(--color-text-primary);">
            {{ stat.value }}
          </p>
          <p class="text-sm mt-1" style="color: var(--color-success);">
            {{ stat.change }}
          </p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card p-6">
        <h3 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary);">
          Actividad Reciente
        </h3>
        <p class="text-sm" style="color: var(--color-text-muted);">
          Últimos movimientos en el sistema
        </p>
      </div>

      <div class="card p-6">
        <h3 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary);">
          Acciones Rápidas
        </h3>
        <div class="flex flex-wrap gap-3">
          <router-link
            to="/alquileres/propiedades/nueva"
            class="px-4 py-2 rounded-lg btn-primary text-sm"
          >
            Nueva Propiedad
          </router-link>
          <router-link
            to="/alquileres/contratos"
            class="px-4 py-2 rounded-lg border-2 text-sm hover-surface"
            style="border-color: var(--color-border); color: var(--color-text-primary);"
          >
            Nuevo Contrato
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
