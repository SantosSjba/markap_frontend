<script setup lang="ts">
import { reactive, ref, watch, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import type { DraggableEvent } from 'vue-draggable-plus'
import { BaseButton, Badge, AppIcon, PageHeader } from '@shared/components'
import BaseModal from '@shared/components/ui/BaseModal.vue'
import SaleProcessFollowUpPanel from '../components/SaleProcessFollowUpPanel.vue'
import { useVentasPipelineBoard, useVentasUpdateProcessQuiet } from '../../application/useVentasSales'
import { useVentasPipelineStages } from '@ventas/configuracion'
import type { SaleProcessListRow } from '../../domain/sales.types'
import {
  processStatusLabel,
  normalizePipelineStage,
  pipelineStageMeta,
  processStatusBadgeVariant,
  isForwardPipelineTransition,
  type PipelineStageValue,
} from '../../domain/pipeline.constants'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { markapAlert } from '@/shared/composables'
import MarkSaleLostModal from '../components/MarkSaleLostModal.vue'

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

function rebuildBoard(rows: SaleProcessListRow[]) {
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
  () => [orderedCodes.value, listResult.value?.data] as const,
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

function warnBackwardMoveBlocked() {
  const now = Date.now()
  if (now - blockedMoveToastAt.value < 2000) return
  blockedMoveToastAt.value = now
  void markapAlert.toast.warning(
    'No se puede retroceder de etapa. Use «Venta caída» si la operación no continúa.',
  )
}

/** Evita soltar la tarjeta en una etapa anterior (Sortable cancela el drop). */
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
  if (!isForwardPipelineTransition(itemStage, toStage, orderedCodes.value)) {
    warnBackwardMoveBlocked()
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
  if (fromStage === toStage) return
  if (!isForwardPipelineTransition(fromStage, toStage, orderedCodes.value)) {
    warnBackwardMoveBlocked()
    restoreBoardFromServer()
    return
  }
  patchQuiet(
    { id: row.id, body: { pipelineStage: toStage } },
    {
      onError: () => {
        restoreBoardFromServer()
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
  put(
    to: { el: HTMLElement },
    from: { el: HTMLElement },
    dragEl: HTMLElement,
  ) {
    const toStage = pipelineStageFromListEl(to.el)
    const fromStage = pipelineStageFromListEl(from.el)
    if (!toStage || !fromStage) return true
    if (toStage === fromStage) return true
    const itemStage = pipelineStageFromCardEl(dragEl) ?? fromStage
    return isForwardPipelineTransition(itemStage, toStage, orderedCodes.value)
  },
}))
const boardBusy = computed(() => savingMove.value)
</script>

<template>
  <div class="space-y-6 min-h-0 flex flex-col w-full">
    <PageHeader
      class="shrink-0"
      title="Pipeline de ventas"
      subtitle="Arrastra las tarjetas entre etapas para actualizar el proceso. Solo procesos activos."
      icon="lucide:columns-3"
    >
      <template #actions>
        <BaseButton variant="secondary" icon="lucide:list" @click="router.push('/ventas/procesos')">
          Ver listado
        </BaseButton>
        <BaseButton variant="primary" icon="lucide:plus" @click="goNewProcess">
          Nuevo proceso
        </BaseButton>
      </template>
    </PageHeader>

    <div
      v-if="configQuery.isError.value"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-warning-light)' }"
    >
      <AppIcon icon="lucide:triangle-alert" :size="18" color="var(--color-warning)" class="shrink-0" />
      <span :style="{ color: 'var(--color-text-primary)' }">
        No se cargó la configuración de etapas; se muestran valores por defecto.
      </span>
      <span class="text-xs max-w-md" style="color: var(--color-error)">{{
        getApiErrorMessage(configQuery.error.value)
      }}</span>
      <BaseButton variant="outline" size="sm" icon="lucide:settings" class="ml-auto shrink-0" @click="() => configQuery.refetch()">
        Reintentar configuración
      </BaseButton>
    </div>

    <div
      v-if="!isLoading && !boardIsError"
      class="flex w-full gap-2"
    >
      <div
        class="flex flex-1 min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          :style="{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }"
        >
          <AppIcon icon="lucide:layers" :size="16" color="var(--color-primary)" />
        </div>
        <div>
          <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">En tablero</p>
          <p class="font-semibold tabular-nums" :style="{ color: 'var(--color-text-primary)' }">{{ totalOnBoard }}</p>
        </div>
      </div>
      <div
        v-for="s in stageSummaries"
        :key="s.value"
        class="flex flex-1 min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          :style="{
            backgroundColor: `color-mix(in srgb, ${s.meta.color} 14%, transparent)`,
          }"
        >
          <AppIcon :icon="s.meta.icon" :size="16" :color="s.meta.color" />
        </div>
        <div class="min-w-0">
          <p class="text-xs truncate max-w-[120px] sm:max-w-none" :style="{ color: 'var(--color-text-muted)' }">
            {{ s.label }}
          </p>
          <p class="font-semibold tabular-nums" :style="{ color: s.meta.color }">{{ s.count }}</p>
        </div>
      </div>
      <div
        v-if="boardBusy"
        class="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ml-auto"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }"
      >
        <AppIcon icon="svg-spinners:ring-resize" :size="16" color="var(--color-primary)" />
        <span class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">Guardando…</span>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center gap-3 py-24 rounded-xl border"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
      <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">Cargando tablero…</p>
    </div>

    <div
      v-else-if="boardIsError"
      class="flex flex-col items-center justify-center gap-3 py-20 rounded-xl border text-center px-4"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div
        class="w-12 h-12 rounded-full flex items-center justify-center"
        :style="{ backgroundColor: 'color-mix(in srgb, var(--color-error) 12%, transparent)' }"
      >
        <AppIcon icon="lucide:cloud-off" :size="24" color="var(--color-error)" />
      </div>
      <p class="text-sm font-medium" style="color: var(--color-error)">{{ getApiErrorMessage(boardError) }}</p>
      <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchBoard()">Reintentar tablero</BaseButton>
    </div>

    <div
      v-else
      class="relative flex w-full gap-3 pb-2 flex-1 min-h-[420px] overflow-x-auto"
      :class="{ 'opacity-70 pointer-events-none': boardBusy }"
    >
      <div
        v-for="col in stageSummaries"
        :key="col.value"
        class="flex flex-col flex-1 min-w-[200px] basis-0 rounded-xl border min-h-[360px] max-h-[calc(100vh-260px)] overflow-hidden"
        :style="{
          backgroundColor: 'var(--color-surface-elevated)',
          borderColor: 'var(--color-border)',
          borderTopWidth: '3px',
          borderTopColor: col.meta.color,
        }"
      >
        <div
          class="px-3 py-2.5 border-b flex items-center gap-2 shrink-0"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            :style="{
              backgroundColor: `color-mix(in srgb, ${col.meta.color} 14%, transparent)`,
            }"
          >
            <AppIcon :icon="col.meta.icon" :size="17" :color="col.meta.color" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm truncate" :style="{ color: 'var(--color-text-primary)' }">
              {{ col.label }}
            </p>
          </div>
          <span
            class="text-xs tabular-nums font-medium px-2 py-0.5 rounded-md shrink-0"
            :style="{
              color: col.meta.color,
              backgroundColor: `color-mix(in srgb, ${col.meta.color} 14%, transparent)`,
            }"
          >
            {{ col.count }}
          </span>
        </div>
        <VueDraggable
          tag="div"
          :data-pipeline-stage="col.value"
          :model-value="boardList(col.value)"
          :group="group"
          :move="onPipelineMove"
          :animation="200"
          :empty-insert-threshold="24"
          class="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]"
          ghost-class="opacity-50"
          drag-class="cursor-grabbing"
          @update:model-value="(v: SaleProcessListRow[]) => onUpdateBoardColumn(col.value, v)"
          @add="(e: DraggableEvent<SaleProcessListRow>) => onCardAdded(col.value, e)"
          @end="onDragEnd"
        >
          <div
            v-if="!boardList(col.value).length"
            class="flex flex-col items-center justify-center gap-2 py-10 px-3 text-center rounded-lg border border-dashed"
            :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }"
          >
            <AppIcon :icon="col.meta.icon" :size="28" :color="col.meta.color" class="opacity-40" />
            <p class="text-xs">Arrastra un proceso aquí</p>
          </div>
          <div
            v-for="p in boardList(col.value)"
            :key="p.id"
            :data-process-id="p.id"
            :data-pipeline-stage="normalizePipelineStage(p.pipelineStage)"
            class="rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-sm transition hover:shadow-md flex flex-col"
            :style="{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }"
          >
            <div class="flex-1 min-h-0">
              <div class="flex items-start justify-between gap-2 mb-2">
                <span
                  class="font-mono text-xs inline-flex items-center gap-1"
                  :style="{ color: 'var(--color-text-muted)' }"
                >
                  <AppIcon icon="lucide:hash" :size="12" />
                  {{ p.code }}
                </span>
                <Badge :variant="processStatusBadgeVariant(p.status)" class="text-[10px] shrink-0">
                  {{ processStatusLabel(p.status) }}
                </Badge>
              </div>
              <p
                class="font-medium text-sm leading-snug flex items-start gap-1.5"
                :style="{ color: 'var(--color-text-primary)' }"
              >
                <AppIcon icon="lucide:user" :size="14" class="shrink-0 mt-0.5" color="var(--color-primary)" />
                <span class="min-w-0">{{ p.buyer.fullName }}</span>
              </p>
              <p
                class="text-xs mt-1.5 line-clamp-2 flex items-start gap-1.5"
                :style="{ color: 'var(--color-text-secondary)' }"
              >
                <AppIcon icon="lucide:building-2" :size="13" class="shrink-0 mt-0.5" color="var(--color-text-muted)" />
                <span>{{ p.property.code }} — {{ p.property.addressLine }}</span>
              </p>
              <div
                v-if="p.agent"
                class="mt-2 flex items-center gap-1.5 text-xs rounded-md px-2 py-1"
                :style="{
                  color: 'var(--color-text-muted)',
                  backgroundColor: 'var(--color-hover)',
                }"
              >
                <AppIcon icon="lucide:user-check" :size="13" color="var(--color-primary)" />
                {{ p.agent.fullName }}
              </div>
            </div>
            <div
              class="flex items-center justify-center gap-1.5 mt-3 pt-2 border-t"
              :style="{ borderColor: 'var(--color-border)' }"
              @click.stop
            >
              <BaseButton
                variant="primary"
                size="sm"
                class="!p-2 shrink-0"
                icon="lucide:message-square-plus"
                title="Seguimiento"
                aria-label="Seguimiento"
                @click="openFollowUp(p)"
              />
              <BaseButton
                variant="outline"
                size="sm"
                class="!p-2 shrink-0"
                icon="lucide:eye"
                title="Ficha del proceso"
                aria-label="Ficha del proceso"
                @click="goDetail(p)"
              />
              <BaseButton
                variant="ghost"
                size="sm"
                class="!p-2 shrink-0"
                icon="lucide:ban"
                :loading="markingLostId === p.id"
                :disabled="!!markingLostId && markingLostId !== p.id"
                title="Registrar venta caída"
                aria-label="Registrar venta caída"
                @click="openMarkLost(p)"
              />
            </div>
          </div>
        </VueDraggable>
      </div>
    </div>

    <div
      v-if="!isLoading && !boardIsError"
      class="rounded-xl border px-4 py-3 flex items-start gap-3 text-sm shrink-0"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <div
        class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        :style="{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }"
      >
        <AppIcon icon="lucide:info" :size="18" color="var(--color-primary)" />
      </div>
      <p :style="{ color: 'var(--color-text-secondary)' }">
        <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">Flujo:</span>
        {{ stageOptions.map((o) => o.label).join(' → ') }} (solo avance; no retroceder).
        Si la venta no continúa, use <strong>Venta caída</strong> — anula comisiones pendientes.
        <strong>Seguimiento</strong> y <strong>Ficha</strong> para el detalle del proceso.
      </p>
    </div>

    <MarkSaleLostModal
      v-model="markLostOpen"
      :process-code="markLostTarget?.code"
      :loading="!!markingLostId"
      @confirm="onMarkLostConfirmed"
    />

    <BaseModal v-model="followUpOpen" size="xl" @close="onFollowUpModalClosed">
      <template #title>
        <div class="flex items-center gap-2 min-w-0">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            :style="{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }"
          >
            <AppIcon icon="lucide:message-square-plus" :size="17" color="var(--color-primary)" />
          </div>
          <span class="truncate">
            {{ followUpCode ? `Seguimiento — ${followUpCode}` : 'Seguimiento' }}
          </span>
        </div>
      </template>
      <div v-if="followUpProcessId" class="-m-4 p-4 max-h-[min(70vh,640px)] overflow-y-auto">
        <SaleProcessFollowUpPanel :process-id="followUpProcessId" layout="tabs" compact />
      </div>
    </BaseModal>
  </div>
</template>
