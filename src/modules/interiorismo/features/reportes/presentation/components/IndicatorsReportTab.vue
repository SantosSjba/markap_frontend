<script setup lang="ts">
import { computed } from 'vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import MonthlyBarChart from '@shared/presentation/components/reports/MonthlyBarChart.vue'
import ReportSectionHeader from '@shared/presentation/components/reports/ReportSectionHeader.vue'
import { useReportCurrency, type ReportPeriodParams } from '@shared/presentation/components/reports/report-period'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { formatCurrency, formatCurrencyRounded } from '@shared/utils/formatters'
import { projectStatusLabel } from '../../../proyectos/presentation/labels'
import { useInteriorProjectStageOptions } from '../../../proyectos/presentation/composables/useInteriorProjectStageOptions'
import type { InteriorReportsDashboard } from '../../domain/reportes.types'
import { amountIn, monthlyBars, periodName } from '../report-series'
/**
 * Indicadores: estado operativo de hoy (cartera, obra, alertas), proyectos por etapa y los
 * gráficos del periodo reunidos. Los montos se ven de una moneda a la vez.
 */

const props = defineProps<{ data: InteriorReportsDashboard; params: ReportPeriodParams; periodLabel: string }>()
const { stageLabelMap, formOptions: stageOptions } = useInteriorProjectStageOptions()

const k = computed(() => props.data.kpis)
const a = computed(() => props.data.alerts)
const taskPct = computed(() => (k.value.tasks ? Math.round((k.value.completedTasks / k.value.tasks) * 100) : 0))

/** Etapas en el orden configurado; las que no tienen proyectos también se ven (en cero) */
const stages = computed(() => {
  const count = new Map(props.data.stages.map((s) => [s.status, s.count]))
  const order = [...stageOptions.value.map((o) => String(o.value)), 'CANCELLED']
  const extra = props.data.stages.map((s) => s.status).filter((s) => !order.includes(s))
  return [...order, ...extra].map((status) => ({ status, count: count.get(status) ?? 0 }))
})
const maxStage = computed(() => Math.max(1, ...stages.value.map((s) => s.count)))
const totalProjects = computed(() => stages.value.reduce((s, x) => s + x.count, 0))

const { currency, currencyTabs } = useReportCurrency(
  computed(() => [...props.data.collections.map((c) => c.currency), ...props.data.totals.budget.map((t) => t.currency)]),
)
const unit = computed(() => (props.params.granularity === 'year' ? 'año' : 'mes'))
const projectChart = computed(() =>
  monthlyBars(props.data, props.params, (m) => m.projects, (key, v) => `${periodName(key)}: ${v} ${v === 1 ? 'proyecto' : 'proyectos'}`),
)
const collectionChart = computed(() =>
  monthlyBars(
    props.data,
    props.params,
    (m) => amountIn(m.collections, currency.value),
    (key, v) => `${periodName(key)}: ${formatCurrency(v, currency.value)}`,
  ),
)

const { isExporting, exportToExcel } = useExcelExport()
function exportExcel() {
  void exportToExcel({
    fileName: `indicadores_interiorismo_${props.periodLabel.replace(/\s+/g, '_')}`,
    sheetName: 'Indicadores',
    columns: [
      { header: 'Indicador', key: 'label', width: 34 },
      { header: 'Valor', key: 'value', width: 14 },
    ],
    rows: [
      { label: 'Proyectos activos', value: k.value.activeProjects },
      { label: 'En ejecución', value: k.value.inExecution },
      { label: 'En cotización', value: k.value.quotation },
      { label: 'Clientes', value: k.value.clients },
      { label: 'Tareas completadas', value: `${k.value.completedTasks}/${k.value.tasks}` },
      { label: 'Incidencias abiertas', value: k.value.openIncidents },
      { label: 'Proyectos atrasados', value: a.value.overdueProjects },
      { label: 'Proyectos con saldo por cobrar', value: a.value.pendingProjects },
      { label: 'Proveedores con saldo', value: a.value.unpaidSuppliers },
      ...stages.value.map((s) => ({ label: `Etapa: ${projectStatusLabel(s.status, stageLabelMap.value)}`, value: s.count })),
    ],
  })
}
</script>

<template>
  <div class="space-y-5">
    <ReportSectionHeader
      title="Indicadores"
      :subtitle="`Estado de hoy y evolución · ${periodLabel}`"
      icon="lucide:gauge"
      :exporting="isExporting"
      @export="exportExcel"
    />

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatsCard compact title="Proyectos activos" :value="String(k.activeProjects)" :subtitle="`${k.inExecution} en ejecución · ${k.quotation} en cotización`">
        <template #icon><AppIcon icon="lucide:folder-kanban" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Clientes" :value="String(k.clients)" subtitle="con proyectos">
        <template #icon><AppIcon icon="lucide:users" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Tareas de obra" :value="`${taskPct} %`" :subtitle="`${k.completedTasks} de ${k.tasks} completadas`">
        <template #icon><AppIcon icon="lucide:list-checks" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Incidencias abiertas" :value="String(k.openIncidents)" :subtitle="k.openIncidents ? 'por resolver' : 'ninguna'">
        <template #icon><AppIcon icon="lucide:triangle-alert" :size="20" /></template>
      </StatsCard>
    </div>

    <!-- Alertas -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div
        v-for="al in [
          { icon: 'lucide:clock-alert', label: 'Proyectos atrasados', hint: 'pasaron su entrega estimada', value: a.overdueProjects },
          { icon: 'lucide:wallet', label: 'Con saldo por cobrar', hint: 'proyectos vigentes', value: a.pendingProjects },
          { icon: 'lucide:truck', label: 'Proveedores con saldo', hint: 'por pagar', value: a.unpaidSuppliers },
        ]"
        :key="al.label"
        :class="[
          'flex items-center gap-3 rounded-xl border p-4',
          al.value ? 'border-warning-200 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/10' : 'border-gray-200 dark:border-gray-800',
        ]"
      >
        <AppIcon :icon="al.icon" :size="20" :class="al.value ? 'text-warning-600 dark:text-warning-400' : 'text-gray-400'" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ al.label }}</p>
          <p class="text-theme-xs text-gray-500 dark:text-gray-400">{{ al.hint }}</p>
        </div>
        <span class="text-xl font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ al.value }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <!-- Proyectos por etapa -->
      <div class="rounded-xl border border-gray-200 dark:border-gray-800">
        <div class="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Proyectos por etapa</h3>
          <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{{ totalProjects }} proyectos en total</p>
        </div>
        <ul class="space-y-3 px-4 py-4">
          <li v-for="s in stages" :key="s.status">
            <div class="mb-1 flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-300">{{ projectStatusLabel(s.status, stageLabelMap) }}</span>
              <span class="font-medium tabular-nums text-gray-800 dark:text-white/90">{{ s.count }}</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                class="h-full rounded-full"
                :class="s.status === 'CANCELLED' ? 'bg-gray-400' : s.status === 'FINISHED' ? 'bg-success-500' : 'bg-brand-500'"
                :style="{ width: `${(s.count / maxStage) * 100}%` }"
              />
            </div>
          </li>
        </ul>
      </div>

      <div class="space-y-5 xl:col-span-2">
        <MonthlyBarChart
          :title="`Proyectos creados por ${unit}`"
          :items="projectChart"
          :format-value="String"
          integer
          empty-text="Sin proyectos creados en el periodo."
        />
        <MonthlyBarChart
          :title="`Cobrado por ${unit} · ${currency}`"
          :items="collectionChart"
          :format-value="(v: number) => formatCurrencyRounded(v, currency)"
          :empty-text="`Sin cobros en ${currency} en el periodo.`"
        >
          <template #actions>
            <BaseTabs v-if="currencyTabs.length > 1" v-model="currency" :tabs="currencyTabs" variant="segmented" />
          </template>
        </MonthlyBarChart>
      </div>
    </div>
  </div>
</template>
