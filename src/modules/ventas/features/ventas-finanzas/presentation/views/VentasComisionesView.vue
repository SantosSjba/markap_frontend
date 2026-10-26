<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { computed, ref } from 'vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { useVentasAgentsList } from '../../../agentes/presentation/composables/useAgents'
import type { CommissionRow } from '../../domain/finanzas.types'
import {
  useVentasCommissionsList,
  useVentasMarkCommissionPaid,
  useVentasMarkCommissionPaymentPartPaid,
  useVentasRecalculateCommission,
} from '../composables/useVentasFinanzas'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
const ITEMS = 12
const listParams = ref({
  page: 1,
  limit: ITEMS,
  status: '' as string | undefined,
  agentId: '' as string | undefined,
})
const listApi = computed(() => ({
  page: listParams.value.page,
  limit: listParams.value.limit,
  status: listParams.value.status || undefined,
  agentId: listParams.value.agentId || undefined,
}))

const {
  data: listResult,
  isLoading,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useVentasCommissionsList(listApi)
const rows = computed(() => listResult.value?.data ?? [])
const total = computed(() => listResult.value?.total ?? 0)

const paginationProps = computed(() => {
  const page = listParams.value.page
  const limit = listParams.value.limit
  const totalPages = Math.max(1, Math.ceil(total.value / limit))
  return {
    currentPage: page,
    totalPages,
    totalItems: total.value,
    pageSize: limit,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  }
})

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PARTIAL', label: 'Parcial' },
  { value: 'PAID', label: 'Pagado' },
]

const DEDUCTIBLE_LABELS: Record<string, string> = {
  TRAVEL: 'Pasajes',
  TAX: 'Impuestos',
  NOTARY: 'Notaría',
  REGISTRY: 'Registros',
  OTHER: 'Otros',
}

const agentParams = ref({ page: 1, limit: 500, isActive: true })
const {
  data: agentsRes,
  isError: agentsQueryError,
  error: agentsFetchError,
  refetch: refetchAgents,
} = useVentasAgentsList(agentParams)
const agentFilterOptions = computed(() => [
  { value: '', label: 'Todos los asesores' },
  ...(agentsRes.value?.data ?? []).map((a) => ({ value: a.id, label: a.fullName })),
])

function commissionPropertyCode(row: CommissionRow): string {
  return row.closing?.property.code ?? row.saleProcess?.property.code ?? '—'
}

function commissionBuyerName(row: CommissionRow): string {
  return row.closing?.buyer.fullName ?? row.saleProcess?.buyer.fullName ?? '—'
}

function commissionBasePrice(row: CommissionRow): number | null {
  if (row.closing) return row.closing.finalPrice
  const p = row.saleProcess?.property.salePrice
  return p != null ? Number(p) : null
}

function commissionOriginLabel(row: CommissionRow): string {
  if (row.closing) return 'Cierre'
  if (row.saleProcess) return `Proceso ${row.saleProcess.code}`
  return '—'
}

function agentTypeLabel(type?: string): string {
  if (type === 'INTERNAL') return 'Interno'
  if (type === 'EXTERNAL') return 'Externo'
  return '—'
}

function calculationLabel(row: CommissionRow): string {
  if (row.calculationType === 'FIXED') return 'Monto fijo'
  if (row.percentApplied != null) return `${row.percentApplied}%`
  return 'Porcentaje'
}

function commissionGross(row: CommissionRow): number {
  return row.grossAmount ?? row.amount
}

function commissionNet(row: CommissionRow): number {
  return row.netPayable ?? row.amount
}

function commissionStatusLabel(status: string): string {
  if (status === 'PAID') return 'Pagado'
  if (status === 'PARTIAL') return 'Parcial'
  if (status === 'CANCELLED') return 'Anulada'
  return 'Pendiente'
}

function commissionStatusVariant(
  status: string,
): 'success' | 'warning' | 'info' | 'error' | 'neutral' {
  if (status === 'PAID') return 'success'
  if (status === 'PARTIAL') return 'info'
  if (status === 'CANCELLED') return 'neutral'
  return 'warning'
}

function canPayCommission(row: CommissionRow): boolean {
  if (row.status === 'CANCELLED' || row.status === 'PAID') return false
  if (row.saleProcess?.status === 'LOST') return false
  return true
}

const columns = [
  {
    key: 'prop',
    label: 'Inmueble',
    sortAccessor: (r: unknown) => commissionPropertyCode(r as CommissionRow),
  },
  {
    key: 'buyer',
    label: 'Cliente',
    sortAccessor: (r: unknown) => commissionBuyerName(r as CommissionRow),
  },
  {
    key: 'origin',
    label: 'Origen',
    sortAccessor: (r: unknown) => commissionOriginLabel(r as CommissionRow),
  },
  {
    key: 'agent',
    label: 'Asesor',
    sortAccessor: (r: unknown) => (r as CommissionRow).agent.fullName,
  },
  {
    key: 'tipo',
    label: 'Tipo asesor',
    sortAccessor: (r: unknown) => (r as CommissionRow).agent.type ?? '',
  },
  {
    key: 'calc',
    label: 'Cálculo',
    sortAccessor: (r: unknown) => calculationLabel(r as CommissionRow),
  },
  {
    key: 'price',
    label: 'Base',
    sortAccessor: (r: unknown) => commissionBasePrice(r as CommissionRow) ?? 0,
  },
  {
    key: 'amt',
    label: 'Bruto / Neto',
    sortAccessor: (r: unknown) => commissionNet(r as CommissionRow),
  },
  { key: 'st', label: 'Estado', sortAccessor: (r: unknown) => (r as CommissionRow).status },
  { key: 'act', label: '' },
]

const { mutate: markPaid } = useVentasMarkCommissionPaid()
const { mutate: markPartPaid } = useVentasMarkCommissionPaymentPartPaid()
const { mutate: recalc } = useVentasRecalculateCommission()

/** Clave única por botón: mark:{commissionId} | recalc:{commissionId} | part:{partId} */
const pendingCommissionAction = ref<string | null>(null)

function isCommissionActionPending(key: string): boolean {
  return pendingCommissionAction.value === key
}

function onMarkCommissionPaid(commissionId: string) {
  const key = `mark:${commissionId}`
  pendingCommissionAction.value = key
  markPaid(commissionId, {
    onSettled: () => {
      pendingCommissionAction.value = null
    },
  })
}

function onMarkCommissionPartPaid(partId: string) {
  const key = `part:${partId}`
  pendingCommissionAction.value = key
  markPartPaid(partId, {
    onSettled: () => {
      pendingCommissionAction.value = null
    },
  })
}

function onRecalcCommission(commissionId: string) {
  const key = `recalc:${commissionId}`
  pendingCommissionAction.value = key
  recalc(commissionId, {
    onSettled: () => {
      pendingCommissionAction.value = null
    },
  })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Comisiones"
      subtitle="Comisiones con plan de pago en partes y deducibles configurados al crear el proceso."
      icon="lucide:percent"
    />

    <div
      v-if="agentsQueryError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3 border-gray-200 dark:border-gray-800 bg-warning-50 dark:bg-warning-500/15"
    >
      <span class="text-gray-800 dark:text-white/90">No se pudieron cargar los asesores para filtros.</span>
      <span class="text-xs max-w-md text-error-500 dark:text-error-400">{{ getApiErrorMessage(agentsFetchError) }}</span>
      <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" class="ml-auto shrink-0" @click="() => refetchAgents()">Reintentar</BaseButton>
    </div>

    <BaseCard padding="sm" class="block space-y-4">
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-brand-500/12"
        >
          <AppIcon icon="lucide:filter" :size="16" color="var(--color-primary)" />
        </div>
        <p class="text-sm font-medium text-gray-800 dark:text-white/90">Filtros</p>
      </div>
      <div class="flex flex-wrap gap-3 items-end">
      <div class="min-w-[140px]">
        <FormSelect v-model="listParams.status" label="Estado" :options="statusOptions" />
      </div>
      <div class="min-w-[220px] flex-1">
        <FormSelect v-model="listParams.agentId" label="Asesor" :options="agentFilterOptions" />
      </div>
      </div>
    </BaseCard>

    <BaseCard padding="none" class="block overflow-hidden">
      <LoadingState v-if="isLoading" />
      <div
        v-else-if="listQueryError"
        class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center"
      >
        <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(listFetchError) }}</p>
        <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchList()">Reintentar</BaseButton>
      </div>
      <DataTable v-else :columns="columns" :data="rows" row-key="id" empty-text="Sin comisiones registradas.">
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm align-top">{{ commissionPropertyCode(row as CommissionRow) }}</td>
          <td class="py-3 px-4 align-top">{{ commissionBuyerName(row as CommissionRow) }}</td>
          <td class="py-3 px-4 text-sm align-top">{{ commissionOriginLabel(row as CommissionRow) }}</td>
          <td class="py-3 px-4 text-sm align-top">{{ (row as CommissionRow).agent.fullName }}</td>
          <td class="py-3 px-4 text-sm align-top">{{ agentTypeLabel((row as CommissionRow).agent.type) }}</td>
          <td class="py-3 px-4 text-sm align-top">{{ calculationLabel(row as CommissionRow) }}</td>
          <td class="py-3 px-4 text-sm align-top">
            {{
              commissionBasePrice(row as CommissionRow) != null
                ? `S/ ${commissionBasePrice(row as CommissionRow)!.toLocaleString('es-PE')}`
                : '—'
            }}
          </td>
          <td class="py-3 px-4 text-sm align-top">
            <div>Bruto S/ {{ commissionGross(row as CommissionRow).toLocaleString('es-PE') }}</div>
            <div
              v-if="(row as CommissionRow).deductibles?.length"
              class="text-xs mt-0.5 text-gray-400 dark:text-gray-500"
            >
              − deducibles S/ {{ ((row as CommissionRow).deductiblesTotal ?? 0).toLocaleString('es-PE') }}
            </div>
            <div class="font-medium mt-0.5">
              Neto S/ {{ commissionNet(row as CommissionRow).toLocaleString('es-PE') }}
            </div>
          </td>
          <td class="py-3 px-4 align-top">
            <Badge :variant="commissionStatusVariant((row as CommissionRow).status)">
              {{ commissionStatusLabel((row as CommissionRow).status) }}
            </Badge>
          </td>
          <td class="py-3 px-4 align-top min-w-[200px]">
            <div class="space-y-2">
              <ul
                v-if="(row as CommissionRow).paymentParts?.length"
                class="text-xs space-y-1 text-gray-500 dark:text-gray-400"
              >
                <li
                  v-for="part in (row as CommissionRow).paymentParts"
                  :key="part.id"
                  class="flex flex-wrap items-center gap-2"
                >
                  <span>
                    {{ part.label || `Parte ${part.partNumber}` }}:
                    S/ {{ part.amount.toLocaleString('es-PE') }}
                    <span v-if="part.status === 'PAID'" class="text-success-600 dark:text-success-500">(pagada)</span>
                  </span>
                  <BaseButton
                    v-if="part.status !== 'PAID' && canPayCommission(row as CommissionRow)"
                    variant="primary"
                    size="sm"
                    icon="lucide:circle-check"
                    :loading="isCommissionActionPending(`part:${part.id}`)"
                    @click="onMarkCommissionPartPaid(part.id)"
                  >
                    Pagar cuota
                  </BaseButton>
                </li>
              </ul>
              <div v-if="canPayCommission(row as CommissionRow)" class="flex flex-wrap gap-1">
                <BaseButton
                  v-if="
                    (row as CommissionRow).status !== 'PAID' &&
                    (row as CommissionRow).calculationType !== 'FIXED'
                  "
                  variant="secondary"
                  size="sm"
                  icon="lucide:calculator"
                  :loading="isCommissionActionPending(`recalc:${(row as CommissionRow).id}`)"
                  @click="onRecalcCommission((row as CommissionRow).id)"
                >
                  Recalcular
                </BaseButton>
                <BaseButton
                  v-if="(row as CommissionRow).status !== 'PAID'"
                  variant="outline"
                  size="sm"
                  icon="lucide:circle-check"
                  :loading="isCommissionActionPending(`mark:${(row as CommissionRow).id}`)"
                  @click="onMarkCommissionPaid((row as CommissionRow).id)"
                >
                  Pagar todo
                </BaseButton>
              </div>
              <p
                v-else-if="(row as CommissionRow).status === 'CANCELLED' || (row as CommissionRow).saleProcess?.status === 'LOST'"
                class="text-xs text-gray-400 dark:text-gray-500"
              >
                Sin pagos: venta caída o comisión anulada.
              </p>
              <ul
                v-if="(row as CommissionRow).deductibles?.length"
                class="text-xs text-gray-400 dark:text-gray-500"
              >
                <li v-for="d in (row as CommissionRow).deductibles" :key="d.id">
                  {{ DEDUCTIBLE_LABELS[d.deductibleType] ?? d.deductibleType }}:
                  S/ {{ d.amount.toLocaleString('es-PE') }}
                </li>
              </ul>
            </div>
          </td>
        </template>
      </DataTable>
      <div v-if="!isLoading && !listQueryError" class="border-t p-2 border-gray-200 dark:border-gray-800">
        <BasePagination
          v-bind="paginationProps"
          :show-page-size="true"
          @update:current-page="(p: number) => (listParams.page = p)"
          @update:page-size="(s: number) => { listParams.limit = s; listParams.page = 1 }"
        />
      </div>
    </BaseCard>
  </div>
</template>
