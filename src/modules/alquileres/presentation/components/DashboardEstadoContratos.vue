<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import { computed } from 'vue'
import type { ContractStatusSummary } from '../../features/reportes/domain/reportes.types'
/**
 * DashboardEstadoContratos
 * Distribución de contratos activos por días restantes: barra apilada + leyenda con conteo y %.
 */

interface Props {
  data?: ContractStatusSummary
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { data: undefined, loading: false })

const segments = computed(() => {
  const d = props.data ?? { vigentes: 0, porVencer: 0, proximos: 0, urgentes: 0 }
  return [
    { id: 'vigentes', label: 'Vigentes', range: 'más de 90 días', value: d.vigentes, color: 'bg-success-500' },
    { id: 'porVencer', label: 'Por vencer', range: '61 – 90 días', value: d.porVencer, color: 'bg-blue-light-500' },
    { id: 'proximos', label: 'Próximos', range: '31 – 60 días', value: d.proximos, color: 'bg-warning-500' },
    { id: 'urgentes', label: 'Urgentes', range: '0 – 30 días', value: d.urgentes, color: 'bg-error-500' },
  ]
})

const total = computed(() => segments.value.reduce((acc, s) => acc + s.value, 0))

function percent(value: number) {
  return total.value > 0 ? Math.round((value / total.value) * 100) : 0
}
</script>

<template>
  <BaseCard padding="none" class="block">
    <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h3 class="font-semibold text-sm text-gray-800 dark:text-white/90">Estado de Contratos</h3>
        <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">Activos según días para vencer</p>
      </div>
      <div class="text-right">
        <span class="text-lg font-bold text-gray-800 dark:text-white/90">{{ loading ? '—' : total }}</span>
        <span class="block text-theme-xs text-gray-400 dark:text-gray-500">activos</span>
      </div>
    </div>

    <div class="px-5 py-4">
      <template v-if="loading">
        <div class="h-2.5 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800" />
        <div v-for="i in 4" :key="i" class="mt-3 h-4 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
      </template>

      <template v-else>
        <!-- Barra apilada -->
        <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            v-for="s in segments"
            v-show="s.value > 0"
            :key="s.id"
            :class="s.color"
            class="h-full transition-all"
            :style="{ width: `${(s.value / Math.max(total, 1)) * 100}%` }"
            :title="`${s.label}: ${s.value}`"
          />
        </div>

        <!-- Leyenda -->
        <ul class="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
          <li v-for="s in segments" :key="s.id" class="flex items-center gap-2.5 py-2">
            <span class="h-2.5 w-2.5 shrink-0 rounded-sm" :class="s.color" />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ s.label }}</span>
            <span class="text-theme-xs text-gray-400 dark:text-gray-500">{{ s.range }}</span>
            <span class="ml-auto text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">
              {{ s.value }}
            </span>
            <span class="w-10 text-right text-theme-xs tabular-nums text-gray-400 dark:text-gray-500">
              {{ percent(s.value) }}%
            </span>
          </li>
        </ul>
      </template>
    </div>
  </BaseCard>
</template>
