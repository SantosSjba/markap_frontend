<script setup lang="ts">
import { computed } from 'vue'
import { groupByDay, monthGrid, viewRange } from '@shared/domain/calendar-grid'
import { CALENDAR_TONE_CLASSES } from './calendar-tones'
import type { CalendarEntry } from './calendar.types'
/**
 * CalendarMonthView — rejilla mensual (lunes primero) con pastillas por evento.
 * En pantallas pequeñas muestra puntos de color; «+N» abre el día.
 */

const props = withDefaults(defineProps<{ anchor: string; today: string; entries: readonly CalendarEntry[]; maxPerDay?: number }>(), { maxPerDay: 3 })
const emit = defineEmits<{ selectEntry: [entry: CalendarEntry]; selectDay: [date: string] }>()

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const cells = computed(() => monthGrid(props.anchor))
const byDay = computed(() => groupByDay(props.entries, viewRange('month', props.anchor), (e) => e.start, (e) => e.end))
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
    <div class="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-theme-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-400">
      <span v-for="d in WEEKDAYS" :key="d" class="py-2">{{ d }}</span>
    </div>
    <div class="grid grid-cols-7">
      <div
        v-for="c in cells"
        :key="c.date"
        role="button"
        tabindex="0"
        class="group min-h-16 cursor-pointer border-b border-r border-gray-100 p-1 transition-colors last:border-r-0 hover:bg-gray-50 sm:min-h-28 sm:p-1.5 dark:border-gray-800 dark:hover:bg-white/[0.03] [&:nth-child(7n)]:border-r-0"
        :class="c.inMonth ? '' : 'bg-gray-50/60 dark:bg-white/[0.01]'"
        @click="emit('selectDay', c.date)"
        @keydown.enter="emit('selectDay', c.date)"
      >
        <span
          class="inline-flex size-6 items-center justify-center rounded-full text-theme-xs"
          :class="c.date === today ? 'bg-brand-500 font-semibold text-white' : c.inMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'"
        >{{ c.day }}</span>

        <!-- Pantallas pequeñas: puntos -->
        <div v-if="byDay.get(c.date)?.length" class="mt-0.5 flex flex-wrap gap-0.5 px-0.5 sm:hidden">
          <span v-for="e in byDay.get(c.date)!.slice(0, 4)" :key="e.id" class="size-1.5 rounded-full" :class="CALENDAR_TONE_CLASSES[e.tone].dot" />
        </div>

        <!-- Desde sm: pastillas -->
        <ul class="mt-1 hidden space-y-0.5 sm:block">
          <li v-for="e in (byDay.get(c.date) ?? []).slice(0, maxPerDay)" :key="e.id">
            <button
              type="button"
              class="flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] leading-4 font-medium hover:opacity-80"
              :class="[CALENDAR_TONE_CLASSES[e.tone].pill, e.done ? 'line-through opacity-60' : '']"
              :title="e.subtitle ? `${e.title} · ${e.subtitle}` : e.title"
              @click.stop="emit('selectEntry', e)"
            >
              <span v-if="e.time" class="shrink-0 tabular-nums opacity-75">{{ e.time }}</span>
              <span class="truncate">{{ e.title }}</span>
            </button>
          </li>
          <li v-if="(byDay.get(c.date)?.length ?? 0) > maxPerDay">
            <button type="button" class="px-1.5 text-[11px] font-medium text-gray-500 hover:text-brand-500 dark:text-gray-400" @click.stop="emit('selectDay', c.date)">
              +{{ byDay.get(c.date)!.length - maxPerDay }} más
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
