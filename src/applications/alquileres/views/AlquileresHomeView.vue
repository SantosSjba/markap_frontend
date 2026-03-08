<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@features/auth/stores'
import { useRentalStats } from '../composables/useRentals'
import {
  useReportsSummary,
  useContractsExpiring,
  useContractStatusSummary,
  useMonthlyMetrics,
  useRentalsByMonth,
} from '@applications/alquileres/reportes/composables'

import DashboardKpiCard from './components/DashboardKpiCard.vue'
import DashboardAlertasList from './components/DashboardAlertasList.vue'
import DashboardBarChart from './components/DashboardBarChart.vue'
import DashboardAccionesRapidas from './components/DashboardAccionesRapidas.vue'
import AppIcon from '@shared/components/ui/AppIcon.vue'

const authStore = useAuthStore()
const currentYear = ref(new Date().getFullYear())

const rentalStatsQuery = useRentalStats()
const summaryQuery = useReportsSummary()
const expiringQuery = useContractsExpiring('alquileres', 30)
const contractStatusQuery = useContractStatusSummary()
const monthlyMetricsQuery = useMonthlyMetrics()
const rentalsByMonthQuery = useRentalsByMonth('alquileres', currentYear)

const loading = computed(
  () =>
    rentalStatsQuery.isPending.value ||
    summaryQuery.isPending.value ||
    expiringQuery.isPending.value ||
    contractStatusQuery.isPending.value ||
    monthlyMetricsQuery.isPending.value
)

const stats = computed(() => rentalStatsQuery.data.value ?? { total: 0, vigentes: 0, porVencer: 0, vencidos: 0 })
const summary = computed(() => summaryQuery.data.value ?? { contratosPorVencer: 0, propiedadesSinContrato: 0, clientesActivos: 0, clientesConIncidencias: 0 })
const metrics = computed(() => monthlyMetricsQuery.data.value ?? { tasaOcupacion: 0, tasaCobranza: 0, contratosRenovados: 0, clientesNuevos: 0 })
const expiringItems = computed(() => expiringQuery.data.value ?? [])
const rentalsByMonth = computed(() => rentalsByMonthQuery.data.value ?? [])

const greetingHour = new Date().getHours()
const greeting = greetingHour < 12 ? 'Buenos días' : greetingHour < 19 ? 'Buenas tardes' : 'Buenas noches'
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
  <div class="space-y-6 animate-fade-in">

    <!-- ── Greeting header ── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          {{ greeting }}, {{ firstName }} 👋
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Resumen de tu cartera de alquileres
        </p>
      </div>

      <!-- Fecha -->
      <p class="text-sm shrink-0" :style="{ color: 'var(--color-text-muted)' }">
        {{
          new Date().toLocaleDateString('es-PE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        }}
      </p>
    </div>

    <!-- ── KPI row ── -->
    <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Contratos totales -->
      <DashboardKpiCard
        title="Contratos Totales"
        :value="stats.total"
        :loading="loading"
        accent="primary"
      >
        <template #icon><AppIcon icon="lucide:file-text" :size="20" /></template>
      </DashboardKpiCard>

      <!-- Vigentes -->
      <DashboardKpiCard
        title="Vigentes"
        :value="stats.vigentes"
        :loading="loading"
        accent="success"
      >
        <template #icon><AppIcon icon="lucide:circle-check" :size="20" /></template>
      </DashboardKpiCard>

      <!-- Por vencer -->
      <DashboardKpiCard
        title="Por Vencer (30 días)"
        :value="stats.porVencer"
        :loading="loading"
        accent="warning"
      >
        <template #icon><AppIcon icon="lucide:triangle-alert" :size="20" /></template>
      </DashboardKpiCard>

      <!-- Tasa de ocupación -->
      <DashboardKpiCard
        title="Tasa de Ocupación"
        :value="formatPercent(metrics.tasaOcupacion)"
        :loading="loading"
        accent="gold"
      >
        <template #icon><AppIcon icon="lucide:home" :size="20" /></template>
      </DashboardKpiCard>
    </div>

    <!-- ── KPI row 2 (métricas operativas) ── -->
    <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Tasa de cobranza -->
      <DashboardKpiCard
        title="Tasa de Cobranza"
        :value="formatPercent(metrics.tasaCobranza)"
        subtitle="mes actual"
        :loading="loading"
        accent="success"
      >
        <template #icon><AppIcon icon="lucide:circle-dollar-sign" :size="20" /></template>
      </DashboardKpiCard>

      <!-- Clientes activos -->
      <DashboardKpiCard
        title="Clientes Activos"
        :value="summary.clientesActivos"
        :loading="loading"
        accent="primary"
      >
        <template #icon><AppIcon icon="lucide:users" :size="20" /></template>
      </DashboardKpiCard>

      <!-- Propiedades sin contrato -->
      <DashboardKpiCard
        title="Propiedades Libres"
        :value="summary.propiedadesSinContrato"
        subtitle="sin contrato activo"
        :loading="loading"
        accent="warning"
      >
        <template #icon><AppIcon icon="lucide:door-open" :size="20" /></template>
      </DashboardKpiCard>

      <!-- Contratos renovados -->
      <DashboardKpiCard
        title="Renovados este mes"
        :value="metrics.contratosRenovados"
        :loading="loading"
        accent="gold"
      >
        <template #icon><AppIcon icon="lucide:refresh-cw" :size="20" /></template>
      </DashboardKpiCard>
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
        <div class="flex items-center gap-1 p-1 rounded-lg self-start" :style="{ backgroundColor: 'var(--color-background)' }">
          <button
            v-for="tab in chartTabs"
            :key="tab.id"
            class="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
            :style="{
              backgroundColor: chartMode === tab.id ? 'var(--color-surface)' : 'transparent',
              color: chartMode === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              boxShadow: chartMode === tab.id ? 'var(--shadow-sm)' : 'none',
            }"
            @click="chartMode = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

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
    <div
      class="rounded-xl border p-5"
      :style="{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }"
    >
      <h3 class="text-sm font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">
        Estado de Contratos
      </h3>
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          v-for="i in 4"
          :key="i"
          class="h-16 rounded-lg animate-pulse"
          :style="{ backgroundColor: 'var(--color-border)' }"
        />
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <!-- Vigentes -->
        <div
          class="flex flex-col items-center p-4 rounded-xl gap-1"
          :style="{ backgroundColor: 'var(--color-success-light)' }"
        >
          <span class="text-2xl font-bold" :style="{ color: 'var(--color-success)' }">
            {{ contractStatusQuery.data.value?.vigentes ?? 0 }}
          </span>
          <span class="text-xs font-medium text-center" :style="{ color: 'var(--color-success)' }">
            Vigentes (90+ días)
          </span>
        </div>
        <!-- Por vencer (61-90d) -->
        <div
          class="flex flex-col items-center p-4 rounded-xl gap-1"
          :style="{ backgroundColor: 'var(--color-info-light, #EFF6FF)' }"
        >
          <span class="text-2xl font-bold" :style="{ color: 'var(--color-info, #3B82F6)' }">
            {{ contractStatusQuery.data.value?.porVencer ?? 0 }}
          </span>
          <span class="text-xs font-medium text-center" :style="{ color: 'var(--color-info, #3B82F6)' }">
            Por Vencer (61-90d)
          </span>
        </div>
        <!-- Próximos (31-60d) -->
        <div
          class="flex flex-col items-center p-4 rounded-xl gap-1"
          :style="{ backgroundColor: 'var(--color-warning-light)' }"
        >
          <span class="text-2xl font-bold" :style="{ color: 'var(--color-warning)' }">
            {{ contractStatusQuery.data.value?.proximos ?? 0 }}
          </span>
          <span class="text-xs font-medium text-center" :style="{ color: '#92600E' }">
            Próximos (31-60d)
          </span>
        </div>
        <!-- Urgentes (0-30d) -->
        <div
          class="flex flex-col items-center p-4 rounded-xl gap-1"
          :style="{ backgroundColor: 'var(--color-error-light)' }"
        >
          <span class="text-2xl font-bold" :style="{ color: 'var(--color-error)' }">
            {{ contractStatusQuery.data.value?.urgentes ?? 0 }}
          </span>
          <span class="text-xs font-medium text-center" :style="{ color: 'var(--color-error)' }">
            Urgentes (0-30d)
          </span>
        </div>
      </div>
    </div>

  </div>
</template>
