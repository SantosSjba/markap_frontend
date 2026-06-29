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
import { useForm, toTypedSchema } from '@shared/components/forms'
import { useExcelExport } from '@shared/composables'
import { markapAlert } from '@/shared/composables'
import { useProduccionReportsDashboard } from '../../application/useProduccionReportes'
import { useProduccionClientsList } from '../../../clientes/application/useClients'
import { useProduccionFurnitureCategoryOptions } from '@modules/produccion/features/configuracion'
import ProduccionSimpleBarChart from '../components/ProduccionSimpleBarChart.vue'
import { WO_STATUS_LABELS } from '../../../taller/presentation/labels'
import type { ProduccionReportsRentabilidadRow } from '../../domain/reportes.types'

function defaultRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 89)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    clientId: '',
    category: '',
  }
}

const filterSchema = toTypedSchema(
  yup.object({
    startDate: yup.string().required('Desde es requerido'),
    endDate: yup.string().required('Hasta es requerido'),
    clientId: yup.string(),
    category: yup.string(),
  }),
)

const { handleSubmit, defineComponentBinds } = useForm({
  validationSchema: filterSchema,
  initialValues: { ...defaultRange() },
})

const filterBinds = {
  startDate: defineComponentBinds('startDate'),
  endDate: defineComponentBinds('endDate'),
  clientId: defineComponentBinds('clientId'),
  category: defineComponentBinds('category'),
}

const applied = ref({ ...defaultRange() })

const rangeParams = computed(() => ({
  startDate: applied.value.startDate,
  endDate: applied.value.endDate,
  clientId: applied.value.clientId.trim() || undefined,
  category: applied.value.category.trim() || undefined,
}))

const applyFilters = handleSubmit((v) => {
  applied.value = {
    startDate: v.startDate,
    endDate: v.endDate,
    clientId: v.clientId ?? '',
    category: v.category ?? '',
  }
})

const dashboardQuery = useProduccionReportsDashboard(rangeParams, { toastOnLoadError: false })
const d = computed(() => dashboardQuery.data.value)
const isLoading = computed(() => dashboardQuery.isLoading.value)

const { data: clientsRes } = useProduccionClientsList(ref({ page: 1, limit: 200 }))
const clientOptions = computed(() => [
  { value: '', label: 'Todos los clientes' },
  ...(clientsRes.value?.data ?? []).map((c) => ({ value: c.id, label: c.fullName })),
])
const { options: furnitureCategoryOptions } = useProduccionFurnitureCategoryOptions()
const categoryOptions = computed(() => [
  { value: '', label: 'Todas las categorías' },
  ...furnitureCategoryOptions.value,
])

const activeTab = ref('produccion')

const reportTabs = [
  { id: 'produccion', label: 'Producción', icon: 'lucide:factory' },
  { id: 'ventas', label: 'Ventas', icon: 'lucide:banknote' },
  { id: 'inventario', label: 'Inventario', icon: 'lucide:warehouse' },
  { id: 'rentabilidad', label: 'Rentabilidad', icon: 'lucide:percent' },
  { id: 'kpis', label: 'KPIs', icon: 'lucide:gauge' },
]

function formatPen(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const woStatusRows = computed(() => d.value?.produccion.workOrdersByStatus ?? [])

const woStatusChartData = computed(() =>
  woStatusRows.value.map((r) => ({
    label: WO_STATUS_LABELS[r.status] ?? r.status,
    value: r.count,
  })),
)

const invCatRows = computed(() => d.value?.inventario.stockValueByCategory ?? [])

const invCatChartData = computed(() =>
  invCatRows.value.map((r) => ({
    label: r.category,
    value: r.totalValue,
  })),
)

const ventasChartData = computed(() => {
  const v = d.value?.ventas
  if (!v) return []
  return [
    { label: 'Cot. enviadas', value: v.quotationsSent },
    { label: 'Cot. aceptadas', value: v.quotationsAccepted },
    { label: 'Pedidos', value: v.ordersCreated },
    { label: 'Entregados', value: v.ordersDelivered },
  ]
})
const woStatusColumns = [
  {
    key: 's',
    label: 'Estado OT',
    sortAccessor: (r: unknown) => WO_STATUS_LABELS[(r as { status: string }).status] ?? '',
  },
  { key: 'c', label: 'Cantidad', sortAccessor: (r: unknown) => (r as { count: number }).count },
]

const invCatColumns = [
  { key: 'cat', label: 'Categoría', sortAccessor: (r: unknown) => (r as { category: string }).category },
  { key: 'items', label: 'Materiales', sortAccessor: (r: unknown) => (r as { itemCount: number }).itemCount },
  { key: 'val', label: 'Valor', sortAccessor: (r: unknown) => (r as { totalValue: number }).totalValue },
]

const rentRows = computed(() => d.value?.rentabilidad.rows ?? [])

const rentColumns = [
  { key: 'code', label: 'Código', sortAccessor: (r: unknown) => (r as ProduccionReportsRentabilidadRow).furnitureCode },
  { key: 'name', label: 'Mueble', sortAccessor: (r: unknown) => (r as ProduccionReportsRentabilidadRow).furnitureName },
  { key: 'ref', label: 'P. ref.', sortAccessor: (r: unknown) => (r as ProduccionReportsRentabilidadRow).referencePrice },
  { key: 'cost', label: 'Costo est.', sortAccessor: (r: unknown) => (r as ProduccionReportsRentabilidadRow).estimatedCost },
  { key: 'margin', label: 'Margen %', sortAccessor: (r: unknown) => (r as ProduccionReportsRentabilidadRow).marginPercent ?? 0 },
  { key: 'sold', label: 'Uds. vendidas', sortAccessor: (r: unknown) => (r as ProduccionReportsRentabilidadRow).unitsSoldPeriod },
]

const { isExporting, exportToExcel } = useExcelExport()
const rangeLabel = computed(() => `${applied.value.startDate}_${applied.value.endDate}`)

async function exportDashboardExcel() {
  const row = d.value
  if (!row) {
    void markapAlert.toast.warning('No hay datos para exportar')
    return
  }
  await exportToExcel({
    fileName: `produccion_reportes_${rangeLabel.value}.xlsx`,
    sheetName: 'Resumen',
    columns: [
      { header: 'Sección', key: 'seccion' },
      { header: 'Indicador', key: 'indicador' },
      { header: 'Valor', key: 'valor' },
    ],
    rows: [
      { seccion: 'Producción', indicador: 'OT creadas período', valor: row.produccion.workOrdersCreated },
      { seccion: 'Producción', indicador: 'OT completadas período', valor: row.produccion.workOrdersCompleted },
      { seccion: 'Producción', indicador: 'OT en proceso (snapshot)', valor: row.produccion.workOrdersInProgressSnapshot },
      { seccion: 'Producción', indicador: 'Consumo materiales (uds)', valor: row.produccion.materialConsumptionQty },
      { seccion: 'Ventas', indicador: 'Cotizaciones enviadas', valor: row.ventas.quotationsSent },
      { seccion: 'Ventas', indicador: 'Cotizaciones aceptadas', valor: row.ventas.quotationsAccepted },
      { seccion: 'Ventas', indicador: 'Pedidos creados', valor: row.ventas.ordersCreated },
      { seccion: 'Ventas', indicador: 'Pedidos entregados', valor: row.ventas.ordersDelivered },
      { seccion: 'Ventas', indicador: 'Ingresos período', valor: row.ventas.salesRevenuePeriod },
      { seccion: 'Ventas', indicador: 'Pipeline (pedidos abiertos)', valor: row.ventas.pipelineValue },
      { seccion: 'Inventario', indicador: 'Valor stock total', valor: row.inventario.totalStockValue },
      { seccion: 'Inventario', indicador: 'Materiales bajo mínimo', valor: row.inventario.lowStockCount },
      { seccion: 'Inventario', indicador: 'Ingresos stock período', valor: row.inventario.stockInValuePeriod },
      { seccion: 'Rentabilidad', indicador: 'Margen promedio %', valor: row.rentabilidad.avgMarginPercent ?? '' },
      { seccion: 'KPIs', indicador: 'Cotizaciones abiertas', valor: row.kpis.openQuotations },
      { seccion: 'KPIs', indicador: 'Pedidos pendientes', valor: row.kpis.pendingOrders },
      { seccion: 'KPIs', indicador: 'OT activas', valor: row.kpis.activeWorkOrders },
      { seccion: 'KPIs', indicador: 'OC pendientes', valor: row.kpis.pendingPurchaseOrders },
    ] as Record<string, string | number>[],
    additionalSheets: [
      {
        sheetName: 'Rentabilidad muebles',
        columns: [
          { header: 'Código', key: 'code' },
          { header: 'Mueble', key: 'name' },
          { header: 'Categoría', key: 'category' },
          { header: 'P. referencia', key: 'ref' },
          { header: 'Costo estimado', key: 'cost' },
          { header: 'Margen %', key: 'margin' },
          { header: 'Uds vendidas', key: 'sold' },
          { header: 'Ingresos período', key: 'revenue' },
        ],
        rows: rentRows.value.map((x) => ({
          code: x.furnitureCode,
          name: x.furnitureName,
          category: x.category,
          ref: x.referencePrice,
          cost: x.estimatedCost,
          margin: x.marginPercent ?? '',
          sold: x.unitsSoldPeriod,
          revenue: x.revenuePeriod,
        })) as Record<string, string | number>[],
      },
      {
        sheetName: 'Inventario categoría',
        columns: [
          { header: 'Categoría', key: 'cat' },
          { header: 'Materiales', key: 'items' },
          { header: 'Valor', key: 'val' },
        ],
        rows: invCatRows.value.map((x) => ({
          cat: x.category,
          items: x.itemCount,
          val: x.totalValue,
        })) as Record<string, string | number>[],
      },
    ],
  })
  void markapAlert.toast.success('Excel generado')
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto space-y-6">
    <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Reportes</h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Producción, ventas, inventario valorizado y rentabilidad por mueble.
        </p>
      </div>
      <BaseButton variant="secondary" :loading="isExporting" :disabled="!d" @click="exportDashboardExcel">
        <ExcelIcon class="mr-1.5" />
        Exportar Excel
      </BaseButton>
    </div>

    <form
      class="rounded-xl border p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
      :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
      @submit.prevent="applyFilters"
    >
      <FormInput v-bind="filterBinds.startDate" label="Desde" type="date" />
      <FormInput v-bind="filterBinds.endDate" label="Hasta" type="date" />
      <FormSelect v-bind="filterBinds.clientId" label="Cliente" :options="clientOptions" />
      <FormSelect v-bind="filterBinds.category" label="Categoría" :options="categoryOptions" />
      <BaseButton type="submit" variant="primary" class="w-full sm:w-auto">
        <AppIcon icon="lucide:filter" :size="16" class="mr-1" />
        Aplicar
      </BaseButton>
    </form>

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <template v-else-if="d">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Ingresos período" :value="formatPen(d.ventas.salesRevenuePeriod)" />
        <StatsCard title="OT completadas" :value="String(d.produccion.workOrdersCompleted)" />
        <StatsCard title="Valor inventario" :value="formatPen(d.inventario.totalStockValue)" />
        <StatsCard
          title="Margen prom. catálogo"
          :value="d.rentabilidad.avgMarginPercent != null ? `${d.rentabilidad.avgMarginPercent}%` : '—'"
        />
      </div>

      <BaseTabs v-model="activeTab" :tabs="reportTabs" />

      <div v-show="activeTab === 'produccion'" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatsCard title="OT creadas" :value="String(d.produccion.workOrdersCreated)" />
          <StatsCard title="En proceso (ahora)" :value="String(d.produccion.workOrdersInProgressSnapshot)" />
          <StatsCard title="Consumo materiales" :value="String(d.produccion.materialConsumptionQty)" />
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProduccionSimpleBarChart
            title="OT por estado"
            subtitle="Distribución actual de órdenes de trabajo"
            :data="woStatusChartData"
            :loading="isLoading"
            color="var(--color-primary)"
          />
          <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
            <DataTable :columns="woStatusColumns" :data="woStatusRows" empty-text="Sin OT." row-key="status">
              <template #row="{ row }">
                <td class="py-3 px-4 text-sm">{{ WO_STATUS_LABELS[(row as { status: string }).status] ?? (row as { status: string }).status }}</td>
                <td class="py-3 px-4 text-sm font-medium">{{ (row as { count: number }).count }}</td>
              </template>
            </DataTable>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'ventas'" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <StatsCard title="Cotizaciones enviadas" :value="String(d.ventas.quotationsSent)" />
          <StatsCard title="Cotizaciones aceptadas" :value="String(d.ventas.quotationsAccepted)" />
          <StatsCard title="Pedidos creados" :value="String(d.ventas.ordersCreated)" />
          <StatsCard title="Pedidos entregados" :value="String(d.ventas.ordersDelivered)" />
          <StatsCard title="Ingresos entregados" :value="formatPen(d.ventas.salesRevenuePeriod)" />
          <StatsCard title="Pipeline abierto" :value="formatPen(d.ventas.pipelineValue)" />
        </div>
        <ProduccionSimpleBarChart
          title="Actividad comercial del período"
          subtitle="Cotizaciones, pedidos y entregas"
          :data="ventasChartData"
          :loading="isLoading"
          color="var(--color-success)"
        />
      </div>

      <div v-show="activeTab === 'inventario'" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <StatsCard title="Materiales" :value="String(d.inventario.totalMaterials)" />
          <StatsCard title="Activos" :value="String(d.inventario.activeMaterials)" />
          <StatsCard title="Bajo mínimo" :value="String(d.inventario.lowStockCount)" />
          <StatsCard title="Ingresos kardex período" :value="formatPen(d.inventario.stockInValuePeriod)" />
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProduccionSimpleBarChart
            title="Valor de stock por categoría"
            subtitle="Inventario valorizado"
            :data="invCatChartData"
            :loading="isLoading"
            color="var(--color-warning)"
            :value-formatter="formatPen"
          />
          <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
            <DataTable :columns="invCatColumns" :data="invCatRows" empty-text="Sin datos." row-key="category">
              <template #row="{ row }">
                <td class="py-3 px-4 text-sm">{{ (row as { category: string }).category }}</td>
                <td class="py-3 px-4 text-sm">{{ (row as { itemCount: number }).itemCount }}</td>
                <td class="py-3 px-4 text-sm font-medium">{{ formatPen((row as { totalValue: number }).totalValue) }}</td>
              </template>
            </DataTable>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'rentabilidad'" class="space-y-4">
        <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          Costo estimado desde BOM + mano de obra + gastos del catálogo. Margen vs precio de referencia.
        </p>
        <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
          <DataTable :columns="rentColumns" :data="rentRows" empty-text="Sin muebles en catálogo." row-key="furnitureId">
            <template #row="{ row }">
              <td class="py-3 px-4 text-sm font-mono">{{ (row as ProduccionReportsRentabilidadRow).furnitureCode }}</td>
              <td class="py-3 px-4 text-sm">{{ (row as ProduccionReportsRentabilidadRow).furnitureName }}</td>
              <td class="py-3 px-4 text-sm">{{ formatPen((row as ProduccionReportsRentabilidadRow).referencePrice) }}</td>
              <td class="py-3 px-4 text-sm">{{ formatPen((row as ProduccionReportsRentabilidadRow).estimatedCost) }}</td>
              <td class="py-3 px-4 text-sm font-medium">
                {{ (row as ProduccionReportsRentabilidadRow).marginPercent != null ? `${(row as ProduccionReportsRentabilidadRow).marginPercent}%` : '—' }}
              </td>
              <td class="py-3 px-4 text-sm">{{ (row as ProduccionReportsRentabilidadRow).unitsSoldPeriod }}</td>
            </template>
          </DataTable>
        </div>
      </div>

      <div v-show="activeTab === 'kpis'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Cotizaciones abiertas" :value="String(d.kpis.openQuotations)" />
        <StatsCard title="Pedidos pendientes" :value="String(d.kpis.pendingOrders)" />
        <StatsCard title="OT activas" :value="String(d.kpis.activeWorkOrders)" />
        <StatsCard title="OC pendientes" :value="String(d.kpis.pendingPurchaseOrders)" />
      </div>
    </template>
  </div>
</template>
