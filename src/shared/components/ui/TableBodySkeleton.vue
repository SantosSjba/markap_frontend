<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number
    columns?: number
    selectable?: boolean
  }>(),
  {
    rows: 8,
    columns: 5,
    selectable: false,
  },
)

const barStyle = {
  backgroundColor: 'color-mix(in srgb, var(--color-text-muted) 14%, transparent)',
}
</script>

<template>
  <tbody>
    <tr
      v-for="row in rows"
      :key="row"
      class="animate-pulse"
      :style="{ borderBottom: '1px solid var(--color-border)' }"
    >
      <td v-if="selectable" class="w-11 py-3 pl-4 pr-2">
        <div class="h-4 w-4 rounded" :style="barStyle" />
      </td>
      <td v-for="col in columns" :key="col" class="py-3 px-4">
        <div
          class="h-4 rounded-md"
          :class="col === 1 ? 'max-w-[70%]' : 'max-w-[90%]'"
          :style="barStyle"
        />
      </td>
    </tr>
  </tbody>
</template>
