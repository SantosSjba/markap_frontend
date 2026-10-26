<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import { computed, ref } from 'vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { useContabilidadCostCentersList } from '../../../centros-costo/presentation/composables/useContabilidadCostCenters'
import { formatPen } from '../../../asientos/domain/journal.utils'
import {
  useContabilidadReportsDashboard,
  useContabilidadTrialBalance,
} from '../composables/useContabilidadReports'
import { useContabilidadFinancialExport } from '../composables/useContabilidadFinancialExport'
import type { ContabilidadDashboardKpiDTO } from '../../domain/reports.types'
const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)
const costCenterId = ref('')

const { data: costCentersData } = useContabilidadCostCentersList(ref(''))
const costCenterOptions = computed(() => [
  { value: '', label: 'Todos los centros' },
  ...(costCentersData.value ?? []).map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })),
])

const { data: dashboard, isLoading: loadingDash } = useContabilidadReportsDashboard(periodId)
const costCenterParam = computed(() => costCenterId.value || undefined)
const { data: trial, isLoading: loadingTrial } = useContabilidadTrialBalance(
  periodId,
  costCenterParam,
)
const { exportFinancialStatement, isExporting } = useContabilidadFinancialExport()

function exportTrialExcel() {
  if (!periodId.value) return
  void exportFinancialStatement('trial-balance', periodId.value, 'excel', costCenterParam.value)
}

function exportTrialPdf() {
  if (!periodId.value) return
  void exportFinancialStatement('trial-balance', periodId.value, 'pdf', costCenterParam.value)
}

function formatKpi(kpi: ContabilidadDashboardKpiDTO) {
  if (kpi.format === 'money') return formatPen(kpi.value)
  if (kpi.format === 'number') return kpi.value
  return kpi.value
}

const kpiIcons: Record<string, string> = {
  posted_entries: 'lucide:book-open',
  net_income: 'lucide:trending-up',
  liquidity: 'lucide:droplets',
  cxc: 'lucide:hand-coins',
  cxp: 'lucide:credit-card',
  igv_balance: 'lucide:percent',
  cash_bank: 'lucide:landmark',
  total_assets: 'lucide:scale',
}
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      icon="lucide:gauge"
      title="KPIs contables"
      subtitle="Indicadores del periodo y balance de comprobación"
    />

    <p v-if="!activePeriod" class="text-sm text-warning-600 dark:text-orange-400">
      Configure el periodo activo en Configuración ? Contexto contable.
    </p>

    <LoadingState v-if="loadingDash" class="py-12" />

    <div v-else-if="dashboard" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <BaseCard v-for="kpi in dashboard.kpis" :key="kpi.key" padding="sm" class="block">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-xs font-medium text-gray-400 dark:text-gray-500">{{ kpi.label }}</span>
          <AppIcon :icon="kpiIcons[kpi.key] ?? 'lucide:activity'" :size="18" color="var(--color-primary)" />
        </div>
        <p class="text-xl font-bold font-mono tabular-nums">{{ formatKpi(kpi) }}</p>
        <p v-if="kpi.hint" class="text-[11px] mt-1 text-gray-500 dark:text-gray-400">{{ kpi.hint }}</p>
      </BaseCard>
    </div>

    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <h2 class="text-lg font-semibold">Balance de comprobación</h2>
        <div class="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div class="w-full max-w-xs">
            <FormSelect v-model="costCenterId" label="Centro de costo" :options="costCenterOptions" />
          </div>
          <div class="flex gap-2 print:hidden">
            <BaseButton
              variant="secondary"
              size="sm"
              :disabled="!activePeriod"
              :loading="isExporting('trial-balance', 'excel')"
              @click="exportTrialExcel"
            >
              Excel
            </BaseButton>
            <BaseButton
              variant="secondary"
              size="sm"
              :disabled="!activePeriod"
              :loading="isExporting('trial-balance', 'pdf')"
              @click="exportTrialPdf"
            >
              PDF
            </BaseButton>
          </div>
        </div>
      </div>

      <LoadingState v-if="loadingTrial" class="py-12" />

      <template v-else-if="trial">
        <div
          v-if="!trial.isBalanced"
          class="rounded-lg border px-4 py-3 text-sm border-warning-500 text-warning-600 dark:text-orange-400"
        >
          El balance de comprobación no cuadra: Debe {{ formatPen(trial.totalDebit) }} vs Haber {{ formatPen(trial.totalCredit) }}.
        </div>

        <BaseCard padding="none" class="block overflow-hidden">
          <Table class="w-full text-sm">
            <TableHeader>
              <TableRow class="border-b border-gray-200 dark:border-gray-800">
                <TableCell is-header class="text-left py-2 px-4">Cuenta</TableCell>
                <TableCell is-header class="text-left py-2 px-4">Nombre</TableCell>
                <TableCell is-header class="text-right py-2 px-4">Debe</TableCell>
                <TableCell is-header class="text-right py-2 px-4">Haber</TableCell>
                <TableCell is-header class="text-right py-2 px-4">Saldo</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="line in trial.lines"
                :key="line.accountId"
                class="border-b last:border-0 border-gray-200 dark:border-gray-800"
              >
                <TableCell class="py-2 px-4 font-mono">{{ line.accountCode }}</TableCell>
                <TableCell class="py-2 px-4">{{ line.accountName }}</TableCell>
                <TableCell class="py-2 px-4 text-right font-mono">{{ formatPen(line.totalDebit) }}</TableCell>
                <TableCell class="py-2 px-4 text-right font-mono">{{ formatPen(line.totalCredit) }}</TableCell>
                <TableCell class="py-2 px-4 text-right font-mono">{{ formatPen(line.balance) }}</TableCell>
              </TableRow>
              <TableRow class="font-semibold bg-gray-100 dark:bg-gray-950">
                <TableCell colspan="2" class="py-2 px-4">Totales</TableCell>
                <TableCell class="py-2 px-4 text-right font-mono">{{ formatPen(trial.totalDebit) }}</TableCell>
                <TableCell class="py-2 px-4 text-right font-mono">{{ formatPen(trial.totalCredit) }}</TableCell>
                <TableCell class="py-2 px-4" />
              </TableRow>
            </TableBody>
          </Table>
        </BaseCard>
      </template>
    </div>
  </div>
</template>
