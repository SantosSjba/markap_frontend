<script setup lang="ts">
import { computed } from 'vue'
import { groupByDay } from '@shared/domain/calendar-grid'
import { formatDate } from '@shared/utils/formatters'
import { CALENDAR_TONE_CLASSES } from './calendar-tones'
import type { CalendarEntry } from './calendar.types'
/**
 * CalendarAgendaList — eventos agrupados por día (vista lista y vista semana).
 * `days` fija los días a mostrar (semana: los 7, aunque estén vacíos); sin `days` solo los que tienen eventos.
 */

const props = defineProps<{
  entries: readonly CalendarEntry[]
  range: { from: string; to: string }
  today: string
  days?: readonly string[]
  emptyText?: string
}>()
const emit = defineEmits<{ selectEntry: [entry: CalendarEntry]; selectDay: [date: string] }>()

const byDay = computed(() => groupByDay(props.entries, props.range, (e) => e.start, (e) => e.end))
const visibleDays = computed(() => props.days ?? [...byDay.value.keys()].sort())
const dayLabel = (d: string) => formatDate(d, { weekday: 'long', day: 'numeric', month: 'long', year: undefined })
</script>

<template>
  <div v-if="!visibleDays.length" class="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400 dark:border-gray-800 dark:text-gray-500">
    {{ emptyText ?? 'Sin eventos en el período.' }}
  </div>
  <div v-else class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
    <section v-for="d in visibleDays" :key="d" class="flex flex-col gap-2 p-3 sm:flex-row sm:gap-4">
      <button type="button" class="flex w-full shrink-0 items-baseline gap-2 text-left sm:w-44 sm:flex-col sm:gap-0" @click="emit('selectDay', d)">
        <span class="text-sm font-semibold first-letter:uppercase" :class="d === today ? 'text-brand-500' : 'text-gray-800 dark:text-white/90'">{{ dayLabel(d) }}</span>
        <span v-if="d === today" class="text-theme-xs text-brand-500">Hoy</span>
      </button>
      <ul v-if="byDay.get(d)?.length" class="min-w-0 flex-1 space-y-1.5">
        <li v-for="e in byDay.get(d)" :key="e.id">
          <button type="button" class="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03]" @click="emit('selectEntry', e)">
            <span class="mt-1.5 size-2 shrink-0 rounded-full" :class="CALENDAR_TONE_CLASSES[e.tone].dot" />
            <span class="mt-0.5 w-20 shrink-0 text-theme-xs tabular-nums text-gray-500 dark:text-gray-400">{{ e.time ?? 'Todo el día' }}</span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-gray-800 dark:text-white/90" :class="e.done ? 'line-through opacity-60' : ''">{{ e.title }}</span>
              <span v-if="e.subtitle" class="block truncate text-theme-xs text-gray-500 dark:text-gray-400">{{ e.subtitle }}</span>
            </span>
          </button>
        </li>
      </ul>
      <p v-else class="flex-1 py-1.5 text-theme-xs text-gray-400 dark:text-gray-500">Sin eventos</p>
    </section>
  </div>
</template>
