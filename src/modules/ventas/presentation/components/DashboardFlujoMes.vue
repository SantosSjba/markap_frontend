<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import { computed } from 'vue'
import { formatCurrency } from '@shared/utils/formatters'
import type { VentasFinancialFlowReport } from '../../features/ventas-reportes/domain/reportes.types'
/**
 * DashboardFlujoMes
 * Flujo financiero del mes: cobrado a compradores vs. saldo por cobrar, comisiones y costos
 * (equivalente a «Cobranza del Mes» en Alquileres).
 */

interface Props {
  data?: VentasFinancialFlowReport
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { data: undefined, loading: false })

const collected = computed(() => props.data?.buyerPaymentsCollected ?? 0)
const pending = computed(() => props.data?.buyerPaymentsPending ?? 0)
const rate = computed(() => {
  const expected = collected.value + pending.value
  return expected > 0 ? Math.round((collected.value / expected) * 100) : 0
})
const net = computed(() => props.data?.estimatedNetAfterCosts ?? 0)

const rows = computed(() => [
  { label: 'Comisiones pagadas', value: `−${formatCurrency(props.data?.commissionsPaidAmount ?? 0, 'PEN')}`, tone: '' },
  { label: 'Comisiones por pagar', value: formatCurrency(props.data?.commissionsPendingAmount ?? 0, 'PEN'), tone: '' },
  { label: 'Costos de documentación', value: `−${formatCurrency(props.data?.documentationCostsTotal ?? 0, 'PEN')}`, tone: '' },
  {
    label: 'Neto estimado',
    value: formatCurrency(net.value, 'PEN'),
    tone: net.value >= 0 ? 'text-brand-500 dark:text-brand-400' : 'text-error-500 dark:text-error-400',
  },
])
</script>

<template>
  <BaseCard padding="none" class="block">
    <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h3 class="font-semibold text-sm text-gray-800 dark:text-white/90">Flujo del Mes</h3>
        <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">Cobros a compradores, comisiones y costos</p>
      </div>
      <router-link
        :to="{ name: 'ventas-comisiones' }"
        class="text-xs font-medium transition-colors text-brand-500 dark:text-brand-400"
      >
        Ver comisiones →
      </router-link>
    </div>

    <div class="px-5 py-4">
      <template v-if="loading">
        <div class="h-6 w-24 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
        <div class="mt-3 h-2.5 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800" />
        <div v-for="i in 5" :key="i" class="mt-3 h-4 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
      </template>

      <template v-else>
        <div class="flex items-baseline justify-between gap-2">
          <span class="text-2xl font-bold text-gray-800 dark:text-white/90">{{ rate }}%</span>
          <span class="text-theme-xs text-gray-400 dark:text-gray-500">cobrado del saldo</span>
        </div>
        <div class="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div class="h-full rounded-full bg-success-500 transition-all" :style="{ width: `${rate}%` }" />
        </div>
        <div class="mt-2 flex justify-between gap-2 text-theme-xs">
          <span class="text-success-600 dark:text-success-500">{{ formatCurrency(collected, 'PEN') }} cobrado</span>
          <span class="text-gray-500 dark:text-gray-400">{{ formatCurrency(pending, 'PEN') }} por cobrar</span>
        </div>

        <ul class="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
          <li v-for="r in rows" :key="r.label" class="flex items-center justify-between py-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ r.label }}</span>
            <span class="text-sm font-semibold tabular-nums" :class="r.tone || 'text-gray-800 dark:text-white/90'">
              {{ r.value }}
            </span>
          </li>
        </ul>
      </template>
    </div>
  </BaseCard>
</template>
