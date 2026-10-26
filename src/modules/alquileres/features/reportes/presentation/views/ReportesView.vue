<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import { reportesRepositoryKey } from '../../application/ports/reportes.port'
import { useService } from '@shared/presentation/di/services'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import type { FinancialDistributionParams, RentalsByMonthParams } from '../../domain/reportes.types'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ExcelIcon from '@shared/presentation/components/ui/ExcelIcon.vue'
import TableBodySkeleton from '@shared/presentation/components/ui/TableBodySkeleton.vue'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatShortDate, parseCalendarDate, toCalendarDateString } from '@shared/utils/formatters'
import {
  useReportsSummary,
  useContractsExpiring,
  usePropertiesWithoutContract,
  useActiveClientsReport,
  useContractStatusSummary,
  useMonthlyMetrics,
  useRentalsByMonth,
  useFinancialDistributionReport,
} from '../composables/useReportes'
import { RENTAL_UTILITY_NET_SHORT_LABEL } from '../../../alquileres/domain/rental-financial.labels'
import type {
  ContractExpiringItem,
  PropertyWithoutContractItem,
  ActiveClientReportItem,
  RentalsByMonthItem,
  RentalsByMonthCurrencyTotals,
  FinancialDistributionReportItem,
} from '../../domain/reportes.types'
import CommissionsBarChart from '../components/CommissionsBarChart.vue'
const reportesRepository = useService(reportesRepositoryKey)

const router = useRouter()

const APPLICATION_SLUG = 'alquileres'

const periodFilter = ref(30)
const activeTab = ref('contratos-por-vencer')

// --- Filtros para "Comisiones de alquileres" ---
type FilterMode = 'year' | 'month' | 'range'
const filterMode = ref<FilterMode>('year')
const yearFilter = ref(new Date().getFullYear())
const monthFilter = ref(new Date().getMonth() + 1)
const startDateFilter = ref('')
const endDateFilter = ref('')

function getDefaultRentalsByMonthFilters() {
  const now = new Date()
  return {
    filterMode: 'year' as FilterMode,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    startDate: '',
    endDate: '',
  }
}

const hasActiveRentalsByMonthFilters = computed(() => {
  const defaults = getDefaultRentalsByMonthFilters()
  return (
    filterMode.value !== defaults.filterMode ||
    yearFilter.value !== defaults.year ||
    monthFilter.value !== defaults.month ||
    !!startDateFilter.value ||
    !!endDateFilter.value
  )
})

function clearRentalsByMonthFilters() {
  const defaults = getDefaultRentalsByMonthFilters()
  filterMode.value = defaults.filterMode
  yearFilter.value = defaults.year
  monthFilter.value = defaults.month
  startDateFilter.value = defaults.startDate
  endDateFilter.value = defaults.endDate
  expandedMonthKey.value = null
}

const filterModeOptions = [
  { value: 'year', label: 'Por año completo' },
  { value: 'month', label: 'Mes específico' },
  { value: 'range', label: 'Rango de fechas' },
]

const monthOptions = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

const rentalsByMonthParams = computed<RentalsByMonthParams>(() => {
  if (filterMode.value === 'range') {
    return {
      year: yearFilter.value,
      startDate: startDateFilter.value || undefined,
      endDate: endDateFilter.value || undefined,
    }
  }
  if (filterMode.value === 'month') {
    return { year: yearFilter.value, month: monthFilter.value }
  }
  return { year: yearFilter.value }
})

const reportTabs = [
  { id: 'contratos-por-vencer', label: 'Contratos por Vencer', icon: 'lucide:calendar-clock' },
  { id: 'sin-contrato', label: 'Sin Contrato', icon: 'lucide:building-2' },
  { id: 'clientes-activos', label: 'Clientes Activos', icon: 'lucide:users' },
  { id: 'alquiler-por-mes', label: 'Comisiones de alquileres', icon: 'lucide:bar-chart-2' },
]

const days = computed(() => Math.min(365, Math.max(1, periodFilter.value)))

const summaryQuery = useReportsSummary(APPLICATION_SLUG, days)
const contractsExpiringQuery = useContractsExpiring(APPLICATION_SLUG, days)
const propertiesWithoutContractQuery = usePropertiesWithoutContract(APPLICATION_SLUG)
const activeClientsQuery = useActiveClientsReport(APPLICATION_SLUG)
const contractStatusQuery = useContractStatusSummary(APPLICATION_SLUG)
const monthlyMetricsQuery = useMonthlyMetrics(APPLICATION_SLUG)
const rentalsByMonthQuery = useRentalsByMonth(APPLICATION_SLUG, rentalsByMonthParams)

const stats = computed(
  () =>
    summaryQuery.data.value ?? {
      contratosPorVencer: 0,
      propiedadesSinContrato: 0,
      clientesActivos: 0,
      clientesConIncidencias: 0,
    },
)

const contratosPorVencerRows = computed(() => contractsExpiringQuery.data.value ?? [])
const propertiesWithoutContractRows = computed(
  () => propertiesWithoutContractQuery.data.value ?? [],
)
const activeClientsRows = computed(() => activeClientsQuery.data.value ?? [])

const statusSummary = computed(
  () =>
    contractStatusQuery.data.value ?? {
      vigentes: 0,
      porVencer: 0,
      proximos: 0,
      urgentes: 0,
    },
)

const resumenContratos = computed(() => [
  {
    label: 'Vigentes (más de 90 días)',
    value: statusSummary.value.vigentes,
    color: 'var(--color-success)',
  },
  {
    label: 'Por vencer (61-90 días)',
    value: statusSummary.value.porVencer,
    color: 'var(--color-surface-elevated)',
  },
  {
    label: 'Próximos (31-60 días)',
    value: statusSummary.value.proximos,
    color: 'var(--color-warning)',
  },
  {
    label: 'Urgentes (0-30 días)',
    value: statusSummary.value.urgentes,
    color: 'var(--color-error)',
  },
])

const totalResumen = computed(() => resumenContratos.value.reduce((acc, r) => acc + r.value, 0))

const metricasMes = computed(
  () =>
    monthlyMetricsQuery.data.value ?? {
      tasaOcupacion: 0,
      tasaCobranza: 0,
      contratosRenovados: 0,
      clientesNuevos: 0,
    },
)

function formatDate(dateStr: string) {
  return formatShortDate(dateStr)
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currency || 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const periodOptions = [
  { value: 30, label: 'Próximos 30 días' },
  { value: 60, label: 'Próximos 60 días' },
  { value: 90, label: 'Próximos 90 días' },
]

const rentalsByMonthRows = computed(() => rentalsByMonthQuery.data.value ?? [])

const expandedMonthKey = ref<string | null>(null)

watch(filterMode, () => {
  expandedMonthKey.value = null
})

watch(yearFilter, () => {
  if (filterMode.value === 'year') expandedMonthKey.value = null
})

function monthDateRange(year: number, month: number) {
  const mm = String(month).padStart(2, '0')
  const lastDay = new Date(year, month, 0).getDate()
  const dd = String(lastDay).padStart(2, '0')
  return {
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${dd}`,
  }
}

const detailDateRange = computed(() => {
  if (filterMode.value === 'range') {
    if (!startDateFilter.value || !endDateFilter.value) return null
    return { startDate: startDateFilter.value, endDate: endDateFilter.value }
  }
  if (filterMode.value === 'month') {
    return monthDateRange(yearFilter.value, monthFilter.value)
  }
  return {
    startDate: `${yearFilter.value}-01-01`,
    endDate: `${yearFilter.value}-12-31`,
  }
})

// El detalle de cada mes lista las comisiones cobradas en él (no los contratos iniciados)
const financialDistributionParams = computed<FinancialDistributionParams>(() => ({
  ...(detailDateRange.value ?? {}),
  dateField: 'commissionPaidDate',
}))

const shouldLoadDetail = computed(
  () => activeTab.value === 'alquiler-por-mes' && detailDateRange.value != null,
)

/** Fila de la tabla: un mes en una moneda (soles y dólares van en filas separadas). */
interface MonthCurrencyRow extends RentalsByMonthCurrencyTotals {
  key: string
  month: RentalsByMonthItem
  /** Primera fila del mes: lleva el nombre del mes y los contratos */
  first: boolean
}

const EMPTY_TOTALS = {
  collectedCommissions: 0,
  totalRevenue: 0,
  companyRevenue: 0,
  totalExpense: 0,
  totalTax: 0,
  totalExternalCommission: 0,
  totalInternalCommission: 0,
  totalUtility: 0,
}

const monthCurrencyRows = computed<MonthCurrencyRow[]>(() =>
  rentalsByMonthRows.value.flatMap((m) => {
    const totals = m.totalsByCurrency.length
      ? m.totalsByCurrency
      : [{ currency: 'PEN', ...EMPTY_TOTALS }]
    return totals.map((t, i) => ({ ...t, key: `${m.year}-${m.month}-${t.currency}`, month: m, first: i === 0 }))
  }),
)

/** Totales del período por moneda */
const periodTotals = computed<RentalsByMonthCurrencyTotals[]>(() => {
  const byCurrency = new Map<string, RentalsByMonthCurrencyTotals>()
  for (const m of rentalsByMonthRows.value) {
    for (const t of m.totalsByCurrency) {
      const acc = byCurrency.get(t.currency) ?? { currency: t.currency, ...EMPTY_TOTALS }
      byCurrency.set(t.currency, {
        currency: t.currency,
        collectedCommissions: acc.collectedCommissions + t.collectedCommissions,
        totalRevenue: acc.totalRevenue + t.totalRevenue,
        companyRevenue: acc.companyRevenue + t.companyRevenue,
        totalExpense: acc.totalExpense + t.totalExpense,
        totalTax: acc.totalTax + t.totalTax,
        totalExternalCommission: acc.totalExternalCommission + t.totalExternalCommission,
        totalInternalCommission: acc.totalInternalCommission + t.totalInternalCommission,
        totalUtility: acc.totalUtility + t.totalUtility,
      })
    }
  }
  const list = [...byCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency))
  return list.length ? list : [{ currency: 'PEN', ...EMPTY_TOTALS }]
})

const periodSummaryCards = (t: RentalsByMonthCurrencyTotals) => [
  { label: 'Ingreso', icon: 'lucide:circle-plus', value: t.companyRevenue, negative: false },
  { label: 'Gastos', icon: 'lucide:minus-circle', value: t.totalExpense, negative: true },
  { label: 'Impuestos', icon: 'lucide:receipt', value: t.totalTax, negative: true },
  { label: 'Com. externo', icon: 'lucide:user-round-cog', value: t.totalExternalCommission, negative: true },
  { label: 'Com. interno', icon: 'lucide:user-check', value: t.totalInternalCommission, negative: true },
]

function canExpandMonth(row: RentalsByMonthItem) {
  return row.totalsByCurrency.some((t) => t.collectedCommissions > 0)
}

function toggleMonthDetail(row: RentalsByMonthItem) {
  if (!canExpandMonth(row)) return
  const key = `${row.year}-${row.month}`
  expandedMonthKey.value = expandedMonthKey.value === key ? null : key
}

function isMonthExpanded(row: RentalsByMonthItem) {
  return expandedMonthKey.value === `${row.year}-${row.month}`
}

function goToRentalDetail(rentalId: string) {
  router.push({ name: 'alquileres-contratos-detalle', params: { id: rentalId } })
}

const financialDistributionQuery = useFinancialDistributionReport(
  APPLICATION_SLUG,
  financialDistributionParams,
  shouldLoadDetail,
)

const allRentalDetails = computed(() => financialDistributionQuery.data.value ?? [])

function getRentalsForMonth(row: RentalsByMonthItem): FinancialDistributionReportItem[] {
  return allRentalDetails.value.filter((item) => {
    if (!item.commissionPaidDate) return false
    const d = parseCalendarDate(item.commissionPaidDate)
    return d.getFullYear() === row.year && d.getMonth() + 1 === row.month
  })
}

const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  return [current - 2, current - 1, current, current + 1]
})

const { isExporting, exportToExcel } = useExcelExport()

async function handleExportTab() {
  const now = toCalendarDateString()
  if (activeTab.value === 'contratos-por-vencer') {
    const data = await reportesRepository.getContractsExpiring(APPLICATION_SLUG, days.value)
    await exportToExcel({
      fileName: `contratos_por_vencer_${now}`,
      sheetName: 'Contratos por Vencer',
      columns: [
        { header: 'Código', key: 'code', width: 14 },
        { header: 'Inquilino', key: 'tenantName', width: 26 },
        { header: 'Propiedad', key: 'propertyAddress', width: 32 },
        { header: 'Propietario', key: 'ownerName', width: 24 },
        { header: 'Vencimiento', key: 'endDate', width: 16 },
        { header: 'Días restantes', key: 'daysLeft', width: 14 },
      ],
      rows: data.map((r: ContractExpiringItem) => ({
        code: r.code,
        tenantName: r.tenantName,
        propertyAddress: r.propertyAddress,
        ownerName: r.ownerName,
        endDate: formatDate(r.endDate),
        daysLeft: r.daysLeft,
      })),
    })
  } else if (activeTab.value === 'sin-contrato') {
    const data = await reportesRepository.getPropertiesWithoutContract(APPLICATION_SLUG)
    await exportToExcel({
      fileName: `propiedades_sin_contrato_${now}`,
      sheetName: 'Sin Contrato',
      columns: [
        { header: 'Código', key: 'code', width: 14 },
        { header: 'Dirección', key: 'addressLine', width: 36 },
        { header: 'Propietario', key: 'ownerName', width: 26 },
      ],
      rows: data.map((p: PropertyWithoutContractItem) => ({
        code: p.code,
        addressLine: p.addressLine,
        ownerName: p.ownerName,
      })),
    })
  } else if (activeTab.value === 'clientes-activos') {
    const data = await reportesRepository.getActiveClients(APPLICATION_SLUG)
    await exportToExcel({
      fileName: `clientes_activos_${now}`,
      sheetName: 'Clientes Activos',
      columns: [
        { header: 'Cliente', key: 'fullName', width: 28 },
        { header: 'Contratos activos', key: 'contractsCount', width: 18 },
      ],
      rows: data.map((c: ActiveClientReportItem) => ({
        fullName: c.fullName,
        contractsCount: c.contractsCount,
      })),
    })
  } else if (activeTab.value === 'alquiler-por-mes') {
    const p = rentalsByMonthParams.value
    const data = await reportesRepository.getRentalsByMonth(
      APPLICATION_SLUG,
      p.year ?? yearFilter.value,
      p.month,
      p.startDate,
      p.endDate,
    )
    const fileLabel =
      filterMode.value === 'range'
        ? `${p.startDate ?? ''}_${p.endDate ?? ''}`
        : filterMode.value === 'month'
          ? `${p.year}_mes${p.month}`
          : String(p.year ?? yearFilter.value)

    await exportToExcel({
      fileName: `comisiones_alquileres_${fileLabel}_${now}`,
      sheetName: 'Comisiones de alquileres',
      columns: [
        { header: 'Mes', key: 'monthName', width: 16 },
        { header: 'Moneda', key: 'currency', width: 10 },
        { header: 'Comisiones cobradas', key: 'collectedCommissions', width: 20 },
        { header: 'Ingreso', key: 'companyRevenue', width: 18 },
        { header: 'Gastos', key: 'totalExpense', width: 16 },
        { header: 'Impuestos', key: 'totalTax', width: 16 },
        { header: 'Comisión ag. externo', key: 'totalExternalCommission', width: 22 },
        { header: 'Comisión ag. interno', key: 'totalInternalCommission', width: 22 },
        { header: RENTAL_UTILITY_NET_SHORT_LABEL, key: 'totalUtility', width: 22 },
        { header: 'Contratos nuevos', key: 'newContracts', width: 18 },
        { header: 'Activos al cierre', key: 'activeAtEndOfMonth', width: 18 },
      ],
      rows: data.flatMap((r: RentalsByMonthItem) =>
        (r.totalsByCurrency.length ? r.totalsByCurrency : [{ currency: 'PEN', ...EMPTY_TOTALS }]).map(
          (t) => ({
            monthName: r.monthName,
            currency: t.currency,
            collectedCommissions: t.collectedCommissions,
            companyRevenue: t.companyRevenue,
            totalExpense: t.totalExpense,
            totalTax: t.totalTax,
            totalExternalCommission: t.totalExternalCommission,
            totalInternalCommission: t.totalInternalCommission,
            totalUtility: t.totalUtility,
            newContracts: r.newContracts,
            activeAtEndOfMonth: r.activeAtEndOfMonth,
          }),
        ),
      ),
    })
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <PageHeader
      title="Reportes"
      subtitle="Análisis y exportación de datos"
    >
      <template #actions>
        <div class="flex items-center gap-2 w-full sm:w-auto">
        <AppIcon icon="lucide:filter" :size="15" color="var(--color-text-muted)" class="shrink-0" />
        <label class="text-sm shrink-0 text-gray-500 dark:text-gray-400">Período:</label>
        <FormSelect
          v-model="periodFilter"
          :options="periodOptions"
          class="min-w-[170px]"
        />
      </div>
      </template>
    </PageHeader>

    <!-- Cards resumen (independiente del resto de consultas) -->
    <div v-if="summaryQuery.isPending.value" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="i in 4"
        :key="i"
        class="rounded-xl border h-24 animate-pulse bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-800"
      />
    </div>
    <BaseCard v-else-if="summaryQuery.isError.value" class="block text-center space-y-3">
      <p class="text-sm text-error-500 dark:text-error-400">{{ getApiErrorMessage(summaryQuery.error.value) }}</p>
      <BaseButton variant="outline" size="sm" @click="() => summaryQuery.refetch()">Reintentar</BaseButton>
    </BaseCard>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Contratos por Vencer" :value="stats.contratosPorVencer">
          <template #icon><AppIcon icon="lucide:calendar-clock" :size="20" color="var(--color-primary)" /></template>
        </StatsCard>
        <StatsCard title="Propiedades Sin Contrato" :value="stats.propiedadesSinContrato">
          <template #icon><AppIcon icon="lucide:building-2" :size="20" color="var(--color-primary)" /></template>
        </StatsCard>
        <StatsCard title="Clientes Activos" :value="stats.clientesActivos">
          <template #icon><AppIcon icon="lucide:users" :size="20" color="var(--color-primary)" /></template>
        </StatsCard>
        <StatsCard title="Clientes con Incidencias" :value="stats.clientesConIncidencias">
          <template #icon><AppIcon icon="lucide:triangle-alert" :size="20" color="var(--color-error)" /></template>
        </StatsCard>
      </div>

      <!-- Tabs -->
      <BaseTabs v-model="activeTab" :tabs="reportTabs" />

      <!-- Contenido según pestaña activa -->
      <BaseCard class="block">
        <!-- Contratos por Vencer -->
        <template v-if="activeTab === 'contratos-por-vencer'">
          <div
            v-if="contractsExpiringQuery.isError.value"
            class="text-center py-10 space-y-3"
          >
            <p class="text-sm text-error-500 dark:text-error-400">
              {{ getApiErrorMessage(contractsExpiringQuery.error.value) }}
            </p>
            <BaseButton variant="outline" size="sm" @click="() => contractsExpiringQuery.refetch()">Reintentar</BaseButton>
          </div>
          <template v-else>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-50 dark:bg-brand-500/12"
            >
                <AppIcon icon="lucide:calendar-clock" :size="20" color="var(--color-primary)" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Contratos por Vencer
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Contratos que vencen en los próximos {{ periodFilter }} días
                </p>
              </div>
            </div>
            <BaseButton variant="outline" :loading="isExporting" @click="handleExportTab">
              <ExcelIcon class="w-5 h-5" />
              Exportar Excel
            </BaseButton>
          </div>
          <div class="overflow-x-auto">
            <DataTable
              :columns="[
                { key: 'c0', label: 'Contrato' },
                { key: 'c1', label: 'Inquilino' },
                { key: 'c2', label: 'Propiedad' },
                { key: 'c3', label: 'Propietario' },
                { key: 'c4', label: 'Vencimiento' },
                { key: 'c5', label: 'Días' },
              ]"
              :data="contratosPorVencerRows"
              :loading="contractsExpiringQuery.isFetching.value"
            >
              <template #row="{ row }">
                  <td class="py-3 px-4 font-medium text-gray-800 dark:text-white/90">{{ row.code }}</td>
                  <td class="py-3 px-4 text-gray-800 dark:text-white/90">{{ row.tenantName }}</td>
                  <td class="py-3 px-4 text-gray-800 dark:text-white/90">{{ row.propertyAddress }}</td>
                  <td class="py-3 px-4 text-gray-800 dark:text-white/90">{{ row.ownerName }}</td>
                  <td class="py-3 px-4 text-gray-800 dark:text-white/90">{{ formatDate(row.endDate) }}</td>
                  <td class="py-3 px-4">
                    <Badge variant="error">{{ row.daysLeft }} días</Badge>
                  </td>
              </template>
            </DataTable>
            <div
              v-if="!contractsExpiringQuery.isFetching.value && !contratosPorVencerRows.length"
              class="flex flex-col items-center gap-2 py-10 text-gray-400 dark:text-gray-500"
            >
              <AppIcon icon="lucide:calendar-check" :size="40" />
              <p class="text-sm">No hay contratos por vencer en el período seleccionado.</p>
            </div>
          </div>
          </template>
        </template>

        <!-- Sin Contrato -->
        <template v-else-if="activeTab === 'sin-contrato'">
          <div
            v-if="propertiesWithoutContractQuery.isError.value"
            class="text-center py-10 space-y-3"
          >
            <p class="text-sm text-error-500 dark:text-error-400">
              {{ getApiErrorMessage(propertiesWithoutContractQuery.error.value) }}
            </p>
            <BaseButton variant="outline" size="sm" @click="() => propertiesWithoutContractQuery.refetch()">Reintentar</BaseButton>
          </div>
          <template v-else>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-50 dark:bg-brand-500/12"
            >
              <AppIcon icon="lucide:building-2" :size="20" color="var(--color-primary)" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">Propiedades sin contrato</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">Propiedades disponibles sin contrato activo</p>
            </div>
          </div>
            <BaseButton variant="outline" :loading="isExporting" @click="handleExportTab">
              <ExcelIcon class="w-5 h-5" />
              Exportar Excel
            </BaseButton>
          </div>
          <div class="overflow-x-auto">
            <DataTable
              :columns="[
                { key: 'c0', label: 'Código' },
                { key: 'c1', label: 'Dirección' },
                { key: 'c2', label: 'Propietario' },
              ]"
              :data="propertiesWithoutContractRows"
              :loading="propertiesWithoutContractQuery.isFetching.value"
            >
              <template #row="{ row }">
                  <td class="py-3 px-4 font-medium text-gray-800 dark:text-white/90">{{ row.code }}</td>
                  <td class="py-3 px-4 text-gray-800 dark:text-white/90">{{ row.addressLine }}</td>
                  <td class="py-3 px-4 text-gray-800 dark:text-white/90">{{ row.ownerName }}</td>
              </template>
            </DataTable>
            <div
              v-if="!propertiesWithoutContractQuery.isFetching.value && !propertiesWithoutContractRows.length"
              class="flex flex-col items-center gap-2 py-10 text-gray-400 dark:text-gray-500"
            >
              <AppIcon icon="lucide:building-2" :size="40" />
              <p class="text-sm">No hay propiedades sin contrato.</p>
            </div>
          </div>
          </template>
        </template>

        <!-- Clientes Activos -->
        <template v-else-if="activeTab === 'clientes-activos'">
          <div
            v-if="activeClientsQuery.isError.value"
            class="text-center py-10 space-y-3"
          >
            <p class="text-sm text-error-500 dark:text-error-400">
              {{ getApiErrorMessage(activeClientsQuery.error.value) }}
            </p>
            <BaseButton variant="outline" size="sm" @click="() => activeClientsQuery.refetch()">Reintentar</BaseButton>
          </div>
          <template v-else>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-50 dark:bg-brand-500/12"
            >
              <AppIcon icon="lucide:users" :size="20" color="var(--color-primary)" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">Clientes activos</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">Inquilinos con al menos un contrato vigente</p>
            </div>
          </div>
            <BaseButton variant="outline" :loading="isExporting" @click="handleExportTab">
              <ExcelIcon class="w-5 h-5" />
              Exportar Excel
            </BaseButton>
          </div>
          <div class="overflow-x-auto">
            <DataTable
              :columns="[
                { key: 'c0', label: 'Cliente' },
                { key: 'c1', label: 'Contratos activos' },
              ]"
              :data="activeClientsRows"
              :loading="activeClientsQuery.isFetching.value"
            >
              <template #row="{ row }">
                  <td class="py-3 px-4 font-medium text-gray-800 dark:text-white/90">{{ row.fullName }}</td>
                  <td class="py-3 px-4 text-gray-800 dark:text-white/90">{{ row.contractsCount }}</td>
              </template>
            </DataTable>
            <div
              v-if="!activeClientsQuery.isFetching.value && !activeClientsRows.length"
              class="flex flex-col items-center gap-2 py-10 text-gray-400 dark:text-gray-500"
            >
              <AppIcon icon="lucide:users" :size="40" />
              <p class="text-sm">No hay clientes activos.</p>
            </div>
          </div>
          </template>
        </template>

        <!-- Comisiones de alquileres (ingreso por intermediación) -->
        <template v-else-if="activeTab === 'alquiler-por-mes'">
          <!-- Header -->
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-brand-50 dark:bg-brand-500/12"
              >
                <AppIcon icon="lucide:bar-chart-2" :size="20" color="var(--color-primary)" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Comisiones de alquileres
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Ingreso por intermediación en el mes en que se cobró cada comisión. Soles y dólares se muestran por separado.
                </p>
              </div>
            </div>
            <BaseButton variant="outline" :loading="isExporting" @click="handleExportTab">
              <ExcelIcon class="w-5 h-5" />
              Exportar Excel
            </BaseButton>
          </div>

          <!-- Filtros -->
          <div
            class="p-4 rounded-xl mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
          >
            <!-- Modo de filtro -->
            <FormSelect
              v-model="filterMode"
              label="Modo de filtro"
              :options="filterModeOptions"
            />

            <!-- Año (siempre visible en modos year y month) -->
            <FormSelect
              v-if="filterMode !== 'range'"
              v-model="yearFilter"
              label="Año"
              :options="yearOptions.map(y => ({ value: y, label: String(y) }))"
            />

            <!-- Mes (solo en modo mes específico) -->
            <FormSelect
              v-if="filterMode === 'month'"
              v-model="monthFilter"
              label="Mes"
              :options="monthOptions"
            />

            <!-- Rango de fechas (solo en modo range) -->
            <template v-if="filterMode === 'range'">
              <FormInput
                v-model="startDateFilter"
                type="date"
                label="Fecha inicio"
              />
              <FormInput
                v-model="endDateFilter"
                type="date"
                label="Fecha fin"
              />
            </template>

            <div
              v-if="hasActiveRentalsByMonthFilters"
              class="flex items-end sm:col-span-2 lg:col-span-1"
            >
              <BaseButton @click="clearRentalsByMonthFilters" variant="ghost" size="sm" block icon="lucide:x" class="sm:w-auto">Limpiar filtros</BaseButton>
            </div>
          </div>

          <div
            v-if="rentalsByMonthQuery.isError.value"
            class="rounded-xl border p-6 text-center space-y-3 mb-5 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-800"
          >
            <p class="text-sm text-error-500 dark:text-error-400">
              {{ getApiErrorMessage(rentalsByMonthQuery.error.value) }}
            </p>
            <BaseButton variant="outline" size="sm" @click="() => rentalsByMonthQuery.refetch()">Reintentar</BaseButton>
          </div>

          <template v-else>
          <!-- Totales del período por moneda (sin conversión) -->
          <div v-if="rentalsByMonthRows.length > 0" class="space-y-3 mb-5">
            <div
              v-for="t in periodTotals"
              :key="t.currency"
              class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
            >
              <div
                v-for="card in periodSummaryCards(t)"
                :key="card.label"
                class="rounded-xl p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
              >
                <div class="flex items-center gap-1.5 mb-1">
                  <AppIcon :icon="card.icon" :size="14" :color="card.negative ? 'var(--color-text-muted)' : 'var(--color-primary)'" />
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {{ card.label }}<template v-if="periodTotals.length > 1"> · {{ t.currency }}</template>
                  </p>
                </div>
                <p
                  class="text-base font-bold"
                  :class="card.negative ? 'text-gray-800 dark:text-white/90' : 'text-brand-500 dark:text-brand-400'"
                >
                  <template v-if="card.negative">− </template>{{ formatCurrency(card.value, t.currency) }}
                </p>
                <p v-if="!card.negative" class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
                  {{ t.collectedCommissions }} {{ t.collectedCommissions === 1 ? 'comisión cobrada' : 'comisiones cobradas' }}
                </p>
              </div>
              <div class="rounded-xl p-3 bg-brand-50 dark:bg-brand-500/12 border border-brand-500">
                <div class="flex items-center gap-1.5 mb-1">
                  <AppIcon icon="lucide:circle-check" :size="14" color="var(--color-primary)" />
                  <p class="text-xs font-medium text-brand-500 dark:text-brand-400">
                    {{ RENTAL_UTILITY_NET_SHORT_LABEL }}<template v-if="periodTotals.length > 1"> · {{ t.currency }}</template>
                  </p>
                </div>
                <p class="text-base font-bold text-brand-500 dark:text-brand-400">
                  {{ formatCurrency(t.totalUtility, t.currency) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Comparación mes a mes -->
          <CommissionsBarChart
            v-if="filterMode !== 'month'"
            class="mb-5"
            :data="rentalsByMonthRows"
            :loading="rentalsByMonthQuery.isPending.value"
            :format-amount="formatCurrency"
          />

          <p class="text-xs mb-3 text-gray-400 dark:text-gray-500">
            Cada ingreso se ubica en el mes de su fecha de cobro (no en el inicio del contrato); las comisiones pendientes no cuentan hasta marcarlas como pagadas en
            <router-link :to="{ name: 'alquileres-comisiones' }" class="text-brand-500 dark:text-brand-400">Comisiones</router-link>.
            Haz clic en un mes con cobros para ver el detalle de cada alquiler.
          </p>

          <div class="overflow-x-auto">
            <Table class="w-full border-collapse text-sm">
              <TableHeader>
                <TableRow class="border-b-2 border-gray-200 dark:border-gray-800">
                  <TableCell is-header class="text-left py-3 px-4 font-semibold text-gray-500 dark:text-gray-400">Período</TableCell>
                  <TableCell is-header class="text-right py-3 px-4 font-semibold text-brand-500 dark:text-brand-400">
                    Ingreso
                    <span class="block text-xs font-normal text-gray-400 dark:text-gray-500">(comisiones cobradas)</span>
                  </TableCell>
                  <TableCell is-header class="text-right py-3 px-4 font-semibold text-gray-500 dark:text-gray-400">Gastos</TableCell>
                  <TableCell is-header class="text-right py-3 px-4 font-semibold text-gray-500 dark:text-gray-400">Impuestos</TableCell>
                  <TableCell is-header class="text-right py-3 px-4 font-semibold text-gray-500 dark:text-gray-400">
                    Comisión
                    <span class="block text-xs font-normal">ag. externo</span>
                  </TableCell>
                  <TableCell is-header class="text-right py-3 px-4 font-semibold text-gray-500 dark:text-gray-400">
                    Comisión
                    <span class="block text-xs font-normal">ag. interno</span>
                  </TableCell>
                  <TableCell is-header class="text-right py-3 px-4 font-semibold text-brand-500 dark:text-brand-400">
                    {{ RENTAL_UTILITY_NET_SHORT_LABEL }}
                    <span class="block text-xs font-normal">(inmobiliaria)</span>
                  </TableCell>
                  <TableCell is-header class="text-right py-3 px-4 font-semibold text-gray-500 dark:text-gray-400">
                    Contratos
                    <span class="block text-xs font-normal">nuevos / activos</span>
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBodySkeleton
                v-if="rentalsByMonthQuery.isFetching.value"
                :rows="6"
                :columns="8"
              />
              <TableBody v-else>
                <template v-for="(row, idx) in monthCurrencyRows" :key="row.key">
                  <TableRow
                    class="transition-opacity"
                    :class="[
                      canExpandMonth(row.month) ? 'cursor-pointer hover:opacity-90' : '',
                      isMonthExpanded(row.month) || monthCurrencyRows[idx + 1]?.month === row.month ? '' : 'border-b border-gray-200 dark:border-gray-800',
                      isMonthExpanded(row.month) ? 'bg-brand-50 dark:bg-brand-500/12' : '',
                    ]"
                    @click="toggleMonthDetail(row.month)"
                  >
                    <TableCell class="py-3 px-4 font-medium text-gray-800 dark:text-white/90">
                      <span class="inline-flex items-center gap-2">
                        <AppIcon
                          v-if="row.first && canExpandMonth(row.month)"
                          :icon="isMonthExpanded(row.month) ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                          :size="14"
                          color="var(--color-text-muted)"
                        />
                        <span v-else class="w-3.5 shrink-0" />
                        <template v-if="row.first">{{ row.month.monthName }}</template>
                        <span
                          v-if="row.month.totalsByCurrency.length > 1"
                          class="text-xs font-normal text-gray-400 dark:text-gray-500"
                        >{{ row.currency }}</span>
                      </span>
                    </TableCell>
                    <TableCell class="py-3 px-4 text-right font-semibold text-brand-500 dark:text-brand-400">
                      {{ formatCurrency(row.companyRevenue, row.currency) }}
                      <span v-if="row.collectedCommissions" class="block text-xs font-normal text-gray-400 dark:text-gray-500">
                        {{ row.collectedCommissions }} cobrada{{ row.collectedCommissions === 1 ? '' : 's' }}
                      </span>
                    </TableCell>
                    <TableCell class="py-3 px-4 text-right text-gray-500 dark:text-gray-400">
                      − {{ formatCurrency(row.totalExpense, row.currency) }}
                    </TableCell>
                    <TableCell class="py-3 px-4 text-right text-gray-500 dark:text-gray-400">
                      − {{ formatCurrency(row.totalTax, row.currency) }}
                    </TableCell>
                    <TableCell class="py-3 px-4 text-right text-gray-500 dark:text-gray-400">
                      − {{ formatCurrency(row.totalExternalCommission, row.currency) }}
                    </TableCell>
                    <TableCell class="py-3 px-4 text-right text-gray-500 dark:text-gray-400">
                      − {{ formatCurrency(row.totalInternalCommission, row.currency) }}
                    </TableCell>
                    <TableCell :class="(row.totalUtility >= 0) ? 'text-brand-500 dark:text-brand-400' : 'text-error-500 dark:text-error-400'" class="py-3 px-4 text-right font-bold">
                      {{ formatCurrency(row.totalUtility, row.currency) }}
                    </TableCell>
                    <TableCell class="py-3 px-4 text-right text-gray-500 dark:text-gray-400">
                      <template v-if="row.first">{{ row.month.newContracts }} / {{ row.month.activeAtEndOfMonth }}</template>
                    </TableCell>
                  </TableRow>

                  <template v-if="isMonthExpanded(row.month) && monthCurrencyRows[idx + 1]?.month !== row.month">
                    <TableRow class="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800"
                      v-if="financialDistributionQuery.isFetching.value"
                    >
                      <TableCell colspan="8" class="py-4 px-4 text-center">
                        <AppIcon icon="svg-spinners:ring-resize" :size="22" color="var(--color-primary)" />
                      </TableCell>
                    </TableRow>
                    <TableRow class="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800"
                      v-else-if="financialDistributionQuery.isError.value"
                    >
                      <TableCell colspan="8" class="py-4 px-4 text-center space-y-2">
                        <p class="text-sm text-error-500 dark:text-error-400">
                          {{ getApiErrorMessage(financialDistributionQuery.error.value) }}
                        </p>
                        <BaseButton variant="outline" size="sm" @click.stop="() => financialDistributionQuery.refetch()">
                          Reintentar
                        </BaseButton>
                      </TableCell>
                    </TableRow>
                    <TableRow class="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800"
                      v-else-if="!getRentalsForMonth(row.month).length"
                    >
                      <TableCell colspan="8" class="py-3 px-4 pl-10 text-sm text-gray-400 dark:text-gray-500">
                        No hay comisiones cobradas en este mes.
                      </TableCell>
                    </TableRow>
                    <template v-else>
                      <TableRow
                        v-for="item in getRentalsForMonth(row.month)"
                        :key="item.rentalId"
                        class="cursor-pointer hover:opacity-90 transition-opacity border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800"
                        @click.stop="goToRentalDetail(item.rentalId)"
                      >
                        <TableCell class="py-2.5 px-4 pl-10">
                          <p class="font-medium text-sm text-brand-500 dark:text-brand-400">{{ item.rentalCode }}</p>
                          <p class="text-xs mt-0.5 line-clamp-2 text-gray-800 dark:text-white/90">{{ item.propertyAddress }}</p>
                          <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
                            {{ item.tenantName }}
                            <span v-if="item.commissionPaidDate"> · cobrada {{ formatDate(item.commissionPaidDate) }}</span>
                            <span v-if="item.contractStartDate"> · inicio {{ formatDate(item.contractStartDate) }}</span>
                          </p>
                        </TableCell>
                        <TableCell class="py-2.5 px-4 text-right font-medium text-brand-500 dark:text-brand-400">
                          {{ formatCurrency(item.baseAmount, item.currency) }}
                        </TableCell>
                        <TableCell class="py-2.5 px-4 text-right text-sm text-gray-500 dark:text-gray-400">
                          − {{ formatCurrency(item.expense, item.currency) }}
                        </TableCell>
                        <TableCell class="py-2.5 px-4 text-right text-sm text-gray-500 dark:text-gray-400">
                          − {{ formatCurrency(item.tax, item.currency) }}
                        </TableCell>
                        <TableCell class="py-2.5 px-4 text-right text-sm text-gray-500 dark:text-gray-400">
                          − {{ formatCurrency(item.externalAgentCommission, item.currency) }}
                        </TableCell>
                        <TableCell class="py-2.5 px-4 text-right text-sm text-gray-500 dark:text-gray-400">
                          − {{ formatCurrency(item.internalAgentCommission, item.currency) }}
                        </TableCell>
                        <TableCell class="py-2.5 px-4 text-right font-semibold text-sm text-brand-500 dark:text-brand-400">
                          {{ formatCurrency(item.utility, item.currency) }}
                        </TableCell>
                        <TableCell class="py-2.5 px-4 text-right text-sm text-gray-400 dark:text-gray-500">—</TableCell>
                      </TableRow>
                    </template>
                  </template>
                </template>
              </TableBody>
              <tfoot v-if="rentalsByMonthRows.length > 1">
                <TableRow
                  v-for="(t, i) in periodTotals"
                  :key="t.currency"
                  :class="i === 0 ? 'border-t-2 border-gray-200 dark:border-gray-800' : ''"
                >
                  <TableCell class="py-3 px-4 font-semibold text-gray-800 dark:text-white/90">
                    Total<template v-if="periodTotals.length > 1"> {{ t.currency }}</template>
                  </TableCell>
                  <TableCell class="py-3 px-4 text-right font-bold text-brand-500 dark:text-brand-400">
                    {{ formatCurrency(t.companyRevenue, t.currency) }}
                  </TableCell>
                  <TableCell class="py-3 px-4 text-right font-semibold text-gray-500 dark:text-gray-400">
                    − {{ formatCurrency(t.totalExpense, t.currency) }}
                  </TableCell>
                  <TableCell class="py-3 px-4 text-right font-semibold text-gray-500 dark:text-gray-400">
                    − {{ formatCurrency(t.totalTax, t.currency) }}
                  </TableCell>
                  <TableCell class="py-3 px-4 text-right font-semibold text-gray-500 dark:text-gray-400">
                    − {{ formatCurrency(t.totalExternalCommission, t.currency) }}
                  </TableCell>
                  <TableCell class="py-3 px-4 text-right font-semibold text-gray-500 dark:text-gray-400">
                    − {{ formatCurrency(t.totalInternalCommission, t.currency) }}
                  </TableCell>
                  <TableCell class="py-3 px-4 text-right font-bold text-brand-500 dark:text-brand-400">
                    {{ formatCurrency(t.totalUtility, t.currency) }}
                  </TableCell>
                  <TableCell class="py-3 px-4 text-right font-semibold text-gray-500 dark:text-gray-400">
                    <template v-if="i === 0">{{ rentalsByMonthRows.reduce((s, r) => s + r.newContracts, 0) }} / —</template>
                  </TableCell>
                </TableRow>
              </tfoot>
            </Table>
            <p
              v-if="!rentalsByMonthRows.length && !rentalsByMonthQuery.isFetching.value && !rentalsByMonthQuery.isError.value"
              class="py-8 text-center text-sm text-gray-400 dark:text-gray-500"
            >
              No hay datos para el período seleccionado.
            </p>
          </div>
          </template>

        </template>
      </BaseCard>

      <!-- Paneles inferiores -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Resumen de Estado de Contratos -->
        <BaseCard class="block">
          <div class="flex items-center gap-2 mb-4">
            <AppIcon icon="lucide:clock" :size="20" color="var(--color-text-muted)" />
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
              Resumen de Estado de Contratos
            </h3>
          </div>
          <LoadingState v-if="contractStatusQuery.isPending.value" class="py-10" />
          <div
            v-else-if="contractStatusQuery.isError.value"
            class="text-center py-6 space-y-3"
          >
            <p class="text-sm text-error-500 dark:text-error-400">
              {{ getApiErrorMessage(contractStatusQuery.error.value) }}
            </p>
            <BaseButton variant="outline" size="sm" @click="() => contractStatusQuery.refetch()">Reintentar</BaseButton>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="(item, i) in resumenContratos"
              :key="i"
              class="flex items-center gap-3"
            >
              <span class="text-sm w-40 shrink-0 text-gray-500 dark:text-gray-400">
                {{ item.label }}
              </span>
              <div class="flex-1 h-6 rounded-full overflow-hidden bg-gray-50 dark:bg-gray-900">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :style="{
                    width: totalResumen ? `${(item.value / totalResumen) * 100}%` : '0%',
                    backgroundColor: item.color,
                  }"
                />
              </div>
              <span class="text-sm font-medium w-8 text-right text-gray-800 dark:text-white/90">
                {{ item.value }}
              </span>
            </div>
          </div>
        </BaseCard>

        <!-- Métricas del Mes -->
        <BaseCard class="block">
          <div class="flex items-center gap-2 mb-4">
            <AppIcon icon="lucide:trending-up" :size="20" color="var(--color-text-muted)" />
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
              Métricas del Mes
            </h3>
          </div>
          <LoadingState v-if="monthlyMetricsQuery.isPending.value" class="py-10" />
          <div
            v-else-if="monthlyMetricsQuery.isError.value"
            class="text-center py-6 space-y-3"
          >
            <p class="text-sm text-error-500 dark:text-error-400">
              {{ getApiErrorMessage(monthlyMetricsQuery.error.value) }}
            </p>
            <BaseButton variant="outline" size="sm" @click="() => monthlyMetricsQuery.refetch()">Reintentar</BaseButton>
          </div>
          <div v-else class="grid grid-cols-2 gap-3">
            <div
              class="rounded-lg p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
            >
              <div class="flex items-center gap-1.5 mb-2">
                <AppIcon icon="lucide:home" :size="15" :color="metricasMes.tasaOcupacion >= 80 ? 'var(--color-success)' : '#f59e0b'" />
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500">Ocupación</p>
              </div>
              <p class="text-2xl font-bold text-gray-800 dark:text-white/90">{{ metricasMes.tasaOcupacion }}%</p>
              <span :class="(metricasMes.tasaOcupacion >= 80) ? 'text-success-600 dark:text-success-500' : 'text-warning-600 dark:text-orange-400'" class="text-xs font-medium">
                {{ metricasMes.tasaOcupacion >= 80 ? '✓ Bueno' : '⚠ Regular' }}
              </span>
            </div>
            <div
              class="rounded-lg p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
            >
              <div class="flex items-center gap-1.5 mb-2">
                <AppIcon icon="lucide:wallet" :size="15" color="var(--color-primary)" />
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500">Cobranza</p>
              </div>
              <p class="text-2xl font-bold text-gray-800 dark:text-white/90">{{ metricasMes.tasaCobranza }}%</p>
              <span class="text-xs text-gray-400 dark:text-gray-500">En desarrollo</span>
            </div>
            <div
              class="rounded-lg p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
            >
              <div class="flex items-center gap-1.5 mb-2">
                <AppIcon icon="lucide:refresh-cw" :size="15" color="#10b981" />
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500">Renovados</p>
              </div>
              <p class="text-2xl font-bold text-gray-800 dark:text-white/90">{{ metricasMes.contratosRenovados }}</p>
              <span class="text-xs text-gray-400 dark:text-gray-500">Este mes</span>
            </div>
            <div
              class="rounded-lg p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
            >
              <div class="flex items-center gap-1.5 mb-2">
                <AppIcon icon="lucide:user-plus" :size="15" color="#6366f1" />
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500">Clientes nuevos</p>
              </div>
              <p class="text-2xl font-bold text-gray-800 dark:text-white/90">{{ metricasMes.clientesNuevos }}</p>
              <span class="text-xs text-gray-400 dark:text-gray-500">Este mes</span>
            </div>
          </div>
        </BaseCard>
      </div>
  </div>
</template>
