<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { useProduccionOrdersList } from '../composables/useProduccionSales'
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
  <div class="space-y-6">
    <PageHeader
      title="Pedidos"
    >
      <template #actions>
        <p class="text-sm mt-0.5 text-gray-500 dark:text-gray-400">
        Pedidos confirmados — producción y entrega.
      </p>
      </template>
    </PageHeader>

    <BaseCard padding="none" class="block overflow-hidden">
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
            <BaseButton @click="goDetail(row as ProduccionOrderListItem)" variant="link" class="font-mono font-medium">{{ (row as ProduccionOrderListItem).code }}</BaseButton>
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
    </BaseCard>
  </div>
</template>
