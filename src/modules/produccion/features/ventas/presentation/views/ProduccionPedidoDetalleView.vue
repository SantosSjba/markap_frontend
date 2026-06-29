<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, DataTable, AppIcon } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useProduccionOrderDetail, useOrderMutations } from '../../application/useProduccionSales'
import { formatSol, formatDate, ORDER_STATUS_LABELS, orderStatusClass } from '../labels'
import type { ProduccionOrderLine } from '../../domain/sales.types'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { data: order, isLoading, refetch } = useProduccionOrderDetail(id)
const { confirm, createWorkOrder, markReady, cancel, remove } = useOrderMutations()

const lineColumns = [
  { key: 'furniture', label: 'Mueble', align: 'left' as const },
  { key: 'quantity', label: 'Cant.', align: 'left' as const },
  { key: 'unitPrice', label: 'P. unit.', align: 'left' as const },
  { key: 'total', label: 'Total', align: 'left' as const },
]

const canConfirm = computed(() => order.value?.status === 'PENDING')
const canCreateWo = computed(
  () => ['PENDING', 'CONFIRMED'].includes(order.value?.status ?? '') && !order.value?.workOrderId,
)
const canMarkReady = computed(() => order.value?.status === 'IN_PRODUCTION')
const canScheduleDelivery = computed(() =>
  ['CONFIRMED', 'IN_PRODUCTION', 'READY'].includes(order.value?.status ?? ''),
)
const canCancel = computed(() => !['DELIVERED', 'CANCELLED'].includes(order.value?.status ?? ''))
const canDelete = computed(() => order.value?.status === 'PENDING')

async function doConfirm() {
  await confirm.mutateAsync(id.value)
  void refetch()
}

async function doCreateWo() {
  const ok = await markapAlert.confirm({
    title: '¿Generar orden de trabajo?',
    text: 'Se creará una OT con los muebles del pedido.',
    confirmText: 'Generar OT',
  })
  if (!ok) return
  await createWorkOrder.mutateAsync(id.value)
  void refetch()
}

async function doMarkReady() {
  await markReady.mutateAsync(id.value)
  void refetch()
}

async function goScheduleDelivery() {
  void router.push({
    name: 'produccion-ventas-entregas',
    query: { orderId: id.value },
  })
}

async function doCancel() {
  const ok = await markapAlert.confirmDanger({ title: '¿Cancelar pedido?', confirmText: 'Cancelar' })
  if (!ok) return
  await cancel.mutateAsync(id.value)
  void refetch()
}

async function doDelete() {
  const ok = await markapAlert.confirmDanger({ title: '¿Eliminar pedido?', confirmText: 'Eliminar' })
  if (!ok) return
  await remove.mutateAsync(id.value)
  void router.push({ name: 'produccion-ventas-pedidos' })
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1000px] mx-auto space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <BaseButton variant="ghost" @click="router.push({ name: 'produccion-ventas-pedidos' })">
        <AppIcon icon="lucide:arrow-left" :size="18" class="mr-1" />
        Volver
      </BaseButton>
      <div class="flex-1 min-w-0">
        <h1 class="text-xl font-bold font-mono" :style="{ color: 'var(--color-text-primary)' }">
          {{ order?.code ?? 'Pedido' }}
        </h1>
        <p v-if="order" class="text-sm mt-0.5" :class="orderStatusClass(order.status)">
          {{ ORDER_STATUS_LABELS[order.status] }} · {{ order.clientName }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <BaseButton v-if="canConfirm" variant="primary" @click="doConfirm">Confirmar</BaseButton>
        <BaseButton v-if="canCreateWo" variant="primary" @click="doCreateWo">Generar OT</BaseButton>
        <BaseButton
          v-if="order?.workOrderId"
          variant="secondary"
          @click="router.push({ name: 'produccion-ot-detalle', params: { id: order.workOrderId } })"
        >
          Ver OT {{ order.workOrderCode }}
        </BaseButton>
        <BaseButton v-if="canMarkReady" variant="secondary" @click="doMarkReady">Marcar listo</BaseButton>
        <BaseButton v-if="canScheduleDelivery" variant="secondary" @click="goScheduleDelivery">Programar entrega</BaseButton>
        <BaseButton v-if="canCancel" variant="danger" @click="doCancel">Cancelar</BaseButton>
        <BaseButton v-if="canDelete" variant="danger" @click="doDelete">Eliminar</BaseButton>
      </div>
    </div>

    <div
      v-if="order"
      class="rounded-xl border p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"
      :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
    >
      <div><span class="text-secondary">Fecha pedido:</span> {{ formatDate(order.orderedAt) }}</div>
      <div v-if="order.quotationCode"><span class="text-secondary">Cotización:</span> {{ order.quotationCode }}</div>
      <div v-if="order.notes" class="sm:col-span-2"><span class="text-secondary">Notas:</span> {{ order.notes }}</div>
    </div>

    <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
      <DataTable
        :columns="lineColumns"
        :data="order?.lines ?? []"
        :loading="isLoading"
        empty-text="Sin líneas."
        row-key="id"
      >
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">
            {{ (row as ProduccionOrderLine).furnitureCode }} · {{ (row as ProduccionOrderLine).furnitureName }}
          </td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionOrderLine).quantity }}</td>
          <td class="py-3 px-4 text-sm">{{ formatSol((row as ProduccionOrderLine).unitPrice) }}</td>
          <td class="py-3 px-4 text-sm font-medium">{{ formatSol((row as ProduccionOrderLine).lineTotal) }}</td>
        </template>
      </DataTable>
      <div v-if="order" class="px-4 py-3 border-t text-right font-semibold" :style="{ borderColor: 'var(--color-border)' }">
        Total: {{ formatSol(order.totalAmount) }}
      </div>
    </div>
  </div>
</template>
