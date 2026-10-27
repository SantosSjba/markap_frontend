<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { formatCurrencyRounded } from '@shared/utils/formatters'
import { useVentasReportSummary } from '../composables/useVentasReportes'
import { PERIOD_MODE_OPTIONS, useReportPeriod } from '../utils/report-period'
import SalesReportTab from '../components/SalesReportTab.vue'
import AgentsReportTab from '../components/AgentsReportTab.vue'
import ConversionReportTab from '../components/ConversionReportTab.vue'
import FinancialReportTab from '../components/FinancialReportTab.vue'
import IndicatorsReportTab from '../components/IndicatorsReportTab.vue'
/**
 * Reportes de Ventas (como en Alquileres): un periodo común (año, mes, rango o todo)
 * y una pestaña por reporte; cada monto se muestra en su moneda.
 */
const route = useRoute()
const router = useRouter()

const reportTabs = [
  { id: 'ventas', label: 'Ventas por periodo', icon: 'lucide:trending-up' },
  { id: 'asesores', label: 'Rendimiento de asesores', icon: 'lucide:user-check' },
  { id: 'conversion', label: 'Conversión', icon: 'lucide:git-branch' },
  { id: 'flujo', label: 'Flujo financiero', icon: 'lucide:wallet' },
  { id: 'indicadores', label: 'Indicadores', icon: 'lucide:gauge' },
] as const
type ReportTab = (typeof reportTabs)[number]['id']

const activeTab = computed<ReportTab>({
  get() {
    const tab = route.query.tab
    return reportTabs.some((t) => t.id === tab) ? (tab as ReportTab) : 'ventas'
  },
  set(tab) {
    void router.replace({ query: { ...route.query, tab } })
  },
})

const { mode, year, month, startDate, endDate, yearOptions, monthOptions, params, label } = useReportPeriod()

// Resumen del periodo (mismas consultas que las pestañas: se comparten en caché)
const salesQuery = useVentasReportSummary('sales', params, ref(true))
const conversionQuery = useVentasReportSummary('conversion', params, ref(true))
const financialQuery = useVentasReportSummary('financial', params, ref(true))

/** Una cifra por moneda: la primera como valor y el resto debajo */
function perCurrency(list: { currency: string; amount: number }[]) {
  const nonZero = list.filter((x) => x.amount > 0)
  return {
    main: nonZero[0] ? formatCurrencyRounded(nonZero[0].amount, nonZero[0].currency) : formatCurrencyRounded(0, 'PEN'),
    rest: nonZero
      .slice(1)
      .map((x) => formatCurrencyRounded(x.amount, x.currency))
      .join(' · '),
  }
}
const soldSummary = computed(() =>
  perCurrency((salesQuery.data.value?.byCurrency ?? []).map((t) => ({ currency: t.currency, amount: t.total }))),
)
const pendingCommissions = computed(() =>
  perCurrency(
    (financialQuery.data.value?.byCurrency ?? []).map((t) => ({ currency: t.currency, amount: t.commissionsPending })),
  ),
)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Reportes" subtitle="Ventas, asesores, conversión y flujo financiero en cada moneda" icon="lucide:bar-chart-3">
      <template #actions>
        <div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-end">
          <FormSelect v-model="mode" :options="PERIOD_MODE_OPTIONS" class="sm:w-40" />
          <FormSelect v-if="mode === 'year' || mode === 'month'" v-model="year" :options="yearOptions" class="sm:w-28" />
          <FormSelect v-if="mode === 'month'" v-model="month" :options="monthOptions" class="col-span-2 sm:col-span-1 sm:w-36" />
          <template v-if="mode === 'range'">
            <FormInput v-model="startDate" type="date" class="sm:w-40" />
            <FormInput v-model="endDate" type="date" class="sm:w-40" />
          </template>
        </div>
      </template>
    </PageHeader>

    <!-- Resumen del periodo -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard
        compact
        title="Ventas cerradas"
        :value="String(salesQuery.data.value?.closings ?? 0)"
        :subtitle="label"
        :loading="salesQuery.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:handshake" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Monto vendido" :value="soldSummary.main" :subtitle="soldSummary.rest || 'precio final'" :loading="salesQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:banknote" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Procesos activos"
        :value="String(conversionQuery.data.value?.active ?? 0)"
        :subtitle="`${conversionQuery.data.value?.conversionRate ?? 0} % de conversión`"
        :loading="conversionQuery.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:git-branch" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Comisiones por pagar"
        :value="pendingCommissions.main"
        :subtitle="pendingCommissions.rest || 'de las ventas del periodo'"
        :loading="financialQuery.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:hourglass" :size="20" /></template>
      </StatsCard>
    </div>

    <BaseTabs v-model="activeTab" :tabs="reportTabs" />

    <BaseCard class="block">
      <SalesReportTab v-if="activeTab === 'ventas'" :params="params" :period-label="label" />
      <AgentsReportTab v-else-if="activeTab === 'asesores'" :params="params" :period-label="label" />
      <ConversionReportTab v-else-if="activeTab === 'conversion'" :params="params" :period-label="label" />
      <FinancialReportTab v-else-if="activeTab === 'flujo'" :params="params" :period-label="label" />
      <IndicatorsReportTab v-else :params="params" :period-label="label" />
    </BaseCard>
  </div>
</template>
