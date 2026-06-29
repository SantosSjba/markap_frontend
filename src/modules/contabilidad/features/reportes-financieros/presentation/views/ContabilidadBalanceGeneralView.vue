<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, BaseButton, PageHeader } from '@shared/components'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import { useContabilidadBalanceSheet } from '../../application/useContabilidadFinancialStatements'
import { useContabilidadFinancialExport } from '../../application/useContabilidadFinancialExport'
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
  <div class="financial-report-print px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
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
      <div
        v-if="!data.isBalanced"
        class="rounded-lg border px-4 py-3 text-sm"
        :style="{ borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }"
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
        class="rounded-xl border p-4 flex flex-col sm:flex-row sm:justify-between gap-2"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }"
      >
        <div>
          <p class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">Resultado del periodo</p>
          <p class="text-lg font-semibold font-mono">{{ formatPen(data.netIncomePeriod) }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">Pasivo + patrimonio</p>
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