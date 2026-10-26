<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import { computed } from 'vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { ref } from 'vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '../../../asientos/domain/journal.utils'
import { useContabilidadPurchaseInvoices } from '../../../compras/presentation/composables/useContabilidadPurchases'
import type { ContabilidadPurchaseInvoiceDTO } from '../../../compras/domain/purchases.types'
const { activePeriod } = useContabilidadActivePeriod()
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)

const listParams = computed(() => ({
  periodId: activePeriod.value?.id,
  search: debouncedSearch.value.trim() || undefined,
}))

const { data, isLoading } = useContabilidadPurchaseInvoices(listParams)
const rows = computed(() => data.value?.invoices ?? [])

const columns = [
  { key: 'issueDate', label: 'Fecha' },
  { key: 'fullNumber', label: 'Comprobante' },
  { key: 'supplierRuc', label: 'RUC' },
  { key: 'supplierName', label: 'Proveedor' },
  { key: 'taxableBase', label: 'Base', align: 'right' as const },
  { key: 'igvAmount', label: 'IGV', align: 'right' as const },
  { key: 'totalAmount', label: 'Total', align: 'right' as const },
]
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      icon="lucide:book-down"
      title="Registro de compras"
      subtitle="Vista consulta 8.1 — comprobantes de compra del periodo (base PLE)."
    />
    <BaseCard padding="none" class="block overflow-hidden">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin compras en el periodo." row-key="id">
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar comprobante o proveedor…" />
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadPurchaseInvoiceDTO).issueDate }}</td>
          <td class="py-3 px-4 font-mono text-sm">{{ (row as ContabilidadPurchaseInvoiceDTO).fullNumber }}</td>
          <td class="py-3 px-4 font-mono text-sm">{{ (row as ContabilidadPurchaseInvoiceDTO).supplierRuc }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadPurchaseInvoiceDTO).supplierName }}</td>
          <td class="py-3 px-4 text-sm text-right font-mono">{{ formatPen((row as ContabilidadPurchaseInvoiceDTO).taxableBase) }}</td>
          <td class="py-3 px-4 text-sm text-right font-mono">{{ formatPen((row as ContabilidadPurchaseInvoiceDTO).igvAmount) }}</td>
          <td class="py-3 px-4 text-sm text-right font-mono font-semibold">{{ formatPen((row as ContabilidadPurchaseInvoiceDTO).totalAmount) }}</td>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
