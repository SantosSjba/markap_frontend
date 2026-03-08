<script setup lang="ts">
/**
 * DashboardBarChart
 * Gráfico de barras SVG puro (sin dependencias externas) para contratos por mes.
 * Muestra nuevos contratos, vencidos y activos al fin de mes.
 */
import { computed } from 'vue'
import type { RentalsByMonthItem } from '@applications/alquileres/reportes/services/reportes.service'

interface Props {
  data: RentalsByMonthItem[]
  loading?: boolean
  /** Qué serie mostrar */
  mode?: 'newContracts' | 'expiredContracts' | 'activeAtEndOfMonth'
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  mode: 'newContracts',
  title: 'Contratos por Mes',
})

const CHART_HEIGHT = 180
const BAR_MAX_HEIGHT = 140
const PADDING_LEFT = 36
const PADDING_BOTTOM = 28

const seriesConfig = {
  newContracts: {
    label: 'Nuevos',
    color: 'var(--color-primary)',
    bgAlpha: 'rgba(11,176,190,0.12)',
  },
  expiredContracts: {
    label: 'Vencidos',
    color: 'var(--color-error)',
    bgAlpha: 'rgba(229,83,61,0.12)',
  },
  activeAtEndOfMonth: {
    label: 'Activos',
    color: 'var(--color-success)',
    bgAlpha: 'rgba(45,190,126,0.12)',
  },
}

const series = computed(() => props.data.map((d) => d[props.mode] as number))
const maxVal = computed(() => Math.max(...series.value, 1))

interface Bar {
  x: number
  barWidth: number
  barHeight: number
  y: number
  value: number
  label: string
  monthName: string
}

const bars = computed<Bar[]>(() => {
  const n = props.data.length || 12
  const totalWidth = 480
  const usableWidth = totalWidth - PADDING_LEFT - 8
  const barWidth = Math.max(12, Math.floor((usableWidth / n) * 0.55))
  const gap = Math.floor(usableWidth / n)

  return props.data.map((d, i) => {
    const value = d[props.mode] as number
    const barHeight = Math.max(4, Math.round((value / maxVal.value) * BAR_MAX_HEIGHT))
    const x = PADDING_LEFT + i * gap + (gap - barWidth) / 2
    const y = CHART_HEIGHT - PADDING_BOTTOM - barHeight
    return {
      x,
      barWidth,
      barHeight,
      y,
      value,
      label: d.monthName?.slice(0, 3) ?? `M${d.month}`,
      monthName: d.monthName ?? '',
    }
  })
})

const yAxisTicks = computed(() => {
  const max = maxVal.value
  const step = Math.ceil(max / 4) || 1
  const ticks: number[] = []
  for (let v = 0; v <= max; v += step) ticks.push(v)
  return ticks
})

function yPos(val: number) {
  return CHART_HEIGHT - PADDING_BOTTOM - Math.round((val / maxVal.value) * BAR_MAX_HEIGHT)
}

const SKELETON_BARS = Array.from({ length: 8 }, (_, i) => ({
  height: 30 + Math.sin(i * 0.9) * 60 + 40,
  idx: i,
}))

const totalWidth = 480
</script>

<template>
  <div
    class="rounded-xl border overflow-hidden"
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
      <div>
        <h3 class="font-semibold text-sm" :style="{ color: 'var(--color-text-primary)' }">
          {{ title }}
        </h3>
        <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">
          {{ seriesConfig[mode].label }} por mes
        </p>
      </div>

      <!-- Legend -->
      <div class="flex items-center gap-1.5">
        <span
          class="w-2.5 h-2.5 rounded-sm"
          :style="{ backgroundColor: seriesConfig[mode].color }"
        />
        <span class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
          {{ seriesConfig[mode].label }}
        </span>
      </div>
    </div>

    <!-- Chart area -->
    <div class="px-4 py-4 overflow-x-auto">
      <!-- Skeleton -->
      <template v-if="loading">
        <svg :width="totalWidth" :height="CHART_HEIGHT" class="w-full animate-pulse">
          <rect
            v-for="bar in SKELETON_BARS"
            :key="bar.idx"
            :x="PADDING_LEFT + bar.idx * 56 + 8"
            :y="CHART_HEIGHT - PADDING_BOTTOM - bar.height"
            :width="32"
            :height="bar.height"
            rx="4"
            :fill="'var(--color-border)'"
          />
        </svg>
      </template>

      <!-- Empty -->
      <template v-else-if="data.length === 0">
        <div class="flex flex-col items-center justify-center py-10 gap-2">
          <svg class="w-8 h-8" :style="{ color: 'var(--color-text-muted)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Sin datos disponibles</p>
        </div>
      </template>

      <!-- SVG Chart -->
      <template v-else>
        <svg
          :viewBox="`0 0 ${totalWidth} ${CHART_HEIGHT}`"
          class="w-full"
          :height="CHART_HEIGHT"
          style="min-width: 280px"
        >
          <!-- Grid lines -->
          <line
            v-for="tick in yAxisTicks"
            :key="tick"
            :x1="PADDING_LEFT"
            :y1="yPos(tick)"
            :x2="totalWidth"
            :y2="yPos(tick)"
            stroke="var(--color-border)"
            stroke-width="1"
            stroke-dasharray="3,3"
          />

          <!-- Y axis labels -->
          <text
            v-for="tick in yAxisTicks"
            :key="`y-${tick}`"
            :x="PADDING_LEFT - 4"
            :y="yPos(tick) + 4"
            text-anchor="end"
            font-size="9"
            :fill="'var(--color-text-muted)'"
          >
            {{ tick }}
          </text>

          <!-- Bars -->
          <g v-for="bar in bars" :key="bar.label + bar.x">
            <!-- Bar background hover -->
            <rect
              :x="bar.x - 4"
              :y="CHART_HEIGHT - PADDING_BOTTOM - BAR_MAX_HEIGHT"
              :width="bar.barWidth + 8"
              :height="BAR_MAX_HEIGHT"
              rx="2"
              fill="transparent"
              class="hover:opacity-100 cursor-pointer"
            />

            <!-- Bar fill -->
            <rect
              :x="bar.x"
              :y="bar.y"
              :width="bar.barWidth"
              :height="bar.barHeight"
              rx="4"
              :fill="seriesConfig[mode].color"
              opacity="0.85"
            />

            <!-- Value label on top -->
            <text
              v-if="bar.value > 0"
              :x="bar.x + bar.barWidth / 2"
              :y="bar.y - 3"
              text-anchor="middle"
              font-size="9"
              font-weight="600"
              :fill="seriesConfig[mode].color"
            >
              {{ bar.value }}
            </text>

            <!-- X label -->
            <text
              :x="bar.x + bar.barWidth / 2"
              :y="CHART_HEIGHT - 6"
              text-anchor="middle"
              font-size="9"
              :fill="'var(--color-text-muted)'"
            >
              {{ bar.label }}
            </text>
          </g>
        </svg>
      </template>
    </div>
  </div>
</template>
