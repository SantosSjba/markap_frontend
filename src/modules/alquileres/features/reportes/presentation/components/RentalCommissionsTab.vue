<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import TableBodySkeleton from '@shared/presentation/components/ui/TableBodySkeleton.vue'
import { useService } from '@shared/presentation/di/services'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatShortDate, parseCalendarDate, toCalendarDateString } from '@shared/utils/formatters'
import { RENTAL_UTILITY_NET_SHORT_LABEL } from '../../../alquileres/domain/rental-financial.labels'
import { reportesRepositoryKey } from '../../application/ports/reportes.port'
import { useFinancialDistributionReport, useRentalsByMonth } from '../composables/useReportes'
import type {
  FinancialDistributionParams,
  FinancialCurrencyLineTotals,
  FinancialDistributionReportItem,
  RentalsByMonthCurrencyTotals,
  RentalsByMonthItem,
  RentalsByMonthParams,
} from '../../domain/reportes.types'
import { formatMoney } from '../utils/report-format'
import ReportSectionHeader from '@shared/presentation/components/reports/ReportSectionHeader.vue'
/**
 * Pestaña «Comisiones de alquileres»: ingreso por intermediación en el mes de cobro,
 * con totales compactos por moneda y detalle por mes (los gráficos están en «Indicadores»).
 */

const reportesRepository = useService(reportesRepositoryKey)
const router = useRouter()
const APPLICATION_SLUG = 'alquileres'
const formatCurrency = formatMoney
const formatDate = (value: string) => formatShortDate(value)

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

const rentalsByMonthQuery = useRentalsByMonth(APPLICATION_SLUG, rentalsByMonthParams)

/** Columnas de montos de la tabla (en orden) */
type AmountKey =
  | 'companyRevenue'
  | 'totalExpense'
  | 'totalTax'
  | 'totalExternalCommission'
  | 'totalInternalCommission'
  | 'totalUtility'
interface AmountColumn {
  key: AmountKey
  kind: 'income' | 'deduction' | 'utility'
}
const AMOUNT_COLUMNS: AmountColumn[] = [
  { key: 'companyRevenue', kind: 'income' },
  { key: 'totalExpense', kind: 'deduction' },
  { key: 'totalTax', kind: 'deduction' },
  { key: 'totalExternalCommission', kind: 'deduction' },
  { key: 'totalInternalCommission', kind: 'deduction' },
  { key: 'totalUtility', kind: 'utility' },
]

function amountText(col: AmountColumn, value: number, currency: string): string {
  return col.kind === 'deduction' ? `− ${formatCurrency(value, currency)}` : formatCurrency(value, currency)
}

function amountClass(col: AmountColumn, value: number): string {
  if (col.kind === 'deduction') return 'text-gray-500 dark:text-gray-400'
  if (col.kind === 'utility' && value < 0) return 'font-semibold text-error-500 dark:text-error-400'
  return 'font-semibold text-brand-500 dark:text-brand-400'
}

/** Montos de un alquiler en el orden de AMOUNT_COLUMNS */
function itemValues(item: FinancialDistributionReportItem): number[] {
  return [
    item.baseAmount,
    item.expense,
    item.tax,
    item.externalAgentCommission,
    item.internalAgentCommission,
    item.utility,
  ]
}

/** Montos fijos en otra moneda, en el orden de AMOUNT_COLUMNS (sin ingreso) */
function lineValues(line: FinancialCurrencyLineTotals): number[] {
  return [
    line.income,
    line.expense,
    line.tax,
    line.externalAgentCommission,
    line.internalAgentCommission,
    line.utility,
  ]
}

/** Conceptos de los totales compactos (el ingreso y la utilidad van destacados) */
const totalLines = (t: RentalsByMonthCurrencyTotals) => [
  { label: 'Gastos', value: t.totalExpense },
  { label: 'Impuestos', value: t.totalTax },
  { label: 'Ag. externo', value: t.totalExternalCommission },
  { label: 'Ag. interno', value: t.totalInternalCommission },
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

const shouldLoadDetail = computed(() => detailDateRange.value != null)

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

/** Soles primero; el resto en orden alfabético */
const byCurrencyOrder = (a: string, b: string) =>
  a === b ? 0 : a === 'PEN' ? -1 : b === 'PEN' ? 1 : a.localeCompare(b)

const CURRENCY_NAMES: Record<string, string> = { PEN: 'Soles', USD: 'Dólares', EUR: 'Euros' }
const currencyName = (code: string) => CURRENCY_NAMES[code] ?? code

/** Totales de un mes en una moneda (ceros si no hubo cobros en ella) */
function monthTotals(month: RentalsByMonthItem, currency: string): RentalsByMonthCurrencyTotals {
  return month.totalsByCurrency.find((t) => t.currency === currency) ?? { currency, ...EMPTY_TOTALS }
}

/** Monedas visibles con movimiento en el mes (sin repetir ceros); una sola si no hubo cobros */
function monthCurrencies(month: RentalsByMonthItem): string[] {
  const withData = viewCurrencies.value.filter((c) => month.totalsByCurrency.some((t) => t.currency === c))
  return withData.length ? withData : viewCurrencies.value.slice(0, 1)
}

/** Alquileres cobrados en el mes cuyo contrato está en la moneda */
function rentalsInCurrency(month: RentalsByMonthItem, currency: string): FinancialDistributionReportItem[] {
  return getRentalsForMonth(month).filter((item) => item.currency === currency)
}

/**
 * Alquileres en otra moneda con montos fijos en esta (p. ej. agente en S/ de un contrato en US$):
 * se listan para que el total de la moneda cuadre con el detalle.
 */
function crossCurrencyLines(month: RentalsByMonthItem, currency: string) {
  return getRentalsForMonth(month).flatMap((item) => {
    const line = item.otherCurrencyTotals.find((t) => t.currency === currency)
    return line ? [{ item, line }] : []
  })
}

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
  const list = [...byCurrency.values()].sort((a, b) => byCurrencyOrder(a.currency, b.currency))
  return list.length ? list : [{ currency: 'PEN', ...EMPTY_TOTALS }]
})

// ── Moneda que se muestra: una sola (sin mezclar) o todas, cada una en su línea ──
type CurrencyView = 'ALL' | string
const CURRENCY_VIEW_KEY = 'markap.alquileres.reportes.comisiones.moneda'
function readCurrencyView(): CurrencyView {
  try {
    return localStorage.getItem(CURRENCY_VIEW_KEY) || 'PEN'
  } catch {
    return 'PEN'
  }
}
const currencyView = ref<CurrencyView>(readCurrencyView())
watch(currencyView, (value) => {
  try {
    localStorage.setItem(CURRENCY_VIEW_KEY, value)
  } catch {
    /* almacenamiento no disponible: la preferencia dura la sesión */
  }
})

/** Monedas con cobros en el período */
const availableCurrencies = computed(() => periodTotals.value.map((t) => t.currency))
const currencyTabs = computed(() => [
  ...availableCurrencies.value.map((code) => ({ id: code, label: currencyName(code) })),
  ...(availableCurrencies.value.length > 1 ? [{ id: 'ALL', label: 'Ambas' }] : []),
])
/** Monedas visibles; si la elegida no tiene cobros en el período, se usa la primera */
const viewCurrencies = computed(() => {
  if (currencyView.value === 'ALL' && availableCurrencies.value.length > 1) return availableCurrencies.value
  return availableCurrencies.value.includes(currencyView.value)
    ? [currencyView.value]
    : availableCurrencies.value.slice(0, 1)
})
const visiblePeriodTotals = computed(() =>
  periodTotals.value.filter((t) => viewCurrencies.value.includes(t.currency)),
)

function canExpandMonth(row: RentalsByMonthItem) {
  return viewCurrencies.value.some(
    (currency) =>
      monthTotals(row, currency).collectedCommissions > 0 ||
      monthTotals(row, currency).companyRevenue !== 0 ||
      monthTotals(row, currency).totalUtility !== 0,
  )
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

async function handleExport() {
  const now = toCalendarDateString()
  const p = rentalsByMonthParams.value
  const data = await reportesRepository.getRentalsByMonth(
    APPLICATION_SLUG,
    p.year ?? yearFilter.value,
    p.month,
    p.startDate,
    p.endDate,
  )
  // Detalle por alquiler, igual que al desplegar cada mes en la tabla
  const range = detailDateRange.value
  const detail = range
    ? (
        await reportesRepository.getFinancialDistribution(
          APPLICATION_SLUG,
          undefined,
          range.startDate,
          range.endDate,
          'commissionPaidDate',
        )
      ).filter((item) => item.commissionPaidDate)
    : []
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
      { header: 'Contratos vencidos', key: 'expiredContracts', width: 18 },
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
          expiredContracts: r.expiredContracts,
          activeAtEndOfMonth: r.activeAtEndOfMonth,
        }),
      ),
    ),
    additionalSheets: [
      {
        sheetName: 'Detalle por alquiler',
        columns: [
          { header: 'Fecha de cobro', key: 'paidDate', width: 16 },
          { header: 'Código', key: 'rentalCode', width: 34 },
          { header: 'Propiedad', key: 'propertyAddress', width: 32 },
          { header: 'Propietario', key: 'ownerName', width: 24 },
          { header: 'Inquilino', key: 'tenantName', width: 24 },
          { header: 'Moneda', key: 'currency', width: 10 },
          { header: 'Ingreso', key: 'income', width: 16 },
          { header: 'Gastos', key: 'expense', width: 14 },
          { header: 'Impuestos', key: 'tax', width: 14 },
          { header: 'Agente externo', key: 'externalAgentName', width: 24 },
          { header: 'Comisión ag. externo', key: 'externalAgentCommission', width: 20 },
          { header: 'Agente interno', key: 'internalAgentName', width: 24 },
          { header: 'Comisión ag. interno', key: 'internalAgentCommission', width: 20 },
          { header: RENTAL_UTILITY_NET_SHORT_LABEL, key: 'utility', width: 20 },
          { header: 'Nota', key: 'note', width: 40 },
        ],
        rows: detail.flatMap((item) => {
          const common = {
            paidDate: formatDate(item.commissionPaidDate!),
            rentalCode: item.rentalCode,
            propertyAddress: item.propertyAddress,
            ownerName: item.ownerName,
            tenantName: item.tenantName,
            externalAgentName: item.externalAgentName ?? '—',
            internalAgentName: item.internalAgentName ?? '—',
          }
          return [
            {
              ...common,
              currency: item.currency,
              income: item.baseAmount,
              expense: item.expense,
              tax: item.tax,
              externalAgentCommission: item.externalAgentCommission,
              internalAgentCommission: item.internalAgentCommission,
              utility: item.utility,
              note: '',
            },
            // Montos fijos en otra moneda (p. ej. agente en S/ de un contrato en US$)
            ...item.otherCurrencyTotals.map((line) => ({
              ...common,
              currency: line.currency,
              income: line.income,
              expense: line.expense,
              tax: line.tax,
              externalAgentCommission: line.externalAgentCommission,
              internalAgentCommission: line.internalAgentCommission,
              utility: line.utility,
              note: `Contrato en ${currencyName(item.currency).toLowerCase()}: montos fijos en ${currencyName(line.currency).toLowerCase()}`,
            })),
          ]
        }),
      },
    ],
  })
}
</script>

<template>
  <ReportSectionHeader
    title="Comisiones de alquileres"
    subtitle="Ingreso por intermediación en el mes de cobro de cada comisión; soles y dólares por separado"
    help="Cada ingreso se ubica en el mes de su fecha de cobro (no en el inicio del contrato); las comisiones pendientes no cuentan hasta marcarlas como cobradas en Comisiones. Haz clic en un mes con cobros para ver el detalle de cada alquiler."
    icon="lucide:bar-chart-2"
    :exporting="isExporting"
    @export="handleExport"
  />

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
    <!-- Totales del período por moneda (sin conversión): una línea compacta por moneda -->
    <div v-if="rentalsByMonthRows.length > 0" class="space-y-2 mb-4">
      <!-- Moneda a mostrar: soles y dólares nunca se suman -->
      <div v-if="currencyTabs.length > 1" class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-gray-500 dark:text-gray-400">Ver montos en</span>
        <BaseTabs v-model="currencyView" :tabs="currencyTabs" variant="segmented" />
      </div>
      <BaseCard
        v-for="t in visiblePeriodTotals"
        :key="t.currency"
        padding="sm"
        class="block"
      >
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div class="flex items-baseline gap-2">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Ingreso</span>
          <span class="text-lg font-bold tabular-nums text-brand-500 dark:text-brand-400">{{ formatCurrency(t.companyRevenue, t.currency) }}</span>
          <span class="text-xs text-gray-400 dark:text-gray-500">
            {{ t.collectedCommissions }} {{ t.collectedCommissions === 1 ? 'cobrada' : 'cobradas' }}
          </span>
        </div>
        <Badge v-for="line in totalLines(t)" :key="line.label" variant="neutral">
          {{ line.label }} − {{ formatCurrency(line.value, t.currency) }}
        </Badge>
        <span class="ml-auto inline-flex items-baseline gap-2">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ RENTAL_UTILITY_NET_SHORT_LABEL }}</span>
          <span
            class="text-lg font-bold tabular-nums"
            :class="t.totalUtility >= 0 ? 'text-brand-500 dark:text-brand-400' : 'text-error-500 dark:text-error-400'"
          >{{ formatCurrency(t.totalUtility, t.currency) }}</span>
        </span>
        </div>
      </BaseCard>
    </div>



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
        <template v-for="month in rentalsByMonthRows" :key="`${month.year}-${month.month}`">
          <!-- Mes: cada moneda visible en su propia línea dentro de la celda -->
          <TableRow
            class="transition-opacity"
            :class="[
              canExpandMonth(month) ? 'cursor-pointer hover:opacity-90' : '',
              isMonthExpanded(month) ? 'bg-brand-50 dark:bg-brand-500/12' : 'border-b border-gray-200 dark:border-gray-800',
            ]"
            @click="toggleMonthDetail(month)"
          >
            <TableCell class="py-3 px-4 font-medium text-gray-800 dark:text-white/90">
              <span class="inline-flex items-center gap-2">
                <AppIcon
                  v-if="canExpandMonth(month)"
                  :icon="isMonthExpanded(month) ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                  :size="14"
                  color="var(--color-text-muted)"
                />
                <span v-else class="w-3.5 shrink-0" />
                {{ month.monthName }}
              </span>
            </TableCell>
            <TableCell
              v-for="col in AMOUNT_COLUMNS"
              :key="col.key"
              class="py-3 px-4 text-right whitespace-nowrap"
            >
              <div
                v-for="currency in monthCurrencies(month)"
                :key="currency"
                :class="amountClass(col, monthTotals(month, currency)[col.key])"
              >
                {{ amountText(col, monthTotals(month, currency)[col.key], currency) }}
              </div>
            </TableCell>
            <TableCell class="py-3 px-4 text-right whitespace-nowrap text-gray-500 dark:text-gray-400">
              {{ month.newContracts }} / {{ month.activeAtEndOfMonth }}
            </TableCell>
          </TableRow>

          <!-- Detalle del mes desplegado: por moneda, con su subtotal -->
          <template v-if="isMonthExpanded(month)">
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
            <template v-else>
              <template v-for="currency in monthCurrencies(month)" :key="`${month.month}-${currency}`">
                <!-- Subtotal de la moneda (solo al ver ambas) -->
                <TableRow
                  v-if="monthCurrencies(month).length > 1"
                  class="border-b border-gray-200 dark:border-gray-800 bg-gray-100/70 dark:bg-white/5"
                >
                  <TableCell class="py-2 px-4 pl-10 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {{ currencyName(currency) }}
                  </TableCell>
                  <TableCell
                    v-for="col in AMOUNT_COLUMNS"
                    :key="col.key"
                    class="py-2 px-4 text-right whitespace-nowrap text-sm"
                  >
                    <span :class="amountClass(col, monthTotals(month, currency)[col.key])">
                      {{ amountText(col, monthTotals(month, currency)[col.key], currency) }}
                    </span>
                  </TableCell>
                  <TableCell class="py-2 px-4" />
                </TableRow>

                <TableRow
                  v-if="!rentalsInCurrency(month, currency).length && !crossCurrencyLines(month, currency).length"
                  class="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800"
                >
                  <TableCell colspan="8" class="py-2.5 px-4 pl-10 text-sm text-gray-400 dark:text-gray-500">
                    Sin comisiones cobradas en {{ currencyName(currency).toLowerCase() }} este mes.
                  </TableCell>
                </TableRow>

                <!-- Alquileres cobrados en la moneda -->
                <TableRow
                  v-for="item in rentalsInCurrency(month, currency)"
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
                    </p>
                  </TableCell>
                  <TableCell
                    v-for="(value, i) in itemValues(item)"
                    :key="i"
                    class="py-2.5 px-4 text-right whitespace-nowrap text-sm"
                    :class="amountClass(AMOUNT_COLUMNS[i]!, value)"
                  >
                    {{ amountText(AMOUNT_COLUMNS[i]!, value, item.currency) }}
                  </TableCell>
                  <TableCell class="py-2.5 px-4 text-right text-sm text-gray-400 dark:text-gray-500">—</TableCell>
                </TableRow>

                <!-- Montos fijos en esta moneda de alquileres pactados en otra -->
                <TableRow
                  v-for="{ item, line } in crossCurrencyLines(month, currency)"
                  :key="`${item.rentalId}-${currency}`"
                  class="cursor-pointer hover:opacity-90 transition-opacity border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800"
                  @click.stop="goToRentalDetail(item.rentalId)"
                >
                  <TableCell class="py-2.5 px-4 pl-10">
                    <p class="font-medium text-sm text-brand-500 dark:text-brand-400">{{ item.rentalCode }}</p>
                    <p class="text-xs mt-0.5 text-warning-600 dark:text-orange-400">
                      Contrato en {{ currencyName(item.currency).toLowerCase() }}: solo sus montos fijos en {{ currencyName(currency).toLowerCase() }}
                    </p>
                  </TableCell>
                  <TableCell
                    v-for="(value, i) in lineValues(line)"
                    :key="i"
                    class="py-2.5 px-4 text-right whitespace-nowrap text-sm"
                    :class="amountClass(AMOUNT_COLUMNS[i]!, value)"
                  >
                    {{ amountText(AMOUNT_COLUMNS[i]!, value, currency) }}
                  </TableCell>
                  <TableCell class="py-2.5 px-4 text-right text-sm text-gray-400 dark:text-gray-500">—</TableCell>
                </TableRow>
              </template>
            </template>
          </template>
        </template>
      </TableBody>
      <tfoot v-if="rentalsByMonthRows.length > 1">
        <TableRow class="border-t-2 border-gray-200 dark:border-gray-800">
          <TableCell class="py-3 px-4 font-semibold text-gray-800 dark:text-white/90">Total</TableCell>
          <TableCell
            v-for="col in AMOUNT_COLUMNS"
            :key="col.key"
            class="py-3 px-4 text-right whitespace-nowrap font-semibold"
          >
            <div
              v-for="t in visiblePeriodTotals"
              :key="t.currency"
              :class="amountClass(col, t[col.key])"
            >
              {{ amountText(col, t[col.key], t.currency) }}
            </div>
          </TableCell>
          <TableCell class="py-3 px-4 text-right whitespace-nowrap font-semibold text-gray-500 dark:text-gray-400">
            {{ rentalsByMonthRows.reduce((s, r) => s + r.newContracts, 0) }} / —
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
