<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import { computed, ref } from 'vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '../../../asientos/domain/journal.utils'
import { useContabilidadSalesInvoices } from '../../../ventas-contables/presentation/composables/useContabilidadSales'
import type { ContabilidadSalesInvoiceDTO } from '../../../ventas-contables/domain/sales.types'
const { activePeriod } = useContabilidadActivePeriod()
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)

const listParams = computed(() => ({
  periodId: activePeriod.value?.id,
  search: debouncedSearch.value.trim() || undefined,
}))

const { data, isLoading } = useContabilidadSalesInvoices(listParams)
const rows = computed(() => data.value?.invoices ?? [])

const columns = [
  { key: 'issueDate', label: 'Fecha' },
  { key: 'fullNumber', label: 'Comprobante' },
  { key: 'customerRuc', label: 'RUC' },
  { key: 'customerName', label: 'Cliente' },
  { key: 'taxableBase', label: 'Base', align: 'right' as const },
  { key: 'igvAmount', label: 'IGV', align: 'right' as const },
  { key: 'totalAmount', label: 'Total', align: 'right' as const },
]
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      icon="lucide:book-up"
      title="Registro de ventas"
      subtitle="Vista consulta 14.1 — comprobantes de venta del periodo (base PLE)."
    />
    <BaseCard padding="none" class="block overflow-hidden">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin ventas en el periodo." row-key="id">
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar comprobante o cliente…" />
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadSalesInvoiceDTO).issueDate }}</td>
          <td class="py-3 px-4 font-mono text-sm">{{ (row as ContabilidadSalesInvoiceDTO).fullNumber }}</td>
          <td class="py-3 px-4 font-mono text-sm">{{ (row as ContabilidadSalesInvoiceDTO).customerRuc }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadSalesInvoiceDTO).customerName }}</td>
          <td class="py-3 px-4 text-sm text-right font-mono">{{ formatPen((row as ContabilidadSalesInvoiceDTO).taxableBase) }}</td>
          <td class="py-3 px-4 text-sm text-right font-mono">{{ formatPen((row as ContabilidadSalesInvoiceDTO).igvAmount) }}</td>
          <td class="py-3 px-4 text-sm text-right font-mono font-semibold">{{ formatPen((row as ContabilidadSalesInvoiceDTO).totalAmount) }}</td>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
