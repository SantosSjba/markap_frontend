<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, BaseButton, PageHeader } from '@shared/components'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import { useContabilidadCashFlowStatement } from '../../application/useContabilidadFinancialStatements'
import { useContabilidadFinancialExport } from '../../application/useContabilidadFinancialExport'

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
  <div class="financial-report-print px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
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
        v-for="(section, key) in [
          { title: 'Actividades operativas', lines: data.operating },
          { title: 'Actividades de inversión', lines: data.investing },
          { title: 'Actividades de financiamiento', lines: data.financing },
        ]"
        :key="key"
        class="rounded-xl border overflow-hidden"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <div class="px-4 py-3 border-b font-semibold" :style="{ borderColor: 'var(--color-border)' }">
          {{ section.title }}
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <th class="text-left py-2 px-4">Concepto</th>
              <th v-if="showPrior" class="text-right py-2 px-4">Periodo ant.</th>
              <th class="text-right py-2 px-4">Periodo actual</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(line, idx) in section.lines"
              :key="idx"
              class="border-b last:border-0"
              :class="{ 'font-semibold': line.label.includes('neto') }"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <td class="py-2 px-4">{{ line.label }}</td>
              <td v-if="showPrior" class="py-2 px-4 text-right font-mono">
                {{ formatPen(line.priorAmount) }}
              </td>
              <td class="py-2 px-4 text-right font-mono">{{ formatPen(line.amount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="rounded-xl border p-4 grid gap-4 sm:grid-cols-3 text-sm"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <div>
          <span :style="{ color: 'var(--color-text-secondary)' }">Variación neta de efectivo (indirecto)</span>
          <p class="font-mono font-bold text-lg">{{ formatPen(data.netCashChange) }}</p>
        </div>
        <div>
          <span :style="{ color: 'var(--color-text-secondary)' }">Tesorería — ingresos</span>
          <p class="font-mono">{{ formatPen(data.treasuryInTotal) }}</p>
        </div>
        <div>
          <span :style="{ color: 'var(--color-text-secondary)' }">Tesorería — egresos</span>
          <p class="font-mono">{{ formatPen(data.treasuryOutTotal) }}</p>
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
