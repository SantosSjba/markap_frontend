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
</script>

<template>
  <div
    v-for="row in rows"
    :key="row"
    :class="['grid animate-pulse gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 dark:border-gray-800', gridClass]"
  >
    <div
      v-for="col in columns"
      :key="col"
      class="h-9 min-w-0 rounded-lg bg-gray-200 dark:bg-gray-800"
      :class="col === 1 ? 'max-w-[85%]' : ''"
    />
  </div>
</template>
