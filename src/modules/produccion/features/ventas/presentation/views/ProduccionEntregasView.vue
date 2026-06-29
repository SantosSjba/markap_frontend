<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, BaseModal, DataTable, FormInput, FormSelect, FormTextarea, SearchInput, AppIcon } from '@shared/components'
import {
  useProduccionDeliveriesList,
  useProduccionOrdersList,
  useDeliveryMutations,
} from '../../application/useProduccionSales'
import {
  formatDate,
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_OPTIONS,
  deliveryStatusClass,
} from '../labels'
import type { ProduccionDeliveryListItem } from '../../domain/sales.types'

const route = useRoute()
const router = useRouter()

const listParams = ref({ page: 1, limit: 50 })
const searchInput = ref('')
const statusFilter = ref('')

const { data: result, isLoading, refetch } = useProduccionDeliveriesList(
  computed(() => ({
    ...listParams.value,
    search: searchInput.value.trim() || undefined,
    status: (statusFilter.value || undefined) as ProduccionDeliveryListItem['status'] | undefined,
  })),
)

const { data: ordersRes } = useProduccionOrdersList(ref({ page: 1, limit: 100 }))
const { create } = useDeliveryMutations()

const showNewModal = ref(false)
const newOrderId = ref('')
const newScheduledAt = ref('')
const newAddress = ref('')
const newRecipient = ref('')
const newNotes = ref('')
const saving = ref(false)

watch(
  () => route.query.orderId,
  (orderId) => {
    if (typeof orderId === 'string' && orderId) {
      newOrderId.value = orderId
      showNewModal.value = true
    }
  },
  { immediate: true },
)

const orderOptions = computed(() =>
  (ordersRes.value?.data ?? [])
    .filter((o) => ['CONFIRMED', 'IN_PRODUCTION', 'READY'].includes(o.status))
    .map((o) => ({ value: o.id, label: `${o.code} · ${o.clientName}` })),
)

const rows = computed(() => result.value?.data ?? [])

const columns = [
  { key: 'code', label: 'Código', align: 'left' as const },
  { key: 'orderCode', label: 'Pedido', align: 'left' as const },
  { key: 'clientName', label: 'Cliente', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
  { key: 'scheduledAt', label: 'Programada', align: 'left' as const },
]

function goDetail(r: ProduccionDeliveryListItem) {
  void router.push({ name: 'produccion-ventas-entrega-detalle', params: { id: r.id } })
}

async function saveDelivery() {
  if (!newOrderId.value) return
  saving.value = true
  try {
    const d = await create.mutateAsync({
      orderId: newOrderId.value,
      scheduledAt: newScheduledAt.value ? new Date(newScheduledAt.value).toISOString() : null,
      address: newAddress.value.trim() || null,
      recipientName: newRecipient.value.trim() || null,
      notes: newNotes.value.trim() || null,
    })
    showNewModal.value = false
    void refetch()
    void router.push({ name: 'produccion-ventas-entrega-detalle', params: { id: d.id } })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1100px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Entregas</h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Programación y confirmación de entregas al cliente.
        </p>
      </div>
      <BaseButton variant="primary" @click="showNewModal = true">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nueva entrega
      </BaseButton>
    </div>

    <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin entregas." row-key="id">
        <template #toolbar>
          <div class="flex flex-wrap gap-3">
            <SearchInput v-model="searchInput" placeholder="Buscar código o cliente…" class="max-w-xs" />
            <FormSelect
              v-model="statusFilter"
              :options="DELIVERY_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))"
              class="max-w-[200px]"
            />
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4">
            <button
              type="button"
              class="font-mono text-sm font-medium hover:underline"
              :style="{ color: 'var(--color-primary)' }"
              @click="goDetail(row as ProduccionDeliveryListItem)"
            >
              {{ (row as ProduccionDeliveryListItem).code }}
            </button>
          </td>
          <td class="py-3 px-4 text-sm font-mono">{{ (row as ProduccionDeliveryListItem).orderCode }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionDeliveryListItem).clientName }}</td>
          <td class="py-3 px-4 text-sm font-medium" :class="deliveryStatusClass((row as ProduccionDeliveryListItem).status)">
            {{ DELIVERY_STATUS_LABELS[(row as ProduccionDeliveryListItem).status] }}
          </td>
          <td class="py-3 px-4 text-sm">{{ formatDate((row as ProduccionDeliveryListItem).scheduledAt) }}</td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="showNewModal" title="Nueva entrega" size="md">
      <div class="space-y-4">
        <FormSelect v-model="newOrderId" label="Pedido" :options="orderOptions" />
        <FormInput v-model="newScheduledAt" label="Fecha programada" type="date" />
        <FormInput v-model="newRecipient" label="Destinatario" />
        <FormTextarea v-model="newAddress" label="Dirección" :rows="2" />
        <FormTextarea v-model="newNotes" label="Notas" :rows="2" />
        <BaseButton variant="primary" :loading="saving" @click="saveDelivery">Crear entrega</BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
