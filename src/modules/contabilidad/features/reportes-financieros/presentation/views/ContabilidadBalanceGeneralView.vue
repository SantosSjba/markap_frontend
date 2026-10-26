<script setup lang="ts">
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { computed } from 'vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '../../../asientos/domain/journal.utils'
import { useContabilidadBalanceSheet } from '../composables/useContabilidadFinancialStatements'
import { useContabilidadFinancialExport } from '../composables/useContabilidadFinancialExport'
import FinancialStatementSection from '../components/FinancialStatementSection.vue'
const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)

const { data, isLoading, isError, refetch } = useContabilidadBalanceSheet(periodId)
const showPrior = computed(() => Boolean(data.value?.priorPeriodId))
const { exportFinancialStatement, isExporting } = useContabilidadFinancialExport()

function exportExcel() {
  if (!periodId.value) return
  void exportFinancialStatement('balance-sheet', periodId.value, 'excel')
}

function exportPdf() {
  if (!periodId.value) return
  void exportFinancialStatement('balance-sheet', periodId.value, 'pdf')
}
</script>

<template>
  <div class="financial-report-print w-full space-y-6">
    <PageHeader
      icon="lucide:scale"
      title="Balance general"
      :subtitle="data ? `Al ${data.asOfLabel} · comparativo con periodo anterior` : 'Saldos acumulados por cuenta PCGE'"
    >
      <template #actions>
        <div class="flex flex-wrap gap-2 print:hidden">
          <BaseButton
            variant="secondary"
            :disabled="!activePeriod"
            :loading="isExporting('balance-sheet', 'excel')"
            @click="exportExcel"
          >
            <AppIcon icon="lucide:file-spreadsheet" :size="16" class="mr-1" />
            Excel
          </BaseButton>
          <BaseButton
            variant="secondary"
            :disabled="!activePeriod"
            :loading="isExporting('balance-sheet', 'pdf')"
            @click="exportPdf"
          >
            <AppIcon icon="lucide:file-text" :size="16" class="mr-1" />
            PDF
          </BaseButton>
        </div>
      </template>
    </PageHeader>

    <p v-if="!activePeriod" class="text-sm text-warning-600 dark:text-orange-400">
      Configure el periodo activo en Configuración ? Contexto contable.
    </p>

    <LoadingState v-if="isLoading" />

    <div v-else-if="isError" class="text-center py-8">
      <BaseButton @click="refetch()" variant="link">Reintentar</BaseButton>
    </div>

    <template v-else-if="data">
      <div
        v-if="!data.isBalanced"
        class="rounded-lg border px-4 py-3 text-sm border-warning-500 text-warning-600 dark:text-orange-400"
      >
        El balance no cuadra: diferencia {{ formatPen(data.difference) }}.
      </div>

      <FinancialStatementSection
        title="Activo"
        :lines="data.assets.lines"
        :total="data.assets.total"
        :show-prior="showPrior"
      />
      <FinancialStatementSection
        title="Pasivo"
        :lines="data.liabilities.lines"
        :total="data.liabilities.total"
        :show-prior="showPrior"
      />
      <FinancialStatementSection
        title="Patrimonio"
        :lines="data.equity.lines"
        :total="data.equity.total"
        :show-prior="showPrior"
      />

      <div
        class="rounded-xl border p-4 flex flex-col sm:flex-row sm:justify-between gap-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800"
      >
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Resultado del periodo</p>
          <p class="text-lg font-semibold font-mono">{{ formatPen(data.netIncomePeriod) }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-gray-500 dark:text-gray-400">Pasivo + patrimonio</p>
          <p class="text-lg font-semibold font-mono">{{ formatPen(data.totalLiabilitiesAndEquity) }}</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
@media print {
  .financial-report-print {
    max-width: none;
    padding: 0;
  }
}
</style>
