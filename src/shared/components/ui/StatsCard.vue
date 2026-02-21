<script setup lang="ts">
/**
 * StatsCard - Tarjeta reutilizable para métricas (Total, Propietarios, etc.)
 */
interface Props {
  title: string
  value: string | number
}

defineProps<Props>()
</script>

<template>
  <div
    class="p-4 sm:p-5 rounded-xl border transition-colors"
    :style="{
      backgroundColor: 'var(--color-surface)',
      borderColor: 'var(--color-border)',
    }"
  >
    <div class="flex items-center gap-3">
      <div
        v-if="$slots.icon"
        class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        :style="{ backgroundColor: 'var(--color-surface-elevated)' }"
      >
        <slot name="icon" />
      </div>
      <div>
        <p class="text-2xl font-bold leading-tight" :style="{ color: 'var(--color-text-primary)' }">
          {{ value }}
        </p>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          {{ title }}
        </p>
      </div>
    </div>
  </div>
</template>
