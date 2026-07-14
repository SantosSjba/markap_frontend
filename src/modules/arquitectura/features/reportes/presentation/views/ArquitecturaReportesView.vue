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
} from '@shared/components'
import { useForm, toTypedSchema } from '@shared/components/forms'
import { useExcelExport } from '@shared/composables'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { toCalendarDateString } from '@/shared/utils/formatters'
import { useArquitecturaReportsDashboard } from '../../application/useArquitecturaReportes'
import { projectStatusLabel } from '@modules/arquitectura/features/proyectos/presentation/labels'
import { useArquitecturaProjectStageOptions } from '@modules/arquitectura/features/proyectos/application/useArquitecturaProjectStageOptions'

const { stageLabelMap } = useArquitecturaProjectStageOptions()

const COST_CAT_LABEL: Record<string, string> = {
  LABOR: 'Mano de obra',
  MATERIAL: 'Material',
  EXPENSE: 'Gastos',
  TRANSPORT: 'Transporte',
}

function defaultRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 89)
  return {
    startDate: toCalendarDateString(start),
    endDate: toCalendarDateString(end),
  }
}

const filterSchema = toTypedSchema(
  yup.object({
    startDate: yup.string().required('Desde es requerido'),
    endDate: yup.string().required('Hasta es requerido'),
  }),
)

const { handleSubmit, errors, defineComponentBinds } = useForm({
  validationSchema: filterSchema,
  initialValues: { ...defaultRange() },
})

const filterBinds = {
  startDate: defineComponentBinds('startDate'),
  endDate: defineComponentBinds('endDate'),
}

const applied = ref({ ...defaultRange() })

const rangeParams = computed(() => ({
  startDate: applied.value.startDate,
  endDate: applied.value.endDate,
}))

const applyFilters = handleSubmit((v) => {
  applied.value = { startDate: v.startDate, endDate: v.endDate }
})

const dashboardQuery = useArquitecturaReportsDashboard(rangeParams, { toastOnLoadError: false })
const d = computed(() => dashboardQuery.data.value)

const activeTab = ref('ventas')

const reportTabs = [
  { id: 'ventas', label: 'Ventas', icon: 'lucide:banknote' },
  { id: 'conversion', label: 'Conversión', icon: 'lucide:git-branch' },
  { id: 'rentabilidad', label: 'Rentabilidad', icon: 'lucide:percent' },
  { id: 'productividad', label: 'Productividad', icon: 'lucide:clipboard-check' },
  { id: 'costos', label: 'Costos', icon: 'lucide:wallet-cards' },
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

const estadoRows = computed(() => {
  const rows = d.value?.conversion.proyectosPorEstado ?? []
  return [...rows].sort((a, b) => b.count - a.count)
})

const estadoColumns = [
  {
    key: 's',
    label: 'Estado',
    sortAccessor: (r: unknown) =>
      projectStatusLabel((r as { status: string }).status, stageLabelMap.value),
  },
  { key: 'c', label: 'Proyectos', sortAccessor: (r: unknown) => (r as { count: number }).count },
]

const costoCatColumns = [
  {
    key: 'cat',
    label: 'Categoría',
    sortAccessor: (r: unknown) => COST_CAT_LABEL[(r as { category: string }).category] ?? '',
  },
  { key: 'tot', label: 'Monto', sortAccessor: (r: unknown) => (r as { total: number }).total },
]

const costoCatRows = computed(() => d.value?.costos.ejecucionPorCategoria ?? [])

const { isExporting, exportToExcel } = useExcelExport()

const rangeLabel = computed(() => `${applied.value.startDate}_${applied.value.endDate}`)

async function exportDashboardExcel() {
  const row = d.value
  if (!row) {
    void markapAlert.toast.warning('No hay datos para exportar')
    return
  }
  await exportToExcel({
    fileName: `arquitectura_reportes_${rangeLabel.value}.xlsx`,
    sheetName: 'Resumen',
    columns: [
      { header: 'Sección', key: 'seccion' },
      { header: 'Indicador', key: 'indicador' },
      { header: 'Valor', key: 'valor' },
    ],
    rows: [
      { seccion: 'Ventas', indicador: 'Cobranzas período', valor: row.ventas.cobranzasPeriodo },
      { seccion: 'Ventas', indicador: 'Pagos registrados', valor: row.ventas.pagosRegistradosPeriodo },
      {
        seccion: 'Ventas',
        indicador: 'Proyectos con cobro en período',
        valor: row.ventas.proyectosConCobroEnPeriodo,
      },
      { seccion: 'Ventas', indicador: 'Cartera pendiente (cuotas)', valor: row.ventas.carteraPendienteCuotas },
      { seccion: 'Conversión', indicador: 'Proyectos nuevos', valor: row.conversion.proyectosNuevosPeriodo },
      {
        seccion: 'Conversión',
        indicador: 'Proyectos finalizados',
        valor: row.conversion.proyectosFinalizadosPeriodo,
      },
      {
        seccion: 'Conversión',
        indicador: 'Presup. aprobados período',
        valor: row.conversion.presupuestosAprobadosPeriodo,
      },
      {
        seccion: 'Conversión',
        indicador: 'Presup. rechazados período',
        valor: row.conversion.presupuestosRechazadosPeriodo,
      },
      {
        seccion: 'Conversión',
        indicador: 'Tasa cierre presupuesto %',
        valor: row.conversion.tasaCierrePresupuestoPct ?? '',
      },
      {
        seccion: 'Rentabilidad',
        indicador: 'Volumen aprobado período',
        valor: row.rentabilidad.volumenPresupuestosAprobadosPeriodo,
      },
      {
        seccion: 'Rentabilidad',
        indicador: 'Costos ejecución período',
        valor: row.rentabilidad.costosEjecucionPeriodo,
      },
      {
        seccion: 'Rentabilidad',
        indicador: 'Compras materiales período',
        valor: row.rentabilidad.comprasMaterialesPeriodo,
      },
      {
        seccion: 'Rentabilidad',
        indicador: 'Margen bruto estimado',
        valor: row.rentabilidad.margenBrutoEstimado,
      },
      {
        seccion: 'Rentabilidad',
        indicador: 'Margen bruto %',
        valor: row.rentabilidad.margenBrutoPct ?? '',
      },
      { seccion: 'Productividad', indicador: 'Tareas totales', valor: row.productividad.tareasTotales },
      {
        seccion: 'Productividad',
        indicador: 'Tareas completadas',
        valor: row.productividad.tareasCompletadasSnapshot,
      },
      {
        seccion: 'Productividad',
        indicador: 'Tareas hechas en período',
        valor: row.productividad.tareasCompletadasPeriodo,
      },
      {
        seccion: 'Productividad',
        indicador: 'Evidencias en período',
        valor: row.productividad.evidenciasPeriodo,
      },
      {
        seccion: 'Productividad',
        indicador: 'Incidencias abiertas',
        valor: row.productividad.incidenciasAbiertas,
      },
      { seccion: 'Costos', indicador: 'Total período', valor: row.costos.totalCostosPeriodo },
      { seccion: 'KPIs', indicador: 'Proyectos activos', valor: row.kpis.proyectosActivos },
      { seccion: 'KPIs', indicador: 'En ejecución', valor: row.kpis.proyectosEnEjecucion },
      { seccion: 'KPIs', indicador: 'Clientes', valor: row.kpis.clientesTotales },
      { seccion: 'KPIs', indicador: 'Presupuestos borrador', valor: row.kpis.presupuestosBorrador },
    ] as Record<string, string | number>[],
    additionalSheets: [
      {
        sheetName: 'Estado proyectos',
        columns: [
          { header: 'Estado', key: 'estado' },
          { header: 'Cantidad', key: 'cantidad' },
        ],
        rows: estadoRows.value.map((x) => ({
          estado: projectStatusLabel(x.status, stageLabelMap.value),
          cantidad: x.count,
        })) as Record<string, string | number>[],
      },
      {
        sheetName: 'Costos ejecución',
        columns: [
          { header: 'Categoría', key: 'categoria' },
          { header: 'Total', key: 'total' },
        ],
        rows: costoCatRows.value.map((x) => ({
          categoria: COST_CAT_LABEL[x.category] ?? x.category,
          total: x.total,
        })) as Record<string, string | number>[],
      },
    ],
  })
  void markapAlert.toast.success('Excel generado')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Reportes</h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Vista consolidada de proyectos, presupuestos, cobranzas, ejecución y compras. Los datos dependen de los demás módulos.
        </p>
      </div>
      <BaseButton
        variant="secondary"
        class="flex items-center gap-2 shrink-0"
        :loading="isExporting"
        :disabled="!d || dashboardQuery.isLoading.value"
        @click="exportDashboardExcel"
      >
        <ExcelIcon class="w-4 h-4" />
        Exportar Excel
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
      <BaseButton type="submit" variant="primary">Aplicar</BaseButton>
      <p v-if="d" class="text-xs w-full sm:w-auto sm:ml-auto" :style="{ color: 'var(--color-text-muted)' }">
        Rango aplicado: {{ d.range.startDate }} — {{ d.range.endDate }}
      </p>
    </form>

    <div v-if="dashboardQuery.isLoading.value" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
    </div>

    <div
      v-else-if="dashboardQuery.isError.value"
      class="rounded-xl border p-8 text-center space-y-4"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <p class="text-sm" style="color: var(--color-error)">
        {{ getApiErrorMessage(dashboardQuery.error.value) }}
      </p>
      <BaseButton variant="secondary" @click="() => dashboardQuery.refetch()">Reintentar</BaseButton>
    </div>

    <template v-else-if="d">
      <BaseTabs v-model="activeTab" :tabs="reportTabs" />

      <div
        class="rounded-xl border p-6"
        :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
      >
        <template v-if="activeTab === 'ventas'">
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Cobranzas (período)" :value="formatPen(d.ventas.cobranzasPeriodo)">
              <template #icon><AppIcon icon="lucide:banknote" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="Pagos registrados" :value="String(d.ventas.pagosRegistradosPeriodo)">
              <template #icon><AppIcon icon="lucide:list-checks" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="Proyectos con cobro" :value="String(d.ventas.proyectosConCobroEnPeriodo)">
              <template #icon><AppIcon icon="lucide:folder-check" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="Cartera pendiente (cuotas)" :value="formatPen(d.ventas.carteraPendienteCuotas)">
              <template #icon><AppIcon icon="lucide:clock" :size="20" color="var(--color-warning)" /></template>
            </StatsCard>
          </div>
          <p class="text-xs mt-4" :style="{ color: 'var(--color-text-muted)' }">
            Cobranzas: pagos del cliente marcados como pagados en el rango. Pendiente: cuotas programadas aún no saldadas (PENDING / PARTIAL).
          </p>
        </template>

        <template v-else-if="activeTab === 'conversion'">
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatsCard title="Proyectos nuevos" :value="String(d.conversion.proyectosNuevosPeriodo)">
              <template #icon><AppIcon icon="lucide:folder-plus" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="Finalizados (período)" :value="String(d.conversion.proyectosFinalizadosPeriodo)">
              <template #icon><AppIcon icon="lucide:circle-check" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard
              title="Tasa cierre presupuesto"
              :value="d.conversion.tasaCierrePresupuestoPct != null ? `${d.conversion.tasaCierrePresupuestoPct} %` : '—'"
            >
              <template #icon><AppIcon icon="lucide:percent" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="Proyectos aprobados" :value="String(d.conversion.presupuestosAprobadosPeriodo)">
              <template #icon><AppIcon icon="lucide:check" :size="20" color="var(--color-success)" /></template>
            </StatsCard>
            <StatsCard title="Proyectos cancelados" :value="String(d.conversion.presupuestosRechazadosPeriodo)">
              <template #icon><AppIcon icon="lucide:x-circle" :size="20" color="var(--color-error)" /></template>
            </StatsCard>
            <StatsCard title="En cotización" :value="String(d.conversion.presupuestosEnviadosSnapshot)">
              <template #icon><AppIcon icon="lucide:send" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
          </div>
          <h3 class="text-sm font-semibold mb-2" :style="{ color: 'var(--color-text-primary)' }">
            Proyectos por estado (cartera actual)
          </h3>
          <DataTable :columns="estadoColumns" :data="estadoRows" row-key="status" empty-text="Sin proyectos.">
            <template #row="{ row }">
              <td class="py-3 px-4 font-medium">
                {{ projectStatusLabel((row as { status: string }).status, stageLabelMap) }}
              </td>
              <td class="py-3 px-4">{{ (row as { count: number }).count }}</td>
            </template>
          </DataTable>
        </template>

        <template v-else-if="activeTab === 'rentabilidad'">
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard title="Volumen aprobado (período)" :value="formatPen(d.rentabilidad.volumenPresupuestosAprobadosPeriodo)">
              <template #icon><AppIcon icon="lucide:file-check" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="Costos ejecución" :value="formatPen(d.rentabilidad.costosEjecucionPeriodo)">
              <template #icon><AppIcon icon="lucide:hammer" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="Compras materiales" :value="formatPen(d.rentabilidad.comprasMaterialesPeriodo)">
              <template #icon><AppIcon icon="lucide:package" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="Margen bruto estimado" :value="formatPen(d.rentabilidad.margenBrutoEstimado)">
              <template #icon><AppIcon icon="lucide:trending-up" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard
              title="Margen % sobre volumen"
              :value="d.rentabilidad.margenBrutoPct != null ? `${d.rentabilidad.margenBrutoPct} %` : '—'"
            >
              <template #icon><AppIcon icon="lucide:chart-no-axes-combined" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
          </div>
          <p class="text-xs mt-4" :style="{ color: 'var(--color-text-muted)' }">
            Estimación simple: total presupuestos aprobados en el período menos costos de obra registrados y compras a proveedores en el mismo rango.
          </p>
        </template>

        <template v-else-if="activeTab === 'productividad'">
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard title="Tareas totales" :value="String(d.productividad.tareasTotales)">
              <template #icon><AppIcon icon="lucide:list-todo" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="Completadas (snapshot)" :value="String(d.productividad.tareasCompletadasSnapshot)">
              <template #icon><AppIcon icon="lucide:circle-check" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="Hechas en período" :value="String(d.productividad.tareasCompletadasPeriodo)">
              <template #icon><AppIcon icon="lucide:calendar-check" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard
              title="% avance tareas"
              :value="d.productividad.pctAvanceTareas != null ? `${d.productividad.pctAvanceTareas} %` : '—'"
            >
              <template #icon><AppIcon icon="lucide:activity" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="Evidencias (período)" :value="String(d.productividad.evidenciasPeriodo)">
              <template #icon><AppIcon icon="lucide:camera" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="Incidencias abiertas" :value="String(d.productividad.incidenciasAbiertas)">
              <template #icon><AppIcon icon="lucide:triangle-alert" :size="20" color="var(--color-warning)" /></template>
            </StatsCard>
            <StatsCard
              title="Progreso medio proyectos"
              :value="d.productividad.progresoPromedioProyectosPct != null ? `${d.productividad.progresoPromedioProyectosPct} %` : '—'"
            >
              <template #icon><AppIcon icon="lucide:layout-dashboard" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
          </div>
        </template>

        <template v-else-if="activeTab === 'costos'">
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatsCard title="Total costos período" :value="formatPen(d.costos.totalCostosPeriodo)">
              <template #icon><AppIcon icon="lucide:calculator" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="Compras proveedores" :value="formatPen(d.costos.comprasProveedoresPeriodo)">
              <template #icon><AppIcon icon="lucide:truck" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
          </div>
          <h3 class="text-sm font-semibold mb-2" :style="{ color: 'var(--color-text-primary)' }">
            Ejecución por categoría (período)
          </h3>
          <DataTable :columns="costoCatColumns" :data="costoCatRows" row-key="category" empty-text="Sin costos registrados en el rango.">
            <template #row="{ row }">
              <td class="py-3 px-4">
                {{ COST_CAT_LABEL[(row as { category: string }).category] ?? (row as { category: string }).category }}
              </td>
              <td class="py-3 px-4 font-medium">{{ formatPen((row as { total: number }).total) }}</td>
            </template>
          </DataTable>
        </template>

        <template v-else-if="activeTab === 'kpis'">
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Proyectos activos" :value="String(d.kpis.proyectosActivos)">
              <template #icon><AppIcon icon="lucide:folder-open" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="En ejecución" :value="String(d.kpis.proyectosEnEjecucion)">
              <template #icon><AppIcon icon="lucide:flame" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="Clientes" :value="String(d.kpis.clientesTotales)">
              <template #icon><AppIcon icon="lucide:users" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
            <StatsCard title="Proyectos en cotización" :value="String(d.kpis.presupuestosBorrador)">
              <template #icon><AppIcon icon="lucide:file-pen" :size="20" color="var(--color-primary)" /></template>
            </StatsCard>
          </div>
          <p class="text-xs mt-4" :style="{ color: 'var(--color-text-muted)' }">
            Activos: proyectos que no están cancelados ni finalizados. Use las demás pestañas para el detalle por período.
          </p>
        </template>
      </div>
    </template>
  </div>
</template>
