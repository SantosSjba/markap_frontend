<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { computed } from 'vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { useContabilidadFinancialAnalysis } from '../composables/useContabilidadReports'
const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)

const { data, isLoading, isError, refetch } = useContabilidadFinancialAnalysis(periodId)
const showPrior = computed(() => Boolean(data.value?.priorPeriodId))
const { isExporting, exportToExcel } = useExcelExport()

const hasAnyValue = computed(() =>
  (data.value?.ratios ?? []).some((r) => r.value != null && r.value !== ''),
)

function formatValue(unit: string, value: string | null) {
  if (value == null || value === '') return '—'
  if (unit === 'percent') return `${value}%`
  if (unit === 'ratio') return value
  return value
}

function formatExportValue(unit: string, value: string | null) {
  if (value == null || value === '') return ''
  return formatValue(unit, value)
}

async function exportAnalysisExcel() {
  if (!data.value) return
  const periodLabel = `${data.value.year}-${String(data.value.month).padStart(2, '0')}`
  await exportToExcel({
    fileName: `analisis-financiero-${periodLabel}.xlsx`,
    sheetName: 'Análisis',
    columns: [
      { header: 'Indicador', key: 'label', width: 32 },
      { header: 'Valor', key: 'value', width: 16 },
      { header: 'Periodo anterior', key: 'priorValue', width: 18 },
      { header: 'Unidad', key: 'unit', width: 12 },
      { header: 'Descripción', key: 'description', width: 48 },
    ],
    rows: data.value.ratios.map((r) => ({
      label: r.label,
      value: formatExportValue(r.unit, r.value),
      priorValue: formatExportValue(r.unit, r.priorValue),
      unit: r.unit,
      description: r.description,
    })),
  })
}

function printReport() {
  window.print()
}
</script>

<template>
  <div class="financial-report-print w-full space-y-6">
    <PageHeader
      icon="lucide:line-chart"
      title="Análisis financiero"
      :subtitle="data ? `Periodo ${data.year}-${String(data.month).padStart(2, '0')} · comparativo con periodo anterior` : 'Ratios clave con comparativo del periodo anterior'"
    >
      <template #actions>
        <div class="flex flex-wrap gap-2 print:hidden">
          <BaseButton
            variant="secondary"
            :disabled="!data"
            :loading="isExporting"
            @click="exportAnalysisExcel"
          >
            <AppIcon icon="lucide:file-spreadsheet" :size="16" class="mr-1" />
            Excel
          </BaseButton>
          <BaseButton variant="secondary" :disabled="!data" @click="printReport">
            <AppIcon icon="lucide:printer" :size="16" class="mr-1" />
            Imprimir / PDF
          </BaseButton>
        </div>
      </template>
    </PageHeader>

    <p v-if="!activePeriod" class="text-sm text-warning-600 dark:text-orange-400">
      Configure el periodo activo en Configuración ? Contexto contable.
    </p>

    <LoadingState v-if="isLoading" />

    <div v-else-if="isError" class="text-center py-8 print:hidden">
      <BaseButton @click="refetch()" variant="link">Reintentar</BaseButton>
    </div>

    <template v-else-if="data">
      <p
        v-if="!hasAnyValue"
        class="text-sm rounded-lg border px-4 py-3 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400"
      >
        Sin movimientos publicados en el periodo: los ratios se calcularán cuando haya asientos y saldos en el libro mayor.
      </p>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <BaseCard v-for="ratio in data.ratios" :key="ratio.key" padding="sm" class="flex flex-col gap-2 min-h-[7.5rem]">
          <div class="min-w-0">
            <p class="font-semibold text-sm leading-snug">{{ ratio.label }}</p>
            <p class="text-xs mt-1 line-clamp-2 text-gray-500 dark:text-gray-400">
              {{ ratio.description }}
            </p>
          </div>
          <div class="mt-auto pt-1">
            <p class="font-mono font-bold text-2xl tabular-nums">
              {{ formatValue(ratio.unit, ratio.value) }}
            </p>
            <p
              v-if="showPrior && ratio.priorValue != null"
              class="text-xs mt-1 font-mono tabular-nums text-gray-400 dark:text-gray-500"
            >
              Periodo ant.: {{ formatValue(ratio.unit, ratio.priorValue) }}
            </p>
          </div>
        </BaseCard>
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

  .financial-report-print .grid {
    display: block;
  }

  .financial-report-print .grid > div {
    break-inside: avoid;
    margin-bottom: 0.75rem;
    border: 1px solid #ccc;
  }
}
</style>
