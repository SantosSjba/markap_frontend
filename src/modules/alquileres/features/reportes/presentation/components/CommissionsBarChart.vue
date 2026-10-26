<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import type { RentalsByMonthItem } from '../../domain/reportes.types'
import MonthlyBarChart from './MonthlyBarChart.vue'
/**
 * CommissionsBarChart
 * Ingresos por comisiones cobradas mes a mes.
 * Una moneda a la vez: soles y dólares no comparten escala ni se suman.
 */

interface Props {
  data: RentalsByMonthItem[]
  loading?: boolean
  formatAmount: (value: number, currency: string) => string
  /** Monedas que se pueden graficar (las elegidas en la vista); por defecto, todas */
  currencies?: string[]
}

const props = withDefaults(defineProps<Props>(), { loading: false })

const currencies = computed(() => {
  if (props.currencies?.length) return props.currencies
  const set = new Set<string>()
  for (const m of props.data) for (const t of m.totalsByCurrency) set.add(t.currency)
  return [...set].sort()
})
const currency = ref('PEN')
watch(
  currencies,
  (list) => {
    if (list.length && !list.includes(currency.value)) currency.value = list[0]!
  },
  { immediate: true },
)
const currencyTabs = computed(() => currencies.value.map((c) => ({ id: c, label: c })))

const items = computed(() =>
  props.data.map((m) => {
    const t = m.totalsByCurrency.find((x) => x.currency === currency.value)
    const value = t?.companyRevenue ?? 0
    const count = t?.collectedCommissions ?? 0
    return {
      key: `${m.year}-${m.month}`,
      monthName: m.monthName,
      year: m.year,
      value,
      tooltip: `${m.monthName}: ${props.formatAmount(value, currency.value)} · ${count} ${count === 1 ? 'comisión cobrada' : 'comisiones cobradas'}`,
    }
  }),
)
</script>

<template>
  <MonthlyBarChart
    title="Ingresos por comisiones por mes"
    :items="items"
    :loading="loading"
    :format-value="(v) => formatAmount(v, currency)"
    empty-text="Sin comisiones cobradas en el período"
  >
    <template #actions>
      <BaseTabs
        v-if="currencyTabs.length > 1"
        v-model="currency"
        :tabs="currencyTabs"
        variant="segmented"
      />
    </template>
  </MonthlyBarChart>
</template>
