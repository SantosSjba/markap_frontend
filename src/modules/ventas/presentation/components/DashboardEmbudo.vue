<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import { computed } from 'vue'
import {
  PIPELINE_STAGE_META,
  PIPELINE_STAGE_OPTIONS,
} from '../../features/ventas-sales/domain/pipeline.constants'
/**
 * DashboardEmbudo
 * Procesos activos por etapa del pipeline: barra apilada + leyenda con conteo y %
 * (equivalente a «Estado de Contratos» en Alquileres).
 */

interface Props {
  /** Conteo de procesos activos por código de etapa */
  byStage?: Record<string, number>
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { byStage: undefined, loading: false })

const segments = computed(() =>
  PIPELINE_STAGE_OPTIONS.map((s) => ({
    id: s.value,
    label: s.label,
    value: props.byStage?.[s.value] ?? 0,
    color: PIPELINE_STAGE_META[s.value].color,
  })),
)

const total = computed(() => segments.value.reduce((acc, s) => acc + s.value, 0))

function percent(value: number) {
  return total.value > 0 ? Math.round((value / total.value) * 100) : 0
}
</script>

<template>
  <BaseCard padding="none" class="block">
    <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h3 class="font-semibold text-sm text-gray-800 dark:text-white/90">Embudo de Ventas</h3>
        <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">Procesos activos por etapa</p>
      </div>
      <router-link :to="{ name: 'ventas-procesos-pipeline' }" class="text-right">
        <span class="text-lg font-bold text-gray-800 dark:text-white/90">{{ loading ? '—' : total }}</span>
        <span class="block text-theme-xs text-brand-500 dark:text-brand-400">Ver pipeline →</span>
      </router-link>
    </div>

    <div class="px-5 py-4">
      <template v-if="loading">
        <div class="h-2.5 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800" />
        <div v-for="i in 4" :key="i" class="mt-3 h-4 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
      </template>

      <template v-else>
        <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            v-for="s in segments"
            v-show="s.value > 0"
            :key="s.id"
            class="h-full transition-all"
            :style="{ width: `${(s.value / Math.max(total, 1)) * 100}%`, backgroundColor: s.color }"
            :title="`${s.label}: ${s.value}`"
          />
        </div>

        <ul class="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
          <li v-for="s in segments" :key="s.id" class="flex items-center gap-2.5 py-2">
            <span class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ backgroundColor: s.color }" />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ s.label }}</span>
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
