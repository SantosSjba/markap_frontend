<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import Avatar from '@shared/presentation/components/ui/Avatar.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { formatShortDate, toCalendarDateString } from '@shared/utils/formatters'
import { useActiveClientsReport } from '../composables/useReportes'
import type { ActiveClientReportItem } from '../../domain/reportes.types'
import { daysLeftLabel, daysLeftVariant, formatMoney, useLocalPagination } from '../utils/report-format'
import ReportSectionHeader from '@shared/presentation/components/reports/ReportSectionHeader.vue'
import ReportQueryError from './ReportQueryError.vue'
/** Pestaña «Clientes activos»: inquilinos con contrato vigente, su contacto y el detalle de cada contrato. */

const query = useActiveClientsReport('alquileres')
const search = ref('')
const rows = computed(() => {
  const q = search.value.trim().toLocaleLowerCase('es-PE')
  const all = query.data.value ?? []
  if (!q) return all
  return all.filter((c) =>
    [c.fullName, c.documentNumber, c.phone, c.email, ...c.contracts.flatMap((k) => [k.code, k.propertyAddress, k.ownerName])]
      .filter(Boolean)
      .some((v) => String(v).toLocaleLowerCase('es-PE').includes(q)),
  )
})
const { pageRows, paginationProps, setPage, setPageSize } = useLocalPagination(rows)

const columns = [
  { key: 'cliente', label: 'Cliente', sortable: true, sortAccessor: (r: unknown) => (r as ActiveClientReportItem).fullName },
  { key: 'contacto', label: 'Contacto' },
  {
    key: 'contratos',
    label: 'Contratos vigentes',
    sortable: true,
    sortType: 'basic' as const,
    sortAccessor: (r: unknown) => (r as ActiveClientReportItem).contractsCount,
  },
]

const { isExporting, exportToExcel } = useExcelExport()
async function handleExport() {
  // Datos al momento de exportar, no los que quedaron en caché al abrir la pestaña
  await query.refetch()
  // Una fila por contrato: el cliente se repite si tiene varios
  await exportToExcel({
    fileName: `clientes_activos_${toCalendarDateString()}`,
    sheetName: 'Clientes activos',
    columns: [
      { header: 'Cliente', key: 'fullName', width: 28 },
      { header: 'Documento', key: 'documentNumber', width: 14 },
      { header: 'Teléfono', key: 'phone', width: 14 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Rol', key: 'role', width: 14 },
      { header: 'Contrato', key: 'code', width: 34 },
      { header: 'Propiedad', key: 'propertyAddress', width: 32 },
      { header: 'Propietario', key: 'ownerName', width: 24 },
      { header: 'Inicio', key: 'startDate', width: 14 },
      { header: 'Vencimiento', key: 'endDate', width: 14 },
      { header: 'Moneda', key: 'currency', width: 10 },
      { header: 'Alquiler mensual', key: 'monthlyAmount', width: 16 },
    ],
    rows: rows.value.flatMap((c) =>
      c.contracts.map((k) => ({
        fullName: c.fullName,
        documentNumber: c.documentNumber ?? '—',
        phone: c.phone ?? '—',
        email: c.email ?? '—',
        role: k.isPrimaryTenant ? 'Titular' : 'Co-inquilino',
        code: k.code,
        propertyAddress: k.propertyAddress,
        ownerName: k.ownerName,
        startDate: formatShortDate(k.startDate),
        endDate: formatShortDate(k.endDate),
        currency: k.currency,
        monthlyAmount: k.monthlyAmount,
      })),
    ),
  })
}
</script>

<template>
  <ReportSectionHeader
    title="Clientes activos"
    subtitle="Inquilinos con al menos un contrato vigente"
    icon="lucide:users"
    :exporting="isExporting"
    @export="handleExport"
  />

  <ReportQueryError v-if="query.isError.value" :error="query.error.value" @retry="() => query.refetch()" />
  <template v-else>
    <DataTable
      :columns="columns"
      :data="pageRows"
      :loading="query.isFetching.value && !query.data.value"
      empty-text="No hay clientes con contratos vigentes."
    >
      <template #toolbar>
        <div class="flex-1 min-w-0">
          <SearchInput v-model="search" placeholder="Buscar por cliente, documento, contrato o propiedad..." />
        </div>
      </template>
      <template #row="{ row }">
        <td class="py-3 px-4 align-top">
          <div class="flex items-center gap-3">
            <Avatar :name="(row as ActiveClientReportItem).fullName" size="sm" />
            <div>
              <p class="font-medium text-gray-800 dark:text-white/90">{{ (row as ActiveClientReportItem).fullName }}</p>
              <p v-if="(row as ActiveClientReportItem).documentNumber" class="text-xs text-gray-400 dark:text-gray-500">
                Doc. {{ (row as ActiveClientReportItem).documentNumber }}
              </p>
            </div>
          </div>
        </td>
        <td class="py-3 px-4 align-top text-sm">
          <p class="text-gray-800 dark:text-white/90">{{ (row as ActiveClientReportItem).phone ?? '—' }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">{{ (row as ActiveClientReportItem).email ?? 'Sin email' }}</p>
        </td>
        <td class="py-3 px-4 align-top whitespace-normal">
          <ul class="space-y-2">
            <li
              v-for="k in (row as ActiveClientReportItem).contracts"
              :key="k.rentalId"
              class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <BaseButton
                    variant="link"
                    size="sm"
                    class="px-0! font-medium"
                    :to="{ name: 'alquileres-contratos-detalle', params: { id: k.rentalId } }"
                  >
                    {{ k.code }}
                  </BaseButton>
                  <Badge v-if="!k.isPrimaryTenant" variant="neutral">Co-inquilino</Badge>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ k.propertyAddress }} · Prop. {{ k.ownerName }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  {{ formatShortDate(k.startDate) }} – {{ formatShortDate(k.endDate) }}
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">
                  {{ formatMoney(k.monthlyAmount, k.currency) }}
                </span>
                <Badge :variant="daysLeftVariant(k.daysLeft)">{{ daysLeftLabel(k.daysLeft) }}</Badge>
              </div>
            </li>
          </ul>
        </td>
      </template>
    </DataTable>
    <div v-if="rows.length" class="border-t border-gray-200 dark:border-gray-800">
      <BasePagination v-bind="paginationProps" :show-page-size="true" @update:current-page="setPage" @update:page-size="setPageSize" />
    </div>
  </template>
</template>
