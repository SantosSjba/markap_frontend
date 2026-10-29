<script setup lang="ts">
import { computed } from 'vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import HelpTooltip from '@shared/presentation/components/ui/HelpTooltip.vue'
import ReportSectionHeader from '@shared/presentation/components/reports/ReportSectionHeader.vue'
import { useReportCurrency } from '@shared/presentation/components/reports/report-period'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { formatCurrency, formatCurrencyRounded } from '@shared/utils/formatters'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import type { InteriorReportsDashboard } from '../../domain/reportes.types'
/**
 * Rentabilidad actual de los proyectos vigentes (no depende del periodo): presupuesto, costo real
 * y utilidad estimada (ingreso sin IGV − costo real − costo presupuestado aún sin costo real).
 */

const props = defineProps<{ data: InteriorReportsDashboard }>()

const current = computed(() => props.data.profitability.filter((p) => p.status !== 'CANCELLED'))
const { currency, currencyTabs } = useReportCurrency(computed(() => current.value.map((p) => p.currency)))
const rows = computed(() =>
  current.value.filter((p) => p.currency === currency.value).sort((a, b) => b.utility - a.utility),
)
const sum = (pick: (p: (typeof rows.value)[number]) => number) => rows.value.reduce((s, p) => s + pick(p), 0)
const totals = computed(() => ({
  budget: sum((p) => p.budget),
  actual: sum((p) => p.actualCost),
  utility: sum((p) => p.utility),
}))
/** Margen promedio de los proyectos con presupuesto (cada uno sobre su ingreso sin IGV) */
const margins = computed(() => rows.value.map((p) => p.marginPct).filter((m): m is number => m != null))
const avgMargin = computed(() =>
  margins.value.length ? Math.round((margins.value.reduce((s, m) => s + m, 0) / margins.value.length) * 10) / 10 : null,
)
const negative = computed(() => rows.value.filter((p) => p.utility < 0).length)
const maxAbsUtility = computed(() => Math.max(1, ...rows.value.map((p) => Math.abs(p.utility))))

const marginClass = (m: number | null) =>
  m == null ? 'text-gray-400' : m < 0 ? 'text-error-500' : m < 15 ? 'text-warning-600 dark:text-warning-400' : 'text-success-600 dark:text-success-400'

const { isExporting, exportToExcel } = useExcelExport()
function exportExcel() {
  void exportToExcel({
    fileName: 'rentabilidad_interiorismo',
    sheetName: 'Rentabilidad',
    columns: [
      { header: 'Código', key: 'code', width: 26 },
      { header: 'Proyecto', key: 'name', width: 36 },
      { header: 'Moneda', key: 'currency', width: 9 },
      { header: 'Presupuesto', key: 'budget', width: 16 },
      { header: 'Costo real', key: 'actualCost', width: 16 },
      { header: 'Utilidad estimada', key: 'utility', width: 18 },
      { header: 'Margen %', key: 'marginPct', width: 10 },
      { header: 'Cobrado', key: 'paid', width: 16 },
      { header: 'Por cobrar', key: 'pending', width: 16 },
    ],
    rows: current.value.map(({ unconverted: _u, ...p }) => ({ ...p, marginPct: p.marginPct ?? '' })),
  })
}
</script>

<template>
  <div class="space-y-5">
    <ReportSectionHeader
      title="Rentabilidad"
      subtitle="Situación actual de los proyectos vigentes, no depende del periodo"
      icon="lucide:trending-up"
      :exporting="isExporting"
      @export="exportExcel"
    >
      <template #actions>
        <HelpTooltip
          title="¿Cómo se calcula la utilidad?"
          text="Ingreso sin IGV − costo real registrado en Compras − costo presupuestado de las partidas que aún no tienen costo real. Es una estimación: al completar Compras queda la utilidad final. El margen es la utilidad sobre el ingreso sin IGV."
          width="w-80"
          align="end"
        />
        <BaseTabs v-if="currencyTabs.length > 1" v-model="currency" :tabs="currencyTabs" variant="segmented" />
      </template>
    </ReportSectionHeader>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatsCard compact title="Presupuestado" :value="formatCurrencyRounded(totals.budget, currency)" :subtitle="`${rows.length} proyectos vigentes`">
        <template #icon><AppIcon icon="lucide:file-spreadsheet" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Costo real" :value="formatCurrencyRounded(totals.actual, currency)" subtitle="registrado en Compras">
        <template #icon><AppIcon icon="lucide:shopping-cart" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Utilidad estimada" :value="formatCurrencyRounded(totals.utility, currency)" :subtitle="avgMargin != null ? `${avgMargin} % de margen promedio` : 'sin presupuesto'">
        <template #icon><AppIcon icon="lucide:trending-up" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Con pérdida" :value="String(negative)" :subtitle="negative ? 'revise sus costos' : 'ningún proyecto'">
        <template #icon><AppIcon icon="lucide:trending-down" :size="20" /></template>
      </StatsCard>
    </div>

    <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <Table class="w-full text-sm">
        <TableHeader>
          <TableRow class="border-b border-gray-200 text-left dark:border-gray-800">
            <TableCell is-header class="px-4 py-3">Proyecto</TableCell>
            <TableCell is-header class="px-4 py-3 text-right">Presupuesto</TableCell>
            <TableCell is-header class="px-4 py-3 text-right">Costo real</TableCell>
            <TableCell is-header class="px-4 py-3">Utilidad estimada</TableCell>
            <TableCell is-header class="px-4 py-3 text-right">Margen</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="p in rows" :key="p.id" class="border-b border-gray-100 dark:border-gray-800">
            <TableCell class="px-4 py-3">
              <BaseButton variant="link" :to="`${INTERIORISMO_BASE_PATH}/proyectos/${p.id}?tab=liquidacion`">{{ p.name }}</BaseButton>
              <p class="text-theme-xs text-gray-400">
                {{ p.code }}<span v-if="p.unconverted.length" class="text-warning-600"> · cobros sin tipo de cambio</span>
              </p>
            </TableCell>
            <TableCell class="px-4 py-3 text-right tabular-nums">{{ formatCurrency(p.budget, currency) }}</TableCell>
            <TableCell class="px-4 py-3 text-right tabular-nums">{{ formatCurrency(p.actualCost, currency) }}</TableCell>
            <TableCell class="min-w-56 px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    class="h-full rounded-full"
                    :class="p.utility < 0 ? 'bg-error-500' : 'bg-success-500'"
                    :style="{ width: `${(Math.abs(p.utility) / maxAbsUtility) * 100}%` }"
                  />
                </div>
                <span :class="['w-28 text-right tabular-nums', p.utility < 0 ? 'text-error-500' : 'text-gray-800 dark:text-white/90']">
                  {{ formatCurrency(p.utility, currency) }}
                </span>
              </div>
            </TableCell>
            <TableCell :class="['px-4 py-3 text-right font-medium tabular-nums', marginClass(p.marginPct)]">
              {{ p.marginPct == null ? '—' : `${p.marginPct} %` }}
            </TableCell>
          </TableRow>
          <TableRow v-if="!rows.length">
            <TableCell colspan="5" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">Sin proyectos vigentes en {{ currency }}.</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
