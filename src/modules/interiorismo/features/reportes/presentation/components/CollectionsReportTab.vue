<script setup lang="ts">
import { computed } from 'vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import PeriodBreakdownTable, {
  PERIOD_DETAIL_ROW_CLASS,
  type PeriodColumn,
} from '@shared/presentation/components/reports/PeriodBreakdownTable.vue'
import ReportSectionHeader from '@shared/presentation/components/reports/ReportSectionHeader.vue'
import { periodKeys, useReportCurrency, type ReportPeriodParams } from '@shared/presentation/components/reports/report-period'
import { TableCell, TableRow } from '@shared/presentation/ui/table'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { formatCurrency, formatCurrencyRounded, formatShortDate } from '@shared/utils/formatters'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import type { InteriorReportsDashboard } from '../../domain/reportes.types'
import { amountIn } from '../report-series'
/**
 * Cobranzas: cobros confirmados del periodo en su moneda original y, aparte, lo que hoy falta
 * cobrar a los clientes (saldo actual de los proyectos vigentes). Por mes (o año), cada fila se
 * despliega con sus cobros; los gráficos están en «Indicadores».
 */

const props = defineProps<{ data: InteriorReportsDashboard; params: ReportPeriodParams; periodLabel: string }>()

const { currency, currencyTabs } = useReportCurrency(
  computed(() => [
    ...props.data.collections.map((c) => c.currency),
    ...props.data.totals.pending.filter((t) => t.amount > 0).map((t) => t.currency),
  ]),
)
const rows = computed(() => props.data.collections.filter((c) => c.currency === currency.value))
const collected = computed(() => amountIn(props.data.totals.collected, currency.value))
const pending = computed(() => amountIn(props.data.totals.pending, currency.value))
const projectsWithBalance = computed(
  () => props.data.profitability.filter((p) => p.status !== 'CANCELLED' && p.currency === currency.value && p.pending > 0.01).length,
)
// ── Por periodo (mes o año del cobro) ──
const periodOf = (date: string) => (props.params.granularity === 'year' ? date.slice(0, 4) : date.slice(0, 7))
const periods = computed(() => periodKeys(props.params, rows.value.map((c) => periodOf(c.date))))
const inPeriod = (period: string) =>
  rows.value.filter((c) => periodOf(c.date) === period).sort((a, b) => a.date.localeCompare(b.date))
const PERIOD_COLUMNS: PeriodColumn[] = [
  { key: 'count', label: 'Cobros' },
  { key: 'projects', label: 'Proyectos' },
  { key: 'amount', label: 'Cobrado', hint: 'confirmado', highlight: true },
]
function cellValue(list: typeof rows.value, column: string) {
  if (column === 'amount') return list.length ? formatCurrency(list.reduce((s, c) => s + c.amount, 0), currency.value) : '—'
  const n = column === 'count' ? list.length : new Set(list.map((c) => c.projectId)).size
  return n || '—'
}

const { isExporting, exportToExcel } = useExcelExport()
function exportExcel() {
  void exportToExcel({
    fileName: `cobranzas_interiorismo_${props.periodLabel.replace(/\s+/g, '_')}`,
    sheetName: 'Cobranzas',
    columns: [
      { header: 'Fecha', key: 'date', width: 12 },
      { header: 'Proyecto', key: 'projectCode', width: 28 },
      { header: 'Concepto', key: 'concept', width: 40 },
      { header: 'Moneda', key: 'currency', width: 9 },
      { header: 'Monto', key: 'amount', width: 16 },
    ],
    rows: props.data.collections,
  })
}
</script>

<template>
  <div class="space-y-5">
    <ReportSectionHeader
      title="Cobranzas"
      :subtitle="`Cobros confirmados en su moneda · ${periodLabel}`"
      icon="lucide:wallet"
      :exporting="isExporting"
      @export="exportExcel"
    >
      <template #actions>
        <BaseTabs v-if="currencyTabs.length > 1" v-model="currency" :tabs="currencyTabs" variant="segmented" />
      </template>
    </ReportSectionHeader>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatsCard compact title="Cobrado en el periodo" :value="formatCurrencyRounded(collected, currency)" :subtitle="`${rows.length} cobros`">
        <template #icon><AppIcon icon="lucide:banknote" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Cobro promedio" :value="formatCurrencyRounded(rows.length ? collected / rows.length : 0, currency)" subtitle="por cobro">
        <template #icon><AppIcon icon="lucide:calculator" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Por cobrar hoy" :value="formatCurrencyRounded(pending, currency)" :subtitle="`${projectsWithBalance} proyectos con saldo`">
        <template #icon><AppIcon icon="lucide:hourglass" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Sin tipo de cambio"
        :value="String(data.alerts.unconvertedPayments)"
        :subtitle="data.alerts.unconvertedPayments ? 'no descuentan el saldo' : 'todo convertido'"
      >
        <template #icon><AppIcon icon="lucide:coins" :size="20" /></template>
      </StatsCard>
    </div>

    <PeriodBreakdownTable
      :periods="periods"
      :columns="PERIOD_COLUMNS"
      :has-detail="(p: string) => inPeriod(p).length > 0"
      show-total
    >
      <template #cell="{ period, column }">
        <span :class="column === 'amount' ? 'font-semibold text-brand-500 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'">
          {{ cellValue(inPeriod(period), column) }}
        </span>
      </template>
      <template #detail="{ period }">
        <TableRow v-for="c in inPeriod(period)" :key="c.id" :class="PERIOD_DETAIL_ROW_CLASS">
          <TableCell class="px-4 py-2.5 pl-10">
            <p class="text-sm text-gray-800 dark:text-white/90">{{ c.concept }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ formatShortDate(c.date) }}</p>
          </TableCell>
          <TableCell class="px-4 py-2.5" />
          <TableCell class="px-4 py-2.5 text-right">
            <BaseButton variant="link" size="sm" :to="`${INTERIORISMO_BASE_PATH}/proyectos/${c.projectId}?tab=liquidacion`">{{ c.projectCode }}</BaseButton>
          </TableCell>
          <TableCell class="px-4 py-2.5 text-right text-sm font-semibold tabular-nums text-brand-500 dark:text-brand-400">{{ formatCurrency(c.amount, currency) }}</TableCell>
        </TableRow>
      </template>
      <template #total="{ column }">
        <span :class="column === 'amount' ? 'text-brand-500 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'">{{ cellValue(rows, column) }}</span>
      </template>
    </PeriodBreakdownTable>
  </div>
</template>
