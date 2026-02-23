<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  StatsCard,
  BaseTabs,
  BaseButton,
  Badge,
} from '@shared/components'
import {
  useReportsSummary,
  useContractsExpiring,
  usePropertiesWithoutContract,
  useActiveClientsReport,
  useContractStatusSummary,
  useMonthlyMetrics,
  useRentalsByMonth,
} from '../composables'

const APPLICATION_SLUG = 'alquileres'

const periodFilter = ref(30)
const activeTab = ref('contratos-por-vencer')
const yearFilter = ref(new Date().getFullYear())

const reportTabs = [
  { id: 'contratos-por-vencer', label: 'Contratos por Vencer' },
  { id: 'sin-contrato', label: 'Sin Contrato' },
  { id: 'clientes-activos', label: 'Clientes Activos' },
  { id: 'alquiler-por-mes', label: 'Alquiler por mes' },
]

const days = computed(() => Math.min(365, Math.max(1, periodFilter.value)))

const summaryQuery = useReportsSummary(APPLICATION_SLUG, days)
const contractsExpiringQuery = useContractsExpiring(APPLICATION_SLUG, days)
const propertiesWithoutContractQuery = usePropertiesWithoutContract(APPLICATION_SLUG)
const activeClientsQuery = useActiveClientsReport(APPLICATION_SLUG)
const contractStatusQuery = useContractStatusSummary(APPLICATION_SLUG)
const monthlyMetricsQuery = useMonthlyMetrics(APPLICATION_SLUG)
const rentalsByMonthQuery = useRentalsByMonth(APPLICATION_SLUG, yearFilter)

const stats = computed(() => summaryQuery.data.value ?? {
  contratosPorVencer: 0,
  propiedadesSinContrato: 0,
  clientesActivos: 0,
  clientesConIncidencias: 0,
})

const contratosPorVencerRows = computed(() => contractsExpiringQuery.data.value ?? [])
const propertiesWithoutContractRows = computed(() => propertiesWithoutContractQuery.data.value ?? [])
const activeClientsRows = computed(() => activeClientsQuery.data.value ?? [])

const statusSummary = computed(() => contractStatusQuery.data.value ?? {
  vigentes: 0,
  porVencer: 0,
  proximos: 0,
  urgentes: 0,
})

const resumenContratos = computed(() => [
  { label: 'Vigentes (más de 90 días)', value: statusSummary.value.vigentes, color: 'var(--color-success)' },
  { label: 'Por vencer (61-90 días)', value: statusSummary.value.porVencer, color: 'var(--color-surface-elevated)' },
  { label: 'Próximos (31-60 días)', value: statusSummary.value.proximos, color: 'var(--color-warning)' },
  { label: 'Urgentes (0-30 días)', value: statusSummary.value.urgentes, color: 'var(--color-error)' },
])

const totalResumen = computed(() =>
  resumenContratos.value.reduce((acc, r) => acc + r.value, 0)
)

const metricasMes = computed(() => monthlyMetricsQuery.data.value ?? {
  tasaOcupacion: 0,
  tasaCobranza: 0,
  contratosRenovados: 0,
  clientesNuevos: 0,
})

const loading = computed(
  () =>
    summaryQuery.isPending.value ||
    contractsExpiringQuery.isPending.value ||
    propertiesWithoutContractQuery.isPending.value ||
    activeClientsQuery.isPending.value ||
    contractStatusQuery.isPending.value ||
    monthlyMetricsQuery.isPending.value ||
    (activeTab.value === 'alquiler-por-mes' && rentalsByMonthQuery.isPending.value)
)

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const periodOptions = [
  { value: 30, label: 'Próximos 30 días' },
  { value: 60, label: 'Próximos 60 días' },
  { value: 90, label: 'Próximos 90 días' },
]

const rentalsByMonthRows = computed(() => rentalsByMonthQuery.data.value ?? [])

const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  return [current - 2, current - 1, current, current + 1]
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold" style="color: var(--color-text-primary);">
          Reportes
        </h1>
        <p class="text-sm mt-0.5" style="color: var(--color-text-secondary);">
          Análisis y exportación de datos
        </p>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm shrink-0" style="color: var(--color-text-secondary);">Período:</label>
        <select
          v-model="periodFilter"
          class="rounded-lg border px-3 py-2 text-sm min-w-[160px]"
          style="
            border-color: var(--color-border);
            background-color: var(--color-surface);
            color: var(--color-text-primary);
          "
        >
          <option
            v-for="opt in periodOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <svg
        class="animate-spin h-8 w-8"
        style="color: var(--color-primary);"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <template v-else>
      <!-- Cards resumen -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Contratos por Vencer" :value="stats.contratosPorVencer">
          <template #icon>
            <svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </template>
        </StatsCard>
        <StatsCard title="Propiedades Sin Contrato" :value="stats.propiedadesSinContrato">
          <template #icon>
            <svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </template>
        </StatsCard>
        <StatsCard title="Clientes Activos" :value="stats.clientesActivos">
          <template #icon>
            <svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </template>
        </StatsCard>
        <StatsCard title="Clientes con Incidencias" :value="stats.clientesConIncidencias">
          <template #icon>
            <svg class="w-5 h-5" style="color: var(--color-error);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </template>
        </StatsCard>
      </div>

      <!-- Tabs -->
      <BaseTabs v-model="activeTab" :tabs="reportTabs" />

      <!-- Contenido según pestaña activa -->
      <div
        class="rounded-xl border p-6"
        style="
          backgroundColor: var(--color-surface);
          borderColor: var(--color-border);
        "
      >
        <!-- Contratos por Vencer -->
        <template v-if="activeTab === 'contratos-por-vencer'">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                style="backgroundColor: var(--color-primary-light);"
              >
                <svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold" style="color: var(--color-text-primary);">
                  Contratos por Vencer
                </h2>
                <p class="text-sm" style="color: var(--color-text-secondary);">
                  Contratos que vencen en los próximos {{ periodFilter }} días
                </p>
              </div>
            </div>
            <BaseButton variant="outline" disabled title="En desarrollo">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar Excel <span class="opacity-70 text-xs ml-1">(en desarrollo)</span>
            </BaseButton>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr style="border-bottom: 1px solid var(--color-border);">
                  <th class="text-left py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Contrato</th>
                  <th class="text-left py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Inquilino</th>
                  <th class="text-left py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Propiedad</th>
                  <th class="text-left py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Propietario</th>
                  <th class="text-left py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Vencimiento</th>
                  <th class="text-left py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Días</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in contratosPorVencerRows"
                  :key="row.id"
                  style="border-bottom: 1px solid var(--color-border);"
                >
                  <td class="py-3 px-4 font-medium" style="color: var(--color-text-primary);">{{ row.code }}</td>
                  <td class="py-3 px-4" style="color: var(--color-text-primary);">{{ row.tenantName }}</td>
                  <td class="py-3 px-4" style="color: var(--color-text-primary);">{{ row.propertyAddress }}</td>
                  <td class="py-3 px-4" style="color: var(--color-text-primary);">{{ row.ownerName }}</td>
                  <td class="py-3 px-4" style="color: var(--color-text-primary);">{{ formatDate(row.endDate) }}</td>
                  <td class="py-3 px-4">
                    <Badge variant="error">{{ row.daysLeft }} días</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
            <p
              v-if="!contratosPorVencerRows.length"
              class="py-8 text-center text-sm"
              style="color: var(--color-text-muted);"
            >
              No hay contratos por vencer en el período seleccionado.
            </p>
          </div>
        </template>

        <!-- Sin Contrato -->
        <template v-else-if="activeTab === 'sin-contrato'">
          <div class="flex items-center gap-3 mb-6">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              style="backgroundColor: var(--color-primary-light);"
            >
              <svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold" style="color: var(--color-text-primary);">Propiedades sin contrato</h2>
              <p class="text-sm" style="color: var(--color-text-secondary);">Propiedades disponibles sin contrato activo</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr style="border-bottom: 1px solid var(--color-border);">
                  <th class="text-left py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Código</th>
                  <th class="text-left py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Dirección</th>
                  <th class="text-left py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Propietario</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in propertiesWithoutContractRows"
                  :key="row.id"
                  style="border-bottom: 1px solid var(--color-border);"
                >
                  <td class="py-3 px-4 font-medium" style="color: var(--color-text-primary);">{{ row.code }}</td>
                  <td class="py-3 px-4" style="color: var(--color-text-primary);">{{ row.addressLine }}</td>
                  <td class="py-3 px-4" style="color: var(--color-text-primary);">{{ row.ownerName }}</td>
                </tr>
              </tbody>
            </table>
            <p
              v-if="!propertiesWithoutContractRows.length"
              class="py-8 text-center text-sm"
              style="color: var(--color-text-muted);"
            >
              No hay propiedades sin contrato.
            </p>
          </div>
        </template>

        <!-- Clientes Activos -->
        <template v-else-if="activeTab === 'clientes-activos'">
          <div class="flex items-center gap-3 mb-6">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              style="backgroundColor: var(--color-primary-light);"
            >
              <svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold" style="color: var(--color-text-primary);">Clientes activos</h2>
              <p class="text-sm" style="color: var(--color-text-secondary);">Inquilinos con al menos un contrato vigente</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr style="border-bottom: 1px solid var(--color-border);">
                  <th class="text-left py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Cliente</th>
                  <th class="text-left py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Contratos activos</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in activeClientsRows"
                  :key="row.id"
                  style="border-bottom: 1px solid var(--color-border);"
                >
                  <td class="py-3 px-4 font-medium" style="color: var(--color-text-primary);">{{ row.fullName }}</td>
                  <td class="py-3 px-4" style="color: var(--color-text-primary);">{{ row.contractsCount }}</td>
                </tr>
              </tbody>
            </table>
            <p
              v-if="!activeClientsRows.length"
              class="py-8 text-center text-sm"
              style="color: var(--color-text-muted);"
            >
              No hay clientes activos.
            </p>
          </div>
        </template>

        <!-- Alquiler por mes -->
        <template v-else-if="activeTab === 'alquiler-por-mes'">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                style="backgroundColor: var(--color-primary-light);"
              >
                <svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold" style="color: var(--color-text-primary);">
                  Alquiler por mes
                </h2>
                <p class="text-sm" style="color: var(--color-text-secondary);">
                  Contratos nuevos, vencidos, activos al cierre e ingresos por mes
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm shrink-0" style="color: var(--color-text-secondary);">Año:</label>
              <select
                v-model.number="yearFilter"
                class="rounded-lg border px-3 py-2 text-sm min-w-[100px]"
                style="
                  border-color: var(--color-border);
                  background-color: var(--color-surface);
                  color: var(--color-text-primary);
                "
              >
                <option v-for="y in yearOptions" :key="y" :value="y">
                  {{ y }}
                </option>
              </select>
            </div>
          </div>
          <div v-if="rentalsByMonthQuery.isPending.value" class="flex justify-center py-12">
            <svg
              class="animate-spin h-8 w-8"
              style="color: var(--color-primary);"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr style="border-bottom: 1px solid var(--color-border);">
                  <th class="text-left py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Mes</th>
                  <th class="text-right py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Contratos nuevos</th>
                  <th class="text-right py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Contratos vencidos</th>
                  <th class="text-right py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Activos al cierre</th>
                  <th class="text-right py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Ingresos del mes</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in rentalsByMonthRows"
                  :key="`${row.year}-${row.month}`"
                  style="border-bottom: 1px solid var(--color-border);"
                >
                  <td class="py-3 px-4 font-medium" style="color: var(--color-text-primary);">{{ row.monthName }}</td>
                  <td class="py-3 px-4 text-right" style="color: var(--color-text-primary);">{{ row.newContracts }}</td>
                  <td class="py-3 px-4 text-right" style="color: var(--color-text-primary);">{{ row.expiredContracts }}</td>
                  <td class="py-3 px-4 text-right" style="color: var(--color-text-primary);">{{ row.activeAtEndOfMonth }}</td>
                  <td class="py-3 px-4 text-right font-medium" style="color: var(--color-text-primary);">
                    {{ formatCurrency(row.totalRevenue, row.currency) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>

      <!-- Paneles inferiores -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Resumen de Estado de Contratos -->
        <div
          class="rounded-xl border p-6"
          style="
            backgroundColor: var(--color-surface);
            borderColor: var(--color-border);
          "
        >
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-5 h-5" style="color: var(--color-text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-base font-semibold" style="color: var(--color-text-primary);">
              Resumen de Estado de Contratos
            </h3>
          </div>
          <div class="space-y-4">
            <div
              v-for="(item, i) in resumenContratos"
              :key="i"
              class="flex items-center gap-3"
            >
              <span class="text-sm w-40 shrink-0" style="color: var(--color-text-secondary);">
                {{ item.label }}
              </span>
              <div class="flex-1 h-6 rounded-full overflow-hidden" style="backgroundColor: var(--color-surface-elevated);">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :style="{
                    width: totalResumen ? `${(item.value / totalResumen) * 100}%` : '0%',
                    backgroundColor: item.color,
                  }"
                />
              </div>
              <span class="text-sm font-medium w-8 text-right" style="color: var(--color-text-primary);">
                {{ item.value }}
              </span>
            </div>
          </div>
        </div>

        <!-- Métricas del Mes -->
        <div
          class="rounded-xl border p-6"
          style="
            backgroundColor: var(--color-surface);
            borderColor: var(--color-border);
          "
        >
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-5 h-5" style="color: var(--color-text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h3 class="text-base font-semibold" style="color: var(--color-text-primary);">
              Métricas del Mes
            </h3>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-2xl font-bold" style="color: var(--color-text-primary);">{{ metricasMes.tasaOcupacion }}%</p>
              <p class="text-sm" style="color: var(--color-text-secondary);">Tasa de ocupación</p>
              <span class="text-xs" :style="{ color: metricasMes.tasaOcupacion >= 80 ? 'var(--color-success)' : 'var(--color-warning)' }">
                {{ metricasMes.tasaOcupacion >= 80 ? 'Bueno' : 'Regular' }}
              </span>
            </div>
            <div>
              <p class="text-2xl font-bold" style="color: var(--color-text-primary);">{{ metricasMes.tasaCobranza }}%</p>
              <p class="text-sm" style="color: var(--color-text-secondary);">Tasa de cobranza</p>
              <span class="text-xs" style="color: var(--color-text-muted);">En desarrollo</span>
            </div>
            <div>
              <p class="text-2xl font-bold" style="color: var(--color-text-primary);">{{ metricasMes.contratosRenovados }}</p>
              <p class="text-sm" style="color: var(--color-text-secondary);">Contratos renovados</p>
              <span class="text-xs" style="color: var(--color-text-muted);">Este mes</span>
            </div>
            <div>
              <p class="text-2xl font-bold" style="color: var(--color-text-primary);">{{ metricasMes.clientesNuevos }}</p>
              <p class="text-sm" style="color: var(--color-text-secondary);">Clientes nuevos</p>
              <span class="text-xs" style="color: var(--color-text-muted);">Este mes</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
