<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { ContextMenuItem, useForwardPropsEmits } from 'reka-ui'
import type { ContextMenuItemEmits, ContextMenuItemProps } from 'reka-ui'
import { cn } from '@shared/presentation/utils/cn'

const props = withDefaults(
  defineProps<ContextMenuItemProps & { class?: HTMLAttributes['class']; variant?: 'default' | 'destructive' }>(),
  { variant: 'default' },
)
const emits = defineEmits<ContextMenuItemEmits>()

const delegated = computed(() => {
  const { class: _class, variant: _variant, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
</script>

<template>
  <ContextMenuItem
    data-slot="context-menu-item"
    :data-variant="variant"
    v-bind="forwarded"
    :class="
      cn(
        `group/context-menu-item relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 outline-hidden transition-colors duration-200 select-none hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-gray-100 data-highlighted:text-gray-700 data-inset:ps-8 data-[variant=destructive]:text-error-500 data-[variant=destructive]:hover:bg-error-50 data-[variant=destructive]:hover:text-error-600 data-[variant=destructive]:focus:bg-error-50 data-[variant=destructive]:focus:text-error-600 data-[variant=destructive]:data-highlighted:bg-error-50 data-[variant=destructive]:data-highlighted:text-error-600 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-300 dark:focus:bg-white/5 dark:focus:text-gray-300 dark:data-highlighted:bg-white/5 dark:data-highlighted:text-gray-300 dark:data-[variant=destructive]:text-error-400 dark:data-[variant=destructive]:hover:bg-error-500/10 dark:data-[variant=destructive]:hover:text-error-400 dark:data-[variant=destructive]:focus:bg-error-500/10 dark:data-[variant=destructive]:focus:text-error-400 dark:data-[variant=destructive]:data-highlighted:bg-error-500/10 dark:data-[variant=destructive]:data-highlighted:text-error-400 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-gray-500 group-hover/context-menu-item:[&_svg]:text-gray-700 data-highlighted:[&_svg]:text-gray-700 dark:[&_svg]:text-gray-400 dark:group-hover/context-menu-item:[&_svg]:text-gray-300 dark:data-highlighted:[&_svg]:text-gray-300 [&_svg:not([class*='size-'])]:size-5 data-[variant=destructive]:*:[svg]:text-error-500 dark:data-[variant=destructive]:*:[svg]:text-error-400`,
        props.class,
      )
    "
  >
    <slot />
  </ContextMenuItem>
</template>
