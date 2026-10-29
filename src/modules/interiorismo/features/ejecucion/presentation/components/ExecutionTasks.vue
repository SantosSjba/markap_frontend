<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, filterActions } = useApplicationAccess('interiorismo')

import { computed, ref, toRef } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import ActionsDropdown, { type ActionItem } from '@shared/presentation/components/ui/ActionsDropdown.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import type { HelpTooltipItem } from '@shared/presentation/components/ui/HelpTooltip.vue'
import HelpTooltip from '@shared/presentation/components/ui/HelpTooltip.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { formatShortDate } from '@shared/utils/formatters'
import type { InteriorExecutionMilestoneDto, InteriorExecutionTaskDto } from '../../domain/execution.types'
import { useDeleteExecutionTask, useUpdateExecutionTask } from '../composables/useInteriorExecution'
import { KANBAN_LABELS, PHASE_LABELS } from '../labels'
import { KANBAN_ORDER, TASK_STATUS_VARIANT } from '../execution-ui'
import ExecutionGantt from './ExecutionGantt.vue'
import ExecutionTaskFormModal from './ExecutionTaskFormModal.vue'
/** ExecutionTasks — tareas de obra en tablero (por estado), lista o Gantt, con filtro por fase. */

const props = defineProps<{ projectId: string; tasks: readonly InteriorExecutionTaskDto[]; milestones: readonly InteriorExecutionMilestoneDto[] }>()

type Mode = 'board' | 'list' | 'gantt'
const mode = ref<Mode>('board')
const MODE_TABS = [
  { id: 'board' as const, label: 'Tablero', icon: 'lucide:columns-3' },
  { id: 'list' as const, label: 'Lista', icon: 'lucide:list' },
  { id: 'gantt' as const, label: 'Gantt', icon: 'lucide:chart-gantt' },
]
const HELP: HelpTooltipItem[] = [
  { icon: 'lucide:columns-3', term: 'Tablero', text: 'Por hacer → En curso → Hecho. «Bloqueado» marca lo que espera algo externo (cliente, proveedor).' },
  { icon: 'lucide:layers', term: 'Fases', text: 'Diseño, Compras, Producción e Instalación: filtre para ver solo una.' },
  { icon: 'lucide:chart-gantt', term: 'Gantt', text: 'Las tareas con fechas en el tiempo, los hitos como rombos y la línea roja de hoy.' },
  { icon: 'lucide:mouse-pointer-click', term: 'Editar', text: 'Clic en una tarea para editarla; «⋯» para moverla de estado o eliminarla.' },
]
const phase = ref('')
const phaseOptions = [{ value: '', label: 'Todas las fases' }, ...Object.entries(PHASE_LABELS).map(([value, label]) => ({ value, label }))]

const filtered = computed(() =>
  [...props.tasks]
    .filter((t) => !phase.value || t.phase === phase.value)
    .sort((a, b) => (a.plannedStart ?? '9999').localeCompare(b.plannedStart ?? '9999') || a.sortOrder - b.sortOrder),
)
const byStatus = computed(() => {
  const map = Object.fromEntries(KANBAN_ORDER.map((s) => [s, [] as InteriorExecutionTaskDto[]])) as Record<string, InteriorExecutionTaskDto[]>
  for (const t of filtered.value) (map[t.kanbanStatus] ?? map.BACKLOG!).push(t)
  return map
})

// ── Acciones ──
const pid = toRef(props, 'projectId')
const updateTask = useUpdateExecutionTask(pid)
const deleteTask = useDeleteExecutionTask(pid)
const formOpen = ref(false)
const editing = ref<InteriorExecutionTaskDto | null>(null)
const defaultStatus = ref<string>()

function openCreate(status?: string) {
  editing.value = null
  defaultStatus.value = status
  formOpen.value = true
}
function openEdit(t: InteriorExecutionTaskDto) {
  editing.value = t
  formOpen.value = true
}
function move(t: InteriorExecutionTaskDto, status: string) {
  updateTask.mutate({ taskId: t.id, payload: { kanbanStatus: status, ...(status === 'DONE' ? { progressPct: 100 } : {}) } })
}
async function remove(t: InteriorExecutionTaskDto) {
  const ok = await markapAlert.confirmDanger({ title: '¿Eliminar tarea?', text: t.title, confirmText: 'Eliminar' })
  if (ok) await deleteTask.mutateAsync(t.id)
}
function actionsFor(t: InteriorExecutionTaskDto): ActionItem[] {
  return filterActions([
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => openEdit(t) },
    ...KANBAN_ORDER.filter((s) => s !== t.kanbanStatus).map((s) => ({ label: `Mover a ${KANBAN_LABELS[s]}`, icon: 'lucide:arrow-right-left', onClick: () => move(t, s) })),
    { label: 'Eliminar', icon: 'lucide:trash-2', danger: true, onClick: () => void remove(t) },
  ])
}

const dates = (t: InteriorExecutionTaskDto) =>
  t.plannedStart || t.plannedEnd ? `${t.plannedStart ? formatShortDate(t.plannedStart) : '—'} → ${t.plannedEnd ? formatShortDate(t.plannedEnd) : '—'}` : 'Sin fechas'

const columns = [
  { key: 'title', label: 'Tarea' },
  { key: 'phase', label: 'Fase' },
  { key: 'status', label: 'Estado' },
  { key: 'dates', label: 'Fechas' },
  { key: 'progress', label: 'Avance' },
  { key: 'actions', label: '', align: 'right' as const },
]
const asTask = (row: unknown) => row as InteriorExecutionTaskDto
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <BaseTabs v-model="mode" :tabs="MODE_TABS" variant="segmented" />
      <div class="w-full min-w-0 sm:w-[200px]"><FormSelect v-model="phase" :options="phaseOptions" /></div>
      <HelpTooltip title="Tareas de obra" :items="HELP" width="w-80" />
      <BaseButton v-if="canWrite" variant="primary" size="sm" icon="lucide:plus" class="sm:ml-auto" @click="openCreate()">Nueva tarea</BaseButton>
    </div>

    <!-- Tablero -->
    <div v-if="mode === 'board'" class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <section v-for="s in KANBAN_ORDER" :key="s" class="flex min-h-40 flex-col rounded-xl bg-gray-50 p-2.5 dark:bg-white/[0.02]">
        <header class="mb-2 flex items-center justify-between px-1">
          <span class="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white/90">
            {{ KANBAN_LABELS[s] }}
            <span class="rounded-full bg-white px-2 text-theme-xs font-medium text-gray-500 dark:bg-white/5 dark:text-gray-400">{{ byStatus[s]?.length ?? 0 }}</span>
          </span>
          <button v-if="canWrite" type="button" class="text-gray-400 hover:text-brand-500" :aria-label="`Nueva tarea en ${KANBAN_LABELS[s]}`" @click="openCreate(s)">
            <span class="text-lg leading-none">+</span>
          </button>
        </header>
        <ul class="flex-1 space-y-2">
          <li
            v-for="t in byStatus[s]"
            :key="t.id"
            class="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-theme-xs transition-colors hover:border-brand-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/40"
            @click="openEdit(t)"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ t.title }}</p>
              <ActionsDropdown :items="actionsFor(t)" />
            </div>
            <p class="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{{ PHASE_LABELS[t.phase] ?? t.phase }} · {{ dates(t) }}</p>
            <div v-if="t.progressPct > 0 && t.kanbanStatus !== 'DONE'" class="mt-2 flex items-center gap-2">
              <div class="h-1 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div class="h-full rounded-full bg-brand-500" :style="{ width: `${t.progressPct}%` }" /></div>
              <span class="text-theme-xs tabular-nums text-gray-400">{{ t.progressPct }}%</span>
            </div>
          </li>
          <li v-if="!byStatus[s]?.length" class="rounded-lg border border-dashed border-gray-200 py-6 text-center text-theme-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">Sin tareas</li>
        </ul>
      </section>
    </div>

    <!-- Lista -->
    <div v-else-if="mode === 'list'" class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <DataTable :columns="columns" :data="filtered" row-key="id" empty-text="Aún no hay tareas.">
        <template #row="{ row }">
          <td class="px-4 py-3"><button type="button" class="text-left text-sm font-medium text-gray-800 hover:text-brand-500 dark:text-white/90" @click="openEdit(asTask(row))">{{ asTask(row).title }}</button></td>
          <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ PHASE_LABELS[asTask(row).phase] ?? asTask(row).phase }}</td>
          <td class="px-4 py-3"><Badge :variant="TASK_STATUS_VARIANT[asTask(row).kanbanStatus] ?? 'neutral'">{{ KANBAN_LABELS[asTask(row).kanbanStatus] ?? asTask(row).kanbanStatus }}</Badge></td>
          <td class="px-4 py-3 text-theme-xs whitespace-nowrap text-gray-500 dark:text-gray-400">{{ dates(asTask(row)) }}</td>
          <td class="px-4 py-3 text-sm tabular-nums text-gray-600 dark:text-gray-300">{{ asTask(row).progressPct }}%</td>
          <td class="px-4 py-3 text-right"><ActionsDropdown :items="actionsFor(asTask(row))" /></td>
        </template>
      </DataTable>
    </div>

    <ExecutionGantt v-else :tasks="filtered" :milestones="milestones" @select-task="openEdit" />

    <ExecutionTaskFormModal v-model:open="formOpen" :project-id="projectId" :task="editing" :default-status="defaultStatus" />
  </div>
</template>
