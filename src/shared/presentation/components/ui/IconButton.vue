<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '../../ui/button'
import { LoaderCircleIcon } from '../../icons/layout'
import AppIcon from './AppIcon.vue'
/**
 * IconButton — botón de solo icono de TailAdmin (`Button` ghost/outline, tamaño icon).
 * `label` se usa como `aria-label` y `title`. El slot por defecto reemplaza al icono.
 */

interface Props {
  /** Icono Iconify (ej. lucide:pencil) */
  icon?: string
  /** Texto accesible y tooltip */
  label: string
  variant?: 'ghost' | 'outline' | 'primary' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Tiñe el icono de error (acciones destructivas en variante ghost) */
  danger?: boolean
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  icon: undefined,
  variant: 'ghost',
  size: 'sm',
  danger: false,
  type: 'button',
  disabled: false,
  loading: false,
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const variantMap = {
  ghost: 'ghost',
  outline: 'outline',
  primary: 'default',
  danger: 'destructive',
} as const

const sizeMap = { xs: 'icon-xs', sm: 'icon-sm', md: 'icon', lg: 'icon-lg' } as const

const toneClass = computed(() => {
  if (props.variant !== 'ghost') return undefined
  return props.danger
    ? 'text-error-500 hover:bg-error-50 hover:text-error-600 dark:text-error-400 dark:hover:bg-error-500/10'
    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
})

function onClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) emit('click', event)
}
</script>

<template>
  <Button
    :type="type"
    :variant="variantMap[variant]"
    :size="sizeMap[size]"
    :disabled="disabled || loading"
    :aria-label="label"
    :title="label"
    :class="toneClass"
    @click="onClick"
  >
    <LoaderCircleIcon v-if="loading" class="animate-spin" />
    <slot v-else>
      <AppIcon v-if="icon" :icon="icon" />
    </slot>
  </Button>
</template>
