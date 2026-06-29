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
  void exportFinancialStatement('balance-sheet', periodId.value)
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:scale"
      title="Balance general"
      :subtitle="data ? `Al ${data.asOfLabel} · comparativo con periodo anterior` : 'Saldos acumulados por cuenta PCGE'"
    >
      <template #actions>
        <BaseButton
          variant="secondary"
          :disabled="!activePeriod"
          :loading="isExporting('balance-sheet')"
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
        class="rounded-xl border p-4 flex flex-wrap gap-6 justify-between text-sm"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <div>
          <span :style="{ color: 'var(--color-text-secondary)' }">Total activo</span>
          <p class="font-mono font-semibold text-lg">{{ formatPen(data.assets.total) }}</p>
        </div>
        <div>
          <span :style="{ color: 'var(--color-text-secondary)' }">Pasivo + patrimonio</span>
          <p class="font-mono font-semibold text-lg">{{ formatPen(data.totalLiabilitiesAndEquity) }}</p>
        </div>
        <div>
          <span :style="{ color: 'var(--color-text-secondary)' }">Resultado acumulado (ejercicio)</span>
          <p class="font-mono font-semibold">{{ formatPen(data.netIncomePeriod) }}</p>
        </div>
      </div>
    </template>
  </div>
</template>
