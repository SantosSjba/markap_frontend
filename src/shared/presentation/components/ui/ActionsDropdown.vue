<script lang="ts">
export interface ActionItem {
  label: string
  onClick: () => void
  /** Nombre de ícono Iconify, e.g. "lucide:pencil" */
  icon?: string
  /** Variante de color para acciones destructivas */
  danger?: boolean
  /** Línea divisoria antes del ítem (para separar bloques de acciones) */
  separator?: boolean
}
</script>

<script setup lang="ts">
import { Button } from '../../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import { HorizontalDotsIcon } from '../../icons/layout'
import AppIcon from './AppIcon.vue'
/**
 * ActionsDropdown — menú de acciones de fila con el `DropdownMenu` de TailAdmin.
 * El disparador detiene el clic para no activar la fila que lo contiene.
 */

interface Props {
  items: ActionItem[]
}

defineProps<Props>()
</script>

<template>
  <DropdownMenu v-if="items.length">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon-sm"
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
        aria-label="Acciones"
        @click.stop
      >
        <slot name="trigger">
          <HorizontalDotsIcon />
        </slot>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="min-w-44 p-2">
      <template v-for="(item, idx) in items" :key="idx">
        <DropdownMenuSeparator v-if="item.separator && idx > 0" />
        <DropdownMenuItem :variant="item.danger ? 'destructive' : 'default'" @select="item.onClick()">
          <AppIcon v-if="item.icon" :icon="item.icon" class="size-4!" />
          <span>{{ item.label }}</span>
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
