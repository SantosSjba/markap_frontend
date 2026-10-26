<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { useProduccionPurchaseOrdersList } from '../composables/useProduccionPurchases'
import {
  formatSol,
  formatDate,
  PO_STATUS_LABELS,
  PO_STATUS_OPTIONS,
  poStatusClass,
} from '../labels'
import type { ProduccionPurchaseOrderListItem } from '../../domain/purchases.types'
const router = useRouter()
const listParams = ref({ page: 1, limit: 50 })
const searchInput = ref('')
const statusFilter = ref('')

const { data: result, isLoading } = useProduccionPurchaseOrdersList(
  computed(() => ({
    ...listParams.value,
    search: searchInput.value.trim() || undefined,
    status: (statusFilter.value || undefined) as
      | ProduccionPurchaseOrderListItem['status']
      | undefined,
  })),
)

const rows = computed(() => result.value?.data ?? [])

const columns = [
  { key: 'code', label: 'Código', align: 'left' as const },
  { key: 'supplierName', label: 'Proveedor', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
  { key: 'orderedAt', label: 'Fecha', align: 'left' as const },
  { key: 'totalAmount', label: 'Total', align: 'left' as const },
]

function goDetail(r: ProduccionPurchaseOrderListItem) {
  void router.push({ name: 'produccion-compras-orden-detalle', params: { id: r.id } })
}

function goNew() {
  void router.push({ name: 'produccion-compras-orden-nueva' })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Órdenes de compra"
      subtitle="Pedidos a proveedores; al recibir se actualiza el inventario."
    >
      <template #actions>
        <BaseButton variant="primary" @click="goNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nueva orden
      </BaseButton>
      </template>
    </PageHeader>

    <BaseCard padding="none" class="block overflow-hidden">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin órdenes de compra." row-key="id">
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar código o proveedor…" />
          </div>
          <div class="w-full sm:w-[200px] min-w-0 shrink-0">
            <FormSelect v-model="statusFilter" :options="PO_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))" />
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4">
            <BaseButton @click="goDetail(row as ProduccionPurchaseOrderListItem)" variant="link" class="font-mono font-medium">{{ (row as ProduccionPurchaseOrderListItem).code }}</BaseButton>
          </td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionPurchaseOrderListItem).supplierName }}</td>
          <td class="py-3 px-4 text-sm font-medium" :class="poStatusClass((row as ProduccionPurchaseOrderListItem).status)">
            {{ PO_STATUS_LABELS[(row as ProduccionPurchaseOrderListItem).status] }}
          </td>
          <td class="py-3 px-4 text-sm">{{ formatDate((row as ProduccionPurchaseOrderListItem).orderedAt) }}</td>
          <td class="py-3 px-4 text-sm font-medium">{{ formatSol((row as ProduccionPurchaseOrderListItem).totalAmount) }}</td>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
