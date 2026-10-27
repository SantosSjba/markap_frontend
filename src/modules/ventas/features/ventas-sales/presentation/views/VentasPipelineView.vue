<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('ventas')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import BaseAlert from '@shared/presentation/components/ui/BaseAlert.vue'
import { reactive, ref, watch, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import type { DraggableEvent } from 'vue-draggable-plus'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import SaleProcessFollowUpPanel from '../components/SaleProcessFollowUpPanel.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import Avatar from '@shared/presentation/components/ui/Avatar.vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { formatCurrencyRounded } from '@shared/utils/formatters'
import { useVentasPipelineBoard, useVentasUpdateProcessQuiet } from '../composables/useVentasSales'
import { useVentasPipelineStages } from '../../../ventas-configuracion/presentation/composables/useVentasConfig'
import type { SaleProcessListRow } from '../../domain/sales.types'
import {
  normalizePipelineStage,
  pipelineStageMeta,
  classifyStageMove,
  STAGE_REQUIRED_DOCUMENT,
  type PipelineStageValue,
} from '../../domain/pipeline.constants'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import MarkSaleLostModal from '../components/MarkSaleLostModal.vue'
import StageRollbackModal from '../components/StageRollbackModal.vue'
/**
 * Pipeline de ventas: tablero por etapas (vue-draggable-plus / SortableJS) con búsqueda y filtro
 * por asesor, totales por moneda en cada columna y tarjetas con comprador, propietario, inmueble,
 * precio y días en la etapa. Solo avance de etapa; «Venta caída» saca el proceso del tablero.
 */
const router = useRouter()

const followUpOpen = ref(false)
const followUpProcessId = ref('')
const followUpCode = ref('')

const markLostOpen = ref(false)
const markLostTarget = ref<SaleProcessListRow | null>(null)
const markingLostId = ref<string | null>(null)

function openFollowUp(p: SaleProcessListRow) {
  followUpProcessId.value = p.id
  followUpCode.value = p.code
  followUpOpen.value = true
}

function onFollowUpModalClosed() {
  followUpProcessId.value = ''
  followUpCode.value = ''
}

const boards = reactive<Record<string, SaleProcessListRow[]>>({})

function boardList(stage: string): SaleProcessListRow[] {
  let list = boards[stage]
  if (!list) {
    list = []
    boards[stage] = list
  }
  return list
}

const { stageOptions, orderedCodes, query: configQuery } = useVentasPipelineStages()
const {
  data: listResult,
  isLoading,
  isError: boardIsError,
  error: boardError,
  refetch: refetchBoard,
} = useVentasPipelineBoard()
const { mutate: patchQuiet, isPending: savingMove } = useVentasUpdateProcessQuiet()

const totalOnBoard = computed(() => listResult.value?.data?.length ?? 0)

const stageSummaries = computed(() =>
  stageOptions.value.map((col) => ({
    ...col,
    meta: pipelineStageMeta(col.value),
    count: boardList(col.value).length,
  })),
)

// ── Filtros del tablero ──
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const filterAgentId = ref('')

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-PE')

function matchesFilters(p: SaleProcessListRow): boolean {
  if (filterAgentId.value && p.agent?.id !== filterAgentId.value) return false
  const q = normalize(debouncedSearch.value.trim())
  if (!q) return true
  const haystack = [
    p.code,
    p.title,
    p.property.code,
    p.property.addressLine,
    ...(p.buyers ?? [p.buyer]).map((b) => b.fullName),
    ...(p.owners ?? []).map((o) => o.fullName),
  ]
    .filter(Boolean)
    .join(' ')
  return normalize(haystack).includes(q)
}

const agentFilterOptions = computed(() => {
  const agents = new Map<string, string>()
  for (const p of listResult.value?.data ?? []) if (p.agent) agents.set(p.agent.id, p.agent.fullName)
  return [
    { value: '', label: 'Todos los asesores' },
    ...[...agents.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label)),
  ]
})
const hasFilters = computed(() => !!debouncedSearch.value.trim() || !!filterAgentId.value)
const visibleCount = computed(() => orderedCodes.value.reduce((n, c) => n + boardList(c).length, 0))

/** Precio de lista por moneda de una columna (no se suman monedas distintas) */
function columnTotals(stage: string): string {
  const totals = new Map<string, number>()
  for (const p of boardList(stage)) {
    if (p.property.salePrice == null) continue
    const cur = p.property.saleCurrency ?? 'PEN'
    totals.set(cur, (totals.get(cur) ?? 0) + p.property.salePrice)
  }
  return [...totals.entries()].map(([cur, amount]) => formatCurrencyRounded(amount, cur)).join(' · ')
}

/** Días desde el último movimiento del proceso */
function daysSince(p: SaleProcessListRow): number | null {
  if (!p.updatedAt) return null
  return Math.max(0, Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / 86_400_000))
}
function daysLabel(days: number): string {
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Hace 1 día'
  return `Hace ${days} días`
}

function rebuildBoard(allRows: SaleProcessListRow[]) {
  const rows = allRows.filter(matchesFilters)
  const codes = orderedCodes.value
  for (const c of codes) {
    boardList(c).length = 0
  }
  for (const key of Object.keys(boards)) {
    if (!codes.includes(key)) delete boards[key]
  }
  for (const p of rows) {
    const st = normalizePipelineStage(p.pipelineStage)
    boardList(st).push(p)
  }
}

watch(
  orderedCodes,
  (codes) => {
    for (const c of codes) {
      if (!boards[c]) boards[c] = []
    }
  },
  { immediate: true },
)

watch(
  () => [orderedCodes.value, listResult.value?.data, debouncedSearch.value, filterAgentId.value] as const,
  () => {
    if (savingMove.value) return
    const rows = listResult.value?.data
    if (!rows) return
    rebuildBoard(rows)
  },
  { immediate: true, deep: true },
)

function removeProcessFromBoards(processId: string) {
  for (const code of orderedCodes.value) {
    const list = boardList(code)
    const idx = list.findIndex((r) => r.id === processId)
    if (idx >= 0) list.splice(idx, 1)
  }
}

function onUpdateBoardColumn(stage: string, v: SaleProcessListRow[]) {
  boards[stage] = v
}

const blockedMoveToastAt = ref(0)

function pipelineStageFromListEl(el: HTMLElement | undefined | null): string | undefined {
  return el?.dataset?.pipelineStage
}

function pipelineStageFromCardEl(el: HTMLElement | undefined | null): string | undefined {
  return el?.dataset?.pipelineStage
}

function warnSkipBlocked(toStage: string) {
  const now = Date.now()
  if (now - blockedMoveToastAt.value < 2000) return
  blockedMoveToastAt.value = now
  const doc = STAGE_REQUIRED_DOCUMENT[toStage]
  void markapAlert.toast.warning(
    'Se avanza una etapa a la vez',
    doc ? `Complete primero la etapa siguiente; cada una exige su documento (p. ej. ${doc.label}).` : undefined,
  )
}

const stageLabel = (code: string) => stageOptions.value.find((o) => o.value === code)?.label ?? code

/** Bloquea saltar etapas al arrastrar; avanzar a la siguiente o retroceder sí se permite. */
function onPipelineMove(evt: {
  from: HTMLElement
  to: HTMLElement
  dragged: HTMLElement
}): boolean {
  const fromStage = pipelineStageFromListEl(evt.from)
  const toStage = pipelineStageFromListEl(evt.to)
  if (!fromStage || !toStage) return true
  if (fromStage === toStage) return true
  const itemStage = pipelineStageFromCardEl(evt.dragged) ?? fromStage
  if (classifyStageMove(itemStage, toStage, orderedCodes.value) === 'skip') {
    warnSkipBlocked(toStage)
    return false
  }
  return true
}

function restoreBoardFromServer() {
  nextTick(() => {
    const rows = listResult.value?.data
    if (rows) rebuildBoard(rows)
    else void refetchBoard()
  })
}

function onCardAdded(targetStage: string, evt: DraggableEvent<SaleProcessListRow>) {
  const row =
    evt.data ??
    boardList(targetStage).find((r) => r.id === evt.item?.dataset?.processId) ??
    boardList(targetStage)[evt.newIndex ?? -1]
  if (!row?.id) {
    restoreBoardFromServer()
    return
  }
  const fromStage = normalizePipelineStage(row.pipelineStage)
  const toStage = targetStage as PipelineStageValue
  const move = classifyStageMove(fromStage, toStage, orderedCodes.value)
  if (move === 'same') return
  if (move === 'skip') {
    warnSkipBlocked(toStage)
    restoreBoardFromServer()
    return
  }
  if (move === 'backward') {
    // Retroceder pide motivo; hasta confirmarlo la tarjeta vuelve a su columna
    rollbackTarget.value = { row, fromStage, toStage }
    restoreBoardFromServer()
    return
  }
  // Avance a la siguiente etapa: el servidor exige el documento de la etapa
  patchQuiet(
    { id: row.id, body: { pipelineStage: toStage } },
    {
      onError: () => {
        restoreBoardFromServer()
      },
    },
  )
}

const rollbackTarget = ref<{ row: SaleProcessListRow; fromStage: string; toStage: string } | null>(null)
const rollingBack = ref(false)
function confirmRollback(reason: string) {
  const t = rollbackTarget.value
  if (!t) return
  rollingBack.value = true
  patchQuiet(
    { id: t.row.id, body: { pipelineStage: t.toStage, stageChangeReason: reason } },
    {
      onSuccess: () => {
        rollbackTarget.value = null
        void markapAlert.toast.success('Proceso regresado de etapa', 'El motivo quedó en sus actividades.')
      },
      onSettled: () => {
        rollingBack.value = false
      },
    },
  )
}

function onDragEnd() {
  nextTick(() => {
    const rows = listResult.value?.data
    if (!rows) return
    for (const code of orderedCodes.value) {
      for (const p of boardList(code)) {
        if (normalizePipelineStage(p.pipelineStage) !== code) {
          rebuildBoard(rows)
          return
        }
      }
    }
  })
}

function openMarkLost(p: SaleProcessListRow) {
  markLostTarget.value = p
  markLostOpen.value = true
}

function onMarkLostConfirmed(reason: string) {
  const p = markLostTarget.value
  if (!p) return
  markingLostId.value = p.id
  patchQuiet(
    { id: p.id, body: { status: 'LOST', lostReason: reason } },
    {
      onSuccess: () => {
        removeProcessFromBoards(p.id)
        markLostOpen.value = false
        markLostTarget.value = null
      },
      onSettled: () => {
        markingLostId.value = null
      },
    },
  )
}

function goDetail(p: SaleProcessListRow) {
  void router.push(`/ventas/procesos/${p.id}`)
}

function goNewProcess() {
  void router.push('/ventas/procesos/nuevo')
}

const group = computed(() => ({
  name: 'ventas-pipeline',
  pull: true,
  put(to: { el: HTMLElement }, from: { el: HTMLElement }, dragEl: HTMLElement) {
    const toStage = pipelineStageFromListEl(to.el)
    const fromStage = pipelineStageFromListEl(from.el)
    if (!toStage || !fromStage) return true
    if (toStage === fromStage) return true
    const itemStage = pipelineStageFromCardEl(dragEl) ?? fromStage
    return classifyStageMove(itemStage, toStage, orderedCodes.value) !== 'skip'
  },
}))
const boardBusy = computed(() => savingMove.value)
</script>

<template>
  <div class="flex w-full min-h-0 flex-col space-y-6">
    <PageHeader class="shrink-0" title="Pipeline de ventas" subtitle="Arrastra las tarjetas para avanzar de una etapa a la vez o regresar con motivo · solo procesos activos">
      <template #actions>
        <div class="flex gap-2 w-full sm:w-auto">
          <BaseButton variant="outline" icon="lucide:list" class="flex-1 sm:flex-none justify-center" @click="router.push({ name: 'ventas-procesos' })">
            Listado
          </BaseButton>
          <BaseButton v-if="canWrite" variant="primary" icon="lucide:plus" class="flex-1 sm:flex-none justify-center" @click="goNewProcess">
            Nuevo Proceso
          </BaseButton>
        </div>
      </template>
    </PageHeader>

    <BaseAlert v-if="configQuery.isError.value" type="warning">
      <span class="text-gray-800 dark:text-white/90">No se cargó la configuración de etapas; se muestran valores por defecto.</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => configQuery.refetch()">Reintentar</BaseButton>
    </BaseAlert>

    <!-- Barra: búsqueda, asesor y totales -->
    <BaseCard v-if="!isLoading && !boardIsError" class="flex flex-col gap-3 sm:flex-row sm:items-center" padding="sm">
      <div class="min-w-0 flex-1">
        <SearchInput v-model="searchInput" placeholder="Buscar por código, comprador, propietario o inmueble..." />
      </div>
      <div class="w-full sm:w-[220px]">
        <FormSelect v-model="filterAgentId" :options="agentFilterOptions" placeholder="Todos los asesores" />
      </div>
      <div class="flex shrink-0 items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <AppIcon icon="lucide:layers" :size="16" color="var(--color-primary)" />
        <span v-if="hasFilters"><strong class="text-gray-800 dark:text-white/90">{{ visibleCount }}</strong> de {{ totalOnBoard }}</span>
        <span v-else><strong class="text-gray-800 dark:text-white/90">{{ totalOnBoard }}</strong> en el tablero</span>
        <span v-if="boardBusy" class="inline-flex items-center gap-1 text-theme-xs">
          <AppIcon icon="svg-spinners:ring-resize" :size="14" color="var(--color-primary)" />Guardando…
        </span>
      </div>
    </BaseCard>

    <BaseCard v-if="isLoading" class="flex flex-col items-center justify-center gap-3 py-24">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
      <p class="text-sm text-gray-500 dark:text-gray-400">Cargando tablero…</p>
    </BaseCard>

    <BaseCard v-else-if="boardIsError" class="flex flex-col items-center justify-center gap-3 py-20 text-center px-4">
      <AppIcon icon="lucide:cloud-off" :size="28" color="var(--color-error)" />
      <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(boardError) }}</p>
      <BaseButton variant="outline" size="sm" @click="() => refetchBoard()">Reintentar</BaseButton>
    </BaseCard>

    <div
      v-else
      class="relative flex w-full flex-1 gap-3 overflow-x-auto pb-2 min-h-[420px]"
      :class="{ 'pointer-events-none opacity-70': boardBusy }"
    >
      <div
        v-for="col in stageSummaries"
        :key="col.value"
        class="flex min-w-[260px] flex-1 basis-0 flex-col overflow-hidden rounded-2xl border border-t-4 border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/2 max-h-[calc(100vh-260px)] min-h-[360px]"
        :style="{ borderTopColor: col.meta.color }"
      >
        <!-- Cabecera de columna -->
        <div class="shrink-0 border-b border-gray-200 px-3 py-3 dark:border-gray-800">
          <div class="flex items-center gap-2">
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              :style="{ backgroundColor: `color-mix(in srgb, ${col.meta.color} 14%, transparent)` }"
            >
              <AppIcon :icon="col.meta.icon" :size="17" :color="col.meta.color" />
            </div>
            <p class="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800 dark:text-white/90">{{ col.label }}</p>
            <span
              class="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium tabular-nums"
              :style="{ color: col.meta.color, backgroundColor: `color-mix(in srgb, ${col.meta.color} 14%, transparent)` }"
            >
              {{ col.count }}
            </span>
          </div>
          <p class="mt-1.5 truncate text-theme-xs tabular-nums text-gray-500 dark:text-gray-400">
            {{ columnTotals(col.value) || 'Sin montos' }}
          </p>
        </div>

        <VueDraggable
          tag="div"
          :data-pipeline-stage="col.value"
          :model-value="boardList(col.value)"
          :group="group"
          :move="onPipelineMove"
          :animation="200"
          :empty-insert-threshold="24"
          class="flex-1 space-y-2 overflow-y-auto p-2 min-h-[120px]"
          ghost-class="opacity-50"
          drag-class="cursor-grabbing"
          @update:model-value="(v: SaleProcessListRow[]) => onUpdateBoardColumn(col.value, v)"
          @add="(e: DraggableEvent<SaleProcessListRow>) => onCardAdded(col.value, e)"
          @end="onDragEnd"
        >
          <div
            v-if="!boardList(col.value).length"
            class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 px-3 py-10 text-center text-gray-400 dark:border-gray-800 dark:text-gray-500"
          >
            <AppIcon :icon="col.meta.icon" :size="28" :color="col.meta.color" class="opacity-40" />
            <p class="text-xs">{{ hasFilters ? 'Sin procesos con estos filtros' : 'Arrastra un proceso aquí' }}</p>
          </div>

          <article
            v-for="p in boardList(col.value)"
            :key="p.id"
            :data-process-id="p.id"
            :data-pipeline-stage="normalizePipelineStage(p.pipelineStage)"
            class="flex cursor-grab flex-col rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs transition hover:shadow-md active:cursor-grabbing dark:border-gray-800 dark:bg-gray-900"
          >
            <div class="flex items-start justify-between gap-2">
              <button type="button" class="text-left" @click.stop="goDetail(p)">
                <p class="text-sm font-semibold text-brand-500 hover:underline dark:text-brand-400">{{ p.code }}</p>
                <p v-if="p.title" class="line-clamp-1 text-theme-xs text-gray-500 dark:text-gray-400">{{ p.title }}</p>
              </button>
              <span v-if="daysSince(p) !== null" class="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-white/5 dark:text-gray-400" :title="'Último movimiento'">
                {{ daysLabel(daysSince(p)!) }}
              </span>
            </div>

            <p class="mt-2 text-base font-bold tabular-nums text-gray-800 dark:text-white/90">
              {{ p.property.salePrice != null ? formatCurrencyRounded(p.property.salePrice, p.property.saleCurrency ?? 'PEN') : 'Sin precio' }}
            </p>

            <div class="mt-2 space-y-1.5 text-xs">
              <p class="flex items-start gap-1.5 text-gray-600 dark:text-gray-300">
                <AppIcon icon="lucide:map-pin" :size="13" class="mt-0.5 shrink-0" color="var(--color-text-muted)" />
                <span class="line-clamp-2"><strong class="font-medium">{{ p.property.code }}</strong> · {{ p.property.addressLine }}</span>
              </p>
              <p class="flex items-center gap-1.5 text-gray-800 dark:text-white/90">
                <AppIcon icon="lucide:user" :size="13" class="shrink-0" color="var(--color-text-muted)" />
                <span class="truncate">{{ p.buyer.fullName }}</span>
                <span v-if="(p.buyers?.length ?? 1) > 1" class="shrink-0 text-gray-400">+{{ p.buyers!.length - 1 }}</span>
                <span class="ml-auto shrink-0 text-[11px] text-gray-400 dark:text-gray-500">Comprador</span>
              </p>
              <p v-if="p.owners?.length" class="flex items-center gap-1.5 text-gray-800 dark:text-white/90">
                <AppIcon icon="lucide:building-2" :size="13" class="shrink-0" color="var(--color-text-muted)" />
                <span class="truncate">{{ p.owners[0]!.fullName }}</span>
                <span v-if="p.owners.length > 1" class="shrink-0 text-gray-400">+{{ p.owners.length - 1 }}</span>
                <span class="ml-auto shrink-0 text-[11px] text-gray-400 dark:text-gray-500">Propietario</span>
              </p>
            </div>

            <div class="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5 dark:border-gray-800" @click.stop>
              <div class="flex min-w-0 items-center gap-1.5">
                <template v-if="p.agent">
                  <Avatar :name="p.agent.fullName" size="sm" />
                  <span class="truncate text-[11px] text-gray-500 dark:text-gray-400" :title="p.agent.fullName">{{ p.agent.fullName }}</span>
                </template>
                <span v-else class="text-[11px] text-gray-400 dark:text-gray-500">Sin asesor</span>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  class="!p-1.5"
                  icon="lucide:message-square-plus"
                  title="Seguimiento"
                  aria-label="Seguimiento"
                  @click="openFollowUp(p)"
                />
                <BaseButton
                  variant="ghost"
                  size="sm"
                  class="!p-1.5"
                  icon="lucide:eye"
                  title="Ver detalle"
                  aria-label="Ver detalle"
                  @click="goDetail(p)"
                />
                <BaseButton
                  v-if="canWrite"
                  variant="ghost"
                  size="sm"
                  class="!p-1.5 text-error-500"
                  icon="lucide:ban"
                  :loading="markingLostId === p.id"
                  :disabled="!!markingLostId && markingLostId !== p.id"
                  title="Registrar venta caída"
                  aria-label="Registrar venta caída"
                  @click="openMarkLost(p)"
                />
              </div>
            </div>
          </article>
        </VueDraggable>
      </div>
    </div>

    <p v-if="!isLoading && !boardIsError" class="flex items-start gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
      <AppIcon icon="lucide:info" :size="14" class="mt-0.5 shrink-0" />
      <span>
        Flujo: {{ stageOptions.map((o) => o.label).join(' → ') }}. Se avanza una etapa a la vez, con su documento cargado en Cumplimiento legal (arras, minuta, escritura); para regresar se pide el motivo. Si la venta no continúa usa
        <strong>Venta caída</strong> (anula las comisiones pendientes). El monto de cada columna es el precio de lista por moneda.
      </span>
    </p>

    <StageRollbackModal
      :model-value="!!rollbackTarget"
      :process-code="rollbackTarget?.row.code"
      :from-label="rollbackTarget ? stageLabel(rollbackTarget.fromStage) : ''"
      :to-label="rollbackTarget ? stageLabel(rollbackTarget.toStage) : ''"
      :loading="rollingBack"
      @update:model-value="(v: boolean) => !v && (rollbackTarget = null)"
      @confirm="confirmRollback"
    />
    <MarkSaleLostModal
      v-model="markLostOpen"
      :process-code="markLostTarget?.code"
      :loading="!!markingLostId"
      @confirm="onMarkLostConfirmed"
    />

    <BaseModal v-model="followUpOpen" size="xl" @close="onFollowUpModalClosed">
      <template #title>
        <div class="flex min-w-0 items-center gap-2">
          <AppIcon icon="lucide:message-square-plus" :size="18" color="var(--color-primary)" />
          <span class="truncate">{{ followUpCode ? `Seguimiento — ${followUpCode}` : 'Seguimiento' }}</span>
        </div>
      </template>
      <div v-if="followUpProcessId" class="-m-4 max-h-[min(70vh,640px)] overflow-y-auto p-4">
        <SaleProcessFollowUpPanel :process-id="followUpProcessId" layout="tabs" compact />
      </div>
    </BaseModal>
  </div>
</template>
