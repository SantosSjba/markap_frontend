<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import ReportPeriodPicker from '@shared/presentation/components/reports/ReportPeriodPicker.vue'
import { useReportPeriod } from '@shared/presentation/components/reports/report-period'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { splitCurrencyTotals } from '@shared/utils/money'
import { useInteriorReportsDashboard } from '../composables/useInteriorReportes'
import ProjectsReportTab from '../components/ProjectsReportTab.vue'
import ProfitabilityReportTab from '../components/ProfitabilityReportTab.vue'
import CollectionsReportTab from '../components/CollectionsReportTab.vue'
import SuppliersReportTab from '../components/SuppliersReportTab.vue'
import IndicatorsReportTab from '../components/IndicatorsReportTab.vue'
/**
 * Reportes de Interiorismo (como en Ventas y Alquileres): un periodo común (año, mes, rango o
 * todo), un resumen arriba y una pestaña por reporte. Cada monto se muestra en su moneda.
 */

const route = useRoute()
const router = useRouter()

const reportTabs = [
  { id: 'proyectos', label: 'Proyectos', icon: 'lucide:folder-kanban' },
  { id: 'rentabilidad', label: 'Rentabilidad', icon: 'lucide:trending-up' },
  { id: 'cobranzas', label: 'Cobranzas', icon: 'lucide:wallet' },
  { id: 'proveedores', label: 'Compras y proveedores', icon: 'lucide:truck' },
  { id: 'indicadores', label: 'Indicadores', icon: 'lucide:gauge' },
] as const
type ReportTab = (typeof reportTabs)[number]['id']

const activeTab = computed<ReportTab>({
  get() {
    const tab = route.query.tab
    return reportTabs.some((t) => t.id === tab) ? (tab as ReportTab) : 'proyectos'
  },
  set(tab) {
    void router.replace({ query: { ...route.query, tab } })
  },
})

const { mode, year, month, startDate, endDate, yearOptions, monthOptions, params, label } = useReportPeriod()
const range = computed(() => ({ startDate: params.value.startDate, endDate: params.value.endDate }))
const query = useInteriorReportsDashboard(range, { toastOnLoadError: false })
const d = computed(() => query.data.value)

const collected = computed(() => splitCurrencyTotals(d.value?.totals.collected.filter((t) => t.amount > 0) ?? [], true))
const pending = computed(() => splitCurrencyTotals(d.value?.totals.pending.filter((t) => t.amount > 0) ?? [], true))
const supplierBalance = computed(() =>
  splitCurrencyTotals(d.value?.totals.supplierBalance.filter((t) => t.amount > 0) ?? [], true),
)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Reportes" subtitle="Proyectos, rentabilidad, cobranzas y proveedores en cada moneda" icon="lucide:bar-chart-3">
      <template #actions>
        <ReportPeriodPicker
          v-model:mode="mode"
          v-model:year="year"
          v-model:month="month"
          v-model:start-date="startDate"
          v-model:end-date="endDate"
          :year-options="yearOptions"
          :month-options="monthOptions"
        />
      </template>
    </PageHeader>

    <!-- Resumen -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatsCard compact title="Proyectos nuevos" :value="String(d?.kpis.newProjects ?? 0)" :subtitle="label" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:folder-plus" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Cobrado" :value="collected.main" :subtitle="collected.rest || label" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:banknote" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Por cobrar hoy" :value="pending.main" :subtitle="pending.rest || 'saldo de clientes'" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:hourglass" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Saldo con proveedores"
        :value="supplierBalance.main"
        :subtitle="supplierBalance.rest || 'por pagar hoy'"
        :loading="query.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:truck" :size="20" /></template>
      </StatsCard>
    </div>

    <BaseTabs v-model="activeTab" :tabs="reportTabs" />

    <BaseCard class="block">
      <LoadingState v-if="query.isPending.value" class="py-16" />
      <div v-else-if="query.isError.value || !d" class="space-y-3 py-12 text-center text-sm">
        <p class="text-error-500">{{ getApiErrorMessage(query.error.value) }}</p>
        <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => query.refetch()">Reintentar</BaseButton>
      </div>
      <template v-else>
        <ProjectsReportTab v-if="activeTab === 'proyectos'" :data="d" :params="params" :period-label="label" />
        <ProfitabilityReportTab v-else-if="activeTab === 'rentabilidad'" :data="d" />
        <CollectionsReportTab v-else-if="activeTab === 'cobranzas'" :data="d" :params="params" :period-label="label" />
        <SuppliersReportTab v-else-if="activeTab === 'proveedores'" :data="d" :period-label="label" />
        <IndicatorsReportTab v-else :data="d" :params="params" :period-label="label" />
      </template>
    </BaseCard>
  </div>
</template>
