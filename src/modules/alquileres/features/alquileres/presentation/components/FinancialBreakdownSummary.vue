<script setup lang="ts">
import { computed } from 'vue'
import { useCurrencyCatalog } from '../../../../presentation/composables/useCurrencyCatalog'
import { RENTAL_UTILITY_NET_LABEL } from '../../domain/rental-financial.labels'
import type { RentalFinancialBreakdown } from '../../domain/rental.types'
/**
 * FinancialBreakdownSummary — desglose de la distribución (cada concepto en su moneda) y,
 * si hay más de una moneda, el resumen por moneda (no se convierten entre sí).
 */

const props = defineProps<{ breakdown: RentalFinancialBreakdown }>()

const { format } = useCurrencyCatalog()

const lines = computed(() => {
  const b = props.breakdown
  const c = b.config
  const cur = b.lineCurrencies
  return [
    { label: 'Ingreso base', amount: b.baseAmount, currency: cur.base, sign: '+', detail: null },
    { label: 'Gastos', amount: b.expense, currency: cur.expense, sign: '−', detail: c?.expenseDetail },
    { label: 'Impuestos', amount: b.tax, currency: cur.tax, sign: '−', detail: c?.taxDetail },
    {
      label: 'Agente externo',
      amount: b.externalAgentCommission,
      currency: cur.externalAgentCommission,
      sign: '−',
      detail: c?.externalAgentName,
    },
    {
      label: 'Agente interno',
      amount: b.internalAgentCommission,
      currency: cur.internalAgentCommission,
      sign: '−',
      detail: c?.internalAgentName,
    },
  ]
})

const multiCurrency = computed(() => props.breakdown.totalsByCurrency.length > 1)
</script>

<template>
  <div class="space-y-4">
    <ul class="divide-y divide-gray-100 text-sm dark:divide-gray-800">
      <li v-for="line in lines" :key="line.label" class="flex items-start justify-between gap-3 py-2">
        <div class="min-w-0">
          <p :class="line.sign === '+' ? 'font-medium text-gray-800 dark:text-white/90' : 'text-gray-600 dark:text-gray-400'">
            {{ line.label }}
          </p>
          <p v-if="line.detail" class="truncate text-theme-xs text-gray-400 dark:text-gray-500">{{ line.detail }}</p>
        </div>
        <span
          class="shrink-0 tabular-nums"
          :class="line.sign === '+' ? 'font-semibold text-gray-800 dark:text-white/90' : 'text-gray-600 dark:text-gray-400'"
        >
          {{ line.sign === '−' && line.amount ? '− ' : '' }}{{ format(line.amount, line.currency) }}
        </span>
      </li>
      <li v-if="!multiCurrency" class="flex items-center justify-between gap-3 py-2.5">
        <span class="font-bold text-gray-800 dark:text-white/90">{{ RENTAL_UTILITY_NET_LABEL }}</span>
        <span
          class="font-bold tabular-nums"
          :class="breakdown.utility >= 0 ? 'text-brand-500 dark:text-brand-400' : 'text-error-500'"
        >
          {{ format(breakdown.utility, breakdown.currency) }}
        </span>
      </li>
    </ul>

    <!-- Resumen por moneda: los montos en distintas monedas no se suman -->
    <div v-if="multiCurrency">
      <p class="mb-2 text-theme-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
        Resumen por moneda
      </p>
      <div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-theme-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th class="px-3 py-2 text-start font-normal">Moneda</th>
              <th class="px-3 py-2 text-end font-normal">Ingresos</th>
              <th class="px-3 py-2 text-end font-normal">Descuentos</th>
              <th class="px-3 py-2 text-end font-normal">Neto</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="t in breakdown.totalsByCurrency" :key="t.currency">
              <td class="px-3 py-2 font-medium text-gray-800 dark:text-white/90">{{ t.currency }}</td>
              <td class="px-3 py-2 text-end tabular-nums text-gray-700 dark:text-gray-300">
                {{ format(t.income, t.currency) }}
              </td>
              <td class="px-3 py-2 text-end tabular-nums text-gray-500 dark:text-gray-400">
                {{ format(t.expense + t.tax + t.externalAgentCommission + t.internalAgentCommission, t.currency) }}
              </td>
              <td
                class="px-3 py-2 text-end font-semibold tabular-nums"
                :class="t.utility >= 0 ? 'text-brand-500 dark:text-brand-400' : 'text-error-500'"
              >
                {{ format(t.utility, t.currency) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-2 text-theme-xs text-gray-400 dark:text-gray-500">
        Sin conversión entre monedas: {{ RENTAL_UTILITY_NET_LABEL.toLowerCase() }} en la moneda del contrato
        = {{ format(breakdown.utility, breakdown.currency) }}.
      </p>
    </div>
  </div>
</template>
