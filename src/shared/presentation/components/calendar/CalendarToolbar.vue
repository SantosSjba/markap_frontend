<script setup lang="ts">
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import type { CalendarViewMode } from '@shared/domain/calendar-grid'
/** CalendarToolbar — navegación (anterior / hoy / siguiente), título del período y selector de vista. */

defineProps<{ title: string }>()
const view = defineModel<CalendarViewMode>('view', { required: true })
const emit = defineEmits<{ prev: []; next: []; today: [] }>()

const VIEW_TABS = [
  { id: 'month' as const, label: 'Mes', icon: 'lucide:calendar' },
  { id: 'week' as const, label: 'Semana', icon: 'lucide:calendar-range' },
  { id: 'list' as const, label: 'Lista', icon: 'lucide:list' },
]
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <div class="flex items-center">
        <button type="button" class="flex size-9 items-center justify-center rounded-l-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5" aria-label="Anterior" @click="emit('prev')">
          <AppIcon icon="lucide:chevron-left" :size="18" />
        </button>
        <button type="button" class="-ml-px flex size-9 items-center justify-center rounded-r-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5" aria-label="Siguiente" @click="emit('next')">
          <AppIcon icon="lucide:chevron-right" :size="18" />
        </button>
      </div>
      <BaseButton variant="outline" size="sm" @click="emit('today')">Hoy</BaseButton>
      <h2 class="ml-1 text-base font-semibold text-gray-800 first-letter:uppercase dark:text-white/90">{{ title }}</h2>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <slot />
      <BaseTabs v-model="view" :tabs="VIEW_TABS" variant="segmented" />
    </div>
  </div>
</template>
