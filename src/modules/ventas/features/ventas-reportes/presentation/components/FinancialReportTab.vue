<script setup lang="ts">
import { computed, ref, watch, type Ref } from 'vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import ReportSectionHeader from '@shared/presentation/components/reports/ReportSectionHeader.vue'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { formatCurrency, formatCurrencyRounded } from '@shared/utils/formatters'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import type { FinancialSummary, VentasSummaryParams } from '../../domain/reportes.types'
import { useVentasReportSummary } from '../composables/useVentasReportes'
import { periodKeys, periodName, sortCurrencies } from '../utils/report-period'
/**
 * Flujo financiero por moneda: ventas cerradas, separaciones recibidas, comisiones
 * (generadas, pagadas y por pagar) y costos de documentación, con detalle por mes o año.
 * Los gráficos están en «Indicadores».
 */

const props = defineProps<{ params: VentasSummaryParams; periodLabel: string }>()
const params = computed(() => props.params)
const query = useVentasReportSummary('financial', params as Ref<VentasSummaryParams>, ref(true))
const data = computed<FinancialSummary | undefined>(() => query.data.value)

const currencies = computed(() => sortCurrencies((data.value?.byCurrency ?? []).map((t) => t.currency)))
const currency = ref('PEN')
watch(currencies, (list) => {
  if (list.length && !list.includes(currency.value)) currency.value = list[0]!
}, { immediate: true })
const currencyTabs = computed(() => currencies.value.map((c) => ({ id: c, label: c })))
const totals = computed(() => data.value?.byCurrency.find((t) => t.currency === currency.value))
const money = (n: number) => formatCurrencyRounded(n, currency.value)

const keys = computed(() => periodKeys(props.params, (data.value?.periods ?? []).map((p) => p.period)))
const at = (period: string) =>
  data.value?.periods.find((p) => p.period === period)?.byCurrency.find((c) => c.currency === currency.value)
/** Detalle por periodo: solo los que tienen movimiento */
const tableRows = computed(() =>
  keys.value
    .map((k) => ({ period: k, ...(at(k) ?? { sales: 0, separations: 0, commissionsPaid: 0, costs: 0 }) }))
    .filter((r) => r.sales || r.separations || r.commissionsPaid || r.costs)
    .reverse(),
)

const { isExporting, exportToExcel } = useExcelExport()
async function exportExcel() {
  const d = data.value
  if (!d) return
  await exportToExcel({
    fileName: `flujo_financiero_ventas_${props.periodLabel.replace(/\s+/g, '_')}`,
    sheetName: 'Resumen por moneda',
    columns: [
      { header: 'Moneda', key: 'currency', width: 9 },
      { header: 'Ventas cerradas', key: 'salesVolume', width: 16 },
      { header: 'Separaciones', key: 'separations', width: 14 },
      { header: 'Comisiones generadas', key: 'commissionsGenerated', width: 18 },
      { header: 'Comisiones pagadas', key: 'commissionsPaid', width: 18 },
      { header: 'Comisiones por pagar', key: 'commissionsPending', width: 18 },
      { header: 'Costos documentación', key: 'documentationCosts', width: 18 },
      { header: 'Cobrado a compradores', key: 'buyerPaymentsCollected', width: 20 },
      { header: 'Por cobrar a compradores', key: 'buyerPaymentsPending', width: 20 },
    ],
    rows: d.byCurrency.map((t) => ({ ...t })),
    additionalSheets: [
      {
        sheetName: 'Por periodo',
        columns: [
          { header: 'Periodo', key: 'period', width: 16 },
          { header: 'Moneda', key: 'currency', width: 9 },
          { header: 'Ventas', key: 'sales', width: 16 },
          { header: 'Separaciones', key: 'separations', width: 14 },
          { header: 'Comisiones pagadas', key: 'commissionsPaid', width: 18 },
          { header: 'Costos', key: 'costs', width: 14 },
        ],
        rows: d.periods.flatMap((p) => p.byCurrency.map((c) => ({ period: periodName(p.period), ...c }))),
      },
    ],
  })
}
</script>

<template>
  <div class="space-y-5">
    <ReportSectionHeader
      title="Flujo financiero"
      :subtitle="`Montos de cada moneda por separado · ${periodLabel}`"
      icon="lucide:wallet"
      :exporting="isExporting"
      @export="exportExcel"
    >
      <template #actions>
        <BaseTabs v-if="currencyTabs.length > 1" v-model="currency" :tabs="currencyTabs" variant="segmented" />
      </template>
    </ReportSectionHeader>

    <p v-if="query.isError.value" class="text-sm text-error-500">{{ getApiErrorMessage(query.error.value) }}</p>

    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <StatsCard compact title="Ventas cerradas" :value="money(totals?.salesVolume ?? 0)" subtitle="precio final" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:banknote" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Separaciones" :value="money(totals?.separations ?? 0)" subtitle="dinero de reserva" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:bookmark" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Comisiones"
        :value="money(totals?.commissionsGenerated ?? 0)"
        :subtitle="`pagado ${money(totals?.commissionsPaid ?? 0)} · falta ${money(totals?.commissionsPending ?? 0)}`"
        :loading="query.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:percent" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Costos de documentación"
        :value="money(totals?.documentationCosts ?? 0)"
        subtitle="notaría, registros…"
        :loading="query.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:file-text" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Cobranza a compradores"
        :value="money(totals?.buyerPaymentsCollected ?? 0)"
        :subtitle="`cobrado · por cobrar ${money(totals?.buyerPaymentsPending ?? 0)}`"
        :loading="query.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:wallet" :size="20" /></template>
      </StatsCard>
    </div>


    <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <Table class="w-full text-sm">
        <TableHeader>
          <TableRow class="border-b border-gray-200 text-left dark:border-gray-800">
            <TableCell is-header class="py-3 px-4">Periodo</TableCell>
            <TableCell is-header class="py-3 px-4 text-right">Ventas</TableCell>
            <TableCell is-header class="py-3 px-4 text-right">Separaciones</TableCell>
            <TableCell is-header class="py-3 px-4 text-right">Comisiones pagadas</TableCell>
            <TableCell is-header class="py-3 px-4 text-right">Costos</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="r in tableRows" :key="r.period" class="border-b border-gray-100 dark:border-gray-800">
            <TableCell class="py-3 px-4 font-medium text-gray-800 dark:text-white/90">{{ periodName(r.period) }}</TableCell>
            <TableCell class="py-3 px-4 text-right tabular-nums">{{ formatCurrency(r.sales, currency) }}</TableCell>
            <TableCell class="py-3 px-4 text-right tabular-nums">{{ formatCurrency(r.separations, currency) }}</TableCell>
            <TableCell class="py-3 px-4 text-right tabular-nums text-error-500">− {{ formatCurrency(r.commissionsPaid, currency) }}</TableCell>
            <TableCell class="py-3 px-4 text-right tabular-nums text-error-500">− {{ formatCurrency(r.costs, currency) }}</TableCell>
          </TableRow>
          <TableRow v-if="!tableRows.length">
            <TableCell colspan="5" class="py-8 px-4 text-center text-gray-400 dark:text-gray-500">Sin movimiento en {{ currency }} en el periodo.</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
