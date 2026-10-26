<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import { computed } from 'vue'
import { formatCurrency } from '@shared/utils/formatters'
import { RENTAL_UTILITY_NET_SHORT_LABEL } from '../../features/alquileres/domain/rental-financial.labels'
import type { RentalsByMonthItem } from '../../features/reportes/domain/reportes.types'
/**
 * DashboardFinanzasCartera
 * Comisiones cobradas en el mes actual (ingreso, descuentos, utilidad) y acumulado del año,
 * en una moneda (la principal); las demás monedas no se suman.
 */

interface Props {
  data: RentalsByMonthItem[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })

const currentMonth = new Date().getMonth() + 1

const monthItem = computed(() => props.data.find((d) => d.month === currentMonth))
/** Moneda mostrada: soles si hubo cobros en soles; si no, la primera con cobros en el año */
const currency = computed(() => {
  const all = new Set(props.data.flatMap((d) => d.totalsByCurrency.map((t) => t.currency)))
  return all.has('PEN') || all.size === 0 ? 'PEN' : [...all].sort()[0]!
})
const hasOtherCurrencies = computed(() =>
  props.data.some((d) => d.totalsByCurrency.some((t) => t.currency !== currency.value)),
)
const totalsIn = (d: RentalsByMonthItem | undefined) =>
  d?.totalsByCurrency.find((t) => t.currency === currency.value)
const month = computed(() => totalsIn(monthItem.value))
const ytdUtility = computed(() =>
  props.data
    .filter((d) => d.month <= currentMonth)
    .reduce((acc, d) => acc + (totalsIn(d)?.totalUtility ?? 0), 0),
)
const margin = computed(() => {
  const base = month.value?.companyRevenue ?? 0
  return base > 0 ? Math.round(((month.value?.totalUtility ?? 0) / base) * 100) : 0
})

const rows = computed(() => {
  const m = month.value
  return [
    { label: 'Comisiones cobradas', value: m?.collectedCommissions ?? 0, negative: false, count: true },
    { label: 'Ingreso', value: m?.companyRevenue ?? 0, negative: false },
    { label: 'Gastos e impuestos', value: (m?.totalExpense ?? 0) + (m?.totalTax ?? 0), negative: true },
    {
      label: 'Comisiones de agentes',
      value: (m?.totalExternalCommission ?? 0) + (m?.totalInternalCommission ?? 0),
      negative: true,
    },
  ]
})
</script>

<template>
  <BaseCard padding="none" class="block">
    <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h3 class="font-semibold text-sm text-gray-800 dark:text-white/90">Finanzas de la Cartera</h3>
        <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
          {{ monthItem?.monthName ?? 'Mes actual' }} · comisiones cobradas{{ hasOtherCurrencies ? ` · en ${currency}` : '' }}
        </p>
      </div>
      <router-link
        :to="{ name: 'alquileres-reportes' }"
        class="text-xs font-medium transition-colors text-brand-500 dark:text-brand-400"
      >
        Reportes →
      </router-link>
    </div>

    <div class="px-5 py-4">
      <template v-if="loading">
        <div class="h-6 w-28 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
        <div v-for="i in 5" :key="i" class="mt-3 h-4 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
      </template>

      <template v-else>
        <div class="flex items-baseline justify-between gap-2">
          <span
            class="text-2xl font-bold"
            :class="(month?.totalUtility ?? 0) >= 0 ? 'text-gray-800 dark:text-white/90' : 'text-error-500 dark:text-error-400'"
          >
            {{ formatCurrency(month?.totalUtility ?? 0, currency) }}
          </span>
          <span class="text-theme-xs text-gray-400 dark:text-gray-500">
            {{ RENTAL_UTILITY_NET_SHORT_LABEL.toLowerCase() }} · margen {{ margin }}%
          </span>
        </div>

        <ul class="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
          <li v-for="r in rows" :key="r.label" class="flex items-center justify-between py-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ r.label }}</span>
            <span class="text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">
              <template v-if="'count' in r">{{ r.value }}</template>
              <template v-else>{{ r.negative && r.value > 0 ? '−' : '' }}{{ formatCurrency(r.value, currency) }}</template>
            </span>
          </li>
          <li class="flex items-center justify-between py-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ RENTAL_UTILITY_NET_SHORT_LABEL }} acumulada {{ new Date().getFullYear() }}
            </span>
            <span class="text-sm font-semibold tabular-nums text-brand-500 dark:text-brand-400">
              {{ formatCurrency(ytdUtility, currency) }}
            </span>
          </li>
        </ul>
      </template>
    </div>
  </BaseCard>
</template>
