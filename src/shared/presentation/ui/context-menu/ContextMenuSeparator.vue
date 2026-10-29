<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { ContextMenuSeparator, useForwardProps } from 'reka-ui'
import type { ContextMenuSeparatorProps } from 'reka-ui'
import { cn } from '@shared/presentation/utils/cn'

const props = defineProps<ContextMenuSeparatorProps & { class?: HTMLAttributes['class'] }>()

const delegated = computed(() => {
  const { class: _class, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <ContextMenuSeparator
    data-slot="context-menu-separator"
    v-bind="forwarded"
    :class="cn(`-mx-3 my-1.5 h-px bg-gray-100 dark:bg-gray-700`, props.class)"
  />
</template>
