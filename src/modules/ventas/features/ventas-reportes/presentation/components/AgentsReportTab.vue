<script setup lang="ts">
import { computed, ref, type Ref } from 'vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Avatar from '@shared/presentation/components/ui/Avatar.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import ReportSectionHeader from '@shared/presentation/components/reports/ReportSectionHeader.vue'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { formatCurrency, formatCurrencyRounded } from '@shared/utils/formatters'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import type { AgentsSummaryRow, VentasSummaryParams } from '../../domain/reportes.types'
import { useVentasReportSummary } from '../composables/useVentasReportes'
import { sortCurrencies } from '../utils/report-period'
/**
 * Rendimiento de asesores: procesos abiertos, ganados, caídos y tasa de cierre del periodo,
 * con lo vendido y sus comisiones (pagadas / por pagar) en cada moneda.
 */

const props = defineProps<{ params: VentasSummaryParams; periodLabel: string }>()
const params = computed(() => props.params)
const query = useVentasReportSummary('agents', params as Ref<VentasSummaryParams>, ref(true))
const agents = computed(() => query.data.value?.agents ?? [])

const totalWon = computed(() => agents.value.reduce((a, r) => a + r.won, 0))
const totalActive = computed(() => agents.value.reduce((a, r) => a + r.activeProcesses, 0))
const top = computed(() => [...agents.value].sort((a, b) => b.won - a.won)[0])

/** Suma por moneda de una lista de montos de todos los asesores */
function sumByCurrency(pick: (r: AgentsSummaryRow) => { currency: string; value: number }[]) {
  const map = new Map<string, number>()
  for (const r of agents.value) for (const v of pick(r)) map.set(v.currency, (map.get(v.currency) ?? 0) + v.value)
  return sortCurrencies(map.keys())
    .filter((c) => map.get(c)! > 0)
    .map((c) => formatCurrencyRounded(map.get(c)!, c))
}
const commissionsPending = computed(() =>
  sumByCurrency((r) => r.commissions.map((c) => ({ currency: c.currency, value: c.pending }))),
)
const commissionsPaid = computed(() =>
  sumByCurrency((r) => r.commissions.map((c) => ({ currency: c.currency, value: c.paid }))),
)

const columns = [
  { key: 'asesor', label: 'Asesor', sortable: true, sortAccessor: (r: unknown) => (r as AgentsSummaryRow).agentName },
  { key: 'procesos', label: 'Procesos', sortable: true, sortType: 'basic' as const, sortAccessor: (r: unknown) => (r as AgentsSummaryRow).activeProcesses },
  { key: 'resultado', label: 'Ganados / caídos', sortable: true, sortType: 'basic' as const, sortAccessor: (r: unknown) => (r as AgentsSummaryRow).won },
  { key: 'tasa', label: 'Tasa de cierre', sortable: true, sortType: 'basic' as const, sortAccessor: (r: unknown) => (r as AgentsSummaryRow).winRate },
  { key: 'ventas', label: 'Vendido' },
  { key: 'comisiones', label: 'Comisiones' },
]

const { isExporting, exportToExcel } = useExcelExport()
async function exportExcel() {
  await exportToExcel({
    fileName: `rendimiento_asesores_${props.periodLabel.replace(/\s+/g, '_')}`,
    sheetName: 'Asesores',
    columns: [
      { header: 'Asesor', key: 'agent', width: 30 },
      { header: 'Tipo', key: 'type', width: 10 },
      { header: 'Procesos nuevos', key: 'created', width: 14 },
      { header: 'Activos hoy', key: 'active', width: 12 },
      { header: 'Ganados', key: 'won', width: 10 },
      { header: 'Caídos', key: 'lost', width: 10 },
      { header: 'Tasa de cierre (%)', key: 'rate', width: 16 },
      { header: 'Moneda', key: 'currency', width: 9 },
      { header: 'Vendido', key: 'sold', width: 16 },
      { header: 'Comisión total', key: 'commission', width: 16 },
      { header: 'Comisión pagada', key: 'paid', width: 16 },
      { header: 'Comisión por pagar', key: 'pending', width: 16 },
    ],
    // Una fila por asesor y moneda: nunca se mezclan montos
    rows: agents.value.flatMap((r) => {
      const currencies = sortCurrencies([...r.sales.map((s) => s.currency), ...r.commissions.map((c) => c.currency)])
      const base = {
        agent: r.agentName,
        type: r.agentType === 'INTERNAL' ? 'Interno' : r.agentType === 'EXTERNAL' ? 'Externo' : '',
        created: r.processesCreated,
        active: r.activeProcesses,
        won: r.won,
        lost: r.lost,
        rate: r.winRate,
      }
      if (!currencies.length) return [{ ...base, currency: '', sold: 0, commission: 0, paid: 0, pending: 0 }]
      return currencies.map((c) => {
        const s = r.sales.find((x) => x.currency === c)
        const k = r.commissions.find((x) => x.currency === c)
        return { ...base, currency: c, sold: s?.total ?? 0, commission: k?.total ?? 0, paid: k?.paid ?? 0, pending: k?.pending ?? 0 }
      })
    }),
  })
}
</script>

<template>
  <div class="space-y-5">
    <ReportSectionHeader
      title="Rendimiento de asesores"
      :subtitle="`Resultados y comisiones · ${periodLabel}`"
      help="Por asesor: procesos nuevos y activos, ganados y caídos, y su tasa de cierre (ganados ÷ ganados + caídos). Lo vendido y las comisiones (total, pagada y por pagar) van en su moneda."
      icon="lucide:user-check"
      :exporting="isExporting"
      @export="exportExcel"
    />

    <p v-if="query.isError.value" class="text-sm text-error-500">{{ getApiErrorMessage(query.error.value) }}</p>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard compact title="Asesores" :value="String(agents.length)" :subtitle="`${totalActive} procesos activos`" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:users" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Ventas ganadas" :value="String(totalWon)" :subtitle="top?.won ? `Destaca: ${top.agentName}` : 'en el periodo'" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:trophy" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Comisión pagada" :value="commissionsPaid[0] ?? '—'" :subtitle="commissionsPaid.slice(1).join(' · ') || 'neto'" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:wallet" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Comisión por pagar" :value="commissionsPending[0] ?? '—'" :subtitle="commissionsPending.slice(1).join(' · ') || 'neto'" :loading="query.isPending.value">
        <template #icon><AppIcon icon="lucide:hourglass" :size="20" /></template>
      </StatsCard>
    </div>

    <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <DataTable :columns="columns" :data="agents" row-key="agentId" :loading="query.isFetching.value" empty-text="Sin actividad de asesores en el periodo.">
        <template #row="{ row }">
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <Avatar :name="(row as AgentsSummaryRow).agentName" size="sm" />
              <div>
                <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ (row as AgentsSummaryRow).agentName }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ (row as AgentsSummaryRow).agentType === 'INTERNAL' ? 'Interno' : (row as AgentsSummaryRow).agentType === 'EXTERNAL' ? 'Externo' : '—' }}
                </p>
              </div>
            </div>
          </td>
          <td class="py-3 px-4 text-sm">
            <span class="block text-gray-800 dark:text-white/90">{{ (row as AgentsSummaryRow).activeProcesses }} activos</span>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ (row as AgentsSummaryRow).processesCreated }} nuevos en el periodo</span>
          </td>
          <td class="py-3 px-4 text-sm">
            <span class="text-success-600 dark:text-success-500">{{ (row as AgentsSummaryRow).won }} ganados</span>
            <span class="text-gray-400"> · </span>
            <span class="text-error-500">{{ (row as AgentsSummaryRow).lost }} caídos</span>
          </td>
          <td class="py-3 px-4 min-w-[120px]">
            <div class="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div class="h-full rounded-full bg-brand-500" :style="{ width: `${(row as AgentsSummaryRow).winRate}%` }" />
            </div>
            <span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">{{ (row as AgentsSummaryRow).winRate }} %</span>
          </td>
          <td class="py-3 px-4 text-sm">
            <span v-for="s in (row as AgentsSummaryRow).sales" :key="s.currency" class="block tabular-nums text-gray-800 dark:text-white/90">
              {{ formatCurrency(s.total, s.currency) }} <span class="text-xs text-gray-400">({{ s.count }})</span>
            </span>
            <span v-if="!(row as AgentsSummaryRow).sales.length" class="text-gray-400">—</span>
          </td>
          <td class="py-3 px-4 text-sm">
            <div v-for="c in (row as AgentsSummaryRow).commissions" :key="c.currency" class="mb-1 last:mb-0">
              <span class="block font-medium tabular-nums text-gray-800 dark:text-white/90">{{ formatCurrency(c.total, c.currency) }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                pagado {{ formatCurrency(c.paid, c.currency) }}<template v-if="c.pending"> · falta {{ formatCurrency(c.pending, c.currency) }}</template>
              </span>
            </div>
            <span v-if="!(row as AgentsSummaryRow).commissions.length" class="text-gray-400">—</span>
          </td>
        </template>
      </DataTable>
    </div>
  </div>
</template>
