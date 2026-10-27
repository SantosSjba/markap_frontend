<script setup lang="ts">
import { computed } from 'vue'
import type { RentalsByMonthItem } from '../../domain/reportes.types'
import MonthlyBarChart from '@shared/presentation/components/reports/MonthlyBarChart.vue'
/**
 * ContractsBarChart
 * Contratos nuevos (iniciados) mes a mes; el tooltip agrega vencidos y activos al cierre.
 */

const props = withDefaults(defineProps<{ data: RentalsByMonthItem[]; loading?: boolean }>(), {
  loading: false,
})

const contractsText = (n: number) => `${n} ${n === 1 ? 'contrato' : 'contratos'}`

const items = computed(() =>
  props.data.map((m) => ({
    key: `${m.year}-${m.month}`,
    monthName: m.monthName,
    year: m.year,
    value: m.newContracts,
    tooltip: `${m.monthName}: ${m.newContracts} nuevos · ${m.expiredContracts} vencidos · ${m.activeAtEndOfMonth} activos al cierre`,
  })),
)
</script>

<template>
  <MonthlyBarChart
    title="Contratos nuevos por mes"
    :items="items"
    :loading="loading"
    :format-value="contractsText"
    empty-text="Sin contratos iniciados en el período"
    integer
  />
</template>
