<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import { computed } from 'vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '../../../asientos/domain/journal.utils'
import { useContabilidadCashFlowStatement } from '../composables/useContabilidadFinancialStatements'
import { useContabilidadFinancialExport } from '../composables/useContabilidadFinancialExport'
const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)

const { data, isLoading, isError, refetch } = useContabilidadCashFlowStatement(periodId)
const showPrior = computed(() => Boolean(data.value?.priorPeriodId))
const { exportFinancialStatement, isExporting } = useContabilidadFinancialExport()

function exportExcel() {
  if (!periodId.value) return
  void exportFinancialStatement('cash-flow', periodId.value, 'excel')
}

function exportPdf() {
  if (!periodId.value) return
  void exportFinancialStatement('cash-flow', periodId.value, 'pdf')
}
</script>

<template>
  <div class="financial-report-print w-full space-y-6">
    <PageHeader
      icon="lucide:arrow-left-right"
      title="Flujo de efectivo"
      subtitle="Método indirecto (v1) — operativo, inversión y financiamiento"
    >
      <template #actions>
        <div class="flex flex-wrap gap-2 print:hidden">
          <BaseButton
            variant="secondary"
            :disabled="!activePeriod"
            :loading="isExporting('cash-flow', 'excel')"
            @click="exportExcel"
          >
            <AppIcon icon="lucide:file-spreadsheet" :size="16" class="mr-1" />
            Excel
          </BaseButton>
          <BaseButton
            variant="secondary"
            :disabled="!activePeriod"
            :loading="isExporting('cash-flow', 'pdf')"
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
      <BaseCard v-for="(section, key) in [
          { title: 'Actividades operativas', lines: data.operating },
          { title: 'Actividades de inversión', lines: data.investing },
          { title: 'Actividades de financiamiento', lines: data.financing },
        ]" :key="key" padding="none" class="block overflow-hidden">
        <div class="px-4 py-3 border-b font-semibold border-gray-200 dark:border-gray-800">
          {{ section.title }}
        </div>
        <Table class="w-full text-sm">
          <TableHeader>
            <TableRow class="border-b border-gray-200 dark:border-gray-800">
              <TableCell is-header class="text-left py-2 px-4">Concepto</TableCell>
              <TableCell is-header v-if="showPrior" class="text-right py-2 px-4">Periodo ant.</TableCell>
              <TableCell is-header class="text-right py-2 px-4">Periodo actual</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="(line, idx) in section.lines"
              :key="idx"
              class="border-b last:border-0 border-gray-200 dark:border-gray-800"
              :class="{ 'font-semibold': line.label.includes('neto') }"
            >
              <TableCell class="py-2 px-4">{{ line.label }}</TableCell>
              <TableCell v-if="showPrior" class="py-2 px-4 text-right font-mono">
                {{ formatPen(line.priorAmount) }}
              </TableCell>
              <TableCell class="py-2 px-4 text-right font-mono">{{ formatPen(line.amount) }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </BaseCard>

      <BaseCard padding="sm" class="grid gap-4 sm:grid-cols-3 text-sm">
        <div>
          <span class="text-gray-500 dark:text-gray-400">Variación neta de efectivo (indirecto)</span>
          <p class="font-mono font-bold text-lg">{{ formatPen(data.netCashChange) }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400">Tesorería — ingresos</span>
          <p class="font-mono">{{ formatPen(data.treasuryInTotal) }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400">Tesorería — egresos</span>
          <p class="font-mono">{{ formatPen(data.treasuryOutTotal) }}</p>
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
