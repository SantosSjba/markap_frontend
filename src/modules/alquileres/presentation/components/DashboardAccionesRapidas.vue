<script setup lang="ts">
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
/**
 * DashboardAccionesRapidas
 * Barra de botones de acceso rápido (una sola fila) a las acciones más frecuentes.
 */

interface Action {
  id: string
  label: string
  route: { name: string }
  icon: string // nombre de icono Iconify: "colección:nombre"
  primary?: boolean
}

const actions: Action[] = [
  {
    id: 'nuevo-contrato',
    label: 'Nuevo Contrato',
    route: { name: 'alquileres-contratos-nuevo' },
    icon: 'lucide:plus',
    primary: true,
  },
  { id: 'contratos', label: 'Contratos', route: { name: 'alquileres-contratos' }, icon: 'lucide:file-text' },
  { id: 'clientes', label: 'Clientes', route: { name: 'alquileres-clientes' }, icon: 'lucide:users' },
  {
    id: 'propiedades',
    label: 'Propiedades',
    route: { name: 'alquileres-propiedades' },
    icon: 'lucide:building-2',
  },
  { id: 'cobranzas', label: 'Cobranzas', route: { name: 'alquileres-cobranzas' }, icon: 'lucide:credit-card' },
  { id: 'reportes', label: 'Reportes', route: { name: 'alquileres-reportes' }, icon: 'lucide:bar-chart-3' },
]
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <BaseButton
      v-for="action in actions"
      :key="action.id"
      :to="action.route"
      :icon="action.icon"
      :variant="action.primary ? 'primary' : 'outline'"
      size="sm"
    >
      {{ action.label }}
    </BaseButton>
  </div>
</template>
