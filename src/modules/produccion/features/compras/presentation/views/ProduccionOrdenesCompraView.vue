<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, DataTable, FormSelect, SearchInput, AppIcon } from '@shared/components'
import { useProduccionPurchaseOrdersList } from '../../application/useProduccionPurchases'
import { formatSol, formatDate, PO_STATUS_LABELS, PO_STATUS_OPTIONS, poStatusClass } from '../labels'
import type { ProduccionPurchaseOrderListItem } from '../../domain/purchases.types'

const router = useRouter()
const listParams = ref({ page: 1, limit: 50 })
const searchInput = ref('')
const statusFilter = ref('')

const { data: result, isLoading } = useProduccionPurchaseOrdersList(
  computed(() => ({
    ...listParams.value,
    search: searchInput.value.trim() || undefined,
    status: (statusFilter.value || undefined) as ProduccionPurchaseOrderListItem['status'] | undefined,
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
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1100px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Órdenes de compra</h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Pedidos a proveedores; al recibir se actualiza el inventario.
        </p>
      </div>
      <BaseButton variant="primary" @click="goNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nueva orden
      </BaseButton>
    </div>

    <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin órdenes de compra." row-key="id">
        <template #toolbar>
          <div class="flex flex-wrap gap-3">
            <SearchInput v-model="searchInput" placeholder="Buscar código o proveedor…" class="max-w-xs" />
            <FormSelect v-model="statusFilter" :options="PO_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))" class="max-w-[200px]" />
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4">
            <button type="button" class="font-mono text-sm font-medium hover:underline" :style="{ color: 'var(--color-primary)' }" @click="goDetail(row as ProduccionPurchaseOrderListItem)">
              {{ (row as ProduccionPurchaseOrderListItem).code }}
            </button>
          </td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionPurchaseOrderListItem).supplierName }}</td>
          <td class="py-3 px-4 text-sm font-medium" :class="poStatusClass((row as ProduccionPurchaseOrderListItem).status)">
            {{ PO_STATUS_LABELS[(row as ProduccionPurchaseOrderListItem).status] }}
          </td>
          <td class="py-3 px-4 text-sm">{{ formatDate((row as ProduccionPurchaseOrderListItem).orderedAt) }}</td>
          <td class="py-3 px-4 text-sm font-medium">{{ formatSol((row as ProduccionPurchaseOrderListItem).totalAmount) }}</td>
        </template>
      </DataTable>
    </div>
  </div>
</template>
