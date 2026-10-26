<script setup lang="ts">
/**
 * StatsCard — `MetricCard` de TailAdmin (dashboard ecommerce): icono arriba,
 * etiqueta y valor abajo. El icono toma el color neutro de la plantilla.
 * `compact`: icono a la izquierda y texto al mismo nivel (ahorra altura en dashboards).
 */
interface Props {
  title: string
  value: string | number
  /** Texto pequeño bajo el valor (ej. «mes actual»); en `compact` va junto al valor */
  subtitle?: string
  /** Muestra un esqueleto en lugar del valor */
  loading?: boolean
  /** Variante horizontal de baja altura */
  compact?: boolean
}

withDefaults(defineProps<Props>(), { subtitle: undefined, loading: false, compact: false })
</script>

<template>
  <div
    v-if="compact"
    class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/3"
  >
    <div
      v-if="$slots.icon"
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90 [&_svg]:size-5! [&_svg]:text-current!"
    >
      <slot name="icon" />
    </div>

    <div class="min-w-0 flex-1">
      <span class="block truncate text-theme-xs text-gray-500 dark:text-gray-400">
        {{ title }}
      </span>
      <div v-if="loading" class="mt-1 h-5 w-14 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      <div v-else class="flex items-baseline gap-1.5">
        <span class="text-lg leading-6 font-bold text-gray-800 dark:text-white/90">
          {{ value }}
        </span>
        <span v-if="subtitle" class="truncate text-theme-xs text-gray-400 dark:text-gray-500">
          {{ subtitle }}
        </span>
      </div>
    </div>

    <slot />
  </div>

  <div
    v-else
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
