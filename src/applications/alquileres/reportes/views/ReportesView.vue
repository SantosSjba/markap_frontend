<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  StatsCard,
  BaseTabs,
  BaseButton,
  Badge,
  AppIcon,
  ExcelIcon,
} from '@shared/components'
import { useExcelExport } from '@shared/composables'
import {
  useReportsSummary,
  useContractsExpiring,
  usePropertiesWithoutContract,
  useActiveClientsReport,
  useContractStatusSummary,
  useMonthlyMetrics,
  useRentalsByMonth,
} from '../composables'
import { reportesService } from '../services/reportes.service'
import type {
  ContractExpiringItem,
  PropertyWithoutContractItem,
  ActiveClientReportItem,
  RentalsByMonthItem,
} from '../services/reportes.service'

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

const { isExporting, exportToExcel } = useExcelExport()

async function handleExportTab() {
  const now = new Date().toLocaleDateString('es-PE')
  if (activeTab.value === 'contratos-por-vencer') {
    const data = await reportesService.getContractsExpiring(APPLICATION_SLUG, days.value)
    await exportToExcel({
      fileName: `contratos_por_vencer_${now}`,
      sheetName: 'Contratos por Vencer',
      columns: [
        { header: 'Código', key: 'code', width: 14 },
        { header: 'Inquilino', key: 'tenantName', width: 26 },
        { header: 'Propiedad', key: 'propertyAddress', width: 32 },
        { header: 'Propietario', key: 'ownerName', width: 24 },
        { header: 'Vencimiento', key: 'endDate', width: 16 },
        { header: 'Días restantes', key: 'daysLeft', width: 14 },
      ],
      rows: data.map((r: ContractExpiringItem) => ({
        code: r.code,
        tenantName: r.tenantName,
        propertyAddress: r.propertyAddress,
        ownerName: r.ownerName,
        endDate: formatDate(r.endDate),
        daysLeft: r.daysLeft,
      })),
    })
  } else if (activeTab.value === 'sin-contrato') {
    const data = await reportesService.getPropertiesWithoutContract(APPLICATION_SLUG)
    await exportToExcel({
      fileName: `propiedades_sin_contrato_${now}`,
      sheetName: 'Sin Contrato',
      columns: [
        { header: 'Código', key: 'code', width: 14 },
        { header: 'Dirección', key: 'addressLine', width: 36 },
        { header: 'Propietario', key: 'ownerName', width: 26 },
      ],
      rows: data.map((p: PropertyWithoutContractItem) => ({
        code: p.code,
        addressLine: p.addressLine,
        ownerName: p.ownerName,
      })),
    })
  } else if (activeTab.value === 'clientes-activos') {
    const data = await reportesService.getActiveClients(APPLICATION_SLUG)
    await exportToExcel({
      fileName: `clientes_activos_${now}`,
      sheetName: 'Clientes Activos',
      columns: [
        { header: 'Cliente', key: 'fullName', width: 28 },
        { header: 'Contratos activos', key: 'contractsCount', width: 18 },
      ],
      rows: data.map((c: ActiveClientReportItem) => ({
        fullName: c.fullName,
        contractsCount: c.contractsCount,
      })),
    })
  } else if (activeTab.value === 'alquiler-por-mes') {
    const data = await reportesService.getRentalsByMonth(APPLICATION_SLUG, yearFilter.value)
    await exportToExcel({
      fileName: `alquiler_por_mes_${yearFilter.value}_${now}`,
      sheetName: `Alquiler ${yearFilter.value}`,
      columns: [
        { header: 'Mes', key: 'monthName', width: 14 },
        { header: 'Contratos nuevos', key: 'newContracts', width: 18 },
        { header: 'Contratos vencidos', key: 'expiredContracts', width: 20 },
        { header: 'Activos al cierre', key: 'activeAtEndOfMonth', width: 18 },
        { header: 'Ingresos', key: 'totalRevenue', width: 16 },
        { header: 'Moneda', key: 'currency', width: 10 },
      ],
      rows: data.map((r: RentalsByMonthItem) => ({
        monthName: r.monthName,
        newContracts: r.newContracts,
        expiredContracts: r.expiredContracts,
        activeAtEndOfMonth: r.activeAtEndOfMonth,
        totalRevenue: r.totalRevenue,
        currency: r.currency,
      })),
    })
  }
}
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
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <template v-else>
      <!-- Cards resumen -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Contratos por Vencer" :value="stats.contratosPorVencer">
          <template #icon><AppIcon icon="lucide:calendar-clock" :size="20" color="var(--color-primary)" /></template>
        </StatsCard>
        <StatsCard title="Propiedades Sin Contrato" :value="stats.propiedadesSinContrato">
          <template #icon><AppIcon icon="lucide:building-2" :size="20" color="var(--color-primary)" /></template>
        </StatsCard>
        <StatsCard title="Clientes Activos" :value="stats.clientesActivos">
          <template #icon><AppIcon icon="lucide:users" :size="20" color="var(--color-primary)" /></template>
        </StatsCard>
        <StatsCard title="Clientes con Incidencias" :value="stats.clientesConIncidencias">
          <template #icon><AppIcon icon="lucide:triangle-alert" :size="20" color="var(--color-error)" /></template>
        </StatsCard>
      </div>

      <!-- Tabs -->
      <BaseTabs v-model="activeTab" :tabs="reportTabs" />

      <!-- Contenido según pestaña activa -->
      <div
        class="rounded-xl border p-6"
        :style="{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }"
      >
        <!-- Contratos por Vencer -->
        <template v-if="activeTab === 'contratos-por-vencer'">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :style="{ backgroundColor: 'var(--color-primary-light)' }"
            >
                <AppIcon icon="lucide:calendar-clock" :size="20" color="var(--color-primary)" />
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
            <BaseButton variant="outline" :loading="isExporting" @click="handleExportTab">
              <ExcelIcon class="w-5 h-5" />
              Exportar Excel
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
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :style="{ backgroundColor: 'var(--color-primary-light)' }"
            >
              <AppIcon icon="lucide:building-2" :size="20" color="var(--color-primary)" />
            </div>
            <div>
              <h2 class="text-lg font-semibold" style="color: var(--color-text-primary);">Propiedades sin contrato</h2>
              <p class="text-sm" style="color: var(--color-text-secondary);">Propiedades disponibles sin contrato activo</p>
            </div>
          </div>
            <BaseButton variant="outline" :loading="isExporting" @click="handleExportTab">
              <ExcelIcon class="w-5 h-5" />
              Exportar Excel
            </BaseButton>
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
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :style="{ backgroundColor: 'var(--color-primary-light)' }"
            >
              <AppIcon icon="lucide:users" :size="20" color="var(--color-primary)" />
            </div>
            <div>
              <h2 class="text-lg font-semibold" style="color: var(--color-text-primary);">Clientes activos</h2>
              <p class="text-sm" style="color: var(--color-text-secondary);">Inquilinos con al menos un contrato vigente</p>
            </div>
          </div>
            <BaseButton variant="outline" :loading="isExporting" @click="handleExportTab">
              <ExcelIcon class="w-5 h-5" />
              Exportar Excel
            </BaseButton>
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
              :style="{ backgroundColor: 'var(--color-primary-light)' }"
            >
                <AppIcon icon="lucide:bar-chart-2" :size="20" color="var(--color-primary)" />
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
            <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
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
          :style="{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }"
        >
          <div class="flex items-center gap-2 mb-4">
            <AppIcon icon="lucide:clock" :size="20" color="var(--color-text-muted)" />
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
              <div class="flex-1 h-6 rounded-full overflow-hidden" :style="{ backgroundColor: 'var(--color-background)' }">
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
          :style="{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }"
        >
          <div class="flex items-center gap-2 mb-4">
            <AppIcon icon="lucide:trending-up" :size="20" color="var(--color-text-muted)" />
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
