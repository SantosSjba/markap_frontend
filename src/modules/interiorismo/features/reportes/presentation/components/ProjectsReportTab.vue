<script setup lang="ts">
import { computed } from 'vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
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
import { projectStatusLabel } from '../../../proyectos/presentation/labels'
import { useInteriorProjectStageOptions } from '../../../proyectos/presentation/composables/useInteriorProjectStageOptions'
import type { InteriorReportsDashboard } from '../../domain/reportes.types'
/**
 * Proyectos creados en el periodo, por mes (o por año), como los demás reportes por periodo:
 * cada fila se despliega con sus proyectos. Los gráficos están en «Indicadores».
 */

const props = defineProps<{ data: InteriorReportsDashboard; params: ReportPeriodParams; periodLabel: string }>()
const { stageLabelMap } = useInteriorProjectStageOptions()

const { currency, currencyTabs } = useReportCurrency(computed(() => props.data.projects.map((p) => p.currency)))
const rows = computed(() => props.data.projects.filter((p) => p.currency === currency.value))
const budgetTotal = computed(() => rows.value.reduce((s, p) => s + p.budget, 0))
const avgBudget = computed(() => (rows.value.length ? budgetTotal.value / rows.value.length : 0))
const active = computed(() => props.data.projects.filter((p) => !['FINISHED', 'CANCELLED'].includes(p.status)).length)

// ── Por periodo (mes o año de creación) ──
const periodOf = (date: string) => (props.params.granularity === 'year' ? date.slice(0, 4) : date.slice(0, 7))
const periods = computed(() => periodKeys(props.params, rows.value.map((p) => periodOf(p.createdDate))))
const inPeriod = (period: string) =>
  rows.value.filter((p) => periodOf(p.createdDate) === period).sort((a, b) => a.createdDate.localeCompare(b.createdDate))
const isActive = (status: string) => !['FINISHED', 'CANCELLED'].includes(status)
const PERIOD_COLUMNS: PeriodColumn[] = [
  { key: 'count', label: 'Proyectos' },
  { key: 'budget', label: 'Presupuestado', hint: 'total al cliente', highlight: true },
  { key: 'active', label: 'Siguen activos' },
  { key: 'finished', label: 'Finalizados' },
]
function cellValue(list: typeof rows.value, column: string) {
  if (column === 'budget') return list.length ? formatCurrency(list.reduce((s, p) => s + p.budget, 0), currency.value) : '—'
  const n = column === 'count' ? list.length : column === 'active' ? list.filter((p) => isActive(p.status)).length : list.filter((p) => p.status === 'FINISHED').length
  return n || '—'
}

const stageVariant = (s: string) =>
  s === 'FINISHED' ? 'success' : s === 'CANCELLED' ? 'neutral' : s === 'IN_PROGRESS' ? 'info' : 'warning'

const { isExporting, exportToExcel } = useExcelExport()
function exportExcel() {
  void exportToExcel({
    fileName: `proyectos_interiorismo_${props.periodLabel.replace(/\s+/g, '_')}`,
    sheetName: 'Proyectos',
    columns: [
      { header: 'Código', key: 'code', width: 26 },
      { header: 'Proyecto', key: 'name', width: 36 },
      { header: 'Creado', key: 'createdDate', width: 12 },
      { header: 'Etapa', key: 'stage', width: 16 },
      { header: 'Moneda', key: 'currency', width: 9 },
      { header: 'Presupuesto', key: 'budget', width: 16 },
    ],
    rows: props.data.projects.map(({ unconverted: _u, ...p }) => ({ ...p, stage: projectStatusLabel(p.status, stageLabelMap.value) })),
  })
}
</script>

<template>
  <div class="space-y-5">
    <ReportSectionHeader
      title="Proyectos del periodo"
      :subtitle="`Proyectos creados · ${periodLabel}`"
      icon="lucide:folder-kanban"
      :exporting="isExporting"
      @export="exportExcel"
    >
      <template #actions>
        <BaseTabs v-if="currencyTabs.length > 1" v-model="currency" :tabs="currencyTabs" variant="segmented" />
      </template>
    </ReportSectionHeader>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatsCard compact title="Proyectos nuevos" :value="String(data.projects.length)" :subtitle="`${active} siguen activos`">
        <template #icon><AppIcon icon="lucide:folder-plus" :size="20" /></template>
      </StatsCard>
      <StatsCard compact :title="`Presupuestado · ${currency}`" :value="formatCurrencyRounded(budgetTotal, currency)" :subtitle="`${rows.length} en ${currency}`">
        <template #icon><AppIcon icon="lucide:file-spreadsheet" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Presupuesto promedio" :value="formatCurrencyRounded(avgBudget, currency)" subtitle="por proyecto">
        <template #icon><AppIcon icon="lucide:calculator" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Finalizados"
        :value="String(data.projects.filter((p) => p.status === 'FINISHED').length)"
        :subtitle="`${data.projects.filter((p) => p.status === 'CANCELLED').length} cancelados`"
      >
        <template #icon><AppIcon icon="lucide:flag" :size="20" /></template>
      </StatsCard>
    </div>

    <PeriodBreakdownTable
      :periods="periods"
      :columns="PERIOD_COLUMNS"
      :has-detail="(p: string) => inPeriod(p).length > 0"
      show-total
    >
      <template #cell="{ period, column }">
        <span :class="column === 'budget' ? 'font-semibold text-brand-500 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'">
          {{ cellValue(inPeriod(period), column) }}
        </span>
      </template>
      <template #detail="{ period }">
        <TableRow v-for="p in inPeriod(period)" :key="p.id" :class="PERIOD_DETAIL_ROW_CLASS">
          <TableCell class="px-4 py-2.5 pl-10">
            <BaseButton variant="link" :to="`${INTERIORISMO_BASE_PATH}/proyectos/${p.id}`">{{ p.name }}</BaseButton>
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ p.code }} · creado {{ formatShortDate(p.createdDate) }}</p>
          </TableCell>
          <TableCell class="px-4 py-2.5 text-right"><Badge :variant="stageVariant(p.status)">{{ projectStatusLabel(p.status, stageLabelMap) }}</Badge></TableCell>
          <TableCell class="px-4 py-2.5 text-right text-sm font-semibold tabular-nums text-brand-500 dark:text-brand-400">{{ formatCurrency(p.budget, currency) }}</TableCell>
          <TableCell class="px-4 py-2.5 text-right text-xs text-gray-500">{{ isActive(p.status) ? 'Activo' : '—' }}</TableCell>
          <TableCell class="px-4 py-2.5 text-right text-xs text-gray-500">{{ p.status === 'FINISHED' ? 'Sí' : '—' }}</TableCell>
        </TableRow>
      </template>
      <template #total="{ column }">
        <span :class="column === 'budget' ? 'text-brand-500 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'">{{ cellValue(rows, column) }}</span>
      </template>
    </PeriodBreakdownTable>
  </div>
</template>
