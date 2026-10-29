<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import QuickActionsBar from '@shared/presentation/components/dashboard/QuickActionsBar.vue'
import type { QuickAction } from '@shared/presentation/components/dashboard/quick-actions.types'
import MonthlyBarChart from '@shared/presentation/components/reports/MonthlyBarChart.vue'
import { useCurrencyCatalog } from '@shared/presentation/composables/useCurrencyCatalog'
import { splitCurrencyTotals } from '@shared/utils/money'
import { toCalendarDateString } from '@shared/utils/formatters'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { useAuthStore } from '@modules/auth/presentation/stores/auth.store'
import { useInteriorReportsDashboard } from '../../features/reportes/presentation/composables/useInteriorReportes'
import { reportChartItems } from '../../features/reportes/presentation/report-charts'
import { useInteriorProjectStageOptions } from '../../features/proyectos/presentation/composables/useInteriorProjectStageOptions'
import { projectStatusLabel } from '../../features/proyectos/presentation/labels'

const auth = useAuthStore()
const now = new Date()
const endDate = toCalendarDateString(now)
const range = ref({ startDate: `${endDate.slice(0, 7)}-01`, endDate })
const query = useInteriorReportsDashboard(range, { toastOnLoadError: false })
const d = computed(() => query.data.value)
const { format, options } = useCurrencyCatalog()
const currency = ref('PEN')
const chart = computed(() => reportChartItems(d.value, currency.value))
const { stageLabelMap } = useInteriorProjectStageOptions()
const maxStage = computed(() =>
  Math.max(1, ...(d.value?.stages.map((s) => s.count) ?? [])),
)
const actions: QuickAction[] = [
  {
    id: 'project',
    label: 'Nuevo proyecto',
    route: '/interiorismo/proyectos/nuevo',
    icon: 'lucide:plus',
    primary: true,
  },
  {
    id: 'client',
    label: 'Nuevo cliente',
    route: '/interiorismo/clientes/nuevo',
    icon: 'lucide:user-plus',
  },
  {
    id: 'calendar',
    label: 'Calendario',
    route: '/interiorismo/calendario',
    icon: 'lucide:calendar',
  },
  {
    id: 'reports',
    label: 'Reportes',
    route: '/interiorismo/reportes',
    icon: 'lucide:chart-column',
  },
]
const reportLink = (tab: string) => ({
  path: '/interiorismo/reportes',
  query: { ...range.value, tab },
})
</script>

<template>
  <div class="space-y-5">
    <PageHeader
      title="Interiorismo"
      :subtitle="`Hola, ${auth.user?.firstName ?? 'Usuario'}. Este es el estado de tus proyectos.`"
    >
      <template #actions
        ><BaseButton size="sm" variant="outline" :to="reportLink('proyectos')"
          >Ver reportes</BaseButton
        ></template
      >
    </PageHeader>
    <QuickActionsBar :actions="actions" />
    <LoadingState v-if="query.isLoading.value" />
    <BaseCard v-else-if="query.isError.value" class="block space-y-3">
      <p role="alert">{{ getApiErrorMessage(query.error.value) }}</p>
      <BaseButton size="sm" @click="query.refetch()">Reintentar</BaseButton>
    </BaseCard>
    <template v-else-if="d">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          compact
          title="Proyectos activos"
          :value="d.kpis.activeProjects"
        />
        <StatsCard compact title="En ejecución" :value="d.kpis.inExecution" />
        <StatsCard
          compact
          title="Cobrado este mes"
          :value="splitCurrencyTotals(d.totals.collected).main"
          :subtitle="splitCurrencyTotals(d.totals.collected).rest"
        />
        <StatsCard
          compact
          title="Por cobrar (actual)"
          :value="splitCurrencyTotals(d.totals.pending).main"
          :subtitle="splitCurrencyTotals(d.totals.pending).rest"
        />
      </div>
      <p class="text-xs text-gray-500">
        Movimientos del {{ d.range.startDate }} al {{ d.range.endDate }}. Los
        saldos reflejan la situación actual.
      </p>
      <div class="grid gap-5 xl:grid-cols-2">
        <MonthlyBarChart
          :title="`Cobranzas del mes · ${currency}`"
          :items="chart"
          :format-value="(value) => format(value, currency)"
          empty-text="Sin cobros confirmados este mes en esta moneda."
        >
          <template #actions
            ><FormSelect
              v-model="currency"
              :options="
                options.length
                  ? options
                  : ['PEN', 'USD', 'EUR'].map((value) => ({
                      value,
                      label: value,
                    }))
              "
              class="w-36"
              size="sm"
              aria-label="Moneda del gráfico"
          /></template>
        </MonthlyBarChart>
        <FormSectionCard
          title="Proyectos por etapa"
          subtitle="Cartera actual"
          dense
        >
          <div v-if="d.stages.length" class="space-y-3">
            <div v-for="stage in d.stages" :key="stage.status">
              <div class="mb-1 flex justify-between text-sm">
                <BaseButton
                  variant="link"
                  :to="{
                    path: '/interiorismo/proyectos',
                    query: { status: stage.status },
                  }"
                  >{{
                    projectStatusLabel(stage.status, stageLabelMap)
                  }}</BaseButton
                ><span class="tabular-nums">{{ stage.count }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  class="h-full rounded-full bg-brand-500"
                  :style="{ width: `${(stage.count / maxStage) * 100}%` }"
                />
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-gray-500">Todavía no hay proyectos.</p>
        </FormSectionCard>
      </div>
      <FormSectionCard
        title="Pendientes de atención"
        subtitle="Saldos y alertas actuales"
        dense
      >
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p class="text-xs text-gray-500">Proyectos con saldo por cobrar</p>
            <BaseButton variant="link" :to="reportLink('cobranzas')"
              >{{ d.alerts.pendingProjects }} proyectos</BaseButton
            >
          </div>
          <div>
            <p class="text-xs text-gray-500">Saldos de proveedores</p>
            <BaseButton variant="link" :to="reportLink('compras')">{{
              splitCurrencyTotals(d.totals.supplierBalance).main
            }}</BaseButton>
            <p class="text-xs text-gray-500">
              {{ splitCurrencyTotals(d.totals.supplierBalance).rest }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Proyectos fuera de plazo</p>
            <BaseButton variant="link" :to="reportLink('rentabilidad')"
              >{{ d.alerts.overdueProjects }} proyectos</BaseButton
            >
          </div>
          <div>
            <p class="text-xs text-gray-500">Incidencias abiertas</p>
            <span class="text-lg font-semibold">{{
              d.kpis.openIncidents
            }}</span>
          </div>
        </div>
        <p
          v-if="d.alerts.unconvertedPayments"
          class="mt-4 text-sm text-warning-600"
        >
          Hay cobros sin tipo de cambio aplicable. Revisa Liquidación para
          completar el cálculo de saldos.
        </p>
      </FormSectionCard>
    </template>
  </div>
</template>
