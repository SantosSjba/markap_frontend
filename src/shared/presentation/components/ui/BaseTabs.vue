<script setup lang="ts" generic="T extends string = string">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
/**
 * BaseTabs — pestañas de TailAdmin.
 * `underline`: pestañas subrayadas. `segmented`: selector compacto (como el de los gráficos del dashboard).
 */

interface Tab {
  id: T
  label: string
  icon?: string
}

interface Props {
  tabs: readonly Tab[]
  modelValue: T
  variant?: 'underline' | 'segmented'
}

const props = withDefaults(defineProps<Props>(), { variant: 'underline' })
const emit = defineEmits<{ 'update:modelValue': [id: T] }>()

const activeId = computed(() => props.modelValue)

function selectTab(id: T) {
  emit('update:modelValue', id)
}
</script>

<template>
  <div
    v-if="variant === 'segmented'"
    class="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-gray-100 p-0.5 no-scrollbar dark:bg-gray-900"
    role="tablist"
    aria-label="Pestañas"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      :aria-selected="activeId === tab.id"
      :class="[
        'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-theme-sm font-medium whitespace-nowrap transition-colors',
        activeId === tab.id
          ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
          : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
      ]"
      @click="selectTab(tab.id)"
    >
      <AppIcon v-if="tab.icon" :icon="tab.icon" class="size-4" />
      {{ tab.label }}
    </button>
  </div>
  <div v-else class="border-b border-gray-200 dark:border-gray-800">
    <nav
      class="-mb-px flex gap-2 overflow-x-auto no-scrollbar"
      role="tablist"
      aria-label="Pestañas"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="activeId === tab.id"
        :class="[
          'inline-flex shrink-0 items-center gap-2 border-b-2 px-2.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ease-in-out',
          activeId === tab.id
            ? 'border-brand-500 text-brand-500 dark:border-brand-400 dark:text-brand-400'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-200',
        ]"
        @click="selectTab(tab.id)"
      >
        <AppIcon v-if="tab.icon" :icon="tab.icon" class="size-4" />
        {{ tab.label }}
      </button>
    </nav>
  </div>
</template>
