<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import {
  useProduccionDeliveryDetail,
  useDeliveryMutations,
} from '../composables/useProduccionSales'
import { formatDate, DELIVERY_STATUS_LABELS } from '../labels'
const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { data: delivery, isLoading, refetch } = useProduccionDeliveryDetail(id)
const { complete, cancel, remove } = useDeliveryMutations()

const canComplete = computed(() => delivery.value?.status === 'SCHEDULED')
const canCancel = computed(() => delivery.value?.status === 'SCHEDULED')
const canDelete = computed(() => delivery.value?.status === 'SCHEDULED')

async function doComplete() {
  const ok = await markapAlert.confirm({
    title: '¿Confirmar entrega realizada?',
    confirmText: 'Confirmar entrega',
  })
  if (!ok) return
  await complete.mutateAsync(id.value)
  void refetch()
}

async function doCancel() {
  const ok = await markapAlert.confirmDanger({
    title: '¿Cancelar entrega?',
    confirmText: 'Cancelar',
  })
  if (!ok) return
  await cancel.mutateAsync(id.value)
  void refetch()
}

async function doDelete() {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar entrega?',
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await remove.mutateAsync(id.value)
  void router.push({ name: 'produccion-ventas-entregas' })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      :title="delivery?.code ?? 'Entrega'"
      :subtitle="delivery ? `${DELIVERY_STATUS_LABELS[delivery.status]} · ${delivery.clientName}` : undefined"
      back
      @back="router.push({ name: 'produccion-ventas-entregas' })"
    >
      <template #actions>
        <div class="flex flex-wrap gap-2">
        <BaseButton v-if="canComplete" variant="primary" @click="doComplete">Confirmar entrega</BaseButton>
        <BaseButton v-if="canCancel" variant="danger" @click="doCancel">Cancelar</BaseButton>
        <BaseButton v-if="canDelete" variant="danger" @click="doDelete">Eliminar</BaseButton>
      </div>
      </template>
    </PageHeader>

    <BaseCard v-if="delivery && !isLoading" padding="sm" class="block space-y-3 text-sm">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span class="text-secondary">Pedido:</span>
          <BaseButton @click="router.push({ name: 'produccion-ventas-pedido-detalle', params: { id: delivery.orderId } })" variant="link" class="font-mono ml-1">{{ delivery.orderCode }}</BaseButton>
        </div>
        <div><span class="text-secondary">Programada:</span> {{ formatDate(delivery.scheduledAt) }}</div>
        <div><span class="text-secondary">Entregada:</span> {{ formatDate(delivery.deliveredAt) }}</div>
        <div><span class="text-secondary">Destinatario:</span> {{ delivery.recipientName ?? '—' }}</div>
      </div>
      <div v-if="delivery.address"><span class="text-secondary">Dirección:</span> {{ delivery.address }}</div>
      <div v-if="delivery.notes"><span class="text-secondary">Notas:</span> {{ delivery.notes }}</div>
    </BaseCard>
  </div>
</template>
