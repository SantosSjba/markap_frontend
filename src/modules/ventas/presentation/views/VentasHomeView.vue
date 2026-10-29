<script setup lang="ts">
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { computed, ref } from 'vue'
import { useAuthStore } from '@modules/auth/presentation/stores/auth.store'
import {
  useVentasConversionReport,
  useVentasFinancialFlowReport,
  useVentasSalesByPeriodReport,
} from '../../features/ventas-reportes/presentation/composables/useVentasReportes'
import { useVentasCommissionsList } from '../../features/ventas-finanzas/presentation/composables/useVentasFinanzas'
import { useVentasProcessesList } from '../../features/ventas-sales/presentation/composables/useVentasSales'
import { useVentasPropertyStats } from '../../features/propiedades/presentation/composables/useVentasProperties'
import { useVentasClientStats } from '../../features/clientes/presentation/composables/useVentasClients'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatCurrency, formatDate, toCalendarDateString } from '@shared/utils/formatters'
import QuickActionsBar from '@shared/presentation/components/dashboard/QuickActionsBar.vue'
import type { QuickAction } from '@shared/presentation/components/dashboard/quick-actions.types'
import DashboardProcesosList from '../components/DashboardProcesosList.vue'
import DashboardBarChart from '../components/DashboardBarChart.vue'
import DashboardEmbudo from '../components/DashboardEmbudo.vue'
import DashboardFlujoMes from '../components/DashboardFlujoMes.vue'
import DashboardResumenAnio from '../components/DashboardResumenAnio.vue'
/**
 * Dashboard de Ventas: misma estructura que el de Alquileres —
 * accesos rápidos, KPIs compactos, procesos en curso + ventas por mes, y embudo / flujo / año.
 */

const silentReportOpts = { toastOnLoadError: false as const }
const authStore = useAuthStore()

const now = new Date()
const currentYear = now.getFullYear()
const currentMonthKey = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`

const monthRange = ref({
  startDate: toCalendarDateString(new Date(currentYear, now.getMonth(), 1)),
  endDate: toCalendarDateString(now),
})
const yearRange = ref({ startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31` })
const yearSalesParams = computed(() => ({ ...yearRange.value, granularity: 'month' }))

const conversionQuery = useVentasConversionReport(monthRange, silentReportOpts)
const yearConversionQuery = useVentasConversionReport(yearRange, silentReportOpts)
const financialQuery = useVentasFinancialFlowReport(monthRange, silentReportOpts)
const yearSalesQuery = useVentasSalesByPeriodReport(yearSalesParams, silentReportOpts)
const propertyStatsQuery = useVentasPropertyStats()
const clientStatsQuery = useVentasClientStats()
// Procesos activos con movimiento más reciente (el backend los ordena por última actualización)
const processesQuery = useVentasProcessesList(ref({ page: 1, limit: 4, status: 'ACTIVE' }))
// Comisiones de agentes por pagar: solo se usa el total
const pendingCommissionsQuery = useVentasCommissionsList(ref({ page: 1, limit: 1, status: 'PENDING' }))
const partialCommissionsQuery = useVentasCommissionsList(ref({ page: 1, limit: 1, status: 'PARTIAL' }))

const conv = computed(() => conversionQuery.data.value)
const yearSales = computed(() => yearSalesQuery.data.value ?? [])
const propertyStats = computed(() => propertyStatsQuery.data.value)
const clientStats = computed(() => clientStatsQuery.data.value)
const pendingCommissions = computed(() => pendingCommissionsQuery.data.value?.total ?? 0)
const partialCommissions = computed(() => partialCommissionsQuery.data.value?.total ?? 0)

const pipelineTotal = computed(() =>
  Object.values(conv.value?.activePipelineByStage ?? {}).reduce((a, b) => a + b, 0),
)
const monthSales = computed(() => yearSales.value.find((r) => r.period === currentMonthKey))
const prospects = computed(() => (clientStats.value?.prospects ?? 0) + (clientStats.value?.interested ?? 0))

const kpiLoading = computed(() => conversionQuery.isPending.value)

const greetingHour = now.getHours()
const greeting =
  greetingHour < 12 ? 'Buenos días' : greetingHour < 19 ? 'Buenas tardes' : 'Buenas noches'
const firstName = computed(() => authStore.user?.firstName ?? 'Usuario')

type ChartMode = 'closingsCount' | 'totalAmount'
const chartMode = ref<ChartMode>('closingsCount')
const chartTabs: { id: ChartMode; label: string }[] = [
  { id: 'closingsCount', label: 'Cierres' },
  { id: 'totalAmount', label: 'Volumen' },
]

const quickActions: QuickAction[] = [
  { id: 'nuevo-proceso', label: 'Nuevo Proceso', route: { name: 'ventas-procesos-nuevo' }, icon: 'lucide:plus', primary: true },
  { id: 'pipeline', label: 'Pipeline', route: { name: 'ventas-procesos-pipeline' }, icon: 'lucide:columns-3' },
  { id: 'procesos', label: 'Procesos', route: { name: 'ventas-procesos' }, icon: 'lucide:handshake' },
  { id: 'clientes', label: 'Clientes', route: { name: 'ventas-clientes' }, icon: 'lucide:users' },
  { id: 'propiedades', label: 'Propiedades', route: { name: 'ventas-propiedades' }, icon: 'lucide:building-2' },
  { id: 'comisiones', label: 'Comisiones', route: { name: 'ventas-comisiones' }, icon: 'lucide:wallet' },
  { id: 'reportes', label: 'Reportes', route: { name: 'ventas-reportes' }, icon: 'lucide:bar-chart-3' },
]
</script>

<template>
  <div class="space-y-4">

    <!-- ── Greeting header ── -->
    <PageHeader :title="`${greeting}, ${firstName} 👋`" subtitle="Resumen de tus ventas, embudo y comisiones">
      <template #actions>
        <p class="text-sm shrink-0 text-gray-400 dark:text-gray-500">
          {{ formatDate(now, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}
        </p>
      </template>
    </PageHeader>

    <!-- ── Acciones rápidas ── -->
    <QuickActionsBar :actions="quickActions" />

    <!-- ── KPIs (compactos) ── -->
    <BaseCard v-if="conversionQuery.isError.value" class="block text-center space-y-3">
      <p class="text-sm text-error-500 dark:text-error-400">{{ getApiErrorMessage(conversionQuery.error.value) }}</p>
      <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => conversionQuery.refetch()">
        Reintentar
      </BaseButton>
    </BaseCard>
    <div v-else class="grid grid-cols-2 xl:grid-cols-4 gap-3">
      <StatsCard
        compact
        title="Procesos Activos"
        :value="pipelineTotal"
        :subtitle="conv && conv.opportunitiesCreated > 0 ? `+${conv.opportunitiesCreated} nuevos este mes` : 'en el embudo'"
        :loading="kpiLoading"
      >
        <template #icon><AppIcon icon="lucide:git-branch" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Separaciones"
        :value="conv?.separationsCreated ?? 0"
        subtitle="este mes"
        :loading="kpiLoading"
      >
        <template #icon><AppIcon icon="lucide:bookmark" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Cierres del Mes"
        :value="conv?.closingsCount ?? 0"
        :subtitle="monthSales ? `${formatCurrency(monthSales.totalAmount, 'PEN')} vendidos` : undefined"
        :loading="kpiLoading"
      >
        <template #icon><AppIcon icon="lucide:circle-check" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Tasa de Conversión"
        :value="`${Math.round(conv?.conversionRatePercent ?? 0)}%`"
        :subtitle="`${conv?.opportunitiesWon ?? 0} ganadas · ${conv?.opportunitiesLost ?? 0} perdidas`"
        :loading="kpiLoading"
      >
        <template #icon><AppIcon icon="lucide:percent" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Propiedades Disponibles"
        :value="propertyStats?.available ?? 0"
        :subtitle="`${propertyStats?.reserved ?? 0} reservadas`"
        :loading="propertyStatsQuery.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:building-2" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Propiedades Vendidas"
        :value="propertyStats?.sold ?? 0"
        :subtitle="`de ${propertyStats?.total ?? 0} en cartera`"
        :loading="propertyStatsQuery.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:key-round" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Prospectos"
        :value="prospects"
        :subtitle="`${clientStats?.salesClients ?? 0} ya son clientes`"
        :loading="clientStatsQuery.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:users" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Comisiones por Pagar"
        :value="pendingCommissions + partialCommissions"
        :subtitle="partialCommissions > 0 ? `${partialCommissions} pagadas en parte` : 'a agentes'"
        :loading="pendingCommissionsQuery.isPending.value || partialCommissionsQuery.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:wallet" :size="20" /></template>
      </StatsCard>
    </div>

    <!-- ── Procesos + Gráfico ── -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div class="lg:col-span-2">
        <DashboardProcesosList
          :items="processesQuery.data.value?.data ?? []"
          :total="processesQuery.data.value?.total ?? 0"
          :loading="processesQuery.isPending.value"
          :max-visible="4"
          class="h-full"
        />
      </div>

      <div class="lg:col-span-3">
        <DashboardBarChart
          :data="yearSales"
          :year="currentYear"
          :loading="yearSalesQuery.isPending.value"
          :mode="chartMode"
          :title="`Ventas por Mes — ${currentYear}`"
          class="h-full"
        >
          <template #actions>
            <BaseTabs v-model="chartMode" :tabs="chartTabs" variant="segmented" />
          </template>
        </DashboardBarChart>
      </div>
    </div>

    <!-- ── Embudo, flujo y resultados del año ── -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <DashboardEmbudo :by-stage="conv?.activePipelineByStage" :loading="kpiLoading" />
      <DashboardFlujoMes :data="financialQuery.data.value" :loading="financialQuery.isPending.value" />
      <DashboardResumenAnio
        :year="currentYear"
        :sales="yearSales"
        :conversion="yearConversionQuery.data.value"
        :loading="yearSalesQuery.isPending.value || yearConversionQuery.isPending.value"
        class="md:col-span-2 xl:col-span-1"
      />
    </div>

  </div>
</template>
