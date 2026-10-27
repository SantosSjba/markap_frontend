<script setup lang="ts">
import { computed, ref, type Ref } from 'vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ReportSectionHeader from '@shared/presentation/components/reports/ReportSectionHeader.vue'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { formatCurrencyRounded } from '@shared/utils/formatters'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { useVentasPipelineStages } from '../../../ventas-configuracion/presentation/composables/useVentasConfig'
import type { ConversionSummary, VentasSummaryParams } from '../../domain/reportes.types'
import { useVentasReportSummary } from '../composables/useVentasReportes'
import { periodName } from '../utils/report-period'
/**
 * Conversión: de procesos abiertos a ventas ganadas, embudo actual por etapa (con su valor
 * en cada moneda) y motivos de las ventas caídas. Los gráficos están en «Indicadores».
 */

const props = defineProps<{ params: VentasSummaryParams; periodLabel: string }>()
const params = computed(() => props.params)
const query = useVentasReportSummary('conversion', params as Ref<VentasSummaryParams>, ref(true))
const data = computed<ConversionSummary | undefined>(() => query.data.value)
const { stageOptions } = useVentasPipelineStages()

/** Embudo en el orden configurado del pipeline */
const funnel = computed(() => {
  const stages = data.value?.stages ?? []
  const max = Math.max(1, ...stages.map((s) => s.count))
  return stageOptions.value.map((o) => {
    const s = stages.find((x) => x.stage === o.value)
    return {
      stage: o.value,
      label: o.label,
      count: s?.count ?? 0,
      width: Math.round(((s?.count ?? 0) / max) * 100),
      value: (s?.value ?? []).map((v) => formatCurrencyRounded(v.amount, v.currency)).join(' · '),
    }
  })
})

const maxReason = computed(() => Math.max(1, ...(data.value?.lostReasons ?? []).map((r) => r.count)))

const { isExporting, exportToExcel } = useExcelExport()
async function exportExcel() {
  const d = data.value
  if (!d) return
  await exportToExcel({
    fileName: `conversion_ventas_${props.periodLabel.replace(/\s+/g, '_')}`,
    sheetName: 'Resumen',
    columns: [
      { header: 'Indicador', key: 'k', width: 30 },
      { header: 'Valor', key: 'v', width: 16 },
    ],
    rows: [
      { k: 'Procesos nuevos', v: d.created },
      { k: 'Ventas ganadas', v: d.won },
      { k: 'Ventas caídas', v: d.lost },
      { k: 'Separaciones registradas', v: d.separations },
      { k: 'Conversión (%)', v: d.conversionRate },
      { k: 'Tasa de cierre (%)', v: d.winRate },
      { k: 'Días promedio al cierre', v: d.avgDaysToClose ?? '' },
      { k: 'Procesos activos hoy', v: d.active },
    ],
    additionalSheets: [
      {
        sheetName: 'Por periodo',
        columns: [
          { header: 'Periodo', key: 'period', width: 16 },
          { header: 'Nuevos', key: 'created', width: 10 },
          { header: 'Ganados', key: 'won', width: 10 },
          { header: 'Caídos', key: 'lost', width: 10 },
        ],
        rows: d.periods.map((p) => ({ ...p, period: periodName(p.period) })),
      },
      {
        sheetName: 'Embudo actual',
        columns: [
          { header: 'Etapa', key: 'stage', width: 22 },
          { header: 'Procesos', key: 'count', width: 10 },
          { header: 'Valor en lista', key: 'value', width: 36 },
        ],
        rows: funnel.value.map((f) => ({ stage: f.label, count: f.count, value: f.value })),
      },
      {
        sheetName: 'Motivos de caída',
        columns: [
          { header: 'Motivo', key: 'reason', width: 50 },
          { header: 'Casos', key: 'count', width: 10 },
        ],
        rows: d.lostReasons,
      },
    ],
  })
}
</script>

<template>
  <div class="space-y-5">
    <ReportSectionHeader
      title="Conversión"
      :subtitle="`De proceso a venta · ${periodLabel}`"
      icon="lucide:git-branch"
      :exporting="isExporting"
      @export="exportExcel"
    />

    <p v-if="query.isError.value" class="text-sm text-error-500">{{ getApiErrorMessage(query.error.value) }}</p>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard compact title="Procesos nuevos" :value="String(data?.created ?? 0)" :subtitle="`${data?.separations ?? 0} separaciones`" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:sparkles" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Ganadas / caídas" :value="`${data?.won ?? 0} / ${data?.lost ?? 0}`" :subtitle="`${data?.winRate ?? 0} % tasa de cierre`" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:trophy" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Conversión" :value="`${data?.conversionRate ?? 0} %`" subtitle="ganadas / nuevos" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:target" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Tiempo al cierre"
        :value="data?.avgDaysToClose != null ? `${data.avgDaysToClose} días` : '—'"
        :subtitle="`${data?.active ?? 0} procesos activos hoy`"
        :loading="query.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:timer" :size="20" /></template>
      </StatsCard>
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <!-- Embudo actual -->
      <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Embudo actual</p>
        <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">Procesos activos hoy por etapa y su valor de lista</p>
        <ul class="space-y-3">
          <li v-for="f in funnel" :key="f.stage">
            <div class="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span class="text-gray-700 dark:text-gray-300">{{ f.label }}</span>
              <span class="font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ f.count }}</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div class="h-full rounded-full bg-brand-500 transition-all" :style="{ width: `${f.width}%` }" />
            </div>
            <p v-if="f.value" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ f.value }}</p>
          </li>
        </ul>
      </div>

      <!-- Motivos de caída -->
      <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Motivos de ventas caídas</p>
        <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">Lo que más frena las ventas en el periodo</p>
        <ul v-if="data?.lostReasons.length" class="space-y-3">
          <li v-for="r in data.lostReasons" :key="r.reason">
            <div class="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span class="min-w-0 truncate text-gray-700 dark:text-gray-300">{{ r.reason }}</span>
              <span class="font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ r.count }}</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div class="h-full rounded-full bg-error-500" :style="{ width: `${Math.round((r.count / maxReason) * 100)}%` }" />
            </div>
          </li>
        </ul>
        <p v-else class="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <AppIcon icon="lucide:circle-check" :size="16" />Sin ventas caídas en el periodo
        </p>
      </div>
    </div>

  </div>
</template>
