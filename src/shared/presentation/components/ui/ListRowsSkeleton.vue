<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number
    columns?: number
    /** Tailwind grid classes, e.g. `grid-cols-[2fr_2fr_1fr_auto]` */
    gridClass?: string
  }>(),
  {
    rows: 8,
    columns: 5,
    gridClass: 'grid-cols-1 sm:grid-cols-5',
  },
)

const barStyle = {
  backgroundColor: 'color-mix(in srgb, var(--color-text-muted) 14%, transparent)',
}
</script>

<template>
  <div
    v-for="row in rows"
    :key="row"
    :class="['grid gap-4 px-5 py-4 border-b animate-pulse', gridClass]"
    :style="{ borderColor: 'var(--color-border)' }"
  >
    <div
      v-for="col in columns"
      :key="col"
      class="h-9 rounded-md min-w-0"
      :class="col === 1 ? 'max-w-[85%]' : ''"
      :style="barStyle"
    />
  </div>
</template>
