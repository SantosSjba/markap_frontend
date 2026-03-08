<script setup lang="ts">
/**
 * BaseButton Component
 * Reusable button component with multiple variants and sizes
 */
import { Icon } from '@iconify/vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  block: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const variantClasses = {
  primary: 'bg-primary-500 text-white hover:bg-primary-700 focus:ring-primary-500',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 focus:ring-gray-500',
  outline: 'border-2 border-primary-500 text-primary-500 hover:bg-[var(--color-primary-light)] focus:ring-primary-500',
  ghost: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] focus:ring-gray-500',
  danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
      'transition-all duration-200 ease-in-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-60 disabled:cursor-not-allowed',
      variantClasses[variant],
      sizeClasses[size],
      { 'w-full': block },
    ]"
    @click="handleClick"
  >
    <!-- Cuando loading: spinner animado + texto "Cargando..." -->
    <template v-if="loading">
      <Icon icon="svg-spinners:ring-resize" class="w-5 h-5 shrink-0" />
      <span>Cargando...</span>
    </template>

    <!-- Estado normal: contenido del slot -->
    <slot v-else />
  </button>
</template>
