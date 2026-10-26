<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '../../ui/badge'
/**
 * Badge — `Badge` de TailAdmin (variante light, tamaño sm) con los colores
 * semánticos de Markap: primary | success | info | warning | error | neutral.
 */
type BadgeVariant = 'primary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

interface Props {
  variant?: BadgeVariant
  /** Texto del badge (alternativa al slot por defecto) */
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  label: undefined,
})

const colorMap = {
  primary: 'primary',
  success: 'success',
  info: 'info',
  warning: 'warning',
  error: 'error',
  neutral: 'light',
} as const

const color = computed(() => colorMap[props.variant] ?? 'light')
</script>

<template>
  <Badge size="sm" :color="color">
    <slot>{{ label }}</slot>
  </Badge>
</template>
