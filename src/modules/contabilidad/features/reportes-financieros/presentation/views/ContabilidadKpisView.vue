<script setup lang="ts">
import { computed, ref } from 'vue'
import { AppIcon, BaseButton, FormSelect, PageHeader } from '@shared/components'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { useContabilidadCostCentersList } from '@modules/contabilidad/features/centros-costo/application/useContabilidadCostCenters'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import {
  useContabilidadReportsDashboard,
  useContabilidadTrialBalance,
} from '../../application/useContabilidadReports'
import { useContabilidadFinancialExport } from '../../application/useContabilidadFinancialExport'
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
const { data: trial, isLoading: loadingTrial } = useContabilidadTrialBalance(periodId, costCenterParam)
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
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-8 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:gauge"
      title="KPIs contables"
      subtitle="Indicadores del periodo y balance de comprobación"
    />

    <p v-if="!activePeriod" class="text-sm" :style="{ color: 'var(--color-warning)' }">
      Seleccione un periodo activo en la barra superior.
    </p>

    <div v-if="loadingDash" class="flex justify-center py-12">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div v-else-if="dashboard" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="kpi in dashboard.kpis"
        :key="kpi.key"
        class="rounded-xl border p-4"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-xs font-medium" :style="{ color: 'var(--color-text-muted)' }">{{ kpi.label }}</span>
          <AppIcon :icon="kpiIcons[kpi.key] ?? 'lucide:activity'" :size="18" color="var(--color-primary)" />
        </div>
        <p class="text-xl font-bold font-mono tabular-nums">{{ formatKpi(kpi) }}</p>
        <p v-if="kpi.hint" class="text-[11px] mt-1" :style="{ color: 'var(--color-text-secondary)' }">{{ kpi.hint }}</p>
      </div>
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

      <div v-if="loadingTrial" class="flex justify-center py-12">
        <AppIcon icon="svg-spinners:ring-resize" :size="28" color="var(--color-primary)" />
      </div>

      <template v-else-if="trial">
        <div
          v-if="!trial.isBalanced"
          class="rounded-lg border px-4 py-3 text-sm"
          :style="{ borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }"
        >
          El balance de comprobación no cuadra: Debe {{ formatPen(trial.totalDebit) }} vs Haber {{ formatPen(trial.totalCredit) }}.
        </div>

        <div
          class="rounded-xl border overflow-hidden"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
                <th class="text-left py-2 px-4">Cuenta</th>
                <th class="text-left py-2 px-4">Nombre</th>
                <th class="text-right py-2 px-4">Debe</th>
                <th class="text-right py-2 px-4">Haber</th>
                <th class="text-right py-2 px-4">Saldo</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="line in trial.lines"
                :key="line.accountId"
                class="border-b last:border-0"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <td class="py-2 px-4 font-mono">{{ line.accountCode }}</td>
                <td class="py-2 px-4">{{ line.accountName }}</td>
                <td class="py-2 px-4 text-right font-mono">{{ formatPen(line.totalDebit) }}</td>
                <td class="py-2 px-4 text-right font-mono">{{ formatPen(line.totalCredit) }}</td>
                <td class="py-2 px-4 text-right font-mono">{{ formatPen(line.balance) }}</td>
              </tr>
              <tr class="font-semibold" :style="{ backgroundColor: 'var(--color-surface-muted)' }">
                <td colspan="2" class="py-2 px-4">Totales</td>
                <td class="py-2 px-4 text-right font-mono">{{ formatPen(trial.totalDebit) }}</td>
                <td class="py-2 px-4 text-right font-mono">{{ formatPen(trial.totalCredit) }}</td>
                <td class="py-2 px-4" />
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>
