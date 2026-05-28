<script setup lang="ts">
import AppIcon from './AppIcon.vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** Nombre de icono (ej. lucide:users) */
    icon: string
    iconColor?: string
    /** Título más grande en listados con layout amplio */
    large?: boolean
  }>(),
  {
    iconColor: 'var(--color-primary)',
    large: false,
  },
)
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div class="flex items-start gap-3 min-w-0">
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        :style="{
          backgroundColor: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
        }"
      >
        <AppIcon :icon="icon" :size="20" :color="iconColor" />
      </div>
      <div class="min-w-0">
        <h1
          class="font-bold"
          :class="large ? 'text-xl sm:text-2xl' : 'text-xl'"
          :style="{ color: 'var(--color-text-primary)' }"
        >
          {{ title }}
        </h1>
        <p v-if="subtitle" class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          {{ subtitle }}
        </p>
      </div>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
