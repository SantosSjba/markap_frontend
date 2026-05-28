<script setup lang="ts">
import { AppIcon } from '@shared/components'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** Nombre de icono (ej. lucide:map-pin) */
    icon: string
    iconColor?: string
  }>(),
  {
    iconColor: 'var(--color-primary)',
  },
)
</script>

<template>
  <section
    class="p-5 rounded-xl"
    :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
  >
    <div class="flex items-center gap-2 mb-4">
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
    <slot />
  </section>
</template>
