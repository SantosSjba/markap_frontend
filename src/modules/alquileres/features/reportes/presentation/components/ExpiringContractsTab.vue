<script setup lang="ts">
import { computed } from 'vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { formatShortDate, parseCalendarDate, toCalendarDateString } from '@shared/utils/formatters'
import { useContractsExpiring } from '../composables/useReportes'
import type { ContractExpiringItem } from '../../domain/reportes.types'
import { daysLeftLabel, daysLeftVariant, formatMoney, useLocalPagination } from '../utils/report-format'
import ReportSectionHeader from '@shared/presentation/components/reports/ReportSectionHeader.vue'
import ReportQueryError from './ReportQueryError.vue'
/** Pestaña «Contratos por vencer»: contratos que terminan en los próximos 30, 60 o 90 días. */

const days = defineModel<number>('days', { required: true })

const query = useContractsExpiring('alquileres', days)
const rows = computed(() => query.data.value ?? [])
const { pageRows, paginationProps, setPage, setPageSize } = useLocalPagination(rows)

const periodTabs = [
  { id: '30', label: '30 días' },
  { id: '60', label: '60 días' },
  { id: '90', label: '90 días' },
] as const
const periodTab = computed({
  get: () => String(days.value) as '30' | '60' | '90',
  set: (v: string) => {
    days.value = Number(v)
  },
})

const columns = [
  { key: 'contrato', label: 'Contrato', sortable: true, sortAccessor: (r: unknown) => (r as ContractExpiringItem).code },
  { key: 'inquilino', label: 'Inquilino', sortable: true, sortAccessor: (r: unknown) => (r as ContractExpiringItem).tenantName },
  { key: 'propiedad', label: 'Propiedad', sortable: true, sortAccessor: (r: unknown) => (r as ContractExpiringItem).propertyAddress },
  {
    key: 'alquiler',
    label: 'Alquiler',
    align: 'right' as const,
    sortable: true,
    sortType: 'basic' as const,
    sortAccessor: (r: unknown) => (r as ContractExpiringItem).monthlyAmount,
  },
  {
    key: 'vence',
    label: 'Vence',
    sortable: true,
    sortType: 'basic' as const,
    sortAccessor: (r: unknown) => parseCalendarDate((r as ContractExpiringItem).endDate).getTime(),
  },
]

const { isExporting, exportToExcel } = useExcelExport()
async function handleExport() {
  // Datos al momento de exportar, no los que quedaron en caché al abrir la pestaña
  await query.refetch()
  await exportToExcel({
    fileName: `contratos_por_vencer_${days.value}d_${toCalendarDateString()}`,
    sheetName: 'Contratos por vencer',
    columns: [
      { header: 'Código', key: 'code', width: 34 },
      { header: 'Inquilino', key: 'tenantName', width: 26 },
      { header: 'Propiedad', key: 'propertyAddress', width: 32 },
      { header: 'Propietario', key: 'ownerName', width: 24 },
      { header: 'Inicio', key: 'startDate', width: 14 },
      { header: 'Vencimiento', key: 'endDate', width: 14 },
      { header: 'Días restantes', key: 'daysLeft', width: 14 },
      { header: 'Moneda', key: 'currency', width: 10 },
      { header: 'Alquiler mensual', key: 'monthlyAmount', width: 16 },
    ],
    rows: rows.value.map((r) => ({
      ...r,
      startDate: formatShortDate(r.startDate),
      endDate: formatShortDate(r.endDate),
    })),
  })
}
</script>

<template>
  <ReportSectionHeader
    title="Contratos por vencer"
    :subtitle="`Contratos que terminan en los próximos ${days} días`"
    icon="lucide:calendar-clock"
    :exporting="isExporting"
    @export="handleExport"
  >
    <template #actions>
      <BaseTabs v-model="periodTab" :tabs="periodTabs" variant="segmented" />
    </template>
  </ReportSectionHeader>

  <ReportQueryError v-if="query.isError.value" :error="query.error.value" @retry="() => query.refetch()" />
  <template v-else>
    <DataTable
      :columns="columns"
      :data="pageRows"
      :loading="query.isFetching.value && !query.data.value"
      :empty-text="`No hay contratos que venzan en los próximos ${days} días.`"
    >
      <template #row="{ row }">
        <td class="py-3 px-4">
          <BaseButton
            variant="link"
            size="sm"
            class="px-0! font-medium"
            :to="{ name: 'alquileres-contratos-detalle', params: { id: (row as ContractExpiringItem).id } }"
          >
            {{ (row as ContractExpiringItem).code }}
          </BaseButton>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            Desde {{ formatShortDate((row as ContractExpiringItem).startDate) }}
          </p>
        </td>
        <td class="py-3 px-4 text-gray-800 dark:text-white/90">{{ (row as ContractExpiringItem).tenantName }}</td>
        <td class="py-3 px-4">
          <p class="text-gray-800 dark:text-white/90">{{ (row as ContractExpiringItem).propertyAddress }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">Prop. {{ (row as ContractExpiringItem).ownerName }}</p>
        </td>
        <td class="py-3 px-4 text-right tabular-nums text-gray-800 dark:text-white/90">
          {{ formatMoney((row as ContractExpiringItem).monthlyAmount, (row as ContractExpiringItem).currency) }}
        </td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-2">
            <span class="text-gray-800 dark:text-white/90">{{ formatShortDate((row as ContractExpiringItem).endDate) }}</span>
            <Badge :variant="daysLeftVariant((row as ContractExpiringItem).daysLeft)">
              {{ daysLeftLabel((row as ContractExpiringItem).daysLeft) }}
            </Badge>
          </div>
        </td>
      </template>
    </DataTable>
    <div v-if="rows.length" class="border-t border-gray-200 dark:border-gray-800">
      <BasePagination v-bind="paginationProps" :show-page-size="true" @update:current-page="setPage" @update:page-size="setPageSize" />
    </div>
  </template>
</template>
