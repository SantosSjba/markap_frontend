<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import CollapsibleFilters from '@shared/presentation/components/ui/CollapsibleFilters.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import ExcelIcon from '@shared/presentation/components/ui/ExcelIcon.vue'
import { useService } from '@shared/presentation/di/services'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { fetchAllPages } from '@shared/utils/fetchAllPages'
import { formatCurrency, formatCurrencyRounded, formatShortDate, toCalendarDateString } from '@shared/utils/formatters'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { useVentasAgentsList } from '../../../agentes/presentation/composables/useAgents'
import { ventasFinanzasRepositoryKey } from '../../application/ports/ventas-finanzas.port'
import type { CommissionCurrencyTotals, CommissionRow } from '../../domain/finanzas.types'
import {
  COMMISSION_STATUS,
  COMMISSION_STATUS_OPTIONS,
  CURRENCY_LABELS,
  agentTypeLabel,
  canPayCommission,
  commissionBaseCurrency,
  commissionBasePrice,
  commissionBuyerName,
  commissionCalculationLabel,
  commissionGross,
  commissionNet,
  commissionPaidAmount,
  commissionPendingAmount,
  commissionPropertyAddress,
  commissionPropertyCode,
  commissionStatusLabel,
} from '../../domain/commission-display'
import { useVentasCommissionStats, useVentasCommissionsList } from '../composables/useVentasFinanzas'
import CommissionDetailModal from '../components/CommissionDetailModal.vue'
/**
 * Comisiones de venta: resumen por moneda (nunca se mezclan monedas), listado con proceso,
 * asesor, cálculo y avance de pago, detalle con cuotas y registro de pagos.
 */
const router = useRouter()
const route = useRoute()

const ITEMS = 10
/** `?q=` llega desde la ficha del proceso para ver solo sus comisiones */
const searchInput = ref(typeof route.query.q === 'string' ? route.query.q : '')
const debouncedSearch = useDebouncedRef(searchInput)
const filterStatus = ref('')
const filterAgent = ref('')
const filterCurrency = ref('')
const page = ref(1)
const limit = ref(ITEMS)

watch([debouncedSearch, filterStatus, filterAgent, filterCurrency], () => {
  page.value = 1
})

const serverFilters = computed(() => ({
  search: debouncedSearch.value.trim() || undefined,
  status: filterStatus.value || undefined,
  agentId: filterAgent.value || undefined,
  currency: filterCurrency.value || undefined,
}))
const listParams = computed(() => ({ page: page.value, limit: limit.value, ...serverFilters.value }))

const {
  data: listResult,
  isFetching,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useVentasCommissionsList(listParams)
const rows = computed(() => listResult.value?.data ?? [])
const total = computed(() => listResult.value?.total ?? 0)

const paginationProps = computed(() => {
  const totalPages = Math.max(1, Math.ceil(total.value / limit.value))
  return {
    currentPage: page.value,
    totalPages,
    totalItems: total.value,
    pageSize: limit.value,
    hasPrevPage: page.value > 1,
    hasNextPage: page.value < totalPages,
  }
})

// Resumen: cada moneda por separado (la primera como cifra principal)
const statsQuery = useVentasCommissionStats()
const stats = computed(() => statsQuery.data.value)
function currencySummary(key: 'pendingNet' | 'paidNet') {
  const list = (stats.value?.byCurrency ?? []).filter((t: CommissionCurrencyTotals) => t[key] > 0)
  return {
    main: list[0] ? formatCurrencyRounded(list[0][key], list[0].currency) : formatCurrencyRounded(0, 'PEN'),
    rest: list
      .slice(1)
      .map((t) => formatCurrencyRounded(t[key], t.currency))
      .join(' · '),
  }
}
const pendingSummary = computed(() => currencySummary('pendingNet'))
const paidSummary = computed(() => currencySummary('paidNet'))
const openCount = computed(() => (stats.value?.byStatus.PENDING ?? 0) + (stats.value?.byStatus.PARTIAL ?? 0))

// Filtros
const { data: agentsRes } = useVentasAgentsList(ref({ page: 1, limit: 50 }))
const agentOptions = computed(() => [
  { value: '', label: 'Todos los asesores' },
  ...(agentsRes.value?.data ?? []).map((a) => ({ value: a.id, label: a.fullName })),
])
const statusOptions = [{ value: '', label: 'Todos los estados' }, ...COMMISSION_STATUS_OPTIONS]
/** Solo las monedas que tienen comisiones */
const currencyOptions = computed(() => [
  { value: '', label: 'Todas las monedas' },
  ...(stats.value?.byCurrency ?? []).map((t) => ({ value: t.currency, label: CURRENCY_LABELS[t.currency] ?? t.currency })),
])
const activeFilterCount = computed(
  () => [filterStatus.value, filterAgent.value, filterCurrency.value].filter(Boolean).length,
)
function clearFilters() {
  filterStatus.value = ''
  filterAgent.value = ''
  filterCurrency.value = ''
}

const tableColumns = [
  { key: 'proceso', label: 'Proceso', sortable: true, sortAccessor: (r: unknown) => (r as CommissionRow).saleProcess?.code ?? '' },
  { key: 'asesor', label: 'Asesor', sortable: true, sortAccessor: (r: unknown) => (r as CommissionRow).agent.fullName },
  { key: 'calculo', label: 'Cálculo' },
  {
    key: 'neto',
    label: 'Neto',
    sortable: true,
    sortType: 'basic' as const,
    sortAccessor: (r: unknown) => commissionNet(r as CommissionRow),
  },
  { key: 'pago', label: 'Pago' },
  { key: 'estado', label: 'Estado', sortable: true, sortAccessor: (r: unknown) => (r as CommissionRow).status },
  { key: 'actions', label: '', align: 'right' as const },
]

const money = (r: CommissionRow, n: number) => formatCurrency(n, r.currency)
const paidParts = (r: CommissionRow) => (r.paymentParts ?? []).filter((p) => p.status === 'PAID').length
const progress = (r: CommissionRow) => {
  const net = commissionNet(r)
  return net > 0 ? Math.round((commissionPaidAmount(r) / net) * 100) : 0
}

// Detalle: se toma de la lista para reflejar los pagos al instante
const detailOpen = ref(false)
const detailId = ref<string | null>(null)
const detailRow = computed(() => rows.value.find((r) => r.id === detailId.value) ?? null)
function openDetail(row: CommissionRow) {
  detailId.value = row.id
  detailOpen.value = true
}

function goProcess(row: CommissionRow) {
  if (row.saleProcess) void router.push({ name: 'ventas-proceso-detalle', params: { id: row.saleProcess.id } })
}

const getActions = (row: CommissionRow) => [
  { label: canPayCommission(row) ? 'Ver y pagar' : 'Ver detalle', icon: 'lucide:eye', onClick: () => openDetail(row) },
  ...(row.saleProcess ? [{ label: 'Ver proceso', icon: 'lucide:handshake', onClick: () => goProcess(row) }] : []),
]

// Excel: todas las páginas con los filtros actuales; importes en la moneda de cada comisión
const ventasFinanzasRepository = useService(ventasFinanzasRepositoryKey)
const { isExporting, exportToExcel } = useExcelExport()
async function handleExport() {
  const all = await fetchAllPages((p, l) => ventasFinanzasRepository.listCommissions({ page: p, limit: l, ...serverFilters.value }), 100)
  await exportToExcel({
    fileName: `comisiones_ventas_${toCalendarDateString()}`,
    sheetName: 'Comisiones',
    columns: [
      { header: 'Proceso', key: 'process', width: 16 },
      { header: 'Inmueble', key: 'property', width: 28 },
      { header: 'Comprador', key: 'buyer', width: 28 },
      { header: 'Asesor', key: 'agent', width: 28 },
      { header: 'Tipo asesor', key: 'agentType', width: 12 },
      { header: 'Cálculo', key: 'calc', width: 18 },
      { header: 'Precio base', key: 'base', width: 20 },
      { header: 'Moneda', key: 'currency', width: 10 },
      { header: 'Bruto', key: 'gross', width: 14 },
      { header: 'Deducibles', key: 'deductibles', width: 14 },
      { header: 'Neto', key: 'net', width: 14 },
      { header: 'Pagado', key: 'paid', width: 14 },
      { header: 'Pendiente', key: 'pending', width: 14 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Fecha de pago', key: 'paidAt', width: 14 },
    ],
    rows: all.map((r) => {
      const base = commissionBasePrice(r)
      return {
        process: r.saleProcess?.code ?? '—',
        property: commissionPropertyCode(r),
        buyer: commissionBuyerName(r),
        agent: r.agent.fullName,
        agentType: agentTypeLabel(r.agent.type),
        calc: commissionCalculationLabel(r),
        base: base != null ? formatCurrency(base, commissionBaseCurrency(r)) : '—',
        currency: r.currency,
        gross: commissionGross(r),
        deductibles: r.deductiblesTotal ?? 0,
        net: commissionNet(r),
        paid: commissionPaidAmount(r),
        pending: commissionPendingAmount(r),
        status: commissionStatusLabel(r.status),
        paidAt: r.paidAt ? formatShortDate(r.paidAt) : '',
      }
    }),
  })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Comisiones" subtitle="Comisiones de asesores por proceso de venta, cada una en su moneda">
      <template #actions>
        <BaseButton
          variant="outline"
          class="flex items-center gap-2 w-full sm:w-auto justify-center"
          :loading="isExporting"
          title="Exportar a Excel"
          @click="handleExport"
        >
          <ExcelIcon class="w-5 h-5" />
          Exportar
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Resumen -->
    <div
      v-if="statsQuery.isError.value"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3 border-gray-200 dark:border-gray-800 bg-warning-50 dark:bg-warning-500/15"
    >
      <span class="max-w-xl text-error-500 dark:text-error-400">{{ getApiErrorMessage(statsQuery.error.value) }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => statsQuery.refetch()">Reintentar</BaseButton>
    </div>
    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard compact title="Por pagar" :value="pendingSummary.main" :subtitle="pendingSummary.rest || 'neto pendiente'" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:hourglass" :size="20" color="#ca8a04" /></template>
      </StatsCard>
      <StatsCard compact title="Pagado" :value="paidSummary.main" :subtitle="paidSummary.rest || 'neto pagado'" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:wallet" :size="20" color="#16a34a" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Abiertas"
        :value="String(openCount)"
        :subtitle="`${stats?.agentsWithPending ?? 0} asesor(es) por cobrar`"
        :loading="statsQuery.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:clock" :size="20" color="var(--color-primary)" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Pagadas"
        :value="String(stats?.byStatus.PAID ?? 0)"
        :subtitle="`${stats?.byStatus.CANCELLED ?? 0} anuladas`"
        :loading="statsQuery.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:circle-check" :size="20" color="#2563eb" /></template>
      </StatsCard>
    </div>

    <BaseCard padding="none" class="block overflow-hidden">
      <div class="overflow-x-auto">
        <div v-if="listQueryError" class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
          <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(listFetchError) }}</p>
          <BaseButton variant="outline" size="sm" @click="() => refetchList()">Reintentar</BaseButton>
        </div>
        <template v-else>
          <DataTable
            :columns="tableColumns"
            :data="rows"
            row-key="id"
            :loading="isFetching"
            empty-text="No hay comisiones con estos filtros."
          >
            <template #toolbar>
              <div class="flex-1 min-w-0">
                <SearchInput v-model="searchInput" placeholder="Buscar por proceso, inmueble, comprador o asesor..." />
              </div>
              <CollapsibleFilters :active-count="activeFilterCount" storage-key="markap.ventas.comisiones.filtros" @clear="clearFilters">
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <FormSelect v-model="filterStatus" label="Estado" :options="statusOptions" />
                  <FormSelect v-model="filterAgent" label="Asesor" :options="agentOptions" />
                  <FormSelect v-model="filterCurrency" label="Moneda" :options="currencyOptions" />
                </div>
              </CollapsibleFilters>
            </template>
            <template #row="{ row }">
              <td class="py-3 px-4">
                <button type="button" class="flex items-start gap-3 text-left" @click="openDetail(row as CommissionRow)">
                  <AppIcon icon="lucide:handshake" :size="16" color="var(--color-text-muted)" class="mt-0.5 shrink-0" />
                  <span class="min-w-0">
                    <span class="block font-medium text-gray-800 dark:text-white/90">{{ (row as CommissionRow).saleProcess?.code ?? 'Cierre' }}</span>
                    <span class="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <AppIcon icon="lucide:map-pin" :size="14" class="shrink-0" />
                      {{ commissionPropertyCode(row as CommissionRow) }} · {{ commissionPropertyAddress(row as CommissionRow) }}
                    </span>
                    <span class="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                      <AppIcon icon="lucide:user" :size="13" class="shrink-0" />
                      {{ commissionBuyerName(row as CommissionRow) }}
                    </span>
                  </span>
                </button>
              </td>
              <td class="py-3 px-4">
                <span class="flex items-center gap-1.5 text-sm text-gray-800 dark:text-white/90">
                  <AppIcon icon="lucide:user-check" :size="16" color="var(--color-text-muted)" class="shrink-0" />
                  {{ (row as CommissionRow).agent.fullName }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ agentTypeLabel((row as CommissionRow).agent.type) }}</span>
              </td>
              <td class="py-3 px-4 text-sm">
                <span class="block text-gray-800 dark:text-white/90">{{ commissionCalculationLabel(row as CommissionRow) }}</span>
                <span v-if="commissionBasePrice(row as CommissionRow) != null" class="text-xs text-gray-500 dark:text-gray-400">
                  {{ (row as CommissionRow).closing ? 'Final' : 'Lista' }}
                  {{ formatCurrency(commissionBasePrice(row as CommissionRow)!, commissionBaseCurrency(row as CommissionRow)) }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm">
                <span class="block font-semibold tabular-nums text-gray-800 dark:text-white/90">
                  {{ money(row as CommissionRow, commissionNet(row as CommissionRow)) }}
                </span>
                <span v-if="(row as CommissionRow).deductiblesTotal" class="text-xs text-gray-500 dark:text-gray-400">
                  Bruto {{ money(row as CommissionRow, commissionGross(row as CommissionRow)) }}
                </span>
              </td>
              <td class="py-3 px-4 min-w-[150px]">
                <template v-if="(row as CommissionRow).status !== 'CANCELLED'">
                  <div class="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div class="h-full rounded-full bg-success-500" :style="{ width: `${progress(row as CommissionRow)}%` }" />
                  </div>
                  <span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    <template v-if="(row as CommissionRow).paymentParts?.length">
                      {{ paidParts(row as CommissionRow) }}/{{ (row as CommissionRow).paymentParts!.length }} cuotas ·
                    </template>
                    <template v-if="commissionPendingAmount(row as CommissionRow) > 0">
                      falta {{ money(row as CommissionRow, commissionPendingAmount(row as CommissionRow)) }}
                    </template>
                    <template v-else>completo</template>
                  </span>
                </template>
                <span v-else class="text-xs text-gray-400 dark:text-gray-500">Venta caída</span>
              </td>
              <td class="py-3 px-4">
                <Badge :variant="COMMISSION_STATUS[(row as CommissionRow).status]?.variant ?? 'neutral'">
                  {{ commissionStatusLabel((row as CommissionRow).status) }}
                </Badge>
              </td>
              <td class="py-3 px-4 text-right">
                <ActionsDropdown :items="getActions(row as CommissionRow)" />
              </td>
            </template>
          </DataTable>
          <div class="border-t border-gray-200 dark:border-gray-800">
            <BasePagination
              v-bind="paginationProps"
              :show-page-size="true"
              @update:current-page="(p: number) => (page = p)"
              @update:page-size="(s: number) => { limit = s; page = 1 }"
            />
          </div>
        </template>
      </div>
    </BaseCard>

    <CommissionDetailModal v-model:open="detailOpen" :commission="detailRow" />
  </div>
</template>
