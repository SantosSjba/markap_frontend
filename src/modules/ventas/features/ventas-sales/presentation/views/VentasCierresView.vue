<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  DataTable,
  BaseButton,
  FormSelect,
  FormCheckbox,
  AppIcon,
  BasePagination,
  Badge,
  PageHeader,
} from '@shared/components'
import BaseModal from '@shared/components/ui/BaseModal.vue'
import {
  useVentasClosingsList,
  useVentasCreateClosing,
  useVentasCompliancePendingBoard,
  useVentasDispatchComplianceAlerts,
} from '../../application/useVentasSales'
import type { SaleClosingRow } from '../../domain/sales.types'
import { ventasClientsRepository } from '@modules/ventas/features/clientes'
import { ventasPropertiesRepository } from '@modules/ventas/features/propiedades'
import { useVentasAgentsList } from '@modules/ventas/features/agentes'
import { PAYMENT_TYPE_OPTIONS } from '../../domain/pipeline.constants'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

const router = useRouter()
const ITEMS = 10
const listParams = ref({ page: 1, limit: ITEMS })
const listApi = computed(() => listParams.value)
const {
  data: listResult,
  isLoading,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useVentasClosingsList(listApi)
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

const columns = [
  { key: 'property', label: 'Inmueble', sortAccessor: (r: unknown) => (r as SaleClosingRow).property.code },
  { key: 'buyer', label: 'Cliente', sortAccessor: (r: unknown) => (r as SaleClosingRow).buyer.fullName },
  { key: 'price', label: 'Precio final', sortAccessor: (r: unknown) => (r as SaleClosingRow).finalPrice },
  { key: 'pay', label: 'Pago', sortAccessor: (r: unknown) => (r as SaleClosingRow).paymentType },
  { key: 'comm', label: 'Comisión', sortAccessor: (r: unknown) => (r as SaleClosingRow).commission?.amount ?? 0 },
  { key: 'act', label: '' },
]

const showNew = ref(false)
const loadingNewModalData = ref(false)
const newModalLoadError = ref('')
const buyerOptions = ref<{ value: string; label: string }[]>([])
const propertyOptions = ref<{ value: string; label: string }[]>([])
const agentParams = ref({ page: 1, limit: 500, isActive: true })
const {
  data: agentsRes,
  isError: agentsQueryError,
  error: agentsFetchError,
  refetch: refetchAgents,
} = useVentasAgentsList(agentParams)
const agentOptions = computed(() =>
  (agentsRes.value?.data ?? []).map((a) => ({ value: a.id, label: a.fullName })),
)

const form = ref({
  buyerClientId: '',
  propertyId: '',
  agentId: '',
  finalPrice: 0,
  paymentType: 'CASH',
  commissionAmount: 0,
  commissionPercent: null as number | null,
  notes: '',
})

const { mutate: createClosing, isPending } = useVentasCreateClosing()
const boardFilters = ref({
  limit: 20,
  offset: 0,
  sunarpStatus: '',
  onlyOverdue: false,
})
const {
  data: pendingBoard,
  isLoading: loadingPendingBoard,
  isError: pendingBoardQueryError,
  error: pendingBoardFetchError,
  refetch: refetchPendingBoard,
} = useVentasCompliancePendingBoard(boardFilters)
const { mutate: dispatchAlerts } = useVentasDispatchComplianceAlerts()
/** Solo el botón pulsado muestra loading (simulate | send). */
const alertDispatchAction = ref<'simulate' | 'send' | null>(null)

async function openModal() {
  newModalLoadError.value = ''
  loadingNewModalData.value = true
  try {
    const [buyers, props] = await Promise.all([
      ventasClientsRepository.getList({ clientType: 'BUYER', page: 1, limit: 500 }),
      ventasPropertiesRepository.getList({ page: 1, limit: 500 }),
    ])
    buyerOptions.value = buyers.data.map((c) => ({
      value: c.id,
      label: `${c.fullName} (${c.documentNumber})`,
    }))
    propertyOptions.value = props.data.map((p) => ({
      value: p.id,
      label: `${p.code} — ${p.listingStatus ?? ''} — ${p.addressLine}`,
    }))
    showNew.value = true
  } catch (e) {
    newModalLoadError.value = getApiErrorMessage(e)
  } finally {
    loadingNewModalData.value = false
  }
}

function submit() {
  if (!form.value.buyerClientId || !form.value.propertyId || form.value.finalPrice <= 0) return
  if (form.value.commissionAmount < 0) return
  const commissionAgentId = form.value.agentId
  if (!commissionAgentId) return
  createClosing(
    {
      buyerClientId: form.value.buyerClientId,
      propertyId: form.value.propertyId,
      agentId: form.value.agentId || null,
      finalPrice: form.value.finalPrice,
      paymentType: form.value.paymentType,
      notes: form.value.notes || null,
      commissionAgentId,
      commissionAmount: form.value.commissionAmount,
      commissionPercent: form.value.commissionPercent,
    },
    {
      onSuccess: () => {
        showNew.value = false
      },
    },
  )
}

function goCompliance(row: SaleClosingRow) {
  router.push({
    name: 'ventas-cierre-cumplimiento',
    params: { closingId: row.id },
    query: {
      propertyId: row.property.id,
      buyerClientId: row.buyer.id,
      propertyCode: row.property.code,
      buyerName: row.buyer.fullName,
      finalPrice: String(row.finalPrice),
    },
  })
}

function runAlerts(dryRun: boolean) {
  const action = dryRun ? 'simulate' : 'send'
  if (alertDispatchAction.value) return
  alertDispatchAction.value = action
  dispatchAlerts(
    { dryRun, maxItems: 50, daysWithoutAlert: 1 },
    {
      onSettled: () => {
        alertDispatchAction.value = null
      },
    },
  )
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Cierres"
      subtitle="Venta final: propiedad en Vendida y comisión registrada (pendiente en Finanzas)."
      icon="lucide:check-circle"
    >
      <template #actions>
        <BaseButton
          variant="primary"
          icon="lucide:plus"
          :loading="loadingNewModalData"
          @click="openModal"
        >
          Registrar cierre
        </BaseButton>
      </template>
    </PageHeader>

    <div
      v-if="newModalLoadError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-warning-light)' }"
    >
      <span class="max-w-xl" style="color: var(--color-error)">{{ newModalLoadError }}</span>
      <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" class="ml-auto shrink-0" :loading="loadingNewModalData" @click="openModal">
        Reintentar
      </BaseButton>
    </div>

    <div
      v-if="agentsQueryError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-warning-light)' }"
    >
      <span :style="{ color: 'var(--color-text-primary)' }">No se pudieron cargar los asesores para el formulario de cierre.</span>
      <span class="text-xs max-w-md" style="color: var(--color-error)">{{ getApiErrorMessage(agentsFetchError) }}</span>
      <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" class="ml-auto shrink-0" @click="() => refetchAgents()">Reintentar</BaseButton>
    </div>

    <div
      class="rounded-xl border p-4 space-y-3"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div class="flex items-start gap-3 min-w-0">
          <div
            class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            :style="{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }"
          >
            <AppIcon icon="lucide:scale" :size="18" color="var(--color-primary)" />
          </div>
          <div>
            <h2 class="text-lg font-semibold" :style="{ color: 'var(--color-text-primary)' }">Pendientes legales</h2>
            <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              Operaciones con faltantes de compliance/SUNARP para seguimiento operativo.
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <BaseButton
            variant="secondary"
            icon="lucide:play"
            :loading="alertDispatchAction === 'simulate'"
            :disabled="!!alertDispatchAction && alertDispatchAction !== 'simulate'"
            @click="runAlerts(true)"
          >
            Simular alertas
          </BaseButton>
          <BaseButton
            variant="primary"
            icon="lucide:send"
            :loading="alertDispatchAction === 'send'"
            :disabled="!!alertDispatchAction && alertDispatchAction !== 'send'"
            @click="runAlerts(false)"
          >
            Enviar alertas
          </BaseButton>
        </div>
      </div>

      <div class="grid sm:grid-cols-3 gap-2">
        <FormSelect
          v-model="boardFilters.sunarpStatus"
          label="SUNARP"
          :options="[
            { value: '', label: 'Todos' },
            { value: 'PENDING', label: 'Pendiente' },
            { value: 'SUBMITTED', label: 'Presentado' },
            { value: 'OBSERVED', label: 'Observado' },
            { value: 'REGISTERED', label: 'Inscrito' },
          ]"
        />
        <FormCheckbox v-model="boardFilters.onlyOverdue" label="Solo vencidos (nextActionAt)" />
      </div>

      <div v-if="loadingPendingBoard" class="py-8 text-center">
        <AppIcon icon="svg-spinners:ring-resize" :size="28" color="var(--color-primary)" />
      </div>
      <div
        v-else-if="pendingBoardQueryError"
        class="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center"
      >
        <p class="text-sm font-medium" style="color: var(--color-error)">{{ getApiErrorMessage(pendingBoardFetchError) }}</p>
        <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchPendingBoard()">Reintentar</BaseButton>
      </div>
      <div v-else class="overflow-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-left" :style="{ borderColor: 'var(--color-border)' }">
              <th class="py-2 px-3">Severidad</th>
              <th class="py-2 px-3">Propiedad</th>
              <th class="py-2 px-3">Comprador</th>
              <th class="py-2 px-3">SUNARP</th>
              <th class="py-2 px-3">Pendientes</th>
              <th class="py-2 px-3">Próxima acción</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in pendingBoard?.data ?? []"
              :key="r.checklistId"
              class="border-b"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <td class="py-2 px-3">
                <Badge :variant="r.severity === 'HIGH' ? 'error' : r.severity === 'MEDIUM' ? 'warning' : 'success'">
                  {{ r.severity }}
                </Badge>
              </td>
              <td class="py-2 px-3 font-mono text-xs">{{ r.propertyId }}</td>
              <td class="py-2 px-3 font-mono text-xs">{{ r.buyerClientId }}</td>
              <td class="py-2 px-3">{{ r.sunarpStatus }}</td>
              <td class="py-2 px-3">{{ r.missing.length }}</td>
              <td class="py-2 px-3">
                {{ r.nextActionAt ? new Date(r.nextActionAt).toLocaleDateString('es-PE') : '—' }}
              </td>
            </tr>
            <tr v-if="!(pendingBoard?.data ?? []).length">
              <td colspan="6" class="py-4 px-3 text-center opacity-70">Sin pendientes en filtros actuales.</td>
            </tr>
          </tbody>
        </table>
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
        <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchList()">Reintentar</BaseButton>
      </div>
      <DataTable v-else :columns="columns" :data="rows" row-key="id" empty-text="Sin cierres registrados.">
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ (row as SaleClosingRow).property.code }}</td>
          <td class="py-3 px-4">{{ (row as SaleClosingRow).buyer.fullName }}</td>
          <td class="py-3 px-4">
            S/ {{ (row as SaleClosingRow).finalPrice.toLocaleString('es-PE') }}
          </td>
          <td class="py-3 px-4">
            <Badge variant="neutral">{{ (row as SaleClosingRow).paymentType }}</Badge>
          </td>
          <td class="py-3 px-4 text-sm">
            <template v-if="(row as SaleClosingRow).commission">
              S/ {{ (row as SaleClosingRow).commission!.amount.toLocaleString('es-PE') }}
              <span class="text-xs opacity-75">({{ (row as SaleClosingRow).commission!.status }})</span>
            </template>
            <span v-else>—</span>
          </td>
          <td class="py-3 px-4 text-right">
            <BaseButton variant="ghost" size="sm" icon="lucide:clipboard-check" @click="goCompliance(row as SaleClosingRow)">
              Cumplimiento
            </BaseButton>
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

    <BaseModal v-model="showNew" title="Registrar cierre de venta" size="lg">
      <div class="p-4 space-y-3">
        <FormSelect v-model="form.buyerClientId" label="Cliente comprador" :options="buyerOptions" required />
        <FormSelect v-model="form.propertyId" label="Inmueble" :options="propertyOptions" required />
        <FormSelect v-model="form.agentId" label="Asesor (comisión)" :options="agentOptions" required />
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium">Precio final (S/)</label>
            <input
              v-model.number="form.finalPrice"
              type="number"
              min="0"
              step="1"
              class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              :style="{ borderColor: 'var(--color-border)' }"
            />
          </div>
          <FormSelect v-model="form.paymentType" label="Tipo de pago" :options="[...PAYMENT_TYPE_OPTIONS]" />
        </div>
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium">Monto comisión (S/)</label>
            <input
              v-model.number="form.commissionAmount"
              type="number"
              min="0"
              step="0.01"
              class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              :style="{ borderColor: 'var(--color-border)' }"
            />
          </div>
          <div>
            <label class="text-sm font-medium">% comisión (opcional)</label>
            <input
              v-model.number="form.commissionPercent"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              :style="{ borderColor: 'var(--color-border)' }"
            />
          </div>
        </div>
        <div>
          <label class="text-sm font-medium">Notas</label>
          <textarea
            v-model="form.notes"
            rows="2"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :style="{ borderColor: 'var(--color-border)' }"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="outline" icon="lucide:x" @click="showNew = false">Cancelar</BaseButton>
          <BaseButton variant="primary" icon="lucide:check-circle" :loading="isPending" @click="submit">Registrar cierre</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
