<script setup lang="ts">
import { ref, computed } from 'vue'
import * as yup from 'yup'
import {
  StatsCard,
  BaseTabs,
  BaseButton,
  AppIcon,
  ExcelIcon,
  DataTable,
  FormInput,
  FormSelect,
} from '@shared/components'
import { useForm, toTypedSchema } from '@shared/forms'
import { useExcelExport } from '@shared/composables'
import { markapAlert } from '@/shared/alert'
import {
  useVentasSalesByPeriodReport,
  useVentasAgentPerformanceReport,
  useVentasConversionReport,
  useVentasFinancialFlowReport,
} from '../composables/useVentasReportes'
import type {
  VentasSalesByPeriodRow,
  VentasAgentPerformanceRow,
} from '../services/ventasReportes.service'

const PIPELINE_LABEL: Record<string, string> = {
  PROSPECT: 'Prospecto',
  VISIT: 'Visita',
  NEGOTIATION: 'Negociación',
  SEPARATION: 'Separación',
  CLOSING: 'Cierre',
}

function defaultRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 89)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

const filterSchema = toTypedSchema(
  yup.object({
    startDate: yup.string().required('Desde es requerido'),
    endDate: yup.string().required('Hasta es requerido'),
    granularity: yup.string().oneOf(['day', 'week', 'month']).required(),
  }),
)

const { handleSubmit, errors, defineComponentBinds } = useForm({
  validationSchema: filterSchema,
  initialValues: {
    ...defaultRange(),
    granularity: 'month',
  },
})

const filterBinds = {
  startDate: defineComponentBinds('startDate'),
  endDate: defineComponentBinds('endDate'),
  granularity: defineComponentBinds('granularity'),
}

const applied = ref({ ...defaultRange(), granularity: 'month' })

const rangeForReports = computed(() => ({
  startDate: applied.value.startDate,
  endDate: applied.value.endDate,
}))

const salesParams = computed(() => ({
  startDate: applied.value.startDate,
  endDate: applied.value.endDate,
  granularity: applied.value.granularity,
}))

const salesQuery = useVentasSalesByPeriodReport(salesParams)
const agentsQuery = useVentasAgentPerformanceReport(rangeForReports)
const conversionQuery = useVentasConversionReport(rangeForReports)
const financialQuery = useVentasFinancialFlowReport(rangeForReports)

const applyFilters = handleSubmit((v) => {
  applied.value = {
    startDate: v.startDate,
    endDate: v.endDate,
    granularity: v.granularity,
  }
})

const activeTab = ref('ventas-periodo')

const reportTabs = [
  { id: 'ventas-periodo', label: 'Ventas por periodo', icon: 'lucide:trending-up' },
  { id: 'asesores', label: 'Rendimiento asesores', icon: 'lucide:user-check' },
  { id: 'conversion', label: 'Conversión', icon: 'lucide:git-branch' },
  { id: 'flujo', label: 'Flujo financiero', icon: 'lucide:wallet' },
]

const granularityOptions = [
  { value: 'month', label: 'Por mes' },
  { value: 'week', label: 'Por semana (inicio ISO)' },
  { value: 'day', label: 'Por día' },
]

const salesRows = computed(() => salesQuery.data.value ?? [])
const agentRows = computed(() => agentsQuery.data.value ?? [])
const conversion = computed(() => conversionQuery.data.value)
const financial = computed(() => financialQuery.data.value)

const salesColumns = [
  { key: 'p', label: 'Periodo', sortAccessor: (r: unknown) => (r as VentasSalesByPeriodRow).period },
  { key: 'n', label: 'Cierres', sortAccessor: (r: unknown) => (r as VentasSalesByPeriodRow).closingsCount },
  { key: 't', label: 'Monto total (S/)', sortAccessor: (r: unknown) => (r as VentasSalesByPeriodRow).totalAmount },
]

const agentColumns = [
  { key: 'a', label: 'Asesor', sortAccessor: (r: unknown) => (r as VentasAgentPerformanceRow).agentName },
  { key: 'c', label: 'Cierres', sortAccessor: (r: unknown) => (r as VentasAgentPerformanceRow).closingsCount },
  { key: 's', label: 'Volumen (S/)', sortAccessor: (r: unknown) => (r as VentasAgentPerformanceRow).totalSales },
  {
    key: 'm',
    label: 'Comisiones (S/)',
    sortAccessor: (r: unknown) => (r as VentasAgentPerformanceRow).totalCommissionAmount,
  },
]

const pipelineTableRows = computed(() => {
  const stages = conversion.value?.activePipelineByStage ?? {}
  return Object.entries(stages).map(([stage, count]) => ({
    stage,
    label: PIPELINE_LABEL[stage] ?? stage,
    count,
  }))
})

const pipelineColumns = [
  { key: 'l', label: 'Etapa', sortAccessor: (r: unknown) => (r as { label: string }).label },
  { key: 'c', label: 'Activos', sortAccessor: (r: unknown) => (r as { count: number }).count },
]

const { isExporting, exportToExcel } = useExcelExport()

const rangeLabel = computed(() => `${applied.value.startDate}_${applied.value.endDate}`)

async function exportSalesExcel() {
  const data = salesRows.value
  if (!data.length) {
    void markapAlert.toast.warning('No hay filas para exportar')
    return
  }
  await exportToExcel({
    fileName: `ventas_por_periodo_${rangeLabel.value}.xlsx`,
    sheetName: 'Ventas',
    columns: [
      { header: 'Periodo', key: 'period' },
      { header: 'Cierres', key: 'closingsCount' },
      { header: 'Monto total', key: 'totalAmount' },
    ],
    rows: data.map((r) => ({
      period: r.period,
      closingsCount: r.closingsCount,
      totalAmount: r.totalAmount,
    })),
  })
  void markapAlert.toast.success('Excel generado')
}

async function exportAgentsExcel() {
  const data = agentRows.value
  if (!data.length) {
    void markapAlert.toast.warning('No hay filas para exportar')
    return
  }
  await exportToExcel({
    fileName: `rendimiento_asesores_${rangeLabel.value}.xlsx`,
    sheetName: 'Asesores',
    columns: [
      { header: 'Asesor', key: 'agentName' },
      { header: 'Cierres', key: 'closingsCount' },
      { header: 'Volumen', key: 'totalSales' },
      { header: 'Comisiones', key: 'totalCommissionAmount' },
    ],
    rows: data.map((r) => ({
      agentName: r.agentName,
      closingsCount: r.closingsCount,
      totalSales: r.totalSales,
      totalCommissionAmount: r.totalCommissionAmount,
    })),
  })
  void markapAlert.toast.success('Excel generado')
}

async function exportConversionExcel() {
  const c = conversion.value
  if (!c) {
    void markapAlert.toast.warning('Sin datos de conversión')
    return
  }
  const funnelRows = pipelineTableRows.value.map((r) => ({
    tipo: 'Embudo activo',
    clave: r.label,
    valor: r.count,
  }))
  const summaryRows = [
    { tipo: 'Resumen', clave: 'Oportunidades creadas (periodo)', valor: c.opportunitiesCreated },
    { tipo: 'Resumen', clave: 'Ganadas', valor: c.opportunitiesWon },
    { tipo: 'Resumen', clave: 'Perdidas', valor: c.opportunitiesLost },
    { tipo: 'Resumen', clave: 'Separaciones registradas', valor: c.separationsCreated },
    { tipo: 'Resumen', clave: 'Cierres', valor: c.closingsCount },
    { tipo: 'Resumen', clave: 'Tasa conversión %', valor: c.conversionRatePercent },
  ]
  await exportToExcel({
    fileName: `conversion_leads_${rangeLabel.value}.xlsx`,
    sheetName: 'Resumen',
    columns: [
      { header: 'Tipo', key: 'tipo' },
      { header: 'Indicador', key: 'clave' },
      { header: 'Valor', key: 'valor' },
    ],
    rows: [...summaryRows, ...funnelRows] as Record<string, string | number>[],
    additionalSheets: [
      {
        sheetName: 'Embudo detalle',
        columns: [
          { header: 'Etapa', key: 'label' },
          { header: 'Procesos activos', key: 'count' },
        ],
        rows: pipelineTableRows.value as unknown as Record<string, string | number | null | undefined>[],
      },
    ],
  })
  void markapAlert.toast.success('Excel generado')
}

async function exportFinancialExcel() {
  const f = financial.value
  if (!f) {
    void markapAlert.toast.warning('Sin datos financieros')
    return
  }
  await exportToExcel({
    fileName: `flujo_financiero_${rangeLabel.value}.xlsx`,
    sheetName: 'Flujo',
    columns: [
      { header: 'Concepto', key: 'concepto' },
      { header: 'Monto (S/)', key: 'monto' },
    ],
    rows: [
      { concepto: 'Cobranza comprador (pagos marcados pagados en periodo)', monto: f.buyerPaymentsCollected },
      { concepto: 'Pendiente de cobro (cuotas/inicial aún PENDING)', monto: f.buyerPaymentsPending },
      { concepto: 'Costos documentación (gastos en periodo)', monto: f.documentationCostsTotal },
      { concepto: 'Comisiones pagadas (cierres en periodo)', monto: f.commissionsPaidAmount },
      { concepto: 'Comisiones pendientes (cierres en periodo)', monto: f.commissionsPendingAmount },
      { concepto: 'Neto estimado (cobranza − docs − com. pagadas)', monto: f.estimatedNetAfterCosts },
    ],
  })
  void markapAlert.toast.success('Excel generado')
}

function printToPdf() {
  void markapAlert.toast.info('En el diálogo de impresión elija «Guardar como PDF».')
  window.print()
}
</script>

<template>
  <div id="ventas-reportes-print" class="space-y-6">
    <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Reportes</h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Indicadores para decisiones: ventas, asesores, conversión y flujo financiero. Exporte a Excel o PDF.
        </p>
      </div>
      <BaseButton variant="secondary" class="flex items-center gap-2 shrink-0" @click="printToPdf">
        <AppIcon icon="lucide:printer" :size="18" />
        PDF / Imprimir
      </BaseButton>
    </div>

    <form
      class="rounded-xl border p-4 flex flex-wrap gap-4 items-end"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
      @submit.prevent="applyFilters"
    >
      <div class="min-w-[140px]">
        <FormInput label="Desde" type="date" v-bind="filterBinds.startDate" />
        <p v-if="errors.startDate" class="text-xs text-red-600 mt-1">{{ errors.startDate }}</p>
      </div>
      <div class="min-w-[140px]">
        <FormInput label="Hasta" type="date" v-bind="filterBinds.endDate" />
        <p v-if="errors.endDate" class="text-xs text-red-600 mt-1">{{ errors.endDate }}</p>
      </div>
      <div class="min-w-[180px]">
        <FormSelect
          label="Agrupación (ventas)"
          v-bind="filterBinds.granularity"
          :options="granularityOptions"
        />
      </div>
      <BaseButton type="submit" variant="primary">Aplicar</BaseButton>
    </form>

    <BaseTabs v-model="activeTab" :tabs="reportTabs" />

    <div
      class="rounded-xl border p-6"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <template v-if="activeTab === 'ventas-periodo'">
        <div class="space-y-4">
          <div class="flex flex-wrap gap-2 justify-end">
            <BaseButton
              variant="secondary"
              class="flex items-center gap-2"
              :loading="isExporting"
              :disabled="salesQuery.isLoading.value"
              @click="exportSalesExcel"
            >
              <ExcelIcon class="w-4 h-4" />
              Excel
            </BaseButton>
          </div>
          <div v-if="salesQuery.isLoading.value" class="flex justify-center py-12">
            <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
          </div>
          <DataTable v-else :columns="salesColumns" :data="salesRows" row-key="period" empty-text="Sin cierres en el rango.">
            <template #row="{ row }">
              <td class="py-3 px-4 font-medium">{{ (row as VentasSalesByPeriodRow).period }}</td>
              <td class="py-3 px-4">{{ (row as VentasSalesByPeriodRow).closingsCount }}</td>
              <td class="py-3 px-4">
                S/ {{ (row as VentasSalesByPeriodRow).totalAmount.toLocaleString('es-PE') }}
              </td>
            </template>
          </DataTable>
        </div>
      </template>

      <template v-else-if="activeTab === 'asesores'">
        <div class="space-y-4">
          <div class="flex flex-wrap gap-2 justify-end">
            <BaseButton
              variant="secondary"
              class="flex items-center gap-2"
              :loading="isExporting"
              :disabled="agentsQuery.isLoading.value"
              @click="exportAgentsExcel"
            >
              <ExcelIcon class="w-4 h-4" />
              Excel
            </BaseButton>
          </div>
          <div v-if="agentsQuery.isLoading.value" class="flex justify-center py-12">
            <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
          </div>
          <DataTable v-else :columns="agentColumns" :data="agentRows" row-key="agentId" empty-text="Sin datos de asesores.">
            <template #row="{ row }">
              <td class="py-3 px-4">{{ (row as VentasAgentPerformanceRow).agentName }}</td>
              <td class="py-3 px-4">{{ (row as VentasAgentPerformanceRow).closingsCount }}</td>
              <td class="py-3 px-4">
                S/ {{ (row as VentasAgentPerformanceRow).totalSales.toLocaleString('es-PE') }}
              </td>
              <td class="py-3 px-4">
                S/ {{ (row as VentasAgentPerformanceRow).totalCommissionAmount.toLocaleString('es-PE') }}
              </td>
            </template>
          </DataTable>
        </div>
      </template>

      <template v-else-if="activeTab === 'conversion'">
        <div class="space-y-4">
          <div class="flex flex-wrap gap-2 justify-end">
            <BaseButton
              variant="secondary"
              class="flex items-center gap-2"
              :loading="isExporting"
              :disabled="conversionQuery.isLoading.value"
              @click="exportConversionExcel"
            >
              <ExcelIcon class="w-4 h-4" />
              Excel
            </BaseButton>
          </div>
          <div v-if="conversionQuery.isLoading.value" class="flex justify-center py-12">
            <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
          </div>
          <template v-else-if="conversion">
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatsCard title="Oportunidades creadas" :value="String(conversion.opportunitiesCreated)">
                <template #icon><AppIcon icon="lucide:sparkles" :size="20" color="var(--color-primary)" /></template>
              </StatsCard>
              <StatsCard title="Ganadas" :value="String(conversion.opportunitiesWon)">
                <template #icon><AppIcon icon="lucide:trophy" :size="20" color="var(--color-primary)" /></template>
              </StatsCard>
              <StatsCard title="Tasa conversión" :value="`${conversion.conversionRatePercent} %`">
                <template #icon><AppIcon icon="lucide:percent" :size="20" color="var(--color-primary)" /></template>
              </StatsCard>
              <StatsCard title="Separaciones (periodo)" :value="String(conversion.separationsCreated)">
                <template #icon><AppIcon icon="lucide:bookmark" :size="20" color="var(--color-primary)" /></template>
              </StatsCard>
              <StatsCard title="Cierres (periodo)" :value="String(conversion.closingsCount)">
                <template #icon><AppIcon icon="lucide:check-circle" :size="20" color="var(--color-primary)" /></template>
              </StatsCard>
              <StatsCard title="Perdidas" :value="String(conversion.opportunitiesLost)">
                <template #icon><AppIcon icon="lucide:x-circle" :size="20" color="var(--color-error)" /></template>
              </StatsCard>
            </div>
            <h3 class="text-sm font-semibold pt-2" :style="{ color: 'var(--color-text-primary)' }">
              Embudo actual (procesos ACTIVE por etapa)
            </h3>
            <DataTable
              :columns="pipelineColumns"
              :data="pipelineTableRows"
              row-key="stage"
              empty-text="Sin procesos activos."
            >
              <template #row="{ row }">
                <td class="py-3 px-4">{{ (row as { label: string }).label }}</td>
                <td class="py-3 px-4">{{ (row as { count: number }).count }}</td>
              </template>
            </DataTable>
          </template>
        </div>
      </template>

      <template v-else-if="activeTab === 'flujo'">
        <div class="space-y-4">
          <div class="flex flex-wrap gap-2 justify-end">
            <BaseButton
              variant="secondary"
              class="flex items-center gap-2"
              :loading="isExporting"
              :disabled="financialQuery.isLoading.value"
              @click="exportFinancialExcel"
            >
              <ExcelIcon class="w-4 h-4" />
              Excel
            </BaseButton>
          </div>
          <div v-if="financialQuery.isLoading.value" class="flex justify-center py-12">
            <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
          </div>
          <div v-else-if="financial" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard
              title="Cobranza comprador (periodo)"
              :value="`S/ ${financial.buyerPaymentsCollected.toLocaleString('es-PE')}`"
            >
              <template #icon><AppIcon icon="lucide:banknote" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard
              title="Por cobrar (pendiente)"
              :value="`S/ ${financial.buyerPaymentsPending.toLocaleString('es-PE')}`"
            >
              <template #icon><AppIcon icon="lucide:clock" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard
              title="Gastos documentación"
              :value="`S/ ${financial.documentationCostsTotal.toLocaleString('es-PE')}`"
            >
              <template #icon><AppIcon icon="lucide:file-text" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard
              title="Comisiones pagadas"
              :value="`S/ ${financial.commissionsPaidAmount.toLocaleString('es-PE')}`"
            >
              <template #icon><AppIcon icon="lucide:circle-dollar-sign" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard
              title="Comisiones pendientes"
              :value="`S/ ${financial.commissionsPendingAmount.toLocaleString('es-PE')}`"
            >
              <template #icon><AppIcon icon="lucide:hourglass" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard
              title="Neto estimado"
              :value="`S/ ${financial.estimatedNetAfterCosts.toLocaleString('es-PE')}`"
            >
              <template #icon><AppIcon icon="lucide:scale" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
@media print {
  :deep(.no-print) {
    display: none !important;
  }
}
</style>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  #ventas-reportes-print,
  #ventas-reportes-print * {
    visibility: visible;
  }
  #ventas-reportes-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
</style>
