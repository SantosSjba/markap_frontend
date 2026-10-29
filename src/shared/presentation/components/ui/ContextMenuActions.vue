<script setup lang="ts">
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../ui/context-menu'
import type { ActionItem } from './ActionsDropdown.vue'
import AppIcon from './AppIcon.vue'
/**
 * ContextMenuActions — menú de clic derecho con la misma lista de acciones que `ActionsDropdown`.
 * El slot es el área que lo abre (se renderiza tal cual, `as-child`); `disabled` deja el menú
 * nativo del navegador. Los ítems pueden fijarse en el mismo clic (p. ej. según la fila).
 */

defineProps<{ items: ActionItem[]; disabled?: boolean }>()
const emit = defineEmits<{ 'update:open': [open: boolean] }>()
</script>

<template>
  <ContextMenu @update:open="emit('update:open', $event)">
    <ContextMenuTrigger as-child :disabled="disabled">
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent class="min-w-56 p-2">
      <template v-for="(item, idx) in items" :key="idx">
        <ContextMenuSeparator v-if="item.separator && idx > 0" />
        <ContextMenuItem :variant="item.danger ? 'destructive' : 'default'" @select="item.onClick()">
          <AppIcon v-if="item.icon" :icon="item.icon" class="size-4!" />
          <span>{{ item.label }}</span>
        </ContextMenuItem>
      </template>
    </ContextMenuContent>
  </ContextMenu>
</template>
