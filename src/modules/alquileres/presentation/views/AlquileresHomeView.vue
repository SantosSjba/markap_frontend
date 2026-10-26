<script setup lang="ts">
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
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
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import DashboardAlertasList from '../components/DashboardAlertasList.vue'
import DashboardBarChart from '../components/DashboardBarChart.vue'
import DashboardAccionesRapidas from '../components/DashboardAccionesRapidas.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { formatDate } from '@shared/utils/formatters'
const authStore = useAuthStore()
const currentYear = ref(new Date().getFullYear())

const rentalStatsQuery = useRentalStats()
const summaryQuery = useReportsSummary()
const expiringQuery = useContractsExpiring('alquileres', 30)
const contractStatusQuery = useContractStatusSummary()
const monthlyMetricsQuery = useMonthlyMetrics()
const rentalsByMonthQuery = useRentalsByMonth(
  'alquileres',
  computed(() => ({ year: currentYear.value })),
)

const loading = computed(
  () =>
    rentalStatsQuery.isPending.value ||
    summaryQuery.isPending.value ||
    expiringQuery.isPending.value ||
    contractStatusQuery.isPending.value ||
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
  <div class="space-y-6">

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

    <!-- ── KPI row ── -->
    <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Contratos totales -->
      <StatsCard
        title="Contratos Totales"
        :value="stats.total"
        :loading="loading"
      >
        <template #icon><AppIcon icon="lucide:file-text" :size="20" /></template>
      </StatsCard>

      <!-- Vigentes -->
      <StatsCard
        title="Vigentes"
        :value="stats.vigentes"
        :loading="loading"
      >
        <template #icon><AppIcon icon="lucide:circle-check" :size="20" /></template>
      </StatsCard>

      <!-- Por vencer -->
      <StatsCard
        title="Por Vencer (30 días)"
        :value="stats.porVencer"
        :loading="loading"
      >
        <template #icon><AppIcon icon="lucide:triangle-alert" :size="20" /></template>
      </StatsCard>

      <!-- Tasa de ocupación -->
      <StatsCard
        title="Tasa de Ocupación"
        :value="formatPercent(metrics.tasaOcupacion)"
        :loading="loading"
      >
        <template #icon><AppIcon icon="lucide:home" :size="20" /></template>
      </StatsCard>
    </div>

    <!-- ── KPI row 2 (métricas operativas) ── -->
    <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Tasa de cobranza -->
      <StatsCard
        title="Tasa de Cobranza"
        :value="formatPercent(metrics.tasaCobranza)"
        subtitle="mes actual"
        :loading="loading"
      >
        <template #icon><AppIcon icon="lucide:circle-dollar-sign" :size="20" /></template>
      </StatsCard>

      <!-- Clientes activos -->
      <StatsCard
        title="Clientes Activos"
        :value="summary.clientesActivos"
        :loading="loading"
      >
        <template #icon><AppIcon icon="lucide:users" :size="20" /></template>
      </StatsCard>

      <!-- Propiedades sin contrato -->
      <StatsCard
        title="Propiedades Libres"
        :value="summary.propiedadesSinContrato"
        subtitle="sin contrato activo"
        :loading="loading"
      >
        <template #icon><AppIcon icon="lucide:door-open" :size="20" /></template>
      </StatsCard>

      <!-- Contratos renovados -->
      <StatsCard
        title="Renovados este mes"
        :value="metrics.contratosRenovados"
        :loading="loading"
      >
        <template #icon><AppIcon icon="lucide:refresh-cw" :size="20" /></template>
      </StatsCard>
    </div>

    <!-- ── Acciones rápidas ── -->
    <DashboardAccionesRapidas />

    <!-- ── Alertas + Gráfico ── -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <!-- Alertas: 2/5 -->
      <div class="lg:col-span-2">
        <DashboardAlertasList
          :items="expiringItems"
          :loading="expiringQuery.isPending.value"
          :max-visible="6"
        />
      </div>

      <!-- Gráfico: 3/5 -->
      <div class="lg:col-span-3 flex flex-col gap-3">
        <!-- Tabs selector -->
        <BaseTabs v-model="chartMode" :tabs="chartTabs" variant="segmented" class="self-start" />

        <DashboardBarChart
          :data="rentalsByMonth"
          :loading="rentalsByMonthQuery.isPending.value"
          :mode="chartMode"
          :title="`Contratos por Mes — ${currentYear}`"
          class="flex-1"
        />
      </div>
    </div>

    <!-- ── Estado de contratos (donut visual simple) ── -->
    <FormSectionCard
      title="Estado de Contratos"
      dense
    >
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          v-for="i in 4"
          :key="i"
          class="h-16 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-800"
        />
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <!-- Vigentes -->
        <div
          class="flex flex-col items-center p-4 rounded-xl gap-1 bg-success-50 dark:bg-success-500/15"
        >
          <span class="text-2xl font-bold text-success-600 dark:text-success-500">
            {{ contractStatusQuery.data.value?.vigentes ?? 0 }}
          </span>
          <span class="text-xs font-medium text-center text-success-600 dark:text-success-500">
            Vigentes (90+ días)
          </span>
        </div>
        <!-- Por vencer (61-90d) -->
        <div
          class="flex flex-col items-center p-4 rounded-xl gap-1 bg-blue-light-50 dark:bg-blue-light-500/15"
        >
          <span class="text-2xl font-bold text-blue-light-500">
            {{ contractStatusQuery.data.value?.porVencer ?? 0 }}
          </span>
          <span class="text-xs font-medium text-center text-blue-light-500">
            Por Vencer (61-90d)
          </span>
        </div>
        <!-- Próximos (31-60d) -->
        <div
          class="flex flex-col items-center p-4 rounded-xl gap-1 bg-warning-50 dark:bg-warning-500/15"
        >
          <span class="text-2xl font-bold text-warning-600 dark:text-orange-400">
            {{ contractStatusQuery.data.value?.proximos ?? 0 }}
          </span>
          <span class="text-xs font-medium text-center text-warning-600 dark:text-orange-400">
            Próximos (31-60d)
          </span>
        </div>
        <!-- Urgentes (0-30d) -->
        <div
          class="flex flex-col items-center p-4 rounded-xl gap-1 bg-error-50 dark:bg-error-500/15"
        >
          <span class="text-2xl font-bold text-error-500 dark:text-error-400">
            {{ contractStatusQuery.data.value?.urgentes ?? 0 }}
          </span>
          <span class="text-xs font-medium text-center text-error-500 dark:text-error-400">
            Urgentes (0-30d)
          </span>
        </div>
      </div>
    </FormSectionCard>

  </div>
</template>
