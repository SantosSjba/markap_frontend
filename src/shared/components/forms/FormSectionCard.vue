<script setup lang="ts">
import { AppIcon } from '@shared/components'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** Nombre de icono (ej. lucide:map-pin) */
    icon: string
    iconColor?: string
    /** Menos padding (vistas de detalle) */
    dense?: boolean
  }>(),
  {
    iconColor: 'var(--color-primary)',
    dense: false,
  },
)
</script>

<template>
  <section
    class="rounded-xl"
    :class="dense ? 'p-4' : 'p-5'"
    :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
  >
    <div class="flex items-start justify-between gap-3 mb-4">
      <div class="flex items-center gap-2 min-w-0">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          :style="{
            backgroundColor: `color-mix(in srgb, ${props.iconColor} 12%, transparent)`,
          }"
        >
          <AppIcon :icon="icon" :size="17" :color="iconColor" />
        </div>
        <div class="min-w-0">
          <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
            {{ title }}
          </h2>
          <p v-if="subtitle" class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
            {{ subtitle }}
          </p>
        </div>
      </div>
      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </section>
</template>
