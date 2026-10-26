<script setup lang="ts">
/**
 * StatsCard — `MetricCard` de TailAdmin (dashboard ecommerce): icono arriba,
 * etiqueta y valor abajo. El icono toma el color neutro de la plantilla.
 */
interface Props {
  title: string
  value: string | number
  /** Texto pequeño bajo el valor (ej. «mes actual») */
  subtitle?: string
  /** Muestra un esqueleto en lugar del valor */
  loading?: boolean
}

withDefaults(defineProps<Props>(), { subtitle: undefined, loading: false })
</script>

<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/3"
  >
    <div
      v-if="$slots.icon"
      class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90 [&_svg]:size-6! [&_svg]:text-current!"
    >
      <slot name="icon" />
    </div>

    <div :class="$slots.icon ? 'mt-5' : undefined">
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ title }}
      </span>
      <div v-if="loading" class="mt-2 h-7 w-20 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
      <h4 v-else class="mt-2 text-lg font-bold text-gray-800 dark:text-white/90">
        {{ value }}
      </h4>
      <p v-if="subtitle" class="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
        {{ subtitle }}
      </p>
    </div>

    <slot />
  </div>
</template>
