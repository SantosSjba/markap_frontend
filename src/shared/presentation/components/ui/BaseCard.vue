<script setup lang="ts">
import { computed } from 'vue'
import { Card } from '../../ui/card'
/**
 * BaseCard — `Card` de TailAdmin. `padding` ajusta el relleno;
 * `shadow`, `rounded` y `border` se conservan por compatibilidad (la plantilla usa borde fijo, sin sombra).
 */

interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  border?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
  shadow: 'sm',
  rounded: 'lg',
  border: true,
})

const paddingClasses = {
  none: 'p-0 sm:p-0',
  sm: 'p-4 sm:p-4',
  md: '',
  lg: 'p-6 sm:p-8',
}

const classes = computed(() => paddingClasses[props.padding])
</script>

<template>
  <Card :class="classes" class="gap-0 rounded-2xl">
    <div v-if="$slots.header" class="mb-5 border-b border-gray-100 pb-5 dark:border-gray-800">
      <slot name="header" />
    </div>

    <slot />

    <div v-if="$slots.footer" class="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
      <slot name="footer" />
    </div>
  </Card>
</template>
