<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, AppIcon } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useProduccionDeliveryDetail, useDeliveryMutations } from '../../application/useProduccionSales'
import { formatDate, DELIVERY_STATUS_LABELS, deliveryStatusClass } from '../labels'

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
  const ok = await markapAlert.confirmDanger({ title: '¿Cancelar entrega?', confirmText: 'Cancelar' })
  if (!ok) return
  await cancel.mutateAsync(id.value)
  void refetch()
}

async function doDelete() {
  const ok = await markapAlert.confirmDanger({ title: '¿Eliminar entrega?', confirmText: 'Eliminar' })
  if (!ok) return
  await remove.mutateAsync(id.value)
  void router.push({ name: 'produccion-ventas-entregas' })
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <BaseButton variant="ghost" @click="router.push({ name: 'produccion-ventas-entregas' })">
        <AppIcon icon="lucide:arrow-left" :size="18" class="mr-1" />
        Volver
      </BaseButton>
      <div class="flex-1 min-w-0">
        <h1 class="text-xl font-bold font-mono" :style="{ color: 'var(--color-text-primary)' }">
          {{ delivery?.code ?? 'Entrega' }}
        </h1>
        <p v-if="delivery" class="text-sm mt-0.5" :class="deliveryStatusClass(delivery.status)">
          {{ DELIVERY_STATUS_LABELS[delivery.status] }} · {{ delivery.clientName }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <BaseButton v-if="canComplete" variant="primary" @click="doComplete">Confirmar entrega</BaseButton>
        <BaseButton v-if="canCancel" variant="danger" @click="doCancel">Cancelar</BaseButton>
        <BaseButton v-if="canDelete" variant="danger" @click="doDelete">Eliminar</BaseButton>
      </div>
    </div>

    <div
      v-if="delivery && !isLoading"
      class="rounded-xl border p-4 space-y-3 text-sm"
      :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span class="text-secondary">Pedido:</span>
          <button
            type="button"
            class="ml-1 font-mono hover:underline"
            :style="{ color: 'var(--color-primary)' }"
            @click="router.push({ name: 'produccion-ventas-pedido-detalle', params: { id: delivery.orderId } })"
          >
            {{ delivery.orderCode }}
          </button>
        </div>
        <div><span class="text-secondary">Programada:</span> {{ formatDate(delivery.scheduledAt) }}</div>
        <div><span class="text-secondary">Entregada:</span> {{ formatDate(delivery.deliveredAt) }}</div>
        <div><span class="text-secondary">Destinatario:</span> {{ delivery.recipientName ?? '—' }}</div>
      </div>
      <div v-if="delivery.address"><span class="text-secondary">Dirección:</span> {{ delivery.address }}</div>
      <div v-if="delivery.notes"><span class="text-secondary">Notas:</span> {{ delivery.notes }}</div>
    </div>
  </div>
</template>
