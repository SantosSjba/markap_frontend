<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { AppIcon, PageHeader, StatsCard } from '@shared/components'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import { fetchIncomeTaxSummary } from '../../infrastructure/contabilidad-income-tax.api.repository'

const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)

const { data, isLoading } = useQuery({
  queryKey: computed(() => ['contabilidad-income-tax', periodId.value]),
  queryFn: () => fetchIncomeTaxSummary(periodId.value!),
  enabled: computed(() => Boolean(periodId.value)),
  staleTime: 15_000,
})

const summary = computed(() => data.value)

const periodLabel = computed(() => {
  if (!summary.value) return activePeriod.value ? `${activePeriod.value.year}-${String(activePeriod.value.month).padStart(2, '0')}` : '—'
  return `${summary.value.year}-${String(summary.value.month).padStart(2, '0')}`
})
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:landmark"
      title="Impuesto a la renta"
      :subtitle="`Estimación del periodo ${periodLabel} desde estado de resultados y cuenta 4012.`"
    />

    <div
      v-if="!activePeriod"
      class="rounded-xl border p-6 text-sm text-center"
      :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }"
    >
      Seleccione un periodo contable activo.
    </div>

    <div v-else-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <template v-else-if="summary">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Ingresos del periodo" :value="formatPen(summary.totalIncome)" />
        <StatsCard title="Gastos del periodo" :value="formatPen(summary.totalExpenses)" />
        <StatsCard title="Resultado antes de renta" :value="formatPen(summary.netIncomeBeforeTax)" />
        <StatsCard title="Saldo cuenta 4012" :value="formatPen(summary.rentaAccountBalance)" />
        <StatsCard title="Provisión estimada" :value="formatPen(summary.estimatedTaxProvision)" />
      </div>

      <div
        class="rounded-xl border p-4 text-sm"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }"
      >
        <p>
          Esta vista es un <strong>borrador estimativo</strong> para revisión interna. La determinación definitiva del
          impuesto a la renta y la declaración anual se implementan en la Fase 16 del plan.
        </p>
      </div>
    </template>
  </div>
</template>
