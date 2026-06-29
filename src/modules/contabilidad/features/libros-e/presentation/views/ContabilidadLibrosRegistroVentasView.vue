<script setup lang="ts">
import { computed, ref } from 'vue'
import { DataTable, PageHeader, SearchInput } from '@shared/components'
import { useDebouncedRef } from '@/shared/composables/useDebouncedRef'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import { useContabilidadSalesInvoices } from '@modules/contabilidad/features/ventas-contables/application/useContabilidadSales'
import type { ContabilidadSalesInvoiceDTO } from '@modules/contabilidad/features/ventas-contables/domain/sales.types'

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
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:book-up"
      title="Registro de ventas"
      subtitle="Vista consulta 14.1 — comprobantes de venta del periodo (base PLE)."
    />
    <div
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
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
    </div>
  </div>
</template>
