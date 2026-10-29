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
import { amountIn } from '../report-series'
/**
 * Compras y proveedores: costo, abonos y saldo actuales de las partidas por proveedor, y las
 * compras de catálogo del periodo (aparte, para no contarlas dos veces como costo del proyecto).
 */

const props = defineProps<{ data: InteriorReportsDashboard; periodLabel: string }>()

const { currency, currencyTabs } = useReportCurrency(computed(() => props.data.suppliers.map((s) => s.currency)))
const rows = computed(() =>
  props.data.suppliers.filter((s) => s.currency === currency.value).sort((a, b) => b.actualCost - a.actualCost),
)
const sum = (pick: (s: (typeof rows.value)[number]) => number) => rows.value.reduce((t, s) => t + pick(s), 0)
const totals = computed(() => ({ cost: sum((s) => s.actualCost), paid: sum((s) => s.paid), balance: sum((s) => s.balance) }))
const catalog = computed(() => amountIn(props.data.totals.catalogPurchases, currency.value))
const paidPct = (s: { actualCost: number; paid: number }) => (s.actualCost > 0 ? Math.min(100, Math.round((s.paid / s.actualCost) * 100)) : 0)

const { isExporting, exportToExcel } = useExcelExport()
function exportExcel() {
  void exportToExcel({
    fileName: `proveedores_interiorismo_${props.periodLabel.replace(/\s+/g, '_')}`,
    sheetName: 'Proveedores',
    columns: [
      { header: 'Proveedor', key: 'name', width: 32 },
      { header: 'Moneda', key: 'currency', width: 9 },
      { header: 'Costo en proyectos', key: 'actualCost', width: 18 },
      { header: 'Abonado', key: 'paid', width: 16 },
      { header: 'Saldo', key: 'balance', width: 16 },
      { header: 'Compras de catálogo (periodo)', key: 'catalogPurchases', width: 26 },
    ],
    rows: props.data.suppliers.map(({ supplierId: _id, key: _k, ...s }) => s),
  })
}
</script>

<template>
  <div class="space-y-5">
    <ReportSectionHeader
      title="Compras y proveedores"
      subtitle="Costos y pagos por proveedor de los proyectos vigentes"
      icon="lucide:truck"
      :exporting="isExporting"
      @export="exportExcel"
    >
      <template #actions>
        <HelpTooltip
          title="¿De dónde salen estas cifras?"
          text="Costo, abonado y saldo son la situación actual de las partidas en Compras y contrataciones, agrupadas por proveedor. Las compras de catálogo son del periodo elegido y se muestran aparte para no sumarlas dos veces al costo del proyecto."
          width="w-80"
          align="end"
        />
        <BaseTabs v-if="currencyTabs.length > 1" v-model="currency" :tabs="currencyTabs" variant="segmented" />
      </template>
    </ReportSectionHeader>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatsCard compact title="Costo en proyectos" :value="formatCurrencyRounded(totals.cost, currency)" :subtitle="`${rows.length} proveedores`">
        <template #icon><AppIcon icon="lucide:shopping-cart" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Abonado" :value="formatCurrencyRounded(totals.paid, currency)" :subtitle="totals.cost ? `${Math.round((totals.paid / totals.cost) * 100)} % del costo` : 'sin costos'">
        <template #icon><AppIcon icon="lucide:hand-coins" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Saldo por pagar" :value="formatCurrencyRounded(totals.balance, currency)" :subtitle="`${rows.filter((s) => s.balance > 0).length} con saldo`">
        <template #icon><AppIcon icon="lucide:hourglass" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Compras de catálogo" :value="formatCurrencyRounded(catalog, currency)" :subtitle="periodLabel">
        <template #icon><AppIcon icon="lucide:package" :size="20" /></template>
      </StatsCard>
    </div>

    <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <Table class="w-full text-sm">
        <TableHeader>
          <TableRow class="border-b border-gray-200 text-left dark:border-gray-800">
            <TableCell is-header class="px-4 py-3">Proveedor</TableCell>
            <TableCell is-header class="px-4 py-3 text-right">Costo</TableCell>
            <TableCell is-header class="px-4 py-3">Pagado</TableCell>
            <TableCell is-header class="px-4 py-3 text-right">Saldo</TableCell>
            <TableCell is-header class="px-4 py-3 text-right">Catálogo (periodo)</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="s in rows" :key="s.key" class="border-b border-gray-100 dark:border-gray-800">
            <TableCell class="px-4 py-3">
              <BaseButton v-if="s.supplierId" variant="link" :to="`${INTERIORISMO_BASE_PATH}/materiales/proveedores/${s.supplierId}`">{{ s.name }}</BaseButton>
              <span v-else class="text-gray-700 dark:text-gray-300">{{ s.name }}</span>
            </TableCell>
            <TableCell class="px-4 py-3 text-right tabular-nums">{{ formatCurrency(s.actualCost, currency) }}</TableCell>
            <TableCell class="min-w-48 px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div class="h-full rounded-full bg-brand-500" :style="{ width: `${paidPct(s)}%` }" />
                </div>
                <span class="w-24 text-right tabular-nums text-gray-600 dark:text-gray-300">{{ formatCurrency(s.paid, currency) }}</span>
              </div>
            </TableCell>
            <TableCell :class="['px-4 py-3 text-right tabular-nums', s.balance > 0.009 ? 'font-medium text-warning-600 dark:text-warning-400' : 'text-gray-400']">
              {{ formatCurrency(s.balance, currency) }}
            </TableCell>
            <TableCell class="px-4 py-3 text-right tabular-nums text-gray-500">{{ s.catalogPurchases ? formatCurrency(s.catalogPurchases, currency) : '—' }}</TableCell>
          </TableRow>
          <TableRow v-if="!rows.length">
            <TableCell colspan="5" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">Sin proveedores con movimiento en {{ currency }}.</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
