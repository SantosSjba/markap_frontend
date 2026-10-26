<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { formatShortDate, parseCalendarDate, toCalendarDateString } from '@shared/utils/formatters'
import { usePropertiesWithoutContract } from '../composables/useReportes'
import type { PropertyWithoutContractItem } from '../../domain/reportes.types'
import { formatMoney, useLocalPagination } from '../utils/report-format'
import ReportSectionHeader from './ReportSectionHeader.vue'
import ReportQueryError from './ReportQueryError.vue'
/** Pestaña «Sin contrato»: propiedades activas sin contrato vigente y desde cuándo están libres. */

const query = usePropertiesWithoutContract('alquileres')
const search = ref('')
const rows = computed(() => {
  const q = search.value.trim().toLocaleLowerCase('es-PE')
  const all = query.data.value ?? []
  if (!q) return all
  return all.filter((p) =>
    [p.code, p.addressLine, p.district, p.ownerName, p.propertyType]
      .filter(Boolean)
      .some((v) => String(v).toLocaleLowerCase('es-PE').includes(q)),
  )
})
const { pageRows, paginationProps, setPage, setPageSize } = useLocalPagination(rows)

const STATUS: Record<string, { label: string; variant: 'info' | 'warning' | 'error' | 'success' }> = {
  AVAILABLE: { label: 'Disponible', variant: 'info' },
  MAINTENANCE: { label: 'En mantenimiento', variant: 'warning' },
  EXPIRING: { label: 'Por vencer', variant: 'error' },
  RENTED: { label: 'Alquilada', variant: 'success' },
}

/** Días desde que terminó el último contrato */
function idleDays(p: PropertyWithoutContractItem): number | null {
  if (!p.lastContractEndDate) return null
  const end = parseCalendarDate(p.lastContractEndDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((today.getTime() - end.getTime()) / 86_400_000))
}

function idleLabel(p: PropertyWithoutContractItem): string {
  const d = idleDays(p)
  if (d == null) return 'Nunca alquilada'
  if (d === 0) return 'Desde hoy'
  return d === 1 ? 'Hace 1 día' : `Hace ${d} días`
}

const columns = [
  { key: 'propiedad', label: 'Propiedad', sortable: true, sortAccessor: (r: unknown) => (r as PropertyWithoutContractItem).code },
  { key: 'tipo', label: 'Tipo', sortable: true, sortAccessor: (r: unknown) => (r as PropertyWithoutContractItem).propertyType },
  { key: 'propietario', label: 'Propietario', sortable: true, sortAccessor: (r: unknown) => (r as PropertyWithoutContractItem).ownerName },
  {
    key: 'renta',
    label: 'Renta referencial',
    align: 'right' as const,
    sortable: true,
    sortType: 'basic' as const,
    sortAccessor: (r: unknown) => (r as PropertyWithoutContractItem).monthlyRent ?? 0,
  },
  {
    key: 'libre',
    label: 'Sin contrato desde',
    sortable: true,
    sortType: 'basic' as const,
    sortAccessor: (r: unknown) => idleDays(r as PropertyWithoutContractItem) ?? Number.MAX_SAFE_INTEGER,
  },
  { key: 'estado', label: 'Estado' },
  { key: 'actions', label: '', align: 'right' as const },
]

const { isExporting, exportToExcel } = useExcelExport()
async function handleExport() {
  await exportToExcel({
    fileName: `propiedades_sin_contrato_${toCalendarDateString()}`,
    sheetName: 'Sin contrato',
    columns: [
      { header: 'Código', key: 'code', width: 26 },
      { header: 'Dirección', key: 'addressLine', width: 36 },
      { header: 'Distrito', key: 'district', width: 18 },
      { header: 'Tipo', key: 'propertyType', width: 14 },
      { header: 'Propietario', key: 'ownerName', width: 26 },
      { header: 'Moneda', key: 'rentCurrency', width: 10 },
      { header: 'Renta referencial', key: 'monthlyRent', width: 16 },
      { header: 'Fin último contrato', key: 'lastContractEndDate', width: 18 },
      { header: 'Estado', key: 'status', width: 16 },
    ],
    rows: rows.value.map((p) => ({
      ...p,
      district: p.district ?? '—',
      monthlyRent: p.monthlyRent ?? '—',
      lastContractEndDate: p.lastContractEndDate ? formatShortDate(p.lastContractEndDate) : 'Nunca alquilada',
      status: STATUS[p.listingStatus ?? '']?.label ?? '—',
    })),
  })
}
</script>

<template>
  <ReportSectionHeader
    title="Propiedades sin contrato"
    subtitle="Propiedades activas sin un contrato vigente"
    icon="lucide:building-2"
    :exporting="isExporting"
    @export="handleExport"
  />

  <ReportQueryError v-if="query.isError.value" :error="query.error.value" @retry="() => query.refetch()" />
  <template v-else>
    <DataTable
      :columns="columns"
      :data="pageRows"
      :loading="query.isFetching.value && !query.data.value"
      empty-text="No hay propiedades sin contrato."
    >
      <template #toolbar>
        <div class="flex-1 min-w-0">
          <SearchInput v-model="search" placeholder="Buscar por código, dirección, tipo o propietario..." />
        </div>
      </template>
      <template #row="{ row }">
        <td class="py-3 px-4">
          <p class="font-medium text-gray-800 dark:text-white/90">{{ (row as PropertyWithoutContractItem).code }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ (row as PropertyWithoutContractItem).addressLine }}<template v-if="(row as PropertyWithoutContractItem).district">, {{ (row as PropertyWithoutContractItem).district }}</template>
          </p>
        </td>
        <td class="py-3 px-4 text-gray-800 dark:text-white/90">{{ (row as PropertyWithoutContractItem).propertyType }}</td>
        <td class="py-3 px-4 text-gray-800 dark:text-white/90">{{ (row as PropertyWithoutContractItem).ownerName }}</td>
        <td class="py-3 px-4 text-right tabular-nums text-gray-800 dark:text-white/90">
          {{
            (row as PropertyWithoutContractItem).monthlyRent != null
              ? formatMoney((row as PropertyWithoutContractItem).monthlyRent!, (row as PropertyWithoutContractItem).rentCurrency)
              : '—'
          }}
        </td>
        <td class="py-3 px-4">
          <p class="text-gray-800 dark:text-white/90">{{ idleLabel(row as PropertyWithoutContractItem) }}</p>
          <p v-if="(row as PropertyWithoutContractItem).lastContractEndDate" class="text-xs text-gray-400 dark:text-gray-500">
            Último contrato terminó el {{ formatShortDate((row as PropertyWithoutContractItem).lastContractEndDate!) }}
          </p>
        </td>
        <td class="py-3 px-4">
          <Badge
            v-if="STATUS[(row as PropertyWithoutContractItem).listingStatus ?? '']"
            :variant="STATUS[(row as PropertyWithoutContractItem).listingStatus ?? '']!.variant"
          >
            {{ STATUS[(row as PropertyWithoutContractItem).listingStatus ?? '']!.label }}
          </Badge>
          <span v-else class="text-gray-400">—</span>
        </td>
        <td class="py-3 px-4 text-right">
          <BaseButton
            variant="link"
            size="sm"
            :to="{ name: 'alquileres-propiedades-editar', params: { id: (row as PropertyWithoutContractItem).id } }"
          >
            Ver propiedad
          </BaseButton>
        </td>
      </template>
    </DataTable>
    <div v-if="rows.length" class="border-t border-gray-200 dark:border-gray-800">
      <BasePagination v-bind="paginationProps" :show-page-size="true" @update:current-page="setPage" @update:page-size="setPageSize" />
    </div>
  </template>
</template>
