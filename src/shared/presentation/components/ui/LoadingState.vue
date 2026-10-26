<script setup lang="ts">
import { useAttrs } from 'vue'
import { LoaderCircleIcon } from '../../icons/layout'
import { cn } from '../../utils/cn'
/**
 * LoadingState — indicador de carga de TailAdmin (spinner de marca + texto opcional).
 * `block`: centrado con espacio vertical (secciones/páginas). `inline`: fila compacta.
 */

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    text?: string
    variant?: 'block' | 'inline'
  }>(),
  { text: undefined, variant: 'block' },
)

const attrs = useAttrs()
</script>

<template>
  <div
    v-if="variant === 'inline'"
    role="status"
    v-bind="{ ...attrs, class: undefined }"
    :class="cn('flex items-center gap-2 py-2 text-sm text-gray-500 dark:text-gray-400', attrs.class as string)"
  >
    <LoaderCircleIcon class="size-4 shrink-0 animate-spin text-brand-500" />
    <span v-if="text">{{ text }}</span>
  </div>
  <div
    v-else
    role="status"
    v-bind="{ ...attrs, class: undefined }"
    :class="cn('flex flex-col items-center justify-center gap-3 py-16', attrs.class as string)"
  >
    <LoaderCircleIcon class="size-8 animate-spin text-brand-500" />
    <p v-if="text" class="text-sm text-gray-500 dark:text-gray-400">{{ text }}</p>
    <span v-else class="sr-only">Cargando…</span>
  </div>
</template>
