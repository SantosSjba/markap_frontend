<script setup lang="ts">
import { computed, ref, watch, type Ref } from 'vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import MonthlyBarChart from '@shared/presentation/components/reports/MonthlyBarChart.vue'
import ReportSectionHeader from '@shared/presentation/components/reports/ReportSectionHeader.vue'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { formatCurrency } from '@shared/utils/formatters'
import type { VentasSummaryParams } from '../../domain/reportes.types'
import { useVentasReportSummary } from '../composables/useVentasReportes'
import { barItems, periodKeys, periodName, sortCurrencies } from '../utils/report-period'
/**
 * Indicadores (como en Alquileres): los gráficos de barras por mes —o por año— reunidos aquí,
 * para que el resto de pestañas sean tablas y el usuario abra los gráficos cuando quiera.
 * Montos de una moneda a la vez: soles y dólares no comparten escala.
 */

const props = defineProps<{ params: VentasSummaryParams; periodLabel: string }>()
const params = computed(() => props.params) as Ref<VentasSummaryParams>
const enabled = ref(true)
const salesQuery = useVentasReportSummary('sales', params, enabled)
const conversionQuery = useVentasReportSummary('conversion', params, enabled)
const financialQuery = useVentasReportSummary('financial', params, enabled)

const unit = computed(() => (props.params.granularity === 'year' ? 'año' : 'mes'))

// Moneda de los gráficos de montos
const currencies = computed(() =>
  sortCurrencies([
    ...(salesQuery.data.value?.byCurrency ?? []).map((t) => t.currency),
    ...(financialQuery.data.value?.byCurrency ?? []).map((t) => t.currency),
  ]),
)
const currency = ref('PEN')
watch(
  currencies,
  (list) => {
    if (list.length && !list.includes(currency.value)) currency.value = list[0]!
  },
  { immediate: true },
)
const currencyTabs = computed(() => currencies.value.map((c) => ({ id: c, label: c })))

// 1. Monto vendido
const salesItems = computed(() => {
  const periods = salesQuery.data.value?.periods ?? []
  const at = (k: string) => periods.find((p) => p.period === k)?.byCurrency.find((c) => c.currency === currency.value)
  return barItems(
    periodKeys(props.params, periods.map((p) => p.period)),
    (k) => at(k)?.total ?? 0,
    (k, v) => {
      const n = at(k)?.count ?? 0
      return `${periodName(k)}: ${formatCurrency(v, currency.value)} · ${n} ${n === 1 ? 'venta' : 'ventas'}`
    },
  )
})

// 2. Procesos: nuevos, ganados o caídos
type ProcessSeries = 'created' | 'won' | 'lost'
const processSeries = ref<ProcessSeries>('won')
const processTabs = [
  { id: 'created' as const, label: 'Nuevos' },
  { id: 'won' as const, label: 'Ganados' },
  { id: 'lost' as const, label: 'Caídos' },
]
const processNoun: Record<ProcessSeries, [string, string]> = {
  created: ['proceso nuevo', 'procesos nuevos'],
  won: ['venta ganada', 'ventas ganadas'],
  lost: ['venta caída', 'ventas caídas'],
}
const processItems = computed(() => {
  const periods = conversionQuery.data.value?.periods ?? []
  return barItems(
    periodKeys(props.params, periods.map((p) => p.period)),
    (k) => periods.find((p) => p.period === k)?.[processSeries.value] ?? 0,
    (k, v) => `${periodName(k)}: ${v} ${processNoun[processSeries.value][v === 1 ? 0 : 1]}`,
  )
})

// 3. Flujo: separaciones, comisiones pagadas o costos
type FlowSeries = 'separations' | 'commissionsPaid' | 'costs'
const flowSeries = ref<FlowSeries>('commissionsPaid')
const flowTabs = [
  { id: 'separations' as const, label: 'Separaciones' },
  { id: 'commissionsPaid' as const, label: 'Comisiones pagadas' },
  { id: 'costs' as const, label: 'Costos' },
]
const flowItems = computed(() => {
  const periods = financialQuery.data.value?.periods ?? []
  return barItems(
    periodKeys(props.params, periods.map((p) => p.period)),
    (k) => periods.find((p) => p.period === k)?.byCurrency.find((c) => c.currency === currency.value)?.[flowSeries.value] ?? 0,
    (k, v) => `${periodName(k)}: ${formatCurrency(v, currency.value)}`,
  )
})

const { isExporting, exportToExcel } = useExcelExport()
async function exportExcel() {
  await exportToExcel({
    fileName: `indicadores_ventas_${props.periodLabel.replace(/\s+/g, '_')}`,
    sheetName: 'Indicadores',
    columns: [
      { header: 'Periodo', key: 'period', width: 16 },
      { header: `Monto vendido (${currency.value})`, key: 'sold', width: 20 },
      { header: 'Procesos nuevos', key: 'created', width: 14 },
      { header: 'Ganados', key: 'won', width: 10 },
      { header: 'Caídos', key: 'lost', width: 10 },
      { header: `Separaciones (${currency.value})`, key: 'separations', width: 18 },
      { header: `Comisiones pagadas (${currency.value})`, key: 'paid', width: 22 },
      { header: `Costos (${currency.value})`, key: 'costs', width: 14 },
    ],
    rows: salesItems.value.map((s) => {
      const conv = conversionQuery.data.value?.periods.find((p) => p.period === s.key)
      const fin = financialQuery.data.value?.periods
        .find((p) => p.period === s.key)
        ?.byCurrency.find((c) => c.currency === currency.value)
      return {
        period: periodName(s.key),
        sold: s.value,
        created: conv?.created ?? 0,
        won: conv?.won ?? 0,
        lost: conv?.lost ?? 0,
        separations: fin?.separations ?? 0,
        paid: fin?.commissionsPaid ?? 0,
        costs: fin?.costs ?? 0,
      }
    }),
  })
}
</script>

<template>
  <div class="space-y-5">
    <ReportSectionHeader
      title="Indicadores"
      :subtitle="`Gráficos por ${unit} · ${periodLabel}`"
      icon="lucide:gauge"
      :exporting="isExporting"
      @export="exportExcel"
    >
      <template #actions>
        <BaseTabs v-if="currencyTabs.length > 1" v-model="currency" :tabs="currencyTabs" variant="segmented" />
      </template>
    </ReportSectionHeader>

    <div class="grid gap-5 xl:grid-cols-2">
      <MonthlyBarChart
        :title="`Monto vendido por ${unit} (${currency})`"
        :items="salesItems"
        :loading="salesQuery.isPending.value"
        :format-value="(v) => formatCurrency(v, currency)"
        empty-text="Sin ventas cerradas en el periodo"
      />

      <MonthlyBarChart
        :title="`Procesos por ${unit}`"
        :items="processItems"
        :loading="conversionQuery.isPending.value"
        :format-value="(v) => String(v)"
        integer
        empty-text="Sin movimiento en el periodo"
      >
        <template #actions>
          <BaseTabs v-model="processSeries" :tabs="processTabs" variant="segmented" />
        </template>
      </MonthlyBarChart>

      <MonthlyBarChart
        class="xl:col-span-2"
        :title="`Flujo por ${unit} (${currency})`"
        :items="flowItems"
        :loading="financialQuery.isPending.value"
        :format-value="(v) => formatCurrency(v, currency)"
        empty-text="Sin movimiento en el periodo"
      >
        <template #actions>
          <BaseTabs v-model="flowSeries" :tabs="flowTabs" variant="segmented" />
        </template>
      </MonthlyBarChart>
    </div>
  </div>
</template>
