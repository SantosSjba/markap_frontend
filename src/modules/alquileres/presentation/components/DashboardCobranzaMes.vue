<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import { computed } from 'vue'
import { formatCurrency } from '@shared/utils/formatters'
import type {
  OverduePaymentItem,
  PaymentStats,
} from '../../features/cobranzas/domain/payment.types'
/**
 * DashboardCobranzaMes
 * Avance de cobranza del mes (cobrado vs. por cobrar) y foco en atrasos / morosidad.
 */

interface Props {
  stats?: PaymentStats
  overdue: OverduePaymentItem[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { stats: undefined, loading: false })

const currency = computed(() => props.stats?.currency ?? 'PEN')
const collected = computed(() => props.stats?.totalCollected ?? 0)
const pending = computed(() => props.stats?.totalPending ?? 0)
const rate = computed(() => {
  const expected = collected.value + pending.value
  return expected > 0 ? Math.round((collected.value / expected) * 100) : 0
})
const totalOwed = computed(() => props.overdue.reduce((acc, o) => acc + o.totalOwed, 0))
const criticalCount = computed(() => props.overdue.filter((o) => o.overdueLevel === 'critical').length)

const rows = computed(() => [
  { label: 'Pagos pendientes', value: String(props.stats?.pendingCount ?? 0), tone: '' },
  {
    label: 'Pagos vencidos',
    value: String(props.stats?.overdueCount ?? 0),
    tone: (props.stats?.overdueCount ?? 0) > 0 ? 'text-error-500 dark:text-error-400' : '',
  },
  {
    label: 'Inquilinos morosos',
    value: criticalCount.value > 0 ? `${props.overdue.length} (${criticalCount.value} críticos)` : String(props.overdue.length),
    tone: criticalCount.value > 0 ? 'text-error-500 dark:text-error-400' : '',
  },
  {
    label: 'Deuda acumulada',
    value: formatCurrency(totalOwed.value, currency.value),
    tone: totalOwed.value > 0 ? 'text-error-500 dark:text-error-400' : '',
  },
])
</script>

<template>
  <BaseCard padding="none" class="block">
    <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h3 class="font-semibold text-sm text-gray-800 dark:text-white/90">Cobranza del Mes</h3>
        <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">Cuotas del período actual</p>
      </div>
      <router-link
        :to="{ name: 'alquileres-cobranzas-atrasos' }"
        class="text-xs font-medium transition-colors text-brand-500 dark:text-brand-400"
      >
        Ver atrasos →
      </router-link>
    </div>

    <div class="px-5 py-4">
      <template v-if="loading">
        <div class="h-6 w-24 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
        <div class="mt-3 h-2.5 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800" />
        <div v-for="i in 4" :key="i" class="mt-3 h-4 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
      </template>

      <template v-else>
        <div class="flex items-baseline justify-between gap-2">
          <span class="text-2xl font-bold text-gray-800 dark:text-white/90">{{ rate }}%</span>
          <span class="text-theme-xs text-gray-400 dark:text-gray-500">cobrado</span>
        </div>
        <div class="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div class="h-full rounded-full bg-success-500 transition-all" :style="{ width: `${rate}%` }" />
        </div>
        <div class="mt-2 flex justify-between text-theme-xs">
          <span class="text-success-600 dark:text-success-500">
            {{ formatCurrency(collected, currency) }} cobrado
          </span>
          <span class="text-gray-500 dark:text-gray-400">
            {{ formatCurrency(pending, currency) }} por cobrar
          </span>
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
