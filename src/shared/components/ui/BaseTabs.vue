<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

/**
 * BaseTabs - Navegación por pestañas reutilizable
 */

interface Tab {
  id: string
  label: string
  icon?: string
}

interface Props {
  tabs: Tab[]
  modelValue: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [id: string] }>()

const activeId = computed(() => props.modelValue)

function selectTab(id: string) {
  emit('update:modelValue', id)
}
</script>

<template>
  <div class="border-b" :style="{ borderColor: 'var(--color-border)' }">
    <nav class="flex gap-1 overflow-x-auto scrollbar-none" aria-label="Tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        :aria-selected="activeId === tab.id"
        :class="[
          'flex items-center gap-1.5 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px whitespace-nowrap shrink-0',
          activeId === tab.id
            ? 'border-current'
            : 'border-transparent hover:opacity-80',
        ]"
        :style="
          activeId === tab.id
            ? { color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }
            : { color: 'var(--color-text-secondary)' }
        "
        @click="selectTab(tab.id)"
      >
        <Icon v-if="tab.icon" :icon="tab.icon" width="16" height="16" />
        {{ tab.label }}
      </button>
    </nav>
  </div>
</template>
