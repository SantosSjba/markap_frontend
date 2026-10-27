<script setup lang="ts">
import { computed } from 'vue'
import { Avatar, AvatarFallback } from '../../ui/avatar'
/**
 * Avatar — `Avatar` de TailAdmin con iniciales (fondo de marca).
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

const sizeMap = { sm: 'sm', md: 'default', lg: 'lg' } as const

const initials = computed(() => {
  const name = props.name ?? ''
  // Solo palabras que empiezan con letra o número: «Sistemas (Ventas)» → «SV», no «S(»
  const parts = name
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+/u, ''))
    .filter(Boolean)
  if (parts.length >= 2) {
    const first = parts[0]?.charAt(0) ?? ''
    const last = parts[parts.length - 1]?.charAt(0) ?? ''
    return (first + last).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || '?'
})
</script>

<template>
  <Avatar :size="sizeMap[size]">
    <AvatarFallback class="bg-brand-50 font-medium text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
      {{ initials }}
    </AvatarFallback>
  </Avatar>
</template>
