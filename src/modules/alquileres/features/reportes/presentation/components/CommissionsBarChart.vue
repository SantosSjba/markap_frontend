<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import type { RentalsByMonthItem } from '../../domain/reportes.types'
/**
 * CommissionsBarChart
 * Ingresos por comisiones cobradas mes a mes (SVG puro, como DashboardBarChart).
 * Una moneda a la vez: soles y dólares no comparten escala ni se suman.
 * El mes con mayor ingreso se resalta.
 */

interface Props {
  data: RentalsByMonthItem[]
  loading?: boolean
  formatAmount: (value: number, currency: string) => string
  /** Monedas que se pueden graficar (las elegidas en la vista); por defecto, todas */
  currencies?: string[]
}

const props = withDefaults(defineProps<Props>(), { loading: false })

const CHART_HEIGHT = 200
const BAR_MAX_HEIGHT = 150
const PADDING_LEFT = 52
const PADDING_BOTTOM = 28
const TOTAL_WIDTH = 560

const currencies = computed(() => {
  if (props.currencies?.length) return props.currencies
  const set = new Set<string>()
  for (const m of props.data) for (const t of m.totalsByCurrency) set.add(t.currency)
  return [...set].sort()
})
const currency = ref('PEN')
watch(
  currencies,
  (list) => {
    if (list.length && !list.includes(currency.value)) currency.value = list[0]!
  },
  { immediate: true },
)
const currencyTabs = computed(() => currencies.value.map((c) => ({ id: c, label: c })))

const values = computed(() =>
  props.data.map(
    (m) => m.totalsByCurrency.find((t) => t.currency === currency.value)?.companyRevenue ?? 0,
  ),
)
const maxVal = computed(() => Math.max(...values.value, 0))
const scaleMax = computed(() => niceCeil(maxVal.value || 1))
const total = computed(() => values.value.reduce((acc, v) => acc + v, 0))
const bestIndex = computed(() => (maxVal.value > 0 ? values.value.indexOf(maxVal.value) : -1))

/** Tope "redondo" del eje para que las marcas sean legibles */
function niceCeil(v: number): number {
  const exp = 10 ** Math.floor(Math.log10(v))
  const f = v / exp
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nice * exp
}

function compact(v: number): string {
  return new Intl.NumberFormat('es-PE', { notation: 'compact', maximumFractionDigits: 1 }).format(v)
}

function yPos(v: number) {
  return CHART_HEIGHT - PADDING_BOTTOM - Math.round((v / scaleMax.value) * BAR_MAX_HEIGHT)
}

const yTicks = computed(() => [0, 0.25, 0.5, 0.75, 1].map((f) => f * scaleMax.value))

const bars = computed(() => {
  const n = props.data.length || 12
  const usable = TOTAL_WIDTH - PADDING_LEFT - 8
  const gap = usable / n
  const barWidth = Math.max(10, Math.min(36, Math.floor(gap * 0.6)))
  return props.data.map((m, i) => {
    const value = values.value[i] ?? 0
    const barHeight = value > 0 ? Math.max(3, Math.round((value / scaleMax.value) * BAR_MAX_HEIGHT)) : 0
    const x = PADDING_LEFT + i * gap + (gap - barWidth) / 2
    return {
      key: `${m.year}-${m.month}`,
      x,
      barWidth,
      barHeight,
      y: CHART_HEIGHT - PADDING_BOTTOM - barHeight,
      value,
      // En rangos de varios años el nombre trae el año («Enero 2026»)
      label: m.monthName.includes(' ')
        ? `${m.monthName.slice(0, 3)} ${String(m.year).slice(-2)}`
        : m.monthName.slice(0, 3),
      title: `${m.monthName}: ${props.formatAmount(value, currency.value)}`,
      best: i === bestIndex.value,
    }
  })
})
</script>

<template>
  <div class="rounded-xl border border-gray-200 dark:border-gray-800">
    <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Ingresos por comisiones por mes</h3>
        <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
          <template v-if="!loading">
            Total {{ formatAmount(total, currency) }}
            {{ bestIndex >= 0 ? ` · Mejor mes: ${data[bestIndex]?.monthName}` : '' }}
          </template>
        </p>
      </div>
      <BaseTabs
        v-if="currencyTabs.length > 1"
        v-model="currency"
        :tabs="currencyTabs"
        variant="segmented"
      />
    </div>

    <div class="px-4 py-4 overflow-x-auto">
      <div v-if="loading" class="h-[200px] rounded-lg animate-pulse bg-gray-100 dark:bg-gray-800" />
      <div v-else-if="total === 0" class="flex flex-col items-center justify-center py-10 gap-2">
        <AppIcon icon="lucide:chart-column" :size="32" color="var(--color-text-muted)" />
        <p class="text-sm text-gray-400 dark:text-gray-500">Sin comisiones cobradas en el período</p>
      </div>
      <svg
        v-else
        :viewBox="`0 0 ${TOTAL_WIDTH} ${CHART_HEIGHT}`"
        class="w-full"
        :height="CHART_HEIGHT"
        style="min-width: 320px"
        role="img"
        aria-label="Ingresos por comisiones por mes"
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
          <text
            :x="PADDING_LEFT - 6"
            :y="yPos(tick) + 3"
            text-anchor="end"
            font-size="9"
            fill="var(--color-text-muted)"
          >
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
            :y="bar.y - 4"
            text-anchor="middle"
            font-size="9"
            :font-weight="bar.best ? 700 : 500"
            fill="var(--color-primary)"
          >
            {{ compact(bar.value) }}
          </text>
          <text
            :x="bar.x + bar.barWidth / 2"
            :y="CHART_HEIGHT - 8"
            text-anchor="middle"
            font-size="9"
            fill="var(--color-text-muted)"
          >
            {{ bar.label }}
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>
