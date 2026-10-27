<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import { computed } from 'vue'
import { formatCurrency } from '@shared/utils/formatters'
import type {
  VentasConversionReport,
  VentasSalesByPeriodRow,
} from '../../features/ventas-reportes/domain/reportes.types'
/**
 * DashboardResumenAnio
 * Resultados acumulados del año: volumen vendido, cierres, ticket promedio y conversión
 * (equivalente a «Finanzas de la Cartera» en Alquileres).
 */

interface Props {
  year: number
  sales: VentasSalesByPeriodRow[]
  conversion?: VentasConversionReport
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { conversion: undefined, loading: false })

const closings = computed(() => props.sales.reduce((acc, r) => acc + r.closingsCount, 0))
const volume = computed(() => props.sales.reduce((acc, r) => acc + r.totalAmount, 0))
const avgTicket = computed(() => (closings.value > 0 ? volume.value / closings.value : 0))

const rows = computed(() => {
  const c = props.conversion
  return [
    { label: 'Cierres', value: String(closings.value) },
    { label: 'Ticket promedio', value: formatCurrency(avgTicket.value, 'PEN') },
    { label: 'Oportunidades creadas', value: String(c?.opportunitiesCreated ?? 0) },
    { label: 'Ganadas / perdidas', value: `${c?.opportunitiesWon ?? 0} / ${c?.opportunitiesLost ?? 0}` },
    { label: 'Separaciones', value: String(c?.separationsCreated ?? 0) },
  ]
})
</script>

<template>
  <BaseCard padding="none" class="block">
    <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h3 class="font-semibold text-sm text-gray-800 dark:text-white/90">Resultados {{ year }}</h3>
        <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">Acumulado del año</p>
      </div>
      <router-link
        :to="{ name: 'ventas-reportes' }"
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
          <span class="text-2xl font-bold text-gray-800 dark:text-white/90">{{ formatCurrency(volume, 'PEN') }}</span>
          <span class="text-theme-xs text-gray-400 dark:text-gray-500">
            vendido · conversión {{ Math.round(conversion?.conversionRatePercent ?? 0) }}%
          </span>
        </div>

        <ul class="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
          <li v-for="r in rows" :key="r.label" class="flex items-center justify-between py-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ r.label }}</span>
            <span class="text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ r.value }}</span>
          </li>
        </ul>
      </template>
    </div>
  </BaseCard>
</template>
