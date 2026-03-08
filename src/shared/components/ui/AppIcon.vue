<script setup lang="ts">
import { Icon } from '@iconify/vue'

/**
 * AppIcon — Wrapper sobre @iconify/vue
 *
 * Uso:
 *   <AppIcon icon="lucide:home" />
 *   <AppIcon icon="line-md:loading-loop" :size="24" color="var(--color-primary)" />
 *
 * Colecciones recomendadas:
 *   lucide:*          → Lucide (limpio, moderno, 1400+ iconos)
 *   tabler:*          → Tabler (2700+ iconos, muy completo)
 *   mdi:*             → Material Design Icons
 *   line-md:*         → Iconos con animación SVG nativa
 *   svg-spinners:*    → Spinners animados
 *   ph:*              → Phosphor Icons
 *
 * Busca iconos en: https://icon-sets.iconify.design/
 */
interface Props {
  icon: string
  size?: number | string
  color?: string
  rotate?: number
  flip?: 'horizontal' | 'vertical' | 'both'
  inline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: '1em',
  inline: false,
})
</script>

<template>
  <Icon
    :icon="icon"
    :width="size"
    :height="size"
    :color="color"
    :rotate="rotate"
    :flip="flip"
    :inline="inline"
  />
</template>
