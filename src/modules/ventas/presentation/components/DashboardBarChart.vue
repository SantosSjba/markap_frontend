<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import { computed } from 'vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { formatCurrency } from '@shared/utils/formatters'
import type { VentasSalesByPeriodRow } from '../../features/ventas-reportes/domain/reportes.types'
/**
 * DashboardBarChart
 * Ventas cerradas por mes del año (SVG puro, como el de Alquileres):
 * cantidad de cierres o volumen vendido. El mejor mes se resalta.
 * Slot `actions`: selector de serie.
 */

interface Props {
  /** Filas del reporte «ventas por período» con granularidad mensual («YYYY-MM») */
  data: VentasSalesByPeriodRow[]
  year: number
  loading?: boolean
  mode?: 'closingsCount' | 'totalAmount'
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  mode: 'closingsCount',
  title: 'Ventas por Mes',
})

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const CHART_HEIGHT = 180
const BAR_MAX_HEIGHT = 140
const PADDING_LEFT = 44
const PADDING_BOTTOM = 28
const TOTAL_WIDTH = 480

/** Los 12 meses del año, con ceros en los meses sin cierres */
const months = computed(() => {
  const byPeriod = new Map(props.data.map((r) => [r.period, r]))
  return MONTHS.map((label, i) => {
    const row = byPeriod.get(`${props.year}-${String(i + 1).padStart(2, '0')}`)
    return { label, name: MONTH_NAMES[i]!, closings: row?.closingsCount ?? 0, amount: row?.totalAmount ?? 0 }
  })
})

const series = computed(() =>
  months.value.map((m) => (props.mode === 'closingsCount' ? m.closings : m.amount)),
)
const maxVal = computed(() => Math.max(...series.value, 0))
const scaleMax = computed(() =>
  props.mode === 'closingsCount' ? Math.max(4, Math.ceil(maxVal.value / 4) * 4) : niceCeil(maxVal.value || 1),
)
const total = computed(() => series.value.reduce((acc, v) => acc + v, 0))
const bestIndex = computed(() => (maxVal.value > 0 ? series.value.indexOf(maxVal.value) : -1))

function niceCeil(v: number): number {
  const exp = 10 ** Math.floor(Math.log10(v))
  const f = v / exp
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nice * exp
}

function compact(v: number): string {
  return new Intl.NumberFormat('es-PE', { notation: 'compact', maximumFractionDigits: 1 }).format(v)
}

function formatValue(v: number) {
  return props.mode === 'closingsCount' ? `${v} ${v === 1 ? 'cierre' : 'cierres'}` : formatCurrency(v, 'PEN')
}

function yPos(v: number) {
  return CHART_HEIGHT - PADDING_BOTTOM - Math.round((v / scaleMax.value) * BAR_MAX_HEIGHT)
}

const yTicks = computed(() => [0, 0.25, 0.5, 0.75, 1].map((f) => f * scaleMax.value))

const bars = computed(() => {
  const gap = (TOTAL_WIDTH - PADDING_LEFT - 8) / 12
  const barWidth = Math.max(12, Math.floor(gap * 0.55))
  return months.value.map((m, i) => {
    const value = series.value[i] ?? 0
    const barHeight = value > 0 ? Math.max(4, Math.round((value / scaleMax.value) * BAR_MAX_HEIGHT)) : 0
    const x = PADDING_LEFT + i * gap + (gap - barWidth) / 2
    return {
      key: m.label,
      x,
      barWidth,
      barHeight,
      y: CHART_HEIGHT - PADDING_BOTTOM - barHeight,
      value,
      label: m.label,
      title: `${m.name}: ${m.closings} ${m.closings === 1 ? 'cierre' : 'cierres'} · ${formatCurrency(m.amount, 'PEN')}`,
      best: i === bestIndex.value,
    }
  })
})
</script>

<template>
  <BaseCard padding="none" class="block overflow-hidden">
    <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h3 class="font-semibold text-sm text-gray-800 dark:text-white/90">{{ title }}</h3>
        <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
          <template v-if="!loading">
            {{ formatValue(total) }} en el año
            {{ bestIndex >= 0 ? ` · Mejor mes: ${months[bestIndex]?.name}` : '' }}
          </template>
        </p>
      </div>
      <slot name="actions" />
    </div>

    <div class="px-4 py-4 overflow-x-auto">
      <div v-if="loading" class="h-[180px] rounded-lg animate-pulse bg-gray-100 dark:bg-gray-800" />
      <div v-else-if="total === 0" class="flex flex-col items-center justify-center py-10 gap-2">
        <AppIcon icon="lucide:chart-column" :size="32" color="var(--color-text-muted)" />
        <p class="text-sm text-gray-400 dark:text-gray-500">Sin ventas cerradas en {{ year }}</p>
      </div>
      <svg
        v-else
        :viewBox="`0 0 ${TOTAL_WIDTH} ${CHART_HEIGHT}`"
        class="w-full"
        :height="CHART_HEIGHT"
        style="min-width: 280px"
        role="img"
        :aria-label="title"
      >
        <g v-for="tick in yTicks" :key="tick">
          <line
            :x1="PADDING_LEFT"
            :y1="yPos(tick)"
            :x2="TOTAL_WIDTH"
            :y2="yPos(tick)"
            stroke="var(--color-border)"
            stroke-width="1"
            stroke-dasharray="3,3"
          />
          <text :x="PADDING_LEFT - 4" :y="yPos(tick) + 4" text-anchor="end" font-size="9" fill="var(--color-text-muted)">
            {{ compact(tick) }}
          </text>
        </g>

        <g v-for="bar in bars" :key="bar.key">
          <title>{{ bar.title }}</title>
          <rect
            :x="bar.x"
            :y="bar.y"
            :width="bar.barWidth"
            :height="bar.barHeight"
            rx="4"
            fill="var(--color-primary)"
            :opacity="bar.best ? 1 : 0.55"
          />
          <text
            v-if="bar.value > 0"
            :x="bar.x + bar.barWidth / 2"
            :y="bar.y - 3"
            text-anchor="middle"
            font-size="9"
            :font-weight="bar.best ? 700 : 500"
            fill="var(--color-primary)"
          >
            {{ compact(bar.value) }}
          </text>
          <text
            :x="bar.x + bar.barWidth / 2"
            :y="CHART_HEIGHT - 6"
            text-anchor="middle"
            font-size="9"
            fill="var(--color-text-muted)"
          >
            {{ bar.label }}
          </text>
        </g>
      </svg>
    </div>
  </BaseCard>
</template>
