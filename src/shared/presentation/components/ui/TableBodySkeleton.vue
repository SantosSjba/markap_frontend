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
</script>

<template>
  <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
    <tr v-for="row in rows" :key="row" class="animate-pulse">
      <td v-if="selectable" class="w-11 py-4 ps-5 pe-2 sm:ps-6">
        <div class="size-4 rounded-md bg-gray-200 dark:bg-gray-800" />
      </td>
      <td v-for="col in columns" :key="col" class="px-4 py-4 first:ps-5 last:pe-5 sm:first:ps-6 sm:last:pe-6">
        <div
          class="h-4 rounded-md bg-gray-200 dark:bg-gray-800"
          :class="col === 1 ? 'max-w-[70%]' : 'max-w-[90%]'"
        />
      </td>
    </tr>
  </tbody>
</template>
