<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BaseButton,
  BaseTabs,
  BaseModal,
  DataTable,
  FormInput,
  FormSelect,
  FormTextarea,
  StatsCard,
  Badge,
  AppIcon,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'
import { useInteriorCatalogMaterialsList } from '@modules/interiorismo/features/materiales/application/useInteriorCatalogMaterials'
import type { ListInteriorCatalogMaterialsParams } from '@modules/interiorismo/features/materiales/domain/catalog.types'
import type { InteriorExecutionTaskDto } from '../../domain/execution.types'
import {
  useInteriorExecutionOverview,
  usePatchExecutionProgress,
  useCreateExecutionTask,
  useUpdateExecutionTask,
  useDeleteExecutionTask,
  useCreateExecutionEvidence,
  useDeleteExecutionEvidence,
  useCreateExecutionIncident,
  useUpdateExecutionIncident,
  useCreateExecutionActualCost,
  useDeleteExecutionActualCost,
} from '../../application/useInteriorExecution'
import {
  PHASE_LABELS,
  KANBAN_LABELS,
  EVIDENCE_LABELS,
  SEVERITY_LABELS,
  INCIDENT_STATUS_LABELS,
  COST_CATEGORY_LABELS,
  formatSol,
} from '../labels'

const route = useRoute()
const router = useRouter()
const projectId = computed(() => String(route.params.projectId ?? ''))

const activeTab = ref('resumen')
const tabs = [
  { id: 'resumen', label: 'Resumen', icon: 'lucide:gauge' },
  { id: 'kanban', label: 'Kanban', icon: 'lucide:columns-3' },
  { id: 'timeline', label: 'Timeline', icon: 'lucide:calendar-days' },
  { id: 'gantt', label: 'Gantt', icon: 'lucide:chart-gantt' },
  { id: 'costos', label: 'Costos reales', icon: 'lucide:coins' },
  { id: 'evidencias', label: 'Fotos / evidencias', icon: 'lucide:camera' },
  { id: 'incidencias', label: 'Incidencias', icon: 'lucide:alert-triangle' },
  { id: 'comparativo', label: 'Presup. vs real', icon: 'lucide:scale' },
]

const { data: ov, isLoading, isError } = useInteriorExecutionOverview(projectId)
const patchProgress = usePatchExecutionProgress(projectId)
const createTask = useCreateExecutionTask(projectId)
const updateTask = useUpdateExecutionTask(projectId)
const deleteTask = useDeleteExecutionTask(projectId)
const createEvidence = useCreateExecutionEvidence(projectId)
const deleteEvidence = useDeleteExecutionEvidence(projectId)
const createIncident = useCreateExecutionIncident(projectId)
const updateIncident = useUpdateExecutionIncident(projectId)
const createCost = useCreateExecutionActualCost(projectId)
const deleteCost = useDeleteExecutionActualCost(projectId)

const progressDraft = ref(0)
watch(
  () => ov.value?.progressPct,
  (p) => {
    if (p != null) progressDraft.value = Math.round(p)
  },
  { immediate: true },
)

const phaseFilter = ref<string>('ALL')
const phaseFilterOptions = [
  { value: 'ALL', label: 'Todas las fases' },
  ...Object.entries(PHASE_LABELS).map(([value, label]) => ({ value, label })),
]

const KANBAN_ORDER = ['BACKLOG', 'IN_PROGRESS', 'DONE', 'BLOCKED'] as const

const tasksByColumn = computed(() => {
  const tasks = ov.value?.tasks ?? []
  const pf = phaseFilter.value
  const filtered = pf === 'ALL' ? tasks : tasks.filter((t) => t.phase === pf)
  const map: Record<(typeof KANBAN_ORDER)[number], InteriorExecutionTaskDto[]> = {
    BACKLOG: [],
    IN_PROGRESS: [],
    DONE: [],
    BLOCKED: [],
  }
  for (const t of filtered) {
    switch (t.kanbanStatus) {
      case 'IN_PROGRESS':
        map.IN_PROGRESS.push(t)
        break
      case 'DONE':
        map.DONE.push(t)
        break
      case 'BLOCKED':
        map.BLOCKED.push(t)
        break
      default:
        map.BACKLOG.push(t)
    }
  }
  return map
})

function parseDay(s: string | null): number | null {
  if (!s) return null
  const t = new Date(`${s}T12:00:00`).getTime()
  return Number.isNaN(t) ? null : t
}

const ganttBounds = computed(() => {
  let min: number | null = null
  let max: number | null = null
  const bump = (x: number | null) => {
    if (x == null) return
    min = min == null ? x : Math.min(min, x)
    max = max == null ? x : Math.max(max, x)
  }
  for (const m of ov.value?.milestones ?? []) {
    bump(parseDay(m.plannedDate))
  }
  for (const t of ov.value?.tasks ?? []) {
    bump(parseDay(t.plannedStart))
    bump(parseDay(t.plannedEnd))
  }
  const today = Date.now()
  if (min == null) min = today - 7 * 86400000
  if (max == null) max = today + 120 * 86400000
  if (max <= min) max = min + 86400000 * 30
  return { min, max, span: max - min }
})

function ganttBar(task: InteriorExecutionTaskDto): { left: number; width: number } | null {
  const a = parseDay(task.plannedStart)
  const b = parseDay(task.plannedEnd)
  if (a == null || b == null || b < a) return null
  const { min, span } = ganttBounds.value
  const left = Math.max(0, ((a - min) / span) * 100)
  const width = Math.min(100 - left, ((b - a) / span) * 100)
  return { left, width: Math.max(width, 2) }
}

const timelineRows = computed(() => {
  const o = ov.value
  if (!o) return []
  type Row = { sortKey: string; title: string; meta: string; badge: string }
  const rows: Row[] = []
  for (const m of o.milestones) {
    rows.push({
      sortKey: m.plannedDate,
      title: m.title,
      meta: `Hito · ${m.plannedDate}${m.completedAt ? ' · Hecho' : ''}`,
      badge: m.completedAt ? 'Hecho' : 'Plan',
    })
  }
  for (const t of o.tasks) {
    const ps = t.plannedStart ?? ''
    const pe = t.plannedEnd ?? ''
    if (!ps && !pe) continue
    rows.push({
      sortKey: ps || pe,
      title: t.title,
      meta: `${PHASE_LABELS[t.phase] ?? t.phase} · ${ps || '—'} → ${pe || '—'}`,
      badge: KANBAN_LABELS[t.kanbanStatus] ?? t.kanbanStatus,
    })
  }
  return rows.sort((x, y) => x.sortKey.localeCompare(y.sortKey))
})

const costCols = [
  { key: 'occurredAt', label: 'Fecha', align: 'left' as const },
  { key: 'costCategory', label: 'Tipo', align: 'left' as const },
  { key: 'concept', label: 'Concepto', align: 'left' as const },
  { key: 'amount', label: 'Monto', align: 'left' as const },
  { key: 'mat', label: 'Material cat.', align: 'left' as const },
  { key: '_a', label: '', align: 'right' as const },
]

const incidentCols = [
  { key: 'reportedAtLabel', label: 'Reporte', align: 'left' as const },
  { key: 'severityLabel', label: 'Severidad', align: 'left' as const },
  { key: 'title', label: 'Título', align: 'left' as const },
  { key: 'statusLabel', label: 'Estado', align: 'left' as const },
  { key: '_a', label: '', align: 'right' as const },
]

const goHub = () => router.push(`${INTERIORISMO_BASE_PATH}/ejecucion`)
const goProject = () => {
  if (!ov.value) return
  router.push(`${INTERIORISMO_BASE_PATH}/proyectos/${ov.value.projectId}`)
}

async function saveProgress() {
  await patchProgress.mutateAsync(Math.min(100, Math.max(0, Number(progressDraft.value))))
}

/** --- Task modal --- */
const taskModal = ref(false)
const taskEditId = ref<string | null>(null)
const tPhase = ref('DESIGN')
const tTitle = ref('')
const tDesc = ref('')
const tKanban = ref('BACKLOG')
const tStart = ref('')
const tEnd = ref('')
const tProg = ref(0)

function openCreateTask() {
  taskEditId.value = null
  tPhase.value = 'DESIGN'
  tTitle.value = ''
  tDesc.value = ''
  tKanban.value = 'BACKLOG'
  tStart.value = ''
  tEnd.value = ''
  tProg.value = 0
  taskModal.value = true
}

function openEditTask(task: InteriorExecutionTaskDto) {
  taskEditId.value = task.id
  tPhase.value = task.phase
  tTitle.value = task.title
  tDesc.value = task.description ?? ''
  tKanban.value = task.kanbanStatus
  tStart.value = task.plannedStart ?? ''
  tEnd.value = task.plannedEnd ?? ''
  tProg.value = task.progressPct
  taskModal.value = true
}

async function saveTask() {
  const payload = {
    phase: tPhase.value,
    title: tTitle.value.trim(),
    description: tDesc.value.trim() || null,
    kanbanStatus: tKanban.value,
    plannedStart: tStart.value.trim() || null,
    plannedEnd: tEnd.value.trim() || null,
    progressPct: Number(tProg.value),
  }
  if (!payload.title) return
  if (taskEditId.value) {
    await updateTask.mutateAsync({ taskId: taskEditId.value, payload })
  } else {
    await createTask.mutateAsync(payload)
  }
  taskModal.value = false
}

async function removeTask(task: InteriorExecutionTaskDto) {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar tarea?',
    text: task.title,
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await deleteTask.mutateAsync(task.id)
}

/** --- Evidence modal --- */
const evModal = ref(false)
const evKind = ref('PHOTO')
const evTitle = ref('')
const evUrl = ref('')
const evCap = ref('')
const evTaskId = ref<string | number | null>('')

function openEvidence() {
  evKind.value = 'PHOTO'
  evTitle.value = ''
  evUrl.value = ''
  evCap.value = new Date().toISOString().slice(0, 16)
  evTaskId.value = ''
  evModal.value = true
}

async function saveEvidence() {
  await createEvidence.mutateAsync({
    taskId: evTaskId.value === '' || evTaskId.value == null ? null : String(evTaskId.value),
    kind: evKind.value,
    title: evTitle.value.trim(),
    fileUrl: evUrl.value.trim(),
    capturedAt: new Date(evCap.value).toISOString(),
  })
  evModal.value = false
}

async function removeEvidence(id: string) {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar evidencia?',
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await deleteEvidence.mutateAsync(id)
}

/** --- Incident modal --- */
const incModal = ref(false)
const incSev = ref('MEDIUM')
const incTitle = ref('')
const incDesc = ref('')
const incAt = ref('')

function openIncident() {
  incSev.value = 'MEDIUM'
  incTitle.value = ''
  incDesc.value = ''
  incAt.value = new Date().toISOString().slice(0, 16)
  incModal.value = true
}

async function saveIncident() {
  await createIncident.mutateAsync({
    severity: incSev.value,
    title: incTitle.value.trim(),
    description: incDesc.value.trim() || null,
    reportedAt: new Date(incAt.value).toISOString(),
  })
  incModal.value = false
}

async function closeIncident(id: string) {
  await updateIncident.mutateAsync({
    incidentId: id,
    payload: { status: 'CLOSED', closedAt: new Date().toISOString() },
  })
}

/** --- Cost modal --- */
const catalogParams = ref<ListInteriorCatalogMaterialsParams>({ page: 1, limit: 400 })
const { data: catalogRes } = useInteriorCatalogMaterialsList(catalogParams)

const costModal = ref(false)
const costCat = ref('LABOR')
const costConcept = ref('')
const costAmount = ref(0)
const costDate = ref('')
const costMatId = ref<string | number | null>('')

const catalogOptions = computed(() => [
  { value: '', label: 'Sin vínculo a catálogo' },
  ...(catalogRes.value?.data ?? []).map((m) => ({
    value: m.id,
    label: `${m.code} · ${m.name}`,
  })),
])

function openCost() {
  costCat.value = 'LABOR'
  costConcept.value = ''
  costAmount.value = 0
  costDate.value = new Date().toISOString().slice(0, 10)
  costMatId.value = ''
  costModal.value = true
}

async function saveCost() {
  await createCost.mutateAsync({
    costCategory: costCat.value,
    concept: costConcept.value.trim(),
    amount: Number(costAmount.value),
    occurredAt: costDate.value,
    catalogMaterialId:
      costMatId.value === '' || costMatId.value == null ? null : String(costMatId.value),
  })
  costModal.value = false
}

async function removeCost(id: string) {
  const ok = await markapAlert.confirmDanger({ title: '¿Eliminar costo?', confirmText: 'Eliminar' })
  if (!ok) return
  await deleteCost.mutateAsync(id)
}

const taskOptionsForEvidence = computed(() => [
  { value: '', label: 'Sin tarea asociada' },
  ...(ov.value?.tasks ?? []).map((t) => ({ value: t.id, label: `${PHASE_LABELS[t.phase] ?? t.phase}: ${t.title}` })),
])

const phaseOptionsTaskModal = Object.entries(PHASE_LABELS).map(([value, label]) => ({ value, label }))
const kanbanOptionsModal = Object.entries(KANBAN_LABELS).map(([value, label]) => ({ value, label }))
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start gap-3">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)] shrink-0"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="goHub"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div class="flex-1 min-w-0">
        <p class="text-xs uppercase tracking-wide" :style="{ color: 'var(--color-text-secondary)' }">Ejecución</p>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          {{ ov?.projectName ?? '…' }}
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          {{ ov?.projectCode }}
          <button
            type="button"
            class="ml-2 underline"
            :style="{ color: 'var(--color-primary)' }"
            @click="goProject"
          >
            Ficha proyecto
          </button>
        </p>
      </div>
      <BaseButton variant="primary" type="button" class="shrink-0" @click="openCreateTask">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nueva tarea
      </BaseButton>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
    </div>

    <div v-else-if="isError || !ov" class="text-center py-16 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
      No se pudo cargar el tablero de ejecución.
      <div class="mt-4">
        <BaseButton variant="outline" @click="goHub">Volver al hub</BaseButton>
      </div>
    </div>

    <template v-else-if="ov">
      <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
        <BaseTabs v-model="activeTab" :tabs="tabs" />
        <div class="p-5 space-y-6">
          <!-- Resumen -->
          <div v-show="activeTab === 'resumen'" class="space-y-6">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatsCard title="% Avance global" :value="`${Math.round(ov.progressPct)}%`">
                <template #icon><AppIcon icon="lucide:gauge" :size="20" color="var(--color-primary)" /></template>
              </StatsCard>
              <StatsCard title="Presup. referencia" :value="formatSol(ov.budgetReference.grandTotal)">
                <template #icon><AppIcon icon="lucide:file-text" :size="20" color="#2563eb" /></template>
              </StatsCard>
              <StatsCard title="Costo real acumulado" :value="formatSol(ov.costTotals.total)">
                <template #icon><AppIcon icon="lucide:wallet" :size="20" color="#16a34a" /></template>
              </StatsCard>
              <StatsCard title="Desviación" :value="ov.varianceVsBudget != null ? formatSol(ov.varianceVsBudget) : '—'">
                <template #icon><AppIcon icon="lucide:trending-down" :size="20" color="#d97706" /></template>
              </StatsCard>
            </div>
            <div class="flex flex-wrap items-end gap-4 p-4 rounded-xl border" :style="{ borderColor: 'var(--color-border)' }">
              <FormInput v-model="progressDraft" type="number" label="Actualizar avance global (0–100)" class="w-40" />
              <BaseButton variant="primary" type="button" :loading="patchProgress.isPending.value" @click="saveProgress">
                Guardar avance
              </BaseButton>
              <p class="text-xs flex-1 min-w-[200px]" :style="{ color: 'var(--color-text-muted)' }">
                Referencia presupuesto:
                {{ ov.budgetReference.code ?? '—' }}
                <template v-if="ov.budgetReference.version != null">· v{{ ov.budgetReference.version }}</template>
              </p>
            </div>
            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div v-for="ph in ['DESIGN', 'PURCHASES', 'PRODUCTION', 'INSTALLATION']" :key="ph" class="p-3 rounded-lg border" :style="{ borderColor: 'var(--color-border)' }">
                <p class="font-semibold" :style="{ color: 'var(--color-text-primary)' }">{{ PHASE_LABELS[ph] }}</p>
                <p class="mt-1" :style="{ color: 'var(--color-text-secondary)' }">
                  {{ ov.tasks.filter((t) => t.phase === ph).length }} tareas
                </p>
              </div>
            </div>
          </div>

          <!-- Kanban -->
          <div v-show="activeTab === 'kanban'" class="space-y-4">
            <FormSelect v-model="phaseFilter" label="Filtrar por fase" :options="phaseFilterOptions" class="max-w-xs" />
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div
                v-for="col in KANBAN_ORDER"
                :key="col"
                class="rounded-xl border p-3 min-h-[220px]"
                :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated, var(--color-surface))' }"
              >
                <p class="text-sm font-semibold mb-3" :style="{ color: 'var(--color-text-primary)' }">
                  {{ KANBAN_LABELS[col] }}
                </p>
                <ul class="space-y-2">
                  <li
                    v-for="task in tasksByColumn[col]"
                    :key="task.id"
                    class="p-3 rounded-lg border text-sm cursor-pointer hover:opacity-95"
                    :style="{ borderColor: 'var(--color-border)' }"
                    @click="openEditTask(task)"
                  >
                    <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ task.title }}</p>
                    <p class="text-xs mt-1" :style="{ color: 'var(--color-text-muted)' }">
                      {{ PHASE_LABELS[task.phase] ?? task.phase }} · {{ task.progressPct }}%
                    </p>
                    <div class="flex gap-2 mt-2">
                      <button type="button" class="text-xs underline text-red-600" @click.stop="removeTask(task)">Eliminar</button>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <div v-show="activeTab === 'timeline'" class="space-y-3">
            <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              Hitos del proyecto y tareas con fechas planificadas (seguimiento lineal).
            </p>
            <ul class="space-y-2">
              <li
                v-for="(row, idx) in timelineRows"
                :key="idx"
                class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border text-sm"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <span :style="{ color: 'var(--color-text-primary)' }">{{ row.title }}</span>
                <span class="flex items-center gap-2 shrink-0">
                  <span :style="{ color: 'var(--color-text-muted)' }">{{ row.meta }}</span>
                  <Badge variant="neutral">{{ row.badge }}</Badge>
                </span>
              </li>
            </ul>
          </div>

          <!-- Gantt -->
          <div v-show="activeTab === 'gantt'" class="space-y-4 overflow-x-auto">
            <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              Franjas proporcionales según fechas planificadas de cada tarea.
            </p>
            <div class="space-y-2 min-w-[640px]">
              <div
                v-for="task in ov.tasks"
                :key="task.id"
                class="grid grid-cols-[200px_1fr] gap-3 items-center text-sm"
              >
                <span class="truncate pr-2" :style="{ color: 'var(--color-text-primary)' }">{{ task.title }}</span>
                <div class="relative h-8 rounded-md overflow-hidden" style="background: var(--color-border)">
                  <template v-if="ganttBar(task)">
                    <div
                      class="absolute top-1 bottom-1 rounded-md"
                      :style="{
                        left: `${ganttBar(task)!.left}%`,
                        width: `${ganttBar(task)!.width}%`,
                        background: 'var(--color-primary)',
                      }"
                    />
                  </template>
                  <span v-else class="absolute inset-0 flex items-center px-2 text-xs opacity-70">Sin fechas plan.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Costos -->
          <div v-show="activeTab === 'costos'" class="space-y-3">
            <div class="flex justify-end">
              <BaseButton variant="primary" type="button" size="sm" @click="openCost">Registrar costo</BaseButton>
            </div>
            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div class="p-3 rounded-lg border" :style="{ borderColor: 'var(--color-border)' }">
                Mano de obra: <strong>{{ formatSol(ov.costTotals.labor) }}</strong>
              </div>
              <div class="p-3 rounded-lg border" :style="{ borderColor: 'var(--color-border)' }">
                Materiales: <strong>{{ formatSol(ov.costTotals.material) }}</strong>
              </div>
              <div class="p-3 rounded-lg border" :style="{ borderColor: 'var(--color-border)' }">
                Transporte: <strong>{{ formatSol(ov.costTotals.transport) }}</strong>
              </div>
              <div class="p-3 rounded-lg border" :style="{ borderColor: 'var(--color-border)' }">
                Gastos: <strong>{{ formatSol(ov.costTotals.expense) }}</strong>
              </div>
            </div>
            <DataTable
              empty-text="Sin costos reales registrados."
              :columns="costCols"
              :data="
                ov.actualCosts.map((c) => ({
                  ...c,
                  amount: formatSol(c.amount),
                  costCategory: COST_CATEGORY_LABELS[c.costCategory] ?? c.costCategory,
                  mat: c.materialCode ? `${c.materialCode}` : '—',
                  _a: '',
                }))
              "
              row-key="id"
            >
              <template #row="{ row }">
                <td class="py-2 px-3 text-sm">{{ (row as any).occurredAt }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).costCategory }}</td>
                <td class="py-2 px-3 text-sm max-w-[280px] truncate">{{ (row as any).concept }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).amount }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).mat }}</td>
                <td class="py-2 px-3 text-right">
                  <button type="button" class="text-xs text-red-600 underline" @click="removeCost((row as { id: string }).id)">
                    Quitar
                  </button>
                </td>
              </template>
            </DataTable>
          </div>

          <!-- Evidencias -->
          <div v-show="activeTab === 'evidencias'" class="space-y-4">
            <div class="flex justify-end">
              <BaseButton variant="primary" type="button" size="sm" @click="openEvidence">Nueva evidencia</BaseButton>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div
                v-for="e in ov.evidences"
                :key="e.id"
                class="rounded-xl border overflow-hidden flex flex-col"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <a :href="e.fileUrl" target="_blank" rel="noopener noreferrer" class="aspect-video bg-black/5 flex items-center justify-center overflow-hidden">
                  <img v-if="e.kind === 'PHOTO'" :src="e.fileUrl" alt="" class="w-full h-full object-cover" loading="lazy" />
                  <AppIcon v-else icon="lucide:file-text" :size="36" :style="{ color: 'var(--color-text-muted)' }" />
                </a>
                <div class="p-2 text-xs flex-1 flex flex-col gap-1">
                  <span class="font-medium line-clamp-2">{{ e.title }}</span>
                  <span :style="{ color: 'var(--color-text-muted)' }">{{ EVIDENCE_LABELS[e.kind] ?? e.kind }}</span>
                  <button type="button" class="text-red-600 underline mt-auto self-start" @click="removeEvidence(e.id)">Eliminar</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Incidencias -->
          <div v-show="activeTab === 'incidencias'" class="space-y-3">
            <div class="flex justify-end">
              <BaseButton variant="primary" type="button" size="sm" @click="openIncident">Registrar incidencia</BaseButton>
            </div>
            <DataTable
              empty-text="Sin incidencias."
              :columns="incidentCols"
              :data="
                ov.incidents.map((i) => ({
                  ...i,
                  reportedAtLabel: new Date(i.reportedAt).toLocaleString('es-PE'),
                  severityLabel: SEVERITY_LABELS[i.severity] ?? i.severity,
                  statusLabel: INCIDENT_STATUS_LABELS[i.status] ?? i.status,
                  _a: '',
                }))
              "
              row-key="id"
            >
              <template #row="{ row }">
                <td class="py-2 px-3 text-sm">{{ (row as any).reportedAtLabel }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).severityLabel }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).title }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).statusLabel }}</td>
                <td class="py-2 px-3 text-right">
                  <button
                    v-if="(row as { status: string }).status !== 'CLOSED'"
                    type="button"
                    class="text-xs underline"
                    @click="closeIncident((row as { id: string }).id)"
                  >
                    Cerrar
                  </button>
                </td>
              </template>
            </DataTable>
          </div>

          <!-- Comparativo -->
          <div v-show="activeTab === 'comparativo'" class="space-y-4 text-sm">
            <DataTable
              empty-text="Sin datos"
              :columns="[
                { key: 'c', label: 'Concepto', align: 'left' as const },
                { key: 'v', label: 'Monto', align: 'right' as const },
              ]"
              :data="[
                { id: '1', c: 'Total presupuesto referencia', v: formatSol(ov.budgetReference.grandTotal) },
                { id: '2', c: 'Costo real total', v: formatSol(ov.costTotals.total) },
                {
                  id: '3',
                  c: 'Variación (real − presupuesto)',
                  v: ov.varianceVsBudget != null ? formatSol(ov.varianceVsBudget) : '—',
                },
                { id: '4', c: '— Mano de obra ejecutada', v: formatSol(ov.costTotals.labor) },
                { id: '5', c: '— Materiales ejecutados', v: formatSol(ov.costTotals.material) },
                { id: '6', c: '— Transporte ejecutado', v: formatSol(ov.costTotals.transport) },
                { id: '7', c: '— Gastos', v: formatSol(ov.costTotals.expense) },
              ]"
              row-key="id"
            >
              <template #row="{ row }">
                <td class="py-2 px-3" :style="{ color: 'var(--color-text-primary)' }">{{ (row as any).c }}</td>
                <td class="py-2 px-3 text-right font-medium">{{ (row as any).v }}</td>
              </template>
            </DataTable>
          </div>
        </div>
      </div>
    </template>

    <!-- Modales -->
    <BaseModal v-model="taskModal" :title="taskEditId ? 'Editar tarea' : 'Nueva tarea'" size="lg">
      <div class="space-y-3">
        <FormSelect v-model="tPhase" label="Fase" :options="phaseOptionsTaskModal" />
        <FormInput v-model="tTitle" label="Título" required />
        <FormTextarea v-model="tDesc" label="Descripción" :rows="3" />
        <FormSelect v-model="tKanban" label="Columna Kanban" :options="kanbanOptionsModal" />
        <div class="grid sm:grid-cols-2 gap-3">
          <FormInput v-model="tStart" type="date" label="Inicio plan." />
          <FormInput v-model="tEnd" type="date" label="Fin plan." />
        </div>
        <FormInput v-model="tProg" type="number" label="% avance tarea" />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="secondary" type="button" @click="taskModal = false">Cancelar</BaseButton>
          <BaseButton variant="primary" type="button" :loading="createTask.isPending.value || updateTask.isPending.value" @click="saveTask">
            Guardar
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <BaseModal v-model="evModal" title="Nueva evidencia" size="md">
      <div class="space-y-3">
        <FormSelect v-model="evKind" label="Tipo" :options="Object.entries(EVIDENCE_LABELS).map(([value, label]) => ({ value, label }))" />
        <FormInput v-model="evTitle" label="Título" required />
        <FormInput v-model="evUrl" label="URL archivo / imagen" required />
        <FormInput v-model="evCap" type="datetime-local" label="Capturado el" />
        <FormSelect v-model="evTaskId" label="Tarea (opcional)" :options="taskOptionsForEvidence" />
        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" type="button" @click="evModal = false">Cancelar</BaseButton>
          <BaseButton variant="primary" type="button" :loading="createEvidence.isPending.value" @click="saveEvidence">Guardar</BaseButton>
        </div>
      </div>
    </BaseModal>

    <BaseModal v-model="incModal" title="Nueva incidencia" size="md">
      <div class="space-y-3">
        <FormSelect v-model="incSev" label="Severidad" :options="Object.entries(SEVERITY_LABELS).map(([value, label]) => ({ value, label }))" />
        <FormInput v-model="incTitle" label="Título" required />
        <FormTextarea v-model="incDesc" label="Descripción" :rows="3" />
        <FormInput v-model="incAt" type="datetime-local" label="Reportado el" />
        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" type="button" @click="incModal = false">Cancelar</BaseButton>
          <BaseButton variant="primary" type="button" :loading="createIncident.isPending.value" @click="saveIncident">Guardar</BaseButton>
        </div>
      </div>
    </BaseModal>

    <BaseModal v-model="costModal" title="Costo real" size="md">
      <div class="space-y-3">
        <FormSelect v-model="costCat" label="Categoría" :options="Object.entries(COST_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))" />
        <FormInput v-model="costConcept" label="Concepto" required />
        <FormInput v-model="costAmount" type="number" label="Monto (S/)" required />
        <FormInput v-model="costDate" type="date" label="Fecha" required />
        <FormSelect v-model="costMatId" label="Material catálogo (opcional)" :options="catalogOptions" />
        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" type="button" @click="costModal = false">Cancelar</BaseButton>
          <BaseButton variant="primary" type="button" :loading="createCost.isPending.value" @click="saveCost">Guardar</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
