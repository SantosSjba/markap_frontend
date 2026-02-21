<script setup lang="ts">
import { computed } from 'vue'

/**
 * Avatar - Iniciales en círculo (reutilizable)
 */
interface Props {
  /** Texto para mostrar (ej. nombre completo); se usan las iniciales */
  name: string
  /** Tamaño: sm, md, lg */
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const initials = computed(() => {
  const parts = props.name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const first = parts[0]?.charAt(0) ?? ''
    const last = parts[parts.length - 1]?.charAt(0) ?? ''
    return (first + last).toUpperCase()
  }
  return props.name.slice(0, 2).toUpperCase() || '?'
})

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}
</script>

<template>
  <div
    class="rounded-full flex items-center justify-center font-medium flex-shrink-0"
    :class="sizeClasses[size]"
    :style="{ backgroundColor: 'var(--color-primary)', color: 'white' }"
  >
    {{ initials }}
  </div>
</template>
