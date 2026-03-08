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
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </template>
      </DashboardKpiCard>

      <!-- Vigentes -->
      <DashboardKpiCard
        title="Vigentes"
        :value="stats.vigentes"
        :loading="loading"
        accent="success"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </template>
      </DashboardKpiCard>

      <!-- Por vencer -->
      <DashboardKpiCard
        title="Por Vencer (30 días)"
        :value="stats.porVencer"
        :loading="loading"
        accent="warning"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </template>
      </DashboardKpiCard>

      <!-- Tasa de ocupación -->
      <DashboardKpiCard
        title="Tasa de Ocupación"
        :value="formatPercent(metrics.tasaOcupacion)"
        :loading="loading"
        accent="gold"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </template>
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
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </template>
      </DashboardKpiCard>

      <!-- Clientes activos -->
      <DashboardKpiCard
        title="Clientes Activos"
        :value="summary.clientesActivos"
        :loading="loading"
        accent="primary"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </template>
      </DashboardKpiCard>

      <!-- Propiedades sin contrato -->
      <DashboardKpiCard
        title="Propiedades Libres"
        :value="summary.propiedadesSinContrato"
        subtitle="sin contrato activo"
        :loading="loading"
        accent="warning"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
        </template>
      </DashboardKpiCard>

      <!-- Contratos renovados -->
      <DashboardKpiCard
        title="Renovados este mes"
        :value="metrics.contratosRenovados"
        :loading="loading"
        accent="gold"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </template>
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
