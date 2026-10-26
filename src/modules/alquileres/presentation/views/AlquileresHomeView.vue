<script setup lang="ts">
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import { computed, ref } from 'vue'
import { useAuthStore } from '@modules/auth/presentation/stores/auth.store'
import { useRentalStats } from '../../features/alquileres/presentation/composables/useRentals'
import {
  useReportsSummary,
  useContractsExpiring,
  useContractStatusSummary,
  useMonthlyMetrics,
  useRentalsByMonth,
} from '../../features/reportes/presentation/composables/useReportes'
import {
  useOverduePayments,
  usePaymentStats,
} from '../../features/cobranzas/presentation/composables/usePayments'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import DashboardAlertasList from '../components/DashboardAlertasList.vue'
import DashboardBarChart from '../components/DashboardBarChart.vue'
import DashboardAccionesRapidas from '../components/DashboardAccionesRapidas.vue'
import DashboardEstadoContratos from '../components/DashboardEstadoContratos.vue'
import DashboardCobranzaMes from '../components/DashboardCobranzaMes.vue'
import DashboardFinanzasCartera from '../components/DashboardFinanzasCartera.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { formatDate } from '@shared/utils/formatters'
const authStore = useAuthStore()
const currentYear = ref(new Date().getFullYear())

const rentalStatsQuery = useRentalStats()
const summaryQuery = useReportsSummary()
const expiringQuery = useContractsExpiring('alquileres', 30)
const contractStatusQuery = useContractStatusSummary()
const monthlyMetricsQuery = useMonthlyMetrics()
const paymentStatsQuery = usePaymentStats()
const overdueQuery = useOverduePayments()
const rentalsByMonthQuery = useRentalsByMonth(
  'alquileres',
  computed(() => ({ year: currentYear.value })),
)

const loading = computed(
  () =>
    rentalStatsQuery.isPending.value ||
    summaryQuery.isPending.value ||
    monthlyMetricsQuery.isPending.value,
)

const stats = computed(
  () => rentalStatsQuery.data.value ?? { total: 0, vigentes: 0, porVencer: 0, vencidos: 0 },
)
const summary = computed(
  () =>
    summaryQuery.data.value ?? {
      contratosPorVencer: 0,
      propiedadesSinContrato: 0,
      clientesActivos: 0,
      clientesConIncidencias: 0,
    },
)
const metrics = computed(
  () =>
    monthlyMetricsQuery.data.value ?? {
      tasaOcupacion: 0,
      tasaCobranza: 0,
      contratosRenovados: 0,
      clientesNuevos: 0,
    },
)
const expiringItems = computed(() => expiringQuery.data.value ?? [])
const rentalsByMonth = computed(() => rentalsByMonthQuery.data.value ?? [])
const overdueItems = computed(() => overdueQuery.data.value ?? [])

const greetingHour = new Date().getHours()
const greeting =
  greetingHour < 12 ? 'Buenos días' : greetingHour < 19 ? 'Buenas tardes' : 'Buenas noches'
const firstName = computed(() => authStore.user?.firstName ?? 'Usuario')

type ChartMode = 'newContracts' | 'expiredContracts' | 'activeAtEndOfMonth'
const chartMode = ref<ChartMode>('newContracts')
const chartTabs: { id: ChartMode; label: string }[] = [
  { id: 'newContracts', label: 'Nuevos' },
  { id: 'expiredContracts', label: 'Vencidos' },
  { id: 'activeAtEndOfMonth', label: 'Activos' },
]

function formatPercent(val: number) {
  return `${Math.round(val)}%`
}
</script>

<template>
  <div class="space-y-4">

    <!-- ── Greeting header ── -->
    <PageHeader
      :title="`${greeting}, ${firstName} 👋`"
      subtitle="Resumen de tu cartera de alquileres"
    >
      <template #actions>
        <p class="text-sm shrink-0 text-gray-400 dark:text-gray-500">
        {{
          formatDate(new Date(), {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        }}
      </p>
      </template>
    </PageHeader>

    <!-- ── Acciones rápidas ── -->
    <DashboardAccionesRapidas />

    <!-- ── KPIs (compactos) ── -->
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">
      <StatsCard compact title="Contratos Totales" :value="stats.total" :loading="loading">
        <template #icon><AppIcon icon="lucide:file-text" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Vigentes"
        :value="stats.vigentes"
        :subtitle="metrics.contratosRenovados > 0 ? `${metrics.contratosRenovados} renovados este mes` : undefined"
        :loading="loading"
      >
        <template #icon><AppIcon icon="lucide:circle-check" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Por Vencer (30 días)" :value="stats.porVencer" :loading="loading">
        <template #icon><AppIcon icon="lucide:triangle-alert" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Vencidos" :value="stats.vencidos" :loading="loading">
        <template #icon><AppIcon icon="lucide:calendar-x" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Tasa de Ocupación"
        :value="formatPercent(metrics.tasaOcupacion)"
        :subtitle="`${summary.propiedadesSinContrato} libres`"
        :loading="loading"
      >
        <template #icon><AppIcon icon="lucide:home" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Tasa de Cobranza"
        :value="formatPercent(metrics.tasaCobranza)"
        subtitle="mes actual"
        :loading="loading"
      >
        <template #icon><AppIcon icon="lucide:circle-dollar-sign" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Clientes Activos"
        :value="summary.clientesActivos"
        :subtitle="metrics.clientesNuevos > 0 ? `+${metrics.clientesNuevos} este mes` : undefined"
        :loading="loading"
      >
        <template #icon><AppIcon icon="lucide:users" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Clientes con Incidencias"
        :value="summary.clientesConIncidencias"
        subtitle="cuotas vencidas"
        :loading="loading"
      >
        <template #icon><AppIcon icon="lucide:user-x" :size="20" /></template>
      </StatsCard>
    </div>

    <!-- ── Alertas + Gráfico ── -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div class="lg:col-span-2">
        <DashboardAlertasList
          :items="expiringItems"
          :loading="expiringQuery.isPending.value"
          :max-visible="4"
          class="h-full"
        />
      </div>

      <div class="lg:col-span-3">
        <DashboardBarChart
          :data="rentalsByMonth"
          :loading="rentalsByMonthQuery.isPending.value"
          :mode="chartMode"
          :title="`Contratos por Mes — ${currentYear}`"
          class="h-full"
        >
          <template #actions>
            <BaseTabs v-model="chartMode" :tabs="chartTabs" variant="segmented" />
          </template>
        </DashboardBarChart>
      </div>
    </div>

    <!-- ── Estado, cobranza y finanzas ── -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <DashboardEstadoContratos
        :data="contractStatusQuery.data.value"
        :loading="contractStatusQuery.isPending.value"
      />
      <DashboardCobranzaMes
        :stats="paymentStatsQuery.data.value"
        :overdue="overdueItems"
        :loading="paymentStatsQuery.isPending.value || overdueQuery.isPending.value"
      />
      <DashboardFinanzasCartera
        :data="rentalsByMonth"
        :loading="rentalsByMonthQuery.isPending.value"
        class="md:col-span-2 xl:col-span-1"
      />
    </div>

  </div>
</template>
