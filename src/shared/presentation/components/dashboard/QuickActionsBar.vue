<script setup lang="ts">
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import type { QuickAction } from './quick-actions.types'
/**
 * QuickActionsBar
 * Barra de botones de acceso rápido (una sola fila) a las acciones más frecuentes de cada módulo.
 * Cada dashboard pasa su lista; la acción `primary` va resaltada.
 */

defineProps<{ actions: readonly QuickAction[] }>()
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
