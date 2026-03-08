<script setup lang="ts">
/**
 * DashboardAlertasList
 * Lista de contratos próximos a vencer con semáforo visual de urgencia.
 */
import type { ContractExpiringItem } from '@applications/alquileres/reportes/services/reportes.service'
import { useRouter } from 'vue-router'

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
  critical: {
    dot: 'var(--color-error)',
    bg: 'var(--color-error-light)',
    text: 'var(--color-error)',
    label: 'Crítico',
  },
  high: {
    dot: 'var(--color-warning)',
    bg: 'var(--color-warning-light)',
    text: '#92600E',
    label: 'Urgente',
  },
  medium: {
    dot: 'var(--color-primary)',
    bg: 'var(--color-primary-light)',
    text: 'var(--color-primary-dark)',
    label: 'Próximo',
  },
  low: {
    dot: 'var(--color-success)',
    bg: 'var(--color-success-light)',
    text: 'var(--color-success)',
    label: 'Vigente',
  },
}

function formatDaysLeft(days: number) {
  if (days === 0) return 'Hoy'
  if (days === 1) return '1 día'
  return `${days} días`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function goToRental(id: string) {
  router.push({ name: 'alquileres-detalle', params: { id } })
}
</script>

<template>
  <div
    class="rounded-xl border"
    :style="{
      backgroundColor: 'var(--color-surface)',
      borderColor: 'var(--color-border)',
      boxShadow: 'var(--shadow-card)',
    }"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-5 py-4 border-b"
      :style="{ borderColor: 'var(--color-border)' }"
    >
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full animate-pulse" :style="{ backgroundColor: 'var(--color-error)' }" />
        <h3 class="font-semibold text-sm" :style="{ color: 'var(--color-text-primary)' }">
          Contratos por Vencer
        </h3>
        <span
          v-if="!loading && items.length > 0"
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
          :style="{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }"
        >
          {{ items.length }}
        </span>
      </div>
      <router-link
        :to="{ name: 'alquileres-reportes' }"
        class="text-xs font-medium transition-colors"
        :style="{ color: 'var(--color-primary)' }"
      >
        Ver todos →
      </router-link>
    </div>

    <!-- Skeleton -->
    <template v-if="loading">
      <div class="divide-y" :style="{ borderColor: 'var(--color-border)' }">
        <div
          v-for="i in 4"
          :key="i"
          class="flex items-center gap-3 px-5 py-3.5 animate-pulse"
        >
          <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: 'var(--color-border)' }" />
          <div class="flex-1 space-y-1.5">
            <div class="h-3 w-3/4 rounded" :style="{ backgroundColor: 'var(--color-border)' }" />
            <div class="h-3 w-1/2 rounded" :style="{ backgroundColor: 'var(--color-border)' }" />
          </div>
          <div class="h-5 w-14 rounded-full shrink-0" :style="{ backgroundColor: 'var(--color-border)' }" />
        </div>
      </div>
    </template>

    <!-- Empty -->
    <template v-else-if="items.length === 0">
      <div class="flex flex-col items-center justify-center py-10 gap-2 px-5">
        <svg class="w-10 h-10" :style="{ color: 'var(--color-success)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm font-medium" :style="{ color: 'var(--color-text-secondary)' }">
          Sin contratos urgentes
        </p>
        <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
          Todos los contratos están al día
        </p>
      </div>
    </template>

    <!-- List -->
    <template v-else>
      <ul class="divide-y" :style="{ borderColor: 'var(--color-border)' }">
        <li
          v-for="item in items.slice(0, maxVisible)"
          :key="item.id"
          class="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover-surface transition-colors"
          @click="goToRental(item.id)"
        >
          <!-- Dot urgency -->
          <span
            class="mt-1.5 w-2 h-2 rounded-full shrink-0"
            :style="{ backgroundColor: urgencyConfig[getUrgencyLevel(item.daysLeft)].dot }"
          />

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate" :style="{ color: 'var(--color-text-primary)' }">
              {{ item.tenantName }}
            </p>
            <p class="text-xs truncate mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
              {{ item.propertyAddress }}
            </p>
            <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">
              Vence: {{ formatDate(item.endDate) }}
            </p>
          </div>

          <!-- Badge días -->
          <span
            class="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
            :style="{
              backgroundColor: urgencyConfig[getUrgencyLevel(item.daysLeft)].bg,
              color: urgencyConfig[getUrgencyLevel(item.daysLeft)].text,
            }"
          >
            {{ formatDaysLeft(item.daysLeft) }}
          </span>
        </li>
      </ul>

      <!-- Ver más -->
      <div
        v-if="items.length > maxVisible"
        class="px-5 py-3 border-t"
        :style="{ borderColor: 'var(--color-border)' }"
      >
        <router-link
          :to="{ name: 'alquileres-reportes' }"
          class="text-sm font-medium transition-colors"
          :style="{ color: 'var(--color-primary)' }"
        >
          Ver {{ items.length - maxVisible }} más →
        </router-link>
      </div>
    </template>
  </div>
</template>
