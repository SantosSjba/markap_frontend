<script setup lang="ts">
import { computed, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { TableCell, TableRow } from '@shared/presentation/ui/table'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import ReportSectionHeader from '@shared/presentation/components/reports/ReportSectionHeader.vue'
import PeriodBreakdownTable, {
  PERIOD_DETAIL_ROW_CLASS,
  type PeriodColumn,
} from '@shared/presentation/components/reports/PeriodBreakdownTable.vue'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { formatCurrency, formatCurrencyRounded, formatShortDate } from '@shared/utils/formatters'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { PAYMENT_TYPE_OPTIONS } from '../../../ventas-sales/domain/pipeline.constants'
import type { SalesSummary, VentasSummaryParams } from '../../domain/reportes.types'
import { useVentasReportSummary } from '../composables/useVentasReportes'
import { periodKeys, periodName, sortCurrencies } from '../utils/report-period'
/**
 * Ventas por periodo (como «Comisiones de alquileres»): una fila por mes —o por año en «Todo»—
 * que se despliega para ver cada venta, con su precio, descuento y comisiones de asesores.
 * Soles, dólares y euros nunca se suman: se ve una moneda o todas, cada una en su línea.
 */

const props = defineProps<{ params: VentasSummaryParams; periodLabel: string }>()
const router = useRouter()

const params = computed(() => props.params)
const query = useVentasReportSummary('sales', params as Ref<VentasSummaryParams>, ref(true))
const data = computed<SalesSummary | undefined>(() => query.data.value)
type Sale = SalesSummary['rows'][number]
const rows = computed(() => data.value?.rows ?? [])

// ── Moneda a mostrar: una sola o todas (cada una en su línea) ──
const CURRENCY_NAMES: Record<string, string> = { PEN: 'Soles', USD: 'Dólares', EUR: 'Euros' }
const currencyName = (code: string) => CURRENCY_NAMES[code] ?? code
const CURRENCY_VIEW_KEY = 'markap.ventas.reportes.ventas.moneda'
function readCurrencyView(): string {
  try {
    return localStorage.getItem(CURRENCY_VIEW_KEY) || 'PEN'
  } catch {
    return 'PEN'
  }
}
const currencyView = ref(readCurrencyView())
watch(currencyView, (v) => {
  try {
    localStorage.setItem(CURRENCY_VIEW_KEY, v)
  } catch {
    /* almacenamiento no disponible: la preferencia dura la sesión */
  }
})
const available = computed(() => sortCurrencies((data.value?.byCurrency ?? []).map((t) => t.currency)))
const currencyTabs = computed(() => [
  ...available.value.map((c) => ({ id: c, label: currencyName(c) })),
  ...(available.value.length > 1 ? [{ id: 'ALL', label: 'Todas' }] : []),
])
const viewCurrencies = computed(() => {
  if (currencyView.value === 'ALL' && available.value.length > 1) return available.value
  return available.value.includes(currencyView.value) ? [currencyView.value] : available.value.slice(0, 1)
})
/** Moneda de las tarjetas: la elegida (o la primera al ver todas) */
const cardCurrency = computed(() => viewCurrencies.value[0] ?? 'PEN')
const cardTotals = computed(() => data.value?.byCurrency.find((t) => t.currency === cardCurrency.value))

// ── Totales de un grupo de ventas en una moneda ──
interface Totals {
  count: number
  total: number
  listTotal: number
  discount: number | null
  commissions: { currency: string; total: number; paid: number }[]
}
function totalsOf(sales: Sale[]): Totals {
  const listed = sales.filter((s) => s.listPrice)
  const listTotal = listed.reduce((a, s) => a + s.listPrice!, 0)
  const listedSold = listed.reduce((a, s) => a + s.finalPrice, 0)
  const byCur = new Map<string, { total: number; paid: number }>()
  for (const s of sales)
    for (const k of s.commissions) {
      const acc = byCur.get(k.currency) ?? { total: 0, paid: 0 }
      acc.total += k.total
      acc.paid += k.paid
      byCur.set(k.currency, acc)
    }
  return {
    count: sales.length,
    total: sales.reduce((a, s) => a + s.finalPrice, 0),
    listTotal: sales.reduce((a, s) => a + (s.listPrice ?? 0), 0),
    discount: listTotal > 0 ? Math.round(((listTotal - listedSold) / listTotal) * 1000) / 10 : null,
    commissions: sortCurrencies(byCur.keys()).map((c) => ({ currency: c, ...byCur.get(c)! })),
  }
}
const salesIn = (period: string | null, currency: string) =>
  rows.value
    .filter((r) => (period === null || r.period === period) && r.currency === currency)
    .sort((a, b) => a.closedAt.localeCompare(b.closedAt))

// ── Periodos (todos los del rango, aunque no tengan ventas) ──
const periods = computed(() => periodKeys(props.params, (data.value?.periods ?? []).map((p) => p.period)))
/** Monedas visibles con ventas en el periodo (una sola si no hubo) */
function periodCurrencies(period: string): string[] {
  const withData = viewCurrencies.value.filter((c) => rows.value.some((r) => r.period === period && r.currency === c))
  return withData.length ? withData : viewCurrencies.value.slice(0, 1)
}
const hasSales = (period: string) => viewCurrencies.value.some((c) => salesIn(period, c).length > 0)
const hasCommissions = (period: string) =>
  periodCurrencies(period).some((c) => totalsOf(salesIn(period, c)).commissions.length > 0)

const PERIOD_COLUMNS: PeriodColumn[] = [
  { key: 'count', label: 'Ventas' },
  { key: 'total', label: 'Monto vendido', hint: '(precio final)', highlight: true },
  { key: 'list', label: 'Valor de lista' },
  { key: 'discount', label: 'Descuento' },
  { key: 'commissions', label: 'Comisiones', hint: 'asesores (neto)' },
  { key: 'paid', label: 'Pagado', hint: 'a asesores' },
]

const periodTotals = computed(() => viewCurrencies.value.map((c) => ({ currency: c, ...totalsOf(salesIn(null, c)) })))

/** Descuento frente a la lista: «−2 %» si se vendió por debajo, «+1 %» si por encima */
const discountText = (d: number | null) => (d == null ? '—' : d === 0 ? '0 %' : `${d > 0 ? '−' : '+'}${Math.abs(d)} %`)
const discountClass = (d: number | null) =>
  d == null || d === 0
    ? 'text-gray-500 dark:text-gray-400'
    : d > 0
      ? 'text-warning-600 dark:text-orange-400'
      : 'text-success-600 dark:text-success-500'
const saleDiscount = (s: Sale) =>
  s.listPrice ? Math.round(((s.listPrice - s.finalPrice) / s.listPrice) * 1000) / 10 : null

const paymentLabel = (code: string) => PAYMENT_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? code
const avgDays = computed(() => {
  const days = rows.value.map((r) => r.daysToClose).filter((d): d is number => d != null)
  return days.length ? Math.round(days.reduce((a, d) => a + d, 0) / days.length) : null
})

function goProcess(s: Sale) {
  if (s.processId) void router.push({ name: 'ventas-proceso-detalle', params: { id: s.processId } })
}

const { isExporting, exportToExcel } = useExcelExport()
async function exportExcel() {
  const d = data.value
  if (!d) return
  await exportToExcel({
    fileName: `ventas_por_periodo_${props.periodLabel.replace(/\s+/g, '_')}`,
    sheetName: 'Por periodo',
    columns: [
      { header: 'Periodo', key: 'period', width: 16 },
      { header: 'Moneda', key: 'currency', width: 9 },
      { header: 'Ventas', key: 'count', width: 9 },
      { header: 'Monto vendido', key: 'total', width: 18 },
      { header: 'Valor de lista', key: 'list', width: 18 },
      { header: 'Descuento (%)', key: 'discount', width: 13 },
    ],
    rows: periods.value.flatMap((p) =>
      available.value.flatMap((c) => {
        const t = totalsOf(salesIn(p, c))
        return t.count
          ? [{ period: periodName(p), currency: c, count: t.count, total: t.total, list: t.listTotal, discount: t.discount ?? '' }]
          : []
      }),
    ),
    additionalSheets: [
      {
        sheetName: 'Ventas',
        columns: [
          { header: 'Periodo', key: 'period', width: 16 },
          { header: 'Fecha', key: 'date', width: 12 },
          { header: 'Proceso', key: 'process', width: 28 },
          { header: 'Inmueble', key: 'property', width: 28 },
          { header: 'Dirección', key: 'address', width: 32 },
          { header: 'Comprador', key: 'buyer', width: 28 },
          { header: 'Asesor', key: 'agent', width: 28 },
          { header: 'Moneda', key: 'currency', width: 9 },
          { header: 'Precio de lista', key: 'list', width: 16 },
          { header: 'Precio final', key: 'final', width: 16 },
          { header: 'Forma de pago', key: 'payment', width: 16 },
          { header: 'Días al cierre', key: 'days', width: 13 },
          { header: 'Comisiones (neto)', key: 'commissions', width: 36 },
        ],
        rows: d.rows.map((r) => ({
          period: periodName(r.period),
          date: formatShortDate(r.closedAt),
          process: r.processCode ?? '',
          property: r.propertyCode,
          address: r.propertyAddress,
          buyer: r.buyerName,
          agent: r.agentName ?? '',
          currency: r.currency,
          list: r.listPrice ?? '',
          final: r.finalPrice,
          payment: paymentLabel(r.paymentType),
          days: r.daysToClose ?? '',
          commissions: r.commissions.map((k) => `${k.agentName}: ${formatCurrency(k.total, k.currency)}`).join(' · '),
        })),
      },
    ],
  })
}
</script>

<template>
  <div class="space-y-5">
    <ReportSectionHeader
      title="Ventas por periodo"
      :subtitle="`Ventas cerradas · ${periodLabel}`"
      :help="`Cada venta se ubica en el ${params.granularity === 'year' ? 'año' : 'mes'} de su cierre. Haz clic en un periodo con ventas para ver cada una. El descuento compara el precio final con el de lista; las comisiones se muestran en su propia moneda.`"
      icon="lucide:trending-up"
      :exporting="isExporting"
      @export="exportExcel"
    />

    <p v-if="query.isError.value" class="text-sm text-error-500">{{ getApiErrorMessage(query.error.value) }}</p>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard compact title="Ticket promedio" :value="formatCurrencyRounded(cardTotals?.average ?? 0, cardCurrency)" :subtitle="`${cardTotals?.count ?? 0} ventas en ${cardCurrency}`" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:receipt" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Valor de lista" :value="formatCurrencyRounded(cardTotals?.listTotal ?? 0, cardCurrency)" subtitle="de lo vendido" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:tag" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Descuento promedio" :value="`${cardTotals?.discountPercent ?? 0} %`" subtitle="frente al precio de lista" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:percent" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Tiempo al cierre" :value="avgDays != null ? `${avgDays} días` : '—'" subtitle="promedio desde el proceso" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:timer" :size="20" /></template>
      </StatsCard>
    </div>

    <!-- Totales del periodo: una línea compacta por moneda -->
    <div v-if="rows.length" class="space-y-2">
      <div v-if="currencyTabs.length > 1" class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-gray-500 dark:text-gray-400">Ver montos en</span>
        <BaseTabs v-model="currencyView" :tabs="currencyTabs" variant="segmented" />
      </div>
      <BaseCard v-for="t in periodTotals" :key="t.currency" padding="sm" class="block">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div class="flex items-baseline gap-2">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Vendido</span>
            <span class="text-lg font-bold tabular-nums text-brand-500 dark:text-brand-400">{{ formatCurrency(t.total, t.currency) }}</span>
            <span class="text-xs text-gray-400 dark:text-gray-500">{{ t.count }} {{ t.count === 1 ? 'venta' : 'ventas' }}</span>
          </div>
          <Badge variant="neutral">Lista {{ formatCurrency(t.listTotal, t.currency) }}</Badge>
          <Badge variant="neutral">Descuento {{ discountText(t.discount) }}</Badge>
          <span class="ml-auto inline-flex flex-wrap items-baseline gap-2">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Comisiones</span>
            <span v-for="k in t.commissions" :key="k.currency" class="text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">
              {{ formatCurrency(k.total, k.currency) }}
            </span>
            <span v-if="!t.commissions.length" class="text-sm text-gray-400">—</span>
          </span>
        </div>
      </BaseCard>
    </div>


    <div>
      <PeriodBreakdownTable
        :periods="periods"
        :columns="PERIOD_COLUMNS"
        :has-detail="hasSales"
        :loading="query.isPending.value"
        show-total
      >
        <template #cell="{ period: p, column }">
          <template v-if="column === 'count'">
            <div v-for="c in periodCurrencies(p)" :key="c" class="text-gray-700 dark:text-gray-300">{{ totalsOf(salesIn(p, c)).count || '—' }}</div>
          </template>
          <template v-else-if="column === 'total'">
            <div v-for="c in periodCurrencies(p)" :key="c" class="font-semibold text-brand-500 dark:text-brand-400">{{ formatCurrency(totalsOf(salesIn(p, c)).total, c) }}</div>
          </template>
          <template v-else-if="column === 'list'">
            <div v-for="c in periodCurrencies(p)" :key="c" class="text-gray-500 dark:text-gray-400">{{ formatCurrency(totalsOf(salesIn(p, c)).listTotal, c) }}</div>
          </template>
          <template v-else-if="column === 'discount'">
            <div v-for="c in periodCurrencies(p)" :key="c" :class="discountClass(totalsOf(salesIn(p, c)).discount)">{{ discountText(totalsOf(salesIn(p, c)).discount) }}</div>
          </template>
          <template v-else>
            <template v-for="c in periodCurrencies(p)" :key="c">
              <div
                v-for="k in totalsOf(salesIn(p, c)).commissions"
                :key="k.currency"
                :class="column === 'commissions' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'"
              >
                {{ formatCurrency(column === 'commissions' ? k.total : k.paid, k.currency) }}
              </div>
            </template>
            <span v-if="!hasCommissions(p)" class="text-gray-400">—</span>
          </template>
        </template>

        <!-- Detalle del periodo: cada venta, por moneda -->
        <template #detail="{ period: p }">
          <template v-for="c in periodCurrencies(p)" :key="`${p}-${c}`">
            <TableRow v-if="periodCurrencies(p).length > 1" class="border-b border-gray-200 bg-gray-100/70 dark:border-gray-800 dark:bg-white/5">
              <TableCell colspan="7" class="py-2 px-4 pl-10 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {{ currencyName(c) }}
              </TableCell>
            </TableRow>
            <TableRow
              v-for="s in salesIn(p, c)"
              :key="s.id"
              :class="[PERIOD_DETAIL_ROW_CLASS, 'transition-opacity', s.processId ? 'cursor-pointer hover:opacity-90' : '']"
              @click.stop="goProcess(s)"
            >
              <TableCell class="py-2.5 px-4 pl-10">
                <p class="font-medium text-sm whitespace-nowrap text-brand-500 dark:text-brand-400">{{ s.processCode ?? s.propertyCode }}</p>
                <p class="text-xs mt-0.5 line-clamp-2 text-gray-800 dark:text-white/90">{{ s.propertyCode }} · {{ s.propertyAddress }}</p>
                <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
                  {{ s.buyerName }}<template v-if="s.agentName"> · {{ s.agentName }}</template> · {{ paymentLabel(s.paymentType) }}
                </p>
              </TableCell>
              <TableCell class="py-2.5 px-4 text-right whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                {{ formatShortDate(s.closedAt) }}
                <span v-if="s.daysToClose != null" class="block">{{ s.daysToClose }} días</span>
              </TableCell>
              <TableCell class="py-2.5 px-4 text-right whitespace-nowrap text-sm font-semibold tabular-nums text-brand-500 dark:text-brand-400">
                {{ formatCurrency(s.finalPrice, s.currency) }}
              </TableCell>
              <TableCell class="py-2.5 px-4 text-right whitespace-nowrap text-sm tabular-nums text-gray-500 dark:text-gray-400">
                {{ s.listPrice != null ? formatCurrency(s.listPrice, s.currency) : '—' }}
              </TableCell>
              <TableCell class="py-2.5 px-4 text-right whitespace-nowrap text-sm tabular-nums" :class="discountClass(saleDiscount(s))">
                {{ discountText(saleDiscount(s)) }}
              </TableCell>
              <TableCell class="py-2.5 px-4 text-right whitespace-nowrap text-sm">
                <div v-for="(k, i) in s.commissions" :key="i" class="tabular-nums text-gray-700 dark:text-gray-300">
                  {{ formatCurrency(k.total, k.currency) }}
                  <span class="block text-xs text-gray-400 dark:text-gray-500">{{ k.agentName }}</span>
                </div>
                <span v-if="!s.commissions.length" class="text-gray-400">—</span>
              </TableCell>
              <TableCell class="py-2.5 px-4 text-right whitespace-nowrap text-sm tabular-nums text-gray-500 dark:text-gray-400">
                <div v-for="(k, i) in s.commissions" :key="i" :class="k.paid >= k.total ? 'text-success-600 dark:text-success-500' : ''">
                  {{ formatCurrency(k.paid, k.currency) }}
                  <span class="block text-xs text-gray-400 dark:text-gray-500">{{ k.paid >= k.total ? 'pagada' : 'pendiente' }}</span>
                </div>
                <span v-if="!s.commissions.length" class="text-gray-400">—</span>
              </TableCell>
            </TableRow>
          </template>
        </template>

        <template #total="{ column }">
          <template v-if="!rows.length" />
          <template v-else-if="column === 'count'">
            <div v-for="t in periodTotals" :key="t.currency" class="text-gray-700 dark:text-gray-300">{{ t.count }}</div>
          </template>
          <template v-else-if="column === 'total'">
            <div v-for="t in periodTotals" :key="t.currency" class="text-brand-500 dark:text-brand-400">{{ formatCurrency(t.total, t.currency) }}</div>
          </template>
          <template v-else-if="column === 'list'">
            <div v-for="t in periodTotals" :key="t.currency" class="text-gray-500 dark:text-gray-400">{{ formatCurrency(t.listTotal, t.currency) }}</div>
          </template>
          <template v-else-if="column === 'discount'">
            <div v-for="t in periodTotals" :key="t.currency" :class="discountClass(t.discount)">{{ discountText(t.discount) }}</div>
          </template>
          <template v-else>
            <template v-for="t in periodTotals" :key="t.currency">
              <div
                v-for="k in t.commissions"
                :key="k.currency"
                :class="column === 'commissions' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'"
              >
                {{ formatCurrency(column === 'commissions' ? k.total : k.paid, k.currency) }}
              </div>
            </template>
          </template>
        </template>
      </PeriodBreakdownTable>
      <p v-if="!rows.length && !query.isPending.value && !query.isError.value" class="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
        No hay ventas cerradas en el periodo seleccionado.
      </p>
    </div>
  </div>
</template>
