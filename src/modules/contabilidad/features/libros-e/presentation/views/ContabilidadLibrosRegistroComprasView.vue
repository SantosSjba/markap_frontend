<script setup lang="ts">
import { computed } from 'vue'
import { DataTable, PageHeader, SearchInput } from '@shared/components'
import { ref } from 'vue'
import { useDebouncedRef } from '@/shared/composables/useDebouncedRef'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import { useContabilidadPurchaseInvoices } from '@modules/contabilidad/features/compras/application/useContabilidadPurchases'
import type { ContabilidadPurchaseInvoiceDTO } from '@modules/contabilidad/features/compras/domain/purchases.types'

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
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
    <PageHeader
      icon="lucide:book-down"
      title="Registro de compras"
      subtitle="Vista consulta 8.1 — comprobantes de compra del periodo (base PLE)."
    />
    <div
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
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
    </div>
  </div>
</template>
