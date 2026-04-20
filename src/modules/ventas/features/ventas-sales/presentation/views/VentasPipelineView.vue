<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import type { DraggableEvent } from 'vue-draggable-plus'
import { BaseButton, Badge, AppIcon } from '@shared/components'
import BaseModal from '@shared/components/ui/BaseModal.vue'
import SaleProcessFollowUpPanel from '../components/SaleProcessFollowUpPanel.vue'
import { useVentasPipelineBoard, useVentasUpdateProcessQuiet } from '../../application/useVentasSales'
import { useVentasPipelineStages } from '@ventas/configuracion'
import type { SaleProcessListRow } from '../../domain/sales.types'
import {
  processStatusLabel,
  normalizePipelineStage,
  type PipelineStageValue,
} from '../../domain/pipeline.constants'

const router = useRouter()

const followUpOpen = ref(false)
const followUpProcessId = ref('')
const followUpCode = ref('')

function openFollowUp(p: SaleProcessListRow) {
  followUpProcessId.value = p.id
  followUpCode.value = p.code
  followUpOpen.value = true
}

/** Limpia el proceso al cerrar el modal (el propio modal controla `followUpOpen`). */
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
const { data: listResult, isLoading, isFetching } = useVentasPipelineBoard()
const { mutate: patchQuiet, isPending: savingMove } = useVentasUpdateProcessQuiet()

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
    const rows = listResult.value?.data
    if (!rows) return
    rebuildBoard(rows)
  },
  { immediate: true, deep: true },
)

function onUpdateBoardColumn(stage: string, v: SaleProcessListRow[]) {
  boards[stage] = v
}

function onCardAdded(targetStage: string, evt: DraggableEvent<SaleProcessListRow>) {
  const row = boardList(targetStage)[evt.newIndex ?? -1]
  if (!row?.id) return
  if (normalizePipelineStage(row.pipelineStage) === targetStage) return
  patchQuiet({ id: row.id, body: { pipelineStage: targetStage as PipelineStageValue } })
}

function goDetail(p: SaleProcessListRow) {
  void router.push(`/ventas/procesos/${p.id}`)
}

const group = { name: 'ventas-pipeline', pull: true, put: true }
</script>

<template>
  <div class="space-y-6 min-h-0 flex flex-col">
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 shrink-0">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Pipeline de ventas
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Arrastra las tarjetas entre etapas para actualizar el proceso. Solo procesos activos.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="secondary" class="flex items-center gap-2" @click="router.push('/ventas/procesos')">
          <AppIcon icon="lucide:list" :size="18" />
          Ver listado
        </BaseButton>
        <BaseButton variant="primary" class="flex items-center gap-2" @click="router.push('/ventas/procesos')">
          <AppIcon icon="lucide:plus" :size="18" />
          Nuevo proceso
        </BaseButton>
      </div>
    </div>

    <div
      v-if="isLoading || configQuery.isLoading.value"
      class="flex justify-center py-24 rounded-xl border"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
    </div>

    <div
      v-else
      class="flex gap-3 overflow-x-auto pb-2 flex-1 min-h-[420px] -mx-1 px-1"
      :class="{ 'opacity-70 pointer-events-none': isFetching || savingMove }"
    >
      <div
        v-for="col in stageOptions"
        :key="col.value"
        class="flex flex-col w-[min(100%,280px)] shrink-0 rounded-xl border min-h-[360px] max-h-[calc(100vh-220px)]"
        :style="{ backgroundColor: 'var(--color-surface-elevated)', borderColor: 'var(--color-border)' }"
      >
        <div
          class="px-3 py-2.5 border-b flex items-center justify-between gap-2 shrink-0"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <span class="font-semibold text-sm" :style="{ color: 'var(--color-text-primary)' }">{{
            col.label
          }}</span>
          <span
            class="text-xs tabular-nums px-2 py-0.5 rounded-md"
            :style="{
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-hover)',
            }"
            >{{ boardList(col.value).length }}</span
          >
        </div>
        <VueDraggable
          :model-value="boardList(col.value)"
          :group="group"
          :animation="200"
          :empty-insert-threshold="24"
          class="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]"
          ghost-class="opacity-50"
          drag-class="cursor-grabbing"
          @update:model-value="(v: SaleProcessListRow[]) => onUpdateBoardColumn(col.value, v)"
          @add="(e: DraggableEvent<SaleProcessListRow>) => onCardAdded(col.value, e)"
        >
          <div
            v-for="p in boardList(col.value)"
            :key="p.id"
            class="rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-sm transition hover:shadow-md flex flex-col"
            :style="{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }"
          >
            <div class="flex-1 min-h-0">
              <div class="flex items-start justify-between gap-2 mb-2">
                <span class="font-mono text-xs" :style="{ color: 'var(--color-text-muted)' }">{{ p.code }}</span>
                <Badge variant="neutral" class="text-[10px] shrink-0">{{
                  processStatusLabel(p.status)
                }}</Badge>
              </div>
              <p class="font-medium text-sm leading-snug" :style="{ color: 'var(--color-text-primary)' }">
                {{ p.buyer.fullName }}
              </p>
              <p class="text-xs mt-1 line-clamp-2" :style="{ color: 'var(--color-text-secondary)' }">
                {{ p.property.code }} — {{ p.property.addressLine }}
              </p>
              <div
                v-if="p.agent"
                class="mt-2 flex items-center gap-1 text-xs"
                :style="{ color: 'var(--color-text-muted)' }"
              >
                <AppIcon icon="lucide:user-check" :size="14" />
                {{ p.agent.fullName }}
              </div>
            </div>
            <div
              class="flex flex-wrap gap-1.5 mt-3 pt-2 border-t"
              :style="{ borderColor: 'var(--color-border)' }"
              @click.stop
            >
              <BaseButton variant="primary" size="sm" class="flex-1 min-w-0" @click="openFollowUp(p)">
                <AppIcon icon="lucide:message-square-plus" :size="14" class="shrink-0 mr-1" />
                Seguimiento
              </BaseButton>
              <BaseButton variant="outline" size="sm" @click="goDetail(p)">
                Ficha
              </BaseButton>
            </div>
          </div>
        </VueDraggable>
      </div>
    </div>

    <p v-if="!isLoading && !configQuery.isLoading.value" class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
      Etapas: {{ stageOptions.map((o) => o.label).join(' → ') }}. Use
      <strong>Seguimiento</strong> para notas, actividades y recordatorios sin salir del pipeline.
    </p>

    <BaseModal
      v-model="followUpOpen"
      :title="followUpCode ? `Seguimiento — ${followUpCode}` : 'Seguimiento'"
      size="xl"
      @close="onFollowUpModalClosed"
    >
      <div v-if="followUpProcessId" class="-m-4 p-4 max-h-[min(70vh,640px)] overflow-y-auto">
        <SaleProcessFollowUpPanel
          :process-id="followUpProcessId"
          layout="tabs"
          compact
        />
      </div>
    </BaseModal>
  </div>
</template>
