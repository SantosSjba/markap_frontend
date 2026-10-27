<script setup lang="ts">
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
/**
 * DashboardAccionesRapidas
 * Barra de botones de acceso rápido (una sola fila) a las acciones más frecuentes de Ventas.
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
    id: 'nuevo-proceso',
    label: 'Nuevo Proceso',
    route: { name: 'ventas-procesos-nuevo' },
    icon: 'lucide:plus',
    primary: true,
  },
  { id: 'pipeline', label: 'Pipeline', route: { name: 'ventas-procesos-pipeline' }, icon: 'lucide:columns-3' },
  { id: 'procesos', label: 'Procesos', route: { name: 'ventas-procesos' }, icon: 'lucide:handshake' },
  { id: 'clientes', label: 'Clientes', route: { name: 'ventas-clientes' }, icon: 'lucide:users' },
  { id: 'propiedades', label: 'Propiedades', route: { name: 'ventas-propiedades' }, icon: 'lucide:building-2' },
  { id: 'comisiones', label: 'Comisiones', route: { name: 'ventas-comisiones' }, icon: 'lucide:wallet' },
  { id: 'reportes', label: 'Reportes', route: { name: 'ventas-reportes' }, icon: 'lucide:bar-chart-3' },
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
