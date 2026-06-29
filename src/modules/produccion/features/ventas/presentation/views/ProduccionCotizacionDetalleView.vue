<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, DataTable, AppIcon } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useProduccionQuotationDetail, useQuotationMutations, openProduccionQuotationPdf } from '../../application/useProduccionSales'
import {
  formatSol,
  formatDate,
  QUOTATION_STATUS_LABELS,
  quotationStatusClass,
} from '../labels'
import type { ProduccionQuotationLine } from '../../domain/sales.types'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { data: quotation, isLoading, refetch } = useProduccionQuotationDetail(id)
const { send, accept, reject, convertToOrder, remove } = useQuotationMutations()

const lineColumns = [
  { key: 'furniture', label: 'Mueble', align: 'left' as const },
  { key: 'quantity', label: 'Cant.', align: 'left' as const },
  { key: 'unitPrice', label: 'P. unit.', align: 'left' as const },
  { key: 'total', label: 'Total', align: 'left' as const },
]

const canSend = computed(() => quotation.value?.status === 'DRAFT')
const canAccept = computed(() => quotation.value?.status === 'SENT')
const canReject = computed(() => quotation.value?.status === 'SENT')
const canConvert = computed(
  () => quotation.value?.status === 'ACCEPTED' && !quotation.value?.orderId,
)
const canDelete = computed(() => quotation.value?.status === 'DRAFT')

async function doSend() {
  const ok = await markapAlert.confirm({
    title: '¿Enviar cotización?',
    text: 'El cliente podrá revisarla. Ya no podrá editarse.',
    confirmText: 'Enviar',
  })
  if (!ok) return
  await send.mutateAsync(id.value)
  void refetch()
}

async function doAccept() {
  await accept.mutateAsync(id.value)
  void refetch()
}

async function doReject() {
  const ok = await markapAlert.confirmDanger({ title: '¿Rechazar cotización?', confirmText: 'Rechazar' })
  if (!ok) return
  await reject.mutateAsync(id.value)
  void refetch()
}

async function doConvert() {
  const order = await convertToOrder.mutateAsync(id.value)
  void router.push({ name: 'produccion-ventas-pedido-detalle', params: { id: order.id } })
}

async function doExportPdf() {
  await openProduccionQuotationPdf(id.value)
}

async function doDelete() {
  const ok = await markapAlert.confirmDanger({ title: '¿Eliminar borrador?', confirmText: 'Eliminar' })
  if (!ok) return
  await remove.mutateAsync(id.value)
  void router.push({ name: 'produccion-ventas-cotizaciones' })
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1000px] mx-auto space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <BaseButton variant="ghost" @click="router.push({ name: 'produccion-ventas-cotizaciones' })">
        <AppIcon icon="lucide:arrow-left" :size="18" class="mr-1" />
        Volver
      </BaseButton>
      <div class="flex-1 min-w-0">
        <h1 class="text-xl font-bold font-mono" :style="{ color: 'var(--color-text-primary)' }">
          {{ quotation?.code ?? 'Cotización' }}
        </h1>
        <p v-if="quotation" class="text-sm mt-0.5" :class="quotationStatusClass(quotation.status)">
          {{ QUOTATION_STATUS_LABELS[quotation.status] }} · {{ quotation.clientName }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="outline" @click="doExportPdf">
          <AppIcon icon="lucide:file-down" :size="16" class="mr-1" />
          Exportar PDF
        </BaseButton>
        <BaseButton v-if="canSend" variant="primary" @click="doSend">Enviar</BaseButton>
        <BaseButton v-if="canAccept" variant="primary" @click="doAccept">Aceptar</BaseButton>
        <BaseButton v-if="canReject" variant="secondary" @click="doReject">Rechazar</BaseButton>
        <BaseButton v-if="canConvert" variant="primary" @click="doConvert">Crear pedido</BaseButton>
        <BaseButton
          v-if="quotation?.orderId"
          variant="secondary"
          @click="router.push({ name: 'produccion-ventas-pedido-detalle', params: { id: quotation.orderId } })"
        >
          Ver pedido
        </BaseButton>
        <BaseButton v-if="canDelete" variant="danger" @click="doDelete">Eliminar</BaseButton>
      </div>
    </div>

    <div
      v-if="quotation"
      class="rounded-xl border p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"
      :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
    >
      <div><span class="text-secondary">Vigencia:</span> {{ formatDate(quotation.validUntil) }}</div>
      <div><span class="text-secondary">Enviada:</span> {{ formatDate(quotation.sentAt) }}</div>
      <div v-if="quotation.notes" class="sm:col-span-2"><span class="text-secondary">Notas:</span> {{ quotation.notes }}</div>
    </div>

    <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
      <DataTable
        :columns="lineColumns"
        :data="quotation?.lines ?? []"
        :loading="isLoading"
        empty-text="Sin líneas."
        row-key="id"
      >
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">
            {{ (row as ProduccionQuotationLine).furnitureCode }} · {{ (row as ProduccionQuotationLine).furnitureName }}
          </td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionQuotationLine).quantity }}</td>
          <td class="py-3 px-4 text-sm">{{ formatSol((row as ProduccionQuotationLine).unitPrice) }}</td>
          <td class="py-3 px-4 text-sm font-medium">{{ formatSol((row as ProduccionQuotationLine).lineTotal) }}</td>
        </template>
      </DataTable>
      <div v-if="quotation" class="px-4 py-3 border-t text-right font-semibold" :style="{ borderColor: 'var(--color-border)' }">
        Total: {{ formatSol(quotation.totalAmount) }}
      </div>
    </div>
  </div>
</template>
