<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DataTable, FormSelect, SearchInput } from '@shared/components'
import { useProduccionOrdersList } from '../../application/useProduccionSales'
import {
  formatSol,
  formatDate,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
  orderStatusClass,
} from '../labels'
import type { ProduccionOrderListItem } from '../../domain/sales.types'

const route = useRoute()
const router = useRouter()

const listParams = ref({
  page: 1,
  limit: 50,
  clientId: typeof route.query.clientId === 'string' ? route.query.clientId : undefined,
})
const searchInput = ref('')
const statusFilter = ref('')

watch(
  () => route.query.clientId,
  (id) => {
    listParams.value.clientId = typeof id === 'string' ? id : undefined
  },
)

const { data: result, isLoading } = useProduccionOrdersList(
  computed(() => ({
    ...listParams.value,
    search: searchInput.value.trim() || undefined,
    status: (statusFilter.value || undefined) as ProduccionOrderListItem['status'] | undefined,
  })),
)

const rows = computed(() => result.value?.data ?? [])

const columns = [
  { key: 'code', label: 'Código', align: 'left' as const },
  { key: 'clientName', label: 'Cliente', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
  { key: 'orderedAt', label: 'Fecha', align: 'left' as const },
  { key: 'workOrderCode', label: 'OT', align: 'left' as const },
  { key: 'totalAmount', label: 'Total', align: 'left' as const },
]

function goDetail(r: ProduccionOrderListItem) {
  void router.push({ name: 'produccion-ventas-pedido-detalle', params: { id: r.id } })
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto space-y-6">
    <div>
      <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Pedidos</h1>
      <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
        Pedidos confirmados — producción y entrega.
      </p>
    </div>

    <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin pedidos." row-key="id">
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar código o cliente…" />
          </div>
          <div class="w-full sm:w-[200px] min-w-0 shrink-0">
            <FormSelect
              v-model="statusFilter"
              :options="ORDER_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))"
            />
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4">
            <button
              type="button"
              class="font-mono text-sm font-medium hover:underline"
              :style="{ color: 'var(--color-primary)' }"
              @click="goDetail(row as ProduccionOrderListItem)"
            >
              {{ (row as ProduccionOrderListItem).code }}
            </button>
          </td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionOrderListItem).clientName }}</td>
          <td class="py-3 px-4 text-sm font-medium" :class="orderStatusClass((row as ProduccionOrderListItem).status)">
            {{ ORDER_STATUS_LABELS[(row as ProduccionOrderListItem).status] }}
          </td>
          <td class="py-3 px-4 text-sm">{{ formatDate((row as ProduccionOrderListItem).orderedAt) }}</td>
          <td class="py-3 px-4 text-sm font-mono">{{ (row as ProduccionOrderListItem).workOrderCode ?? '—' }}</td>
          <td class="py-3 px-4 text-sm font-medium">{{ formatSol((row as ProduccionOrderListItem).totalAmount) }}</td>
        </template>
      </DataTable>
    </div>
  </div>
</template>
