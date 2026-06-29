<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, BaseButton, PageHeader } from '@shared/components'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import { useContabilidadIncomeStatement } from '../../application/useContabilidadFinancialStatements'
import { useContabilidadFinancialExport } from '../../application/useContabilidadFinancialExport'
import FinancialStatementSection from '../components/FinancialStatementSection.vue'

const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)

const { data, isLoading, isError, refetch } = useContabilidadIncomeStatement(periodId)
const showPrior = computed(() => Boolean(data.value?.priorPeriodId))
const { exportFinancialStatement, isExporting } = useContabilidadFinancialExport()

function exportExcel() {
  if (!periodId.value) return
  void exportFinancialStatement('income-statement', periodId.value)
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:trending-up"
      title="Estado de resultados"
      subtitle="Ingresos y gastos del periodo con comparativo mensual"
    >
      <template #actions>
        <BaseButton
          variant="secondary"
          :disabled="!activePeriod"
          :loading="isExporting('income-statement')"
          @click="exportExcel"
        >
          <AppIcon icon="lucide:file-spreadsheet" :size="16" class="mr-1" />
          Exportar Excel
        </BaseButton>
      </template>
    </PageHeader>

    <p v-if="!activePeriod" class="text-sm" :style="{ color: 'var(--color-warning)' }">
      Seleccione un periodo activo en la barra superior.
    </p>

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div v-else-if="isError" class="text-center py-8">
      <button type="button" class="text-sm underline" @click="refetch()">Reintentar</button>
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

      <div
        class="rounded-xl border p-4 flex flex-wrap gap-8"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <div>
          <span class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">Utilidad neta del periodo</span>
          <p class="font-mono font-bold text-xl mt-1">{{ formatPen(data.netIncome) }}</p>
        </div>
        <div v-if="data.priorNetIncome != null">
          <span class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">Periodo anterior</span>
          <p class="font-mono font-semibold text-lg mt-1">{{ formatPen(data.priorNetIncome) }}</p>
        </div>
      </div>
    </template>
  </div>
</template>
