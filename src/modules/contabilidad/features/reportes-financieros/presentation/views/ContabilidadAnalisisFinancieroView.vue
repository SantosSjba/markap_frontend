<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, PageHeader } from '@shared/components'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { useContabilidadFinancialAnalysis } from '../../application/useContabilidadReports'

const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)

const { data, isLoading, isError, refetch } = useContabilidadFinancialAnalysis(periodId)
const showPrior = computed(() => Boolean(data.value?.priorPeriodId))

const hasAnyValue = computed(() =>
  (data.value?.ratios ?? []).some((r) => r.value != null && r.value !== ''),
)

function formatValue(unit: string, value: string | null) {
  if (value == null || value === '') return '—'
  if (unit === 'percent') return `${value}%`
  if (unit === 'ratio') return value
  return value
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1200px] mx-auto w-full">
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

    <template v-else-if="data">
      <p
        v-if="!hasAnyValue"
        class="text-sm rounded-lg border px-4 py-3"
        :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }"
      >
        Sin movimientos publicados en el periodo: los ratios se calcularán cuando haya asientos y saldos en el libro mayor.
      </p>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="ratio in data.ratios"
          :key="ratio.key"
          class="rounded-xl border p-4 flex flex-col gap-2 min-h-[7.5rem]"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <div class="min-w-0">
            <p class="font-semibold text-sm leading-snug">{{ ratio.label }}</p>
            <p class="text-xs mt-1 line-clamp-2" :style="{ color: 'var(--color-text-secondary)' }">
              {{ ratio.description }}
            </p>
          </div>
          <div class="mt-auto pt-1">
            <p class="font-mono font-bold text-2xl tabular-nums">
              {{ formatValue(ratio.unit, ratio.value) }}
            </p>
            <p
              v-if="showPrior && ratio.priorValue != null"
              class="text-xs mt-1 font-mono tabular-nums"
              :style="{ color: 'var(--color-text-muted)' }"
            >
              Periodo ant.: {{ formatValue(ratio.unit, ratio.priorValue) }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
