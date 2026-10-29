<script setup lang="ts">
import { computed } from 'vue'
import { formatDate, formatShortDate, toCalendarDateString } from '@shared/utils/formatters'
import type { InteriorExecutionMilestoneDto, InteriorExecutionTaskDto } from '../../domain/execution.types'
import { ganttBar, ganttMonths, ganttOffset, ganttScale } from '../../domain/gantt-layout'
import { KANBAN_LABELS, PHASE_LABELS } from '../labels'
import { TASK_STATUS_BAR } from '../execution-ui'
/** ExecutionGantt — barras por tarea (color por estado), hitos como rombos y línea de hoy. */

const props = defineProps<{ tasks: readonly InteriorExecutionTaskDto[]; milestones: readonly InteriorExecutionMilestoneDto[] }>()
const emit = defineEmits<{ selectTask: [task: InteriorExecutionTaskDto] }>()

const today = toCalendarDateString()
const scale = computed(() =>
  ganttScale([...props.tasks.flatMap((t) => [t.plannedStart, t.plannedEnd]), ...props.milestones.map((m) => m.plannedDate)], today),
)
const months = computed(() => ganttMonths(scale.value))
const todayLeft = computed(() => ganttOffset(scale.value, today))
const rows = computed(() => props.tasks.map((t) => ({ task: t, bar: ganttBar(scale.value, t.plannedStart, t.plannedEnd) })))
const undated = computed(() => rows.value.filter((r) => !r.bar).length)
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
    <div class="min-w-[720px]">
      <!-- Meses -->
      <div class="grid grid-cols-[220px_1fr] border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
        <span class="px-3 py-2 text-theme-xs font-medium text-gray-500 dark:text-gray-400">Tarea</span>
        <div class="relative h-8">
          <span v-for="m in months" :key="m.date" class="absolute top-0 flex h-full items-center border-l border-gray-200 pl-1.5 text-theme-xs capitalize text-gray-500 dark:border-gray-800 dark:text-gray-400" :style="{ left: `${m.left}%` }">
            {{ formatDate(m.date, { month: 'short', year: '2-digit', day: undefined }) }}
          </span>
        </div>
      </div>

      <!-- Hitos -->
      <div v-if="milestones.length" class="grid grid-cols-[220px_1fr] border-b border-gray-100 dark:border-gray-800">
        <span class="px-3 py-2 text-theme-xs font-medium text-theme-purple-500">Hitos</span>
        <div class="relative h-9">
          <span v-for="m in months" :key="m.date" class="absolute inset-y-0 border-l border-gray-100 dark:border-gray-800/60" :style="{ left: `${m.left}%` }" />
          <span
            v-for="m in milestones"
            :key="m.id"
            class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px]"
            :class="m.completedAt ? 'bg-success-500' : 'bg-theme-purple-500'"
            :style="{ left: `${ganttOffset(scale, m.plannedDate)}%` }"
            :title="`${m.title} · ${formatShortDate(m.plannedDate)}${m.completedAt ? ' · cumplido' : ''}`"
          />
        </div>
      </div>

      <!-- Tareas -->
      <div v-for="r in rows" :key="r.task.id" class="grid grid-cols-[220px_1fr] border-b border-gray-100 last:border-b-0 dark:border-gray-800">
        <button type="button" class="min-w-0 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03]" @click="emit('selectTask', r.task)">
          <span class="block truncate text-sm text-gray-800 dark:text-white/90">{{ r.task.title }}</span>
          <span class="block text-theme-xs text-gray-400 dark:text-gray-500">{{ PHASE_LABELS[r.task.phase] ?? r.task.phase }}</span>
        </button>
        <div class="relative">
          <span v-for="m in months" :key="m.date" class="absolute inset-y-0 border-l border-gray-100 dark:border-gray-800/60" :style="{ left: `${m.left}%` }" />
          <span class="absolute inset-y-0 z-10 w-px bg-error-400/70" :style="{ left: `${todayLeft}%` }" />
          <button
            v-if="r.bar"
            type="button"
            class="absolute top-1/2 h-5 min-w-1.5 -translate-y-1/2 overflow-hidden rounded-md opacity-90 hover:opacity-100"
            :class="TASK_STATUS_BAR[r.task.kanbanStatus] ?? TASK_STATUS_BAR.BACKLOG"
            :style="{ left: `${r.bar.left}%`, width: `${r.bar.width}%` }"
            :title="`${r.task.title} · ${KANBAN_LABELS[r.task.kanbanStatus] ?? ''} · ${r.task.progressPct}%`"
            @click="emit('selectTask', r.task)"
          >
            <span v-if="r.task.kanbanStatus !== 'DONE' && r.task.progressPct > 0" class="block h-full bg-black/15" :style="{ width: `${r.task.progressPct}%` }" />
          </button>
          <span v-else class="absolute inset-0 flex items-center px-3 text-theme-xs text-gray-400 dark:text-gray-500">Sin fechas planificadas</span>
        </div>
      </div>
      <p v-if="!tasks.length" class="py-10 text-center text-sm text-gray-400 dark:text-gray-500">Aún no hay tareas.</p>
    </div>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-200 px-3 py-2 text-theme-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
      <span v-for="(cls, s) in TASK_STATUS_BAR" :key="s" class="flex items-center gap-1.5"><span class="h-2 w-3 rounded-sm" :class="cls" />{{ KANBAN_LABELS[s] }}</span>
      <span class="flex items-center gap-1.5"><span class="size-2 rotate-45 rounded-[1px] bg-theme-purple-500" />Hito</span>
      <span class="flex items-center gap-1.5"><span class="h-3 w-px bg-error-400" />Hoy</span>
      <span v-if="undated" class="ml-auto">{{ undated }} sin fechas</span>
    </div>
  </div>
</template>
