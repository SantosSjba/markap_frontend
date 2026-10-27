<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { formatCurrency } from '@shared/utils/formatters'
import type { SaleProcessListRow } from '../../features/ventas-sales/domain/sales.types'
import {
  pipelineStageLabel,
  pipelineStageMeta,
} from '../../features/ventas-sales/domain/pipeline.constants'
/**
 * DashboardProcesosList
 * Procesos de venta activos con movimiento más reciente, con su etapa del pipeline
 * (equivalente a «Contratos por Vencer» en Alquileres).
 */

interface Props {
  items: SaleProcessListRow[]
  /** Total de procesos activos (puede ser mayor que los listados) */
  total?: number
  loading?: boolean
  maxVisible?: number
}

const props = withDefaults(defineProps<Props>(), { total: 0, loading: false, maxVisible: 5 })

const router = useRouter()

function goToProcess(id: string) {
  router.push({ name: 'ventas-proceso-detalle', params: { id } })
}
</script>

<template>
  <BaseCard padding="none" class="block">
    <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center gap-2">
        <h3 class="font-semibold text-sm text-gray-800 dark:text-white/90">Procesos en Curso</h3>
        <Badge v-if="!loading && total > 0" variant="primary">{{ total }}</Badge>
      </div>
      <router-link
        :to="{ name: 'ventas-procesos' }"
        class="text-xs font-medium transition-colors text-brand-500 dark:text-brand-400"
      >
        Ver todos →
      </router-link>
    </div>

    <template v-if="loading">
      <div class="divide-y border-gray-200 dark:border-gray-800">
        <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-5 py-3.5 animate-pulse">
          <div class="w-2 h-2 rounded-full shrink-0 bg-gray-200 dark:bg-gray-800" />
          <div class="flex-1 space-y-1.5">
            <div class="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
            <div class="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
          <div class="h-5 w-16 rounded-full shrink-0 bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </template>

    <template v-else-if="items.length === 0">
      <div class="flex flex-col items-center justify-center py-10 gap-2 px-5">
        <AppIcon icon="lucide:handshake" :size="40" color="var(--color-text-muted)" />
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Sin procesos en curso</p>
        <router-link
          :to="{ name: 'ventas-procesos-nuevo' }"
          class="text-xs font-medium text-brand-500 dark:text-brand-400"
        >
          Crear un proceso →
        </router-link>
      </div>
    </template>

    <template v-else>
      <ul class="divide-y border-gray-200 dark:border-gray-800">
        <li
          v-for="p in items.slice(0, maxVisible)"
          :key="p.id"
          class="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover-surface transition-colors"
          @click="goToProcess(p.id)"
        >
          <span
            class="mt-1.5 w-2 h-2 rounded-full shrink-0"
            :style="{ backgroundColor: pipelineStageMeta(p.pipelineStage).color }"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate text-gray-800 dark:text-white/90">
              {{ p.buyer.fullName }}
            </p>
            <p class="text-xs truncate mt-0.5 text-gray-500 dark:text-gray-400">
              {{ p.property.addressLine }}
            </p>
            <p class="text-xs mt-0.5 truncate text-gray-400 dark:text-gray-500">
              {{ p.code }}
              <template v-if="p.property.salePrice != null">
                · {{ formatCurrency(p.property.salePrice, p.property.saleCurrency ?? 'PEN') }}
              </template>
              <template v-if="p.agent"> · {{ p.agent.fullName }}</template>
            </p>
          </div>
          <span
            class="shrink-0 rounded-full px-2 py-0.5 text-theme-xs font-medium"
            :style="{
              color: pipelineStageMeta(p.pipelineStage).color,
              backgroundColor: `color-mix(in srgb, ${pipelineStageMeta(p.pipelineStage).color} 14%, transparent)`,
            }"
          >
            {{ pipelineStageLabel(p.pipelineStage) }}
          </span>
        </li>
      </ul>

      <div v-if="total > maxVisible" class="px-5 py-3 border-t border-gray-200 dark:border-gray-800">
        <router-link
          :to="{ name: 'ventas-procesos-pipeline' }"
          class="text-sm font-medium transition-colors text-brand-500 dark:text-brand-400"
        >
          Ver {{ total - maxVisible }} más en el pipeline →
        </router-link>
      </div>
    </template>
  </BaseCard>
</template>
