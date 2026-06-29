<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, PageHeader } from '@shared/components'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { useContabilidadFinancialAnalysis } from '../../application/useContabilidadReports'

const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)

const { data, isLoading, isError, refetch } = useContabilidadFinancialAnalysis(periodId)
const showPrior = computed(() => Boolean(data.value?.priorPeriodId))

function formatValue(unit: string, value: string | null) {
  if (value == null || value === '') return '—'
  if (unit === 'percent') return `${value}%`
  if (unit === 'ratio') return value
  return value
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[960px] mx-auto">
    <PageHeader
      icon="lucide:line-chart"
      title="Análisis financiero"
      subtitle="Ratios clave con comparativo del periodo anterior"
    />

    <p v-if="!activePeriod" class="text-sm" :style="{ color: 'var(--color-warning)' }">
      Seleccione un periodo activo en la barra superior.
    </p>

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div v-else-if="isError" class="text-center py-8">
      <button type="button" class="text-sm underline" @click="refetch()">Reintentar</button>
    </div>

    <div v-else-if="data" class="space-y-3">
      <div
        v-for="ratio in data.ratios"
        :key="ratio.key"
        class="rounded-xl border p-4"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="font-semibold">{{ ratio.label }}</p>
            <p class="text-xs mt-1" :style="{ color: 'var(--color-text-secondary)' }">
              {{ ratio.description }}
            </p>
          </div>
          <div class="text-right">
            <p class="font-mono font-bold text-xl">{{ formatValue(ratio.unit, ratio.value) }}</p>
            <p v-if="showPrior && ratio.priorValue != null" class="text-xs mt-1 font-mono" :style="{ color: 'var(--color-text-muted)' }">
              Ant.: {{ formatValue(ratio.unit, ratio.priorValue) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
