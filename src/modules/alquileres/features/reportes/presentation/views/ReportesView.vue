<script setup lang="ts">
import { ref, computed } from 'vue'
import { FormInput, FormSelect } from '@shared/components'
import type { RentalsByMonthParams } from '../../domain/reportes.types'
import {
  StatsCard,
  BaseTabs,
  BaseButton,
  AppIcon,
  ExcelIcon,
} from '@shared/components'
import { useExcelExport } from '@shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import {
  useReportsSummary,
  useContractsExpiring,
  usePropertiesWithoutContract,
  useActiveClientsReport,
  useContractStatusSummary,
  useMonthlyMetrics,
  useRentalsByMonth,
} from '../../application/useReportes'
import { reportesRepository } from '@modules/alquileres/features/reportes'
import type {
  ContractExpiringItem,
  PropertyWithoutContractItem,
  ActiveClientReportItem,
  RentalsByMonthItem,
} from '../../domain/reportes.types'

const APPLICATION_SLUG = 'alquileres'

const periodFilter = ref(30)
const activeTab = ref('contratos-por-vencer')

// --- Filtros para "Alquiler por mes" ---
type FilterMode = 'year' | 'month' | 'range'
const filterMode = ref<FilterMode>('year')
const yearFilter = ref(new Date().getFullYear())
const monthFilter = ref(new Date().getMonth() + 1)
const startDateFilter = ref('')
const endDateFilter = ref('')

const filterModeOptions = [
  { value: 'year', label: 'Por año completo' },
  { value: 'month', label: 'Mes específico' },
  { value: 'range', label: 'Rango de fechas' },
]

const monthOptions = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

const rentalsByMonthParams = computed<RentalsByMonthParams>(() => {
  if (filterMode.value === 'range') {
    return {
      year: yearFilter.value,
      startDate: startDateFilter.value || undefined,
      endDate: endDateFilter.value || undefined,
    }
  }
  if (filterMode.value === 'month') {
    return { year: yearFilter.value, month: monthFilter.value }
  }
  return { year: yearFilter.value }
})

const reportTabs = [
  { id: 'contratos-por-vencer', label: 'Contratos por Vencer', icon: 'lucide:calendar-clock' },
  { id: 'sin-contrato', label: 'Sin Contrato', icon: 'lucide:building-2' },
  { id: 'clientes-activos', label: 'Clientes Activos', icon: 'lucide:users' },
  { id: 'alquiler-por-mes', label: 'Alquiler por mes', icon: 'lucide:bar-chart-2' },
]

const days = computed(() => Math.min(365, Math.max(1, periodFilter.value)))

const summaryQuery = useReportsSummary(APPLICATION_SLUG, days)
const contractsExpiringQuery = useContractsExpiring(APPLICATION_SLUG, days)
const propertiesWithoutContractQuery = usePropertiesWithoutContract(APPLICATION_SLUG)
const activeClientsQuery = useActiveClientsReport(APPLICATION_SLUG)
const contractStatusQuery = useContractStatusSummary(APPLICATION_SLUG)
const monthlyMetricsQuery = useMonthlyMetrics(APPLICATION_SLUG)
const rentalsByMonthQuery = useRentalsByMonth(APPLICATION_SLUG, rentalsByMonthParams)

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
    const data = await reportesRepository.getContractsExpiring(APPLICATION_SLUG, days.value)
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
    const data = await reportesRepository.getPropertiesWithoutContract(APPLICATION_SLUG)
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
    const data = await reportesRepository.getActiveClients(APPLICATION_SLUG)
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
    const p = rentalsByMonthParams.value
    const data = await reportesRepository.getRentalsByMonth(
      APPLICATION_SLUG,
      p.year ?? yearFilter.value,
      p.month,
      p.startDate,
      p.endDate,
    )
    const fileLabel = filterMode.value === 'range'
      ? `${p.startDate ?? ''}_${p.endDate ?? ''}`
      : filterMode.value === 'month'
        ? `${p.year}_mes${p.month}`
        : String(p.year ?? yearFilter.value)

    await exportToExcel({
      fileName: `alquiler_por_mes_${fileLabel}_${now}`,
      sheetName: 'Alquiler por Mes',
      columns: [
        { header: 'Mes', key: 'monthName', width: 16 },
        { header: 'Ingreso (monto base)', key: 'companyRevenue', width: 22 },
        { header: 'Gastos', key: 'totalExpense', width: 16 },
        { header: 'Impuestos', key: 'totalTax', width: 16 },
        { header: 'Comisión ag. externo', key: 'totalExternalCommission', width: 22 },
        { header: 'Comisión ag. interno', key: 'totalInternalCommission', width: 22 },
        { header: 'Utilidad neta', key: 'totalUtility', width: 18 },
        { header: 'Contratos nuevos', key: 'newContracts', width: 18 },
        { header: 'Activos al cierre', key: 'activeAtEndOfMonth', width: 18 },
        { header: 'Moneda', key: 'currency', width: 10 },
      ],
      rows: data.map((r: RentalsByMonthItem) => ({
        monthName: r.monthName,
        companyRevenue: r.companyRevenue,
        totalExpense: r.totalExpense,
        totalTax: r.totalTax,
        totalExternalCommission: r.totalExternalCommission,
        totalInternalCommission: r.totalInternalCommission,
        totalUtility: r.totalUtility,
        newContracts: r.newContracts,
        activeAtEndOfMonth: r.activeAtEndOfMonth,
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
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <AppIcon icon="lucide:filter" :size="15" color="var(--color-text-muted)" class="shrink-0" />
        <label class="text-sm shrink-0" style="color: var(--color-text-secondary);">Período:</label>
        <FormSelect
          v-model="periodFilter"
          :options="periodOptions"
          class="min-w-[170px]"
        />
      </div>
    </div>

    <!-- Cards resumen (independiente del resto de consultas) -->
    <div v-if="summaryQuery.isPending.value" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="i in 4"
        :key="i"
        class="rounded-xl border h-24 animate-pulse"
        :style="{ backgroundColor: 'var(--color-surface-elevated)', borderColor: 'var(--color-border)' }"
      />
    </div>
    <div
      v-else-if="summaryQuery.isError.value"
      class="rounded-xl border p-6 text-center space-y-3"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <p class="text-sm" style="color: var(--color-error)">{{ getApiErrorMessage(summaryQuery.error.value) }}</p>
      <BaseButton variant="outline" size="sm" @click="() => summaryQuery.refetch()">Reintentar</BaseButton>
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div v-if="contractsExpiringQuery.isPending.value" class="flex justify-center py-12">
            <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
          </div>
          <div
            v-else-if="contractsExpiringQuery.isError.value"
            class="text-center py-10 space-y-3"
          >
            <p class="text-sm" style="color: var(--color-error)">
              {{ getApiErrorMessage(contractsExpiringQuery.error.value) }}
            </p>
            <BaseButton variant="outline" size="sm" @click="() => contractsExpiringQuery.refetch()">Reintentar</BaseButton>
          </div>
          <template v-else>
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
            <div
              v-if="!contratosPorVencerRows.length"
              class="flex flex-col items-center gap-2 py-10"
              style="color: var(--color-text-muted);"
            >
              <AppIcon icon="lucide:calendar-check" :size="40" />
              <p class="text-sm">No hay contratos por vencer en el período seleccionado.</p>
            </div>
          </div>
          </template>
        </template>

        <!-- Sin Contrato -->
        <template v-else-if="activeTab === 'sin-contrato'">
          <div v-if="propertiesWithoutContractQuery.isPending.value" class="flex justify-center py-12">
            <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
          </div>
          <div
            v-else-if="propertiesWithoutContractQuery.isError.value"
            class="text-center py-10 space-y-3"
          >
            <p class="text-sm" style="color: var(--color-error)">
              {{ getApiErrorMessage(propertiesWithoutContractQuery.error.value) }}
            </p>
            <BaseButton variant="outline" size="sm" @click="() => propertiesWithoutContractQuery.refetch()">Reintentar</BaseButton>
          </div>
          <template v-else>
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
            <div
              v-if="!propertiesWithoutContractRows.length"
              class="flex flex-col items-center gap-2 py-10"
              style="color: var(--color-text-muted);"
            >
              <AppIcon icon="lucide:building-2" :size="40" />
              <p class="text-sm">No hay propiedades sin contrato.</p>
            </div>
          </div>
          </template>
        </template>

        <!-- Clientes Activos -->
        <template v-else-if="activeTab === 'clientes-activos'">
          <div v-if="activeClientsQuery.isPending.value" class="flex justify-center py-12">
            <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
          </div>
          <div
            v-else-if="activeClientsQuery.isError.value"
            class="text-center py-10 space-y-3"
          >
            <p class="text-sm" style="color: var(--color-error)">
              {{ getApiErrorMessage(activeClientsQuery.error.value) }}
            </p>
            <BaseButton variant="outline" size="sm" @click="() => activeClientsQuery.refetch()">Reintentar</BaseButton>
          </div>
          <template v-else>
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
            <div
              v-if="!activeClientsRows.length"
              class="flex flex-col items-center gap-2 py-10"
              style="color: var(--color-text-muted);"
            >
              <AppIcon icon="lucide:users" :size="40" />
              <p class="text-sm">No hay clientes activos.</p>
            </div>
          </div>
          </template>
        </template>

        <!-- Alquiler por mes -->
        <template v-else-if="activeTab === 'alquiler-por-mes'">
          <!-- Header -->
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                :style="{ backgroundColor: 'var(--color-primary-light)' }"
              >
                <AppIcon icon="lucide:bar-chart-2" :size="20" color="var(--color-primary)" />
              </div>
              <div>
                <h2 class="text-lg font-semibold" style="color: var(--color-text-primary);">
                  Ingresos por alquileres por mes
                </h2>
                <p class="text-sm" style="color: var(--color-text-secondary);">
                  Contratos nuevos, vencidos, activos y el ingreso único que la empresa recibe al concretar cada alquiler
                </p>
              </div>
            </div>
            <BaseButton variant="outline" :loading="isExporting" @click="handleExportTab">
              <ExcelIcon class="w-5 h-5" />
              Exportar Excel
            </BaseButton>
          </div>

          <!-- Filtros -->
          <div
            class="p-4 rounded-xl mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
            :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
          >
            <!-- Modo de filtro -->
            <FormSelect
              v-model="filterMode"
              label="Modo de filtro"
              :options="filterModeOptions"
            />

            <!-- Año (siempre visible en modos year y month) -->
            <FormSelect
              v-if="filterMode !== 'range'"
              v-model="yearFilter"
              label="Año"
              :options="yearOptions.map(y => ({ value: y, label: String(y) }))"
            />

            <!-- Mes (solo en modo mes específico) -->
            <FormSelect
              v-if="filterMode === 'month'"
              v-model="monthFilter"
              label="Mes"
              :options="monthOptions"
            />

            <!-- Rango de fechas (solo en modo range) -->
            <template v-if="filterMode === 'range'">
              <FormInput
                v-model="startDateFilter"
                type="date"
                label="Fecha inicio"
              />
              <FormInput
                v-model="endDateFilter"
                type="date"
                label="Fecha fin"
              />
            </template>
          </div>

          <div
            v-if="rentalsByMonthQuery.isError.value"
            class="rounded-xl border p-6 text-center space-y-3 mb-5"
            :style="{ backgroundColor: 'var(--color-surface-elevated)', borderColor: 'var(--color-border)' }"
          >
            <p class="text-sm" style="color: var(--color-error)">
              {{ getApiErrorMessage(rentalsByMonthQuery.error.value) }}
            </p>
            <BaseButton variant="outline" size="sm" @click="() => rentalsByMonthQuery.refetch()">Reintentar</BaseButton>
          </div>

          <template v-else>
          <!-- Totales rápidos -->
          <div
            v-if="rentalsByMonthRows.length > 0"
            class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5"
          >
            <div
              class="rounded-xl p-3"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <AppIcon icon="lucide:circle-plus" :size="14" color="var(--color-primary)" />
                <p class="text-xs font-medium" :style="{ color: 'var(--color-text-secondary)' }">Ingreso</p>
              </div>
              <p class="text-base font-bold" :style="{ color: 'var(--color-primary)' }">
                {{ formatCurrency(rentalsByMonthRows.reduce((s, r) => s + r.companyRevenue, 0), rentalsByMonthRows[0]?.currency ?? 'PEN') }}
              </p>
            </div>
            <div
              class="rounded-xl p-3"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <AppIcon icon="lucide:minus-circle" :size="14" color="var(--color-text-muted)" />
                <p class="text-xs font-medium" :style="{ color: 'var(--color-text-secondary)' }">Gastos</p>
              </div>
              <p class="text-base font-bold" :style="{ color: 'var(--color-text-primary)' }">
                − {{ formatCurrency(rentalsByMonthRows.reduce((s, r) => s + r.totalExpense, 0), rentalsByMonthRows[0]?.currency ?? 'PEN') }}
              </p>
            </div>
            <div
              class="rounded-xl p-3"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <AppIcon icon="lucide:receipt" :size="14" color="var(--color-text-muted)" />
                <p class="text-xs font-medium" :style="{ color: 'var(--color-text-secondary)' }">Impuestos</p>
              </div>
              <p class="text-base font-bold" :style="{ color: 'var(--color-text-primary)' }">
                − {{ formatCurrency(rentalsByMonthRows.reduce((s, r) => s + r.totalTax, 0), rentalsByMonthRows[0]?.currency ?? 'PEN') }}
              </p>
            </div>
            <div
              class="rounded-xl p-3"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <AppIcon icon="lucide:user-round-cog" :size="14" color="var(--color-text-muted)" />
                <p class="text-xs font-medium" :style="{ color: 'var(--color-text-secondary)' }">Com. externo</p>
              </div>
              <p class="text-base font-bold" :style="{ color: 'var(--color-text-primary)' }">
                − {{ formatCurrency(rentalsByMonthRows.reduce((s, r) => s + r.totalExternalCommission, 0), rentalsByMonthRows[0]?.currency ?? 'PEN') }}
              </p>
            </div>
            <div
              class="rounded-xl p-3"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <AppIcon icon="lucide:user-check" :size="14" color="var(--color-text-muted)" />
                <p class="text-xs font-medium" :style="{ color: 'var(--color-text-secondary)' }">Com. interno</p>
              </div>
              <p class="text-base font-bold" :style="{ color: 'var(--color-text-primary)' }">
                − {{ formatCurrency(rentalsByMonthRows.reduce((s, r) => s + r.totalInternalCommission, 0), rentalsByMonthRows[0]?.currency ?? 'PEN') }}
              </p>
            </div>
            <div
              class="rounded-xl p-3"
              :style="{ backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary)' }"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <AppIcon icon="lucide:circle-check" :size="14" color="var(--color-primary)" />
                <p class="text-xs font-medium" :style="{ color: 'var(--color-primary)' }">Utilidad neta</p>
              </div>
              <p class="text-base font-bold" :style="{ color: 'var(--color-primary)' }">
                {{ formatCurrency(rentalsByMonthRows.reduce((s, r) => s + r.totalUtility, 0), rentalsByMonthRows[0]?.currency ?? 'PEN') }}
              </p>
            </div>
          </div>

          <div v-if="rentalsByMonthQuery.isPending.value" class="flex justify-center py-12">
            <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr style="border-bottom: 2px solid var(--color-border);">
                  <th class="text-left py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Período</th>
                  <th class="text-right py-3 px-4 font-semibold" :style="{ color: 'var(--color-primary)' }">
                    Ingreso
                    <span class="block text-xs font-normal" :style="{ color: 'var(--color-text-muted)' }">(monto base)</span>
                  </th>
                  <th class="text-right py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Gastos</th>
                  <th class="text-right py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">Impuestos</th>
                  <th class="text-right py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">
                    Comisión
                    <span class="block text-xs font-normal">ag. externo</span>
                  </th>
                  <th class="text-right py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">
                    Comisión
                    <span class="block text-xs font-normal">ag. interno</span>
                  </th>
                  <th class="text-right py-3 px-4 font-semibold" :style="{ color: 'var(--color-primary)' }">
                    Utilidad neta
                    <span class="block text-xs font-normal">(propietario)</span>
                  </th>
                  <th class="text-right py-3 px-4 font-semibold" style="color: var(--color-text-secondary);">
                    Contratos
                    <span class="block text-xs font-normal">nuevos / activos</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in rentalsByMonthRows"
                  :key="`${row.year}-${row.month}`"
                  class="hover:opacity-90 transition-opacity"
                  style="border-bottom: 1px solid var(--color-border);"
                >
                  <td class="py-3 px-4 font-medium" style="color: var(--color-text-primary);">{{ row.monthName }}</td>
                  <td class="py-3 px-4 text-right font-semibold" :style="{ color: 'var(--color-primary)' }">
                    {{ formatCurrency(row.companyRevenue, row.currency) }}
                  </td>
                  <td class="py-3 px-4 text-right" style="color: var(--color-text-secondary);">
                    {{ row.totalExpense > 0 ? `− ${formatCurrency(row.totalExpense, row.currency)}` : `− ${formatCurrency(0, row.currency)}` }}
                  </td>
                  <td class="py-3 px-4 text-right" style="color: var(--color-text-secondary);">
                    {{ row.totalTax > 0 ? `− ${formatCurrency(row.totalTax, row.currency)}` : `− ${formatCurrency(0, row.currency)}` }}
                  </td>
                  <td class="py-3 px-4 text-right" style="color: var(--color-text-secondary);">
                    {{ row.totalExternalCommission > 0 ? `− ${formatCurrency(row.totalExternalCommission, row.currency)}` : `− ${formatCurrency(0, row.currency)}` }}
                  </td>
                  <td class="py-3 px-4 text-right" style="color: var(--color-text-secondary);">
                    {{ row.totalInternalCommission > 0 ? `− ${formatCurrency(row.totalInternalCommission, row.currency)}` : `− ${formatCurrency(0, row.currency)}` }}
                  </td>
                  <td class="py-3 px-4 text-right font-bold" :style="{ color: row.totalUtility >= 0 ? 'var(--color-primary)' : 'var(--color-error)' }">
                    {{ formatCurrency(row.totalUtility, row.currency) }}
                  </td>
                  <td class="py-3 px-4 text-right" style="color: var(--color-text-secondary);">
                    {{ row.newContracts }} / {{ row.activeAtEndOfMonth }}
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="rentalsByMonthRows.length > 1">
                <tr style="border-top: 2px solid var(--color-border);">
                  <td class="py-3 px-4 font-semibold" style="color: var(--color-text-primary);">Total</td>
                  <td class="py-3 px-4 text-right font-bold" :style="{ color: 'var(--color-primary)' }">
                    {{ formatCurrency(rentalsByMonthRows.reduce((s, r) => s + r.companyRevenue, 0), rentalsByMonthRows[0]?.currency ?? 'PEN') }}
                  </td>
                  <td class="py-3 px-4 text-right font-semibold" style="color: var(--color-text-secondary);">
                    − {{ formatCurrency(rentalsByMonthRows.reduce((s, r) => s + r.totalExpense, 0), rentalsByMonthRows[0]?.currency ?? 'PEN') }}
                  </td>
                  <td class="py-3 px-4 text-right font-semibold" style="color: var(--color-text-secondary);">
                    − {{ formatCurrency(rentalsByMonthRows.reduce((s, r) => s + r.totalTax, 0), rentalsByMonthRows[0]?.currency ?? 'PEN') }}
                  </td>
                  <td class="py-3 px-4 text-right font-semibold" style="color: var(--color-text-secondary);">
                    − {{ formatCurrency(rentalsByMonthRows.reduce((s, r) => s + r.totalExternalCommission, 0), rentalsByMonthRows[0]?.currency ?? 'PEN') }}
                  </td>
                  <td class="py-3 px-4 text-right font-semibold" style="color: var(--color-text-secondary);">
                    − {{ formatCurrency(rentalsByMonthRows.reduce((s, r) => s + r.totalInternalCommission, 0), rentalsByMonthRows[0]?.currency ?? 'PEN') }}
                  </td>
                  <td class="py-3 px-4 text-right font-bold" :style="{ color: 'var(--color-primary)' }">
                    {{ formatCurrency(rentalsByMonthRows.reduce((s, r) => s + r.totalUtility, 0), rentalsByMonthRows[0]?.currency ?? 'PEN') }}
                  </td>
                  <td class="py-3 px-4 text-right font-semibold" style="color: var(--color-text-secondary);">
                    {{ rentalsByMonthRows.reduce((s, r) => s + r.newContracts, 0) }} / —
                  </td>
                </tr>
              </tfoot>
            </table>
            <p
              v-if="!rentalsByMonthRows.length && !rentalsByMonthQuery.isPending.value && !rentalsByMonthQuery.isError.value"
              class="py-8 text-center text-sm"
              style="color: var(--color-text-muted);"
            >
              No hay datos para el período seleccionado.
            </p>
          </div>
          </template>

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
          <div v-if="contractStatusQuery.isPending.value" class="flex justify-center py-10">
            <AppIcon icon="svg-spinners:ring-resize" :size="28" color="var(--color-primary)" />
          </div>
          <div
            v-else-if="contractStatusQuery.isError.value"
            class="text-center py-6 space-y-3"
          >
            <p class="text-sm" style="color: var(--color-error)">
              {{ getApiErrorMessage(contractStatusQuery.error.value) }}
            </p>
            <BaseButton variant="outline" size="sm" @click="() => contractStatusQuery.refetch()">Reintentar</BaseButton>
          </div>
          <div v-else class="space-y-4">
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
          <div v-if="monthlyMetricsQuery.isPending.value" class="flex justify-center py-10">
            <AppIcon icon="svg-spinners:ring-resize" :size="28" color="var(--color-primary)" />
          </div>
          <div
            v-else-if="monthlyMetricsQuery.isError.value"
            class="text-center py-6 space-y-3"
          >
            <p class="text-sm" style="color: var(--color-error)">
              {{ getApiErrorMessage(monthlyMetricsQuery.error.value) }}
            </p>
            <BaseButton variant="outline" size="sm" @click="() => monthlyMetricsQuery.refetch()">Reintentar</BaseButton>
          </div>
          <div v-else class="grid grid-cols-2 gap-3">
            <div
              class="rounded-lg p-3"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
            >
              <div class="flex items-center gap-1.5 mb-2">
                <AppIcon icon="lucide:home" :size="15" :color="metricasMes.tasaOcupacion >= 80 ? 'var(--color-success)' : '#f59e0b'" />
                <p class="text-xs font-medium" :style="{ color: 'var(--color-text-muted)' }">Ocupación</p>
              </div>
              <p class="text-2xl font-bold" style="color: var(--color-text-primary);">{{ metricasMes.tasaOcupacion }}%</p>
              <span class="text-xs font-medium" :style="{ color: metricasMes.tasaOcupacion >= 80 ? 'var(--color-success)' : '#f59e0b' }">
                {{ metricasMes.tasaOcupacion >= 80 ? '✓ Bueno' : '⚠ Regular' }}
              </span>
            </div>
            <div
              class="rounded-lg p-3"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
            >
              <div class="flex items-center gap-1.5 mb-2">
                <AppIcon icon="lucide:wallet" :size="15" color="var(--color-primary)" />
                <p class="text-xs font-medium" :style="{ color: 'var(--color-text-muted)' }">Cobranza</p>
              </div>
              <p class="text-2xl font-bold" style="color: var(--color-text-primary);">{{ metricasMes.tasaCobranza }}%</p>
              <span class="text-xs" style="color: var(--color-text-muted);">En desarrollo</span>
            </div>
            <div
              class="rounded-lg p-3"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
            >
              <div class="flex items-center gap-1.5 mb-2">
                <AppIcon icon="lucide:refresh-cw" :size="15" color="#10b981" />
                <p class="text-xs font-medium" :style="{ color: 'var(--color-text-muted)' }">Renovados</p>
              </div>
              <p class="text-2xl font-bold" style="color: var(--color-text-primary);">{{ metricasMes.contratosRenovados }}</p>
              <span class="text-xs" style="color: var(--color-text-muted);">Este mes</span>
            </div>
            <div
              class="rounded-lg p-3"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
            >
              <div class="flex items-center gap-1.5 mb-2">
                <AppIcon icon="lucide:user-plus" :size="15" color="#6366f1" />
                <p class="text-xs font-medium" :style="{ color: 'var(--color-text-muted)' }">Clientes nuevos</p>
              </div>
              <p class="text-2xl font-bold" style="color: var(--color-text-primary);">{{ metricasMes.clientesNuevos }}</p>
              <span class="text-xs" style="color: var(--color-text-muted);">Este mes</span>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>
