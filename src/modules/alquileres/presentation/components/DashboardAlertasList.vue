<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import type { ContractExpiringItem } from '../../features/reportes/domain/reportes.types'
import { useRouter } from 'vue-router'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { formatShortDate } from '@shared/utils/formatters'
/**
 * DashboardAlertasList
 * Lista de contratos próximos a vencer con semáforo visual de urgencia.
 */

interface Props {
  items: ContractExpiringItem[]
  loading?: boolean
  /** Máximo de ítems a mostrar antes del botón "ver más" */
  maxVisible?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  maxVisible: 5,
})

const router = useRouter()

function getUrgencyLevel(days: number): 'critical' | 'high' | 'medium' | 'low' {
  if (days <= 7) return 'critical'
  if (days <= 15) return 'high'
  if (days <= 20) return 'medium'
  return 'low'
}

const urgencyConfig = {
  critical: { dot: 'bg-error-500', variant: 'error', label: 'Crítico' },
  high: { dot: 'bg-warning-500', variant: 'warning', label: 'Urgente' },
  medium: { dot: 'bg-brand-500', variant: 'primary', label: 'Próximo' },
  low: { dot: 'bg-success-500', variant: 'success', label: 'Vigente' },
} as const

function formatDaysLeft(days: number) {
  if (days === 0) return 'Hoy'
  if (days === 1) return '1 día'
  return `${days} días`
}

function goToRental(id: string) {
  router.push({ name: 'alquileres-detalle', params: { id } })
}
</script>

<template>
  <BaseCard padding="none" class="block">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800"
    >
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full animate-pulse bg-error-500" />
        <h3 class="font-semibold text-sm text-gray-800 dark:text-white/90">
          Contratos por Vencer
        </h3>
        <Badge v-if="!loading && items.length > 0" variant="error">{{ items.length }}</Badge>
      </div>
      <router-link
        :to="{ name: 'alquileres-reportes' }"
        class="text-xs font-medium transition-colors text-brand-500 dark:text-brand-400"
      >
        Ver todos →
      </router-link>
    </div>

    <!-- Skeleton -->
    <template v-if="loading">
      <div class="divide-y border-gray-200 dark:border-gray-800">
        <div
          v-for="i in 4"
          :key="i"
          class="flex items-center gap-3 px-5 py-3.5 animate-pulse"
        >
          <div class="w-2 h-2 rounded-full shrink-0 bg-gray-200 dark:bg-gray-800" />
          <div class="flex-1 space-y-1.5">
            <div class="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
            <div class="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
          <div class="h-5 w-14 rounded-full shrink-0 bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </template>

    <!-- Empty -->
    <template v-else-if="items.length === 0">
      <div class="flex flex-col items-center justify-center py-10 gap-2 px-5">
        <AppIcon icon="lucide:circle-check-big" :size="40" color="var(--color-success)" />
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Sin contratos urgentes
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500">
          Todos los contratos están al día
        </p>
      </div>
    </template>

    <!-- List -->
    <template v-else>
      <ul class="divide-y border-gray-200 dark:border-gray-800">
        <li
          v-for="item in items.slice(0, maxVisible)"
          :key="item.id"
          class="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover-surface transition-colors"
          @click="goToRental(item.id)"
        >
          <!-- Dot urgency -->
          <span
            class="mt-1.5 w-2 h-2 rounded-full shrink-0"
            :class="urgencyConfig[getUrgencyLevel(item.daysLeft)].dot"
          />

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate text-gray-800 dark:text-white/90">
              {{ item.tenantName }}
            </p>
            <p class="text-xs truncate mt-0.5 text-gray-500 dark:text-gray-400">
              {{ item.propertyAddress }}
            </p>
            <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
              Vence: {{ formatShortDate(item.endDate) }}
            </p>
          </div>

          <!-- Badge días -->
          <Badge :variant="urgencyConfig[getUrgencyLevel(item.daysLeft)].variant" class="shrink-0">{{ formatDaysLeft(item.daysLeft) }}</Badge>
        </li>
      </ul>

      <!-- Ver más -->
      <div
        v-if="items.length > maxVisible"
        class="px-5 py-3 border-t border-gray-200 dark:border-gray-800"
      >
        <router-link
          :to="{ name: 'alquileres-reportes' }"
          class="text-sm font-medium transition-colors text-brand-500 dark:text-brand-400"
        >
          Ver {{ items.length - maxVisible }} más →
        </router-link>
      </div>
    </template>
  </BaseCard>
</template>
