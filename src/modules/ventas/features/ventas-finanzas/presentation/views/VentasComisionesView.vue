<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DataTable,
  BaseButton,
  FormSelect,
  AppIcon,
  BasePagination,
  Badge,
} from '@shared/components'
import { useVentasAgentsList } from '@modules/ventas/features/agentes'
import type { CommissionRow } from '../../domain/finanzas.types'
import {
  useVentasCommissionsList,
  useVentasMarkCommissionPaid,
  useVentasRecalculateCommission,
} from '../../application/useVentasFinanzas'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

const ITEMS = 12
const listParams = ref({ page: 1, limit: ITEMS, status: '' as string | undefined, agentId: '' as string | undefined })
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
  { value: 'PAID', label: 'Pagado' },
]

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

const columns = [
  { key: 'prop', label: 'Inmueble', sortAccessor: (r: unknown) => commissionPropertyCode(r as CommissionRow) },
  { key: 'buyer', label: 'Cliente', sortAccessor: (r: unknown) => commissionBuyerName(r as CommissionRow) },
  { key: 'origin', label: 'Origen', sortAccessor: (r: unknown) => commissionOriginLabel(r as CommissionRow) },
  { key: 'agent', label: 'Asesor', sortAccessor: (r: unknown) => (r as CommissionRow).agent.fullName },
  { key: 'tipo', label: 'Tipo asesor', sortAccessor: (r: unknown) => (r as CommissionRow).agent.type ?? '' },
  { key: 'calc', label: 'Cálculo', sortAccessor: (r: unknown) => calculationLabel(r as CommissionRow) },
  {
    key: 'price',
    label: 'Base',
    sortAccessor: (r: unknown) => commissionBasePrice(r as CommissionRow) ?? 0,
  },
  { key: 'amt', label: 'Comisión', sortAccessor: (r: unknown) => (r as CommissionRow).amount },
  { key: 'st', label: 'Estado', sortAccessor: (r: unknown) => (r as CommissionRow).status },
  { key: 'act', label: '' },
]

const { mutate: markPaid, isPending: marking } = useVentasMarkCommissionPaid()
const { mutate: recalc, isPending: recalcing } = useVentasRecalculateCommission()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Comisiones</h1>
      <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
        Listado de comisiones registradas al crear procesos de venta. La configuración se hace en Nuevo proceso.
      </p>
    </div>

    <div
      v-if="agentsQueryError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-warning-light)' }"
    >
      <span :style="{ color: 'var(--color-text-primary)' }">No se pudieron cargar los asesores para filtros.</span>
      <span class="text-xs max-w-md" style="color: var(--color-error)">{{ getApiErrorMessage(agentsFetchError) }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => refetchAgents()">Reintentar</BaseButton>
    </div>

    <div
      class="flex flex-wrap gap-3 items-end rounded-xl border p-4"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div class="min-w-[140px]">
        <FormSelect v-model="listParams.status" label="Estado" :options="statusOptions" />
      </div>
      <div class="min-w-[220px] flex-1">
        <FormSelect v-model="listParams.agentId" label="Asesor" :options="agentFilterOptions" />
      </div>
    </div>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div v-if="isLoading" class="flex justify-center py-16">
        <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
      </div>
      <div
        v-else-if="listQueryError"
        class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center"
      >
        <p class="text-sm font-medium" style="color: var(--color-error)">{{ getApiErrorMessage(listFetchError) }}</p>
        <BaseButton variant="outline" size="sm" @click="() => refetchList()">Reintentar</BaseButton>
      </div>
      <DataTable v-else :columns="columns" :data="rows" row-key="id" empty-text="Sin comisiones registradas.">
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ commissionPropertyCode(row as CommissionRow) }}</td>
          <td class="py-3 px-4">{{ commissionBuyerName(row as CommissionRow) }}</td>
          <td class="py-3 px-4 text-sm">{{ commissionOriginLabel(row as CommissionRow) }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as CommissionRow).agent.fullName }}</td>
          <td class="py-3 px-4 text-sm">{{ agentTypeLabel((row as CommissionRow).agent.type) }}</td>
          <td class="py-3 px-4 text-sm">{{ calculationLabel(row as CommissionRow) }}</td>
          <td class="py-3 px-4 text-sm">
            {{
              commissionBasePrice(row as CommissionRow) != null
                ? `S/ ${commissionBasePrice(row as CommissionRow)!.toLocaleString('es-PE')}`
                : '—'
            }}
          </td>
          <td class="py-3 px-4 text-sm font-medium">
            S/ {{ (row as CommissionRow).amount.toLocaleString('es-PE') }}
          </td>
          <td class="py-3 px-4">
            <Badge :variant="(row as CommissionRow).status === 'PAID' ? 'success' : 'warning'">
              {{ (row as CommissionRow).status === 'PAID' ? 'Pagado' : 'Pendiente' }}
            </Badge>
          </td>
          <td class="py-3 px-4">
            <div class="flex flex-wrap gap-1">
              <BaseButton
                v-if="(row as CommissionRow).status === 'PENDING' && (row as CommissionRow).calculationType !== 'FIXED'"
                variant="secondary"
                size="sm"
                :disabled="recalcing"
                @click="recalc((row as CommissionRow).id)"
              >
                Recalcular
              </BaseButton>
              <BaseButton
                v-if="(row as CommissionRow).status === 'PENDING'"
                variant="primary"
                size="sm"
                :disabled="marking"
                @click="markPaid((row as CommissionRow).id)"
              >
                Marcar pagada
              </BaseButton>
            </div>
          </td>
        </template>
      </DataTable>
      <div v-if="!isLoading && !listQueryError" class="border-t p-2" :style="{ borderColor: 'var(--color-border)' }">
        <BasePagination
          v-bind="paginationProps"
          :show-page-size="true"
          @update:current-page="(p: number) => (listParams.page = p)"
          @update:page-size="(s: number) => { listParams.limit = s; listParams.page = 1 }"
        />
      </div>
    </div>
  </div>
</template>
