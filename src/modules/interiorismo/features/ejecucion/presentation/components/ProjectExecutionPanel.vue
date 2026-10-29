<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin } = useApplicationAccess('interiorismo')

import { computed, ref, toRef } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import SectionIntro from '@shared/presentation/components/ui/SectionIntro.vue'
import HelpTooltip, { type HelpTooltipItem } from '@shared/presentation/components/ui/HelpTooltip.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatMoney } from '@shared/utils/money'
import { formatShortDate, toCalendarDateString } from '@shared/utils/formatters'
import { useDeleteExecutionActualCost, useInteriorExecutionOverview, usePatchExecutionProgress } from '../composables/useInteriorExecution'
import { COST_CATEGORY_LABELS } from '../labels'
import ExecutionTasks from './ExecutionTasks.vue'
import ExecutionMilestones from './ExecutionMilestones.vue'
import ExecutionEvidences from './ExecutionEvidences.vue'
import ExecutionIncidents from './ExecutionIncidents.vue'
/**
 * ProjectExecutionPanel — pestaña Ejecución de la ficha: avance, tareas (tablero / lista / Gantt),
 * cronograma de hitos, evidencias e incidencias. Los costos reales se llevan en Compras;
 * los registrados antes en Ejecución se muestran solo para consulta.
 */

const props = defineProps<{ projectId: string }>()
const emit = defineEmits<{ openCalendar: []; goTab: [tab: string] }>()
const pid = toRef(props, 'projectId')
const today = toCalendarDateString()

const { data: ov, isLoading, isError, error, refetch } = useInteriorExecutionOverview(pid)

const section = ref<'tareas' | 'cronograma' | 'evidencias' | 'incidencias' | 'costos'>('tareas')
const openIncidents = computed(() => ov.value?.incidents.filter((i) => i.status !== 'CLOSED').length ?? 0)
const sections = computed(() => [
  { id: 'tareas' as const, label: `Tareas · ${ov.value?.tasks.length ?? 0}`, icon: 'lucide:list-checks' },
  { id: 'cronograma' as const, label: `Cronograma · ${ov.value?.milestones.length ?? 0}`, icon: 'lucide:flag' },
  { id: 'evidencias' as const, label: `Evidencias · ${ov.value?.evidences.length ?? 0}`, icon: 'lucide:camera' },
  { id: 'incidencias' as const, label: `Incidencias · ${openIncidents.value}`, icon: 'lucide:triangle-alert' },
  ...(ov.value?.actualCosts.length ? [{ id: 'costos' as const, label: 'Costos anteriores', icon: 'lucide:archive' }] : []),
])

// ── Resumen ──
const taskStats = computed(() => {
  const tasks = ov.value?.tasks ?? []
  const done = tasks.filter((t) => t.kanbanStatus === 'DONE').length
  const blocked = tasks.filter((t) => t.kanbanStatus === 'BLOCKED').length
  const late = tasks.filter((t) => t.kanbanStatus !== 'DONE' && t.plannedEnd && t.plannedEnd < today).length
  /** Avance sugerido: promedio del avance de las tareas (hechas = 100 %). */
  const suggested = tasks.length ? Math.round(tasks.reduce((s, t) => s + (t.kanbanStatus === 'DONE' ? 100 : t.progressPct), 0) / tasks.length) : null
  return { total: tasks.length, done, blocked, late, suggested }
})
const nextMilestone = computed(() => [...(ov.value?.milestones ?? [])].filter((m) => !m.completedAt).sort((a, b) => a.plannedDate.localeCompare(b.plannedDate))[0] ?? null)

// ── Ayuda ──
const HELP: HelpTooltipItem[] = [
  { icon: 'lucide:gauge', term: 'Avance', text: 'Porcentaje global de la obra. Se actualiza a mano; puede usar el sugerido según las tareas.' },
  { icon: 'lucide:list-checks', term: 'Tareas', text: 'Trabajo por hacer en cada fase (diseño, compras, producción, instalación), en tablero, lista o Gantt.' },
  { icon: 'lucide:flag', term: 'Cronograma', text: 'Hitos o entregas clave con fecha (diseño aprobado, llegada de mobiliario, entrega final). Aparecen en el Calendario.' },
  { icon: 'lucide:camera', term: 'Evidencias', text: 'Fotos y documentos de obra, opcionalmente asociados a una tarea.' },
  { icon: 'lucide:triangle-alert', term: 'Incidencias', text: 'Problemas en obra con su severidad; se siguen hasta cerrarlos.' },
  { icon: 'lucide:shopping-cart', term: 'Costos', text: 'Los costos reales se registran por partida en Compras y contrataciones, no aquí.' },
]

// ── Avance global ──
const patchProgress = usePatchExecutionProgress(pid)
const progressOpen = ref(false)
const progressDraft = ref(0)
function openProgress() {
  progressDraft.value = Math.round(ov.value?.progressPct ?? 0)
  progressOpen.value = true
}
async function saveProgress() {
  const value = Math.min(100, Math.max(0, Math.round(Number(progressDraft.value) || 0)))
  await patchProgress.mutateAsync(value)
  progressOpen.value = false
}

// ── Costos anteriores (solo consulta) ──
const deleteCost = useDeleteExecutionActualCost(pid)
async function removeCost(id: string, concept: string) {
  const ok = await markapAlert.confirmDanger({ title: '¿Eliminar costo?', text: concept, confirmText: 'Eliminar' })
  if (ok) await deleteCost.mutateAsync(id)
}
</script>

<template>
  <LoadingState v-if="isLoading" class="py-16" />
  <div v-else-if="isError || !ov" class="space-y-3 py-12 text-center text-sm">
    <p class="text-error-500">{{ isError ? getApiErrorMessage(error) : 'No se pudo cargar la ejecución.' }}</p>
    <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetch()">Reintentar</BaseButton>
  </div>
  <div v-else class="space-y-6">
    <SectionIntro
      title="Ejecución de obra"
      subtitle="Avance, tareas, cronograma de hitos, evidencias e incidencias del proyecto."
      help-title="¿Qué se gestiona en Ejecución?"
      :help="HELP"
    >
      <template #actions>
        <BaseButton v-if="canWrite" variant="outline" size="sm" icon="lucide:sliders-horizontal" @click="openProgress">Actualizar avance</BaseButton>
        <BaseButton variant="outline" size="sm" icon="lucide:calendar" @click="emit('openCalendar')">Ver en calendario</BaseButton>
      </template>
    </SectionIntro>

    <div class="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="flex items-center gap-3">
        <span class="flex items-center gap-1 text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">
          {{ Math.round(ov.progressPct) }}% de avance
          <HelpTooltip
            :size="13"
            width="w-64"
            :text="taskStats.suggested != null ? `Avance global registrado a mano. Según las tareas sería ${taskStats.suggested}%.` : 'Avance global registrado a mano con «Actualizar avance».'"
          />
        </span>
        <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div class="h-full rounded-full bg-brand-500 transition-all" :style="{ width: `${Math.min(100, Math.max(0, ov.progressPct))}%` }" />
        </div>
      </div>
      <ul class="flex flex-wrap gap-x-5 gap-y-1 text-theme-sm text-gray-500 dark:text-gray-400">
        <li class="flex items-center gap-1.5"><AppIcon icon="lucide:list-checks" :size="15" /><span><strong class="font-medium text-gray-800 dark:text-white/90">{{ taskStats.done }}/{{ taskStats.total }}</strong> tareas hechas</span></li>
        <li v-if="taskStats.late" class="flex items-center gap-1.5 text-error-600 dark:text-error-400"><AppIcon icon="lucide:clock-alert" :size="15" />{{ taskStats.late }} atrasadas</li>
        <li v-if="taskStats.blocked" class="flex items-center gap-1.5 text-warning-600 dark:text-warning-400"><AppIcon icon="lucide:octagon-pause" :size="15" />{{ taskStats.blocked }} bloqueadas</li>
        <li class="flex min-w-0 items-center gap-1.5">
          <AppIcon icon="lucide:flag" :size="15" />
          <span v-if="nextMilestone" class="truncate">Próximo hito <strong class="font-medium text-gray-800 dark:text-white/90">{{ formatShortDate(nextMilestone.plannedDate) }}</strong> · {{ nextMilestone.title }}</span>
          <span v-else>Sin hitos pendientes</span>
        </li>
        <li class="flex items-center gap-1.5" :class="openIncidents ? 'text-error-600 dark:text-error-400' : ''"><AppIcon icon="lucide:triangle-alert" :size="15" />{{ openIncidents ? `${openIncidents} incidencia${openIncidents === 1 ? '' : 's'} abierta${openIncidents === 1 ? '' : 's'}` : 'Sin incidencias abiertas' }}</li>
      </ul>
    </div>

    <BaseTabs v-model="section" :tabs="sections" variant="segmented" />

    <ExecutionTasks v-if="section === 'tareas'" :project-id="projectId" :tasks="ov.tasks" :milestones="ov.milestones" />
    <ExecutionMilestones v-else-if="section === 'cronograma'" :project-id="projectId" :milestones="ov.milestones" />
    <ExecutionEvidences v-else-if="section === 'evidencias'" :project-id="projectId" :evidences="ov.evidences" :tasks="ov.tasks" />
    <ExecutionIncidents v-else-if="section === 'incidencias'" :project-id="projectId" :incidents="ov.incidents" />
    <div v-else class="space-y-3">
      <div class="flex flex-wrap items-center gap-3 rounded-lg bg-blue-light-50 px-4 py-3 text-sm text-blue-light-700 dark:bg-blue-light-500/10 dark:text-blue-light-400">
        <AppIcon icon="lucide:info" :size="18" class="shrink-0" />
        <span class="flex-1">Los costos reales ahora se registran por partida en <strong>Compras</strong>. Estos se cargaron antes en Ejecución y no suman en la liquidación.</span>
        <BaseButton variant="outline" size="sm" @click="emit('goTab', 'compras')">Ir a Compras</BaseButton>
      </div>
      <ul class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
        <li v-for="c in ov.actualCosts" :key="c.id" class="flex items-center gap-3 px-4 py-2.5 text-sm">
          <span class="w-24 shrink-0 text-theme-xs text-gray-500 dark:text-gray-400">{{ formatShortDate(c.occurredAt) }}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-gray-800 dark:text-white/90">{{ c.concept }}</span>
            <span class="block text-theme-xs text-gray-500 dark:text-gray-400">{{ COST_CATEGORY_LABELS[c.costCategory] ?? c.costCategory }}<template v-if="c.materialName"> · {{ c.materialName }}</template></span>
          </span>
          <span class="tabular-nums font-medium text-gray-800 dark:text-white/90">{{ formatMoney(c.amount, 'PEN') }}</span>
          <button v-if="canAdmin" type="button" class="text-gray-400 hover:text-error-500" aria-label="Eliminar costo" @click="removeCost(c.id, c.concept)"><AppIcon icon="lucide:trash-2" :size="16" /></button>
        </li>
      </ul>
    </div>

    <BaseModal v-model="progressOpen" title="Avance de obra" size="sm">
      <div class="space-y-4">
        <FormInput v-model="progressDraft" type="number" label="Avance global (%)" />
        <div v-if="taskStats.suggested != null" class="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/[0.03]">
          <span class="text-gray-600 dark:text-gray-300">Según tareas: <strong class="tabular-nums">{{ taskStats.suggested }}%</strong></span>
          <BaseButton variant="link" size="sm" @click="progressDraft = taskStats.suggested!">Usar</BaseButton>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" @click="progressOpen = false">Cancelar</BaseButton>
          <BaseButton variant="primary" :loading="patchProgress.isPending.value" @click="saveProgress">Guardar</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
