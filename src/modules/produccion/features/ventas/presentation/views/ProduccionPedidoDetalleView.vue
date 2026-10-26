<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canAdmin } = useApplicationAccess('produccion')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { useProduccionOrderDetail, useOrderMutations } from '../composables/useProduccionSales'
import { formatSol, formatDate, ORDER_STATUS_LABELS } from '../labels'
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
  const ok = await markapAlert.confirmDanger({
    title: '¿Cancelar pedido?',
    confirmText: 'Cancelar',
  })
  if (!ok) return
  await cancel.mutateAsync(id.value)
  void refetch()
}

async function doDelete() {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar pedido?',
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await remove.mutateAsync(id.value)
  void router.push({ name: 'produccion-ventas-pedidos' })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      :title="order?.code ?? 'Pedido'"
      :subtitle="order ? `${ORDER_STATUS_LABELS[order.status]} · ${order.clientName}` : undefined"
      back
      @back="router.push({ name: 'produccion-ventas-pedidos' })"
    >
      <template #actions>
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
        <BaseButton v-if="(canDelete) && canAdmin" variant="danger" @click="doDelete">Eliminar</BaseButton>
      </div>
      </template>
    </PageHeader>

    <BaseCard v-if="order" padding="sm" class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
      <div><span class="text-secondary">Fecha pedido:</span> {{ formatDate(order.orderedAt) }}</div>
      <div v-if="order.quotationCode"><span class="text-secondary">Cotización:</span> {{ order.quotationCode }}</div>
      <div v-if="order.notes" class="sm:col-span-2"><span class="text-secondary">Notas:</span> {{ order.notes }}</div>
    </BaseCard>

    <BaseCard padding="none" class="block overflow-hidden">
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
      <div v-if="order" class="px-4 py-3 border-t text-right font-semibold border-gray-200 dark:border-gray-800">
        Total: {{ formatSol(order.totalAmount) }}
      </div>
    </BaseCard>
  </div>
</template>
