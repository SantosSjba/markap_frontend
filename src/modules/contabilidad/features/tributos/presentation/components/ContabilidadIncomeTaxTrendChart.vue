<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon } from '@shared/components'

export interface IncomeTaxTrendBarItem {
  label: string
  value: number
}

interface Props {
  data: IncomeTaxTrendBarItem[]
  loading?: boolean
  title?: string
  subtitle?: string
  color?: string
  valueFormatter?: (value: number) => string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  title: 'Evolución anual',
  subtitle: '',
  color: 'var(--color-primary)',
  valueFormatter: (v: number) => String(v),
})

const CHART_HEIGHT = 180
const BAR_MAX_HEIGHT = 140
const PADDING_LEFT = 44
const PADDING_BOTTOM = 28
const totalWidth = 480

const maxVal = computed(() => Math.max(...props.data.map((d) => d.value), 1))

interface Bar {
  x: number
  barWidth: number
  barHeight: number
  y: number
  value: number
  label: string
}

const bars = computed<Bar[]>(() => {
  const n = props.data.length || 1
  const usableWidth = totalWidth - PADDING_LEFT - 8
  const barWidth = Math.max(12, Math.floor((usableWidth / n) * 0.55))
  const gap = Math.floor(usableWidth / n)

  return props.data.map((d, i) => {
    const barHeight = Math.max(4, Math.round((d.value / maxVal.value) * BAR_MAX_HEIGHT))
    const x = PADDING_LEFT + i * gap + (gap - barWidth) / 2
    const y = CHART_HEIGHT - PADDING_BOTTOM - barHeight
    return {
      x,
      barWidth,
      barHeight,
      y,
      value: d.value,
      label: d.label.length > 10 ? `${d.label.slice(0, 9)}…` : d.label,
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

const SKELETON_BARS = Array.from({ length: 6 }, (_, i) => ({
  height: 30 + Math.sin(i * 0.9) * 60 + 40,
  idx: i,
}))
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
    <div
      class="flex items-center justify-between px-5 py-4 border-b"
      :style="{ borderColor: 'var(--color-border)' }"
    >
      <div>
        <h3 class="font-semibold text-sm" :style="{ color: 'var(--color-text-primary)' }">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">
          {{ subtitle }}
        </p>
      </div>
      <span class="w-2.5 h-2.5 rounded-sm" :style="{ backgroundColor: color }" />
    </div>

    <div class="px-4 py-4 overflow-x-auto">
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
            fill="var(--color-border)"
          />
        </svg>
      </template>

      <template v-else-if="data.length === 0">
        <div class="flex flex-col items-center justify-center py-10 gap-2">
          <AppIcon icon="lucide:chart-column" :size="32" color="var(--color-text-muted)" />
          <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Sin datos disponibles</p>
        </div>
      </template>

      <template v-else>
        <svg
          :viewBox="`0 0 ${totalWidth} ${CHART_HEIGHT}`"
          class="w-full"
          :height="CHART_HEIGHT"
          style="min-width: 280px"
        >
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

          <text
            v-for="tick in yAxisTicks"
            :key="`y-${tick}`"
            :x="PADDING_LEFT - 4"
            :y="yPos(tick) + 4"
            text-anchor="end"
            font-size="9"
            fill="var(--color-text-muted)"
          >
            {{ valueFormatter(tick) }}
          </text>

          <g v-for="bar in bars" :key="bar.label + bar.x">
            <rect
              :x="bar.x"
              :y="bar.y"
              :width="bar.barWidth"
              :height="bar.barHeight"
              rx="4"
              :fill="color"
              opacity="0.85"
            />
            <text
              v-if="bar.value > 0"
              :x="bar.x + bar.barWidth / 2"
              :y="bar.y - 3"
              text-anchor="middle"
              font-size="9"
              font-weight="600"
              :fill="color"
            >
              {{ valueFormatter(bar.value) }}
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
      </template>
    </div>
  </div>
</template>
