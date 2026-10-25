<script setup lang="ts">
/**
 * Badge - Etiqueta reutilizable (Propietario, Inquilino, Activo, etc.)
 */
type BadgeVariant = 'success' | 'info' | 'warning' | 'error' | 'neutral'

const variantStyles: Record<BadgeVariant, string> = {
  success: 'var(--color-success-bg, #dcfce7)',
  info: 'var(--color-info-bg, #dbeafe)',
  warning: 'var(--color-warning-bg, #fef3c7)',
  error: 'var(--color-error-bg, #fee2e2)',
  neutral: 'var(--color-surface-elevated)',
}

const variantText: Record<BadgeVariant, string> = {
  success: 'var(--color-success, #16a34a)',
  info: 'var(--color-info, #2563eb)',
  warning: 'var(--color-warning, #d97706)',
  error: 'var(--color-error)',
  neutral: 'var(--color-text-secondary)',
}

interface Props {
  variant?: BadgeVariant
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
})
</script>

<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    :style="{
      backgroundColor: variantStyles[props.variant],
      color: variantText[props.variant],
    }"
  >
    <slot />
  </span>
</template>
