<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { computed } from 'vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '../../../asientos/domain/journal.utils'
import { useContabilidadIncomeStatement } from '../composables/useContabilidadFinancialStatements'
import { useContabilidadFinancialExport } from '../composables/useContabilidadFinancialExport'
import FinancialStatementSection from '../components/FinancialStatementSection.vue'
const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)

const { data, isLoading, isError, refetch } = useContabilidadIncomeStatement(periodId)
const showPrior = computed(() => Boolean(data.value?.priorPeriodId))
const { exportFinancialStatement, isExporting } = useContabilidadFinancialExport()

function exportExcel() {
  if (!periodId.value) return
  void exportFinancialStatement('income-statement', periodId.value, 'excel')
}

function exportPdf() {
  if (!periodId.value) return
  void exportFinancialStatement('income-statement', periodId.value, 'pdf')
}
</script>

<template>
  <div class="financial-report-print w-full space-y-6">
    <PageHeader
      icon="lucide:trending-up"
      title="Estado de resultados"
      subtitle="Ingresos y gastos del periodo con comparativo mensual"
    >
      <template #actions>
        <div class="flex flex-wrap gap-2 print:hidden">
          <BaseButton
            variant="secondary"
            :disabled="!activePeriod"
            :loading="isExporting('income-statement', 'excel')"
            @click="exportExcel"
          >
            <AppIcon icon="lucide:file-spreadsheet" :size="16" class="mr-1" />
            Excel
          </BaseButton>
          <BaseButton
            variant="secondary"
            :disabled="!activePeriod"
            :loading="isExporting('income-statement', 'pdf')"
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
      <FinancialStatementSection
        title="Ingresos"
        :lines="data.income.lines"
        :total="data.income.total"
        :show-prior="showPrior"
      />
      <FinancialStatementSection
        title="Gastos"
        :lines="data.expenses.lines"
        :total="data.expenses.total"
        :show-prior="showPrior"
      />

      <BaseCard padding="sm" class="flex flex-wrap gap-8 flex-row">
        <div>
          <span class="text-sm text-gray-500 dark:text-gray-400">Utilidad neta del periodo</span>
          <p class="font-mono font-bold text-xl mt-1">{{ formatPen(data.netIncome) }}</p>
        </div>
        <div v-if="data.priorNetIncome != null">
          <span class="text-sm text-gray-500 dark:text-gray-400">Periodo anterior</span>
          <p class="font-mono font-semibold text-lg mt-1">{{ formatPen(data.priorNetIncome) }}</p>
        </div>
      </BaseCard>
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
