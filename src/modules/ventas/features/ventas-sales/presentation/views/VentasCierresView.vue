<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { ventasClientsRepositoryKey } from '../../../clientes/application/ports/ventas-clients.port'
import { ventasPropertiesRepositoryKey } from '../../../propiedades/application/ports/ventas-properties.port'
import { useService } from '@shared/presentation/di/services'
import { FILE_ACCESS } from '@shared/application/ports/file-access.port'
import { formatShortDate } from '@shared/utils/formatters'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import {
  useVentasClosingsList,
  useVentasCreateClosing,
  useVentasUploadClosingContract,
  useVentasCompliancePendingBoard,
  useVentasDispatchComplianceAlerts,
} from '../composables/useVentasSales'
import type { SaleClosingRow } from '../../domain/sales.types'
import { useVentasAgentsList } from '../../../agentes/presentation/composables/useAgents'
import { PAYMENT_TYPE_OPTIONS } from '../../domain/pipeline.constants'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { resolveFileDownloadUrl } from '@shared/utils/archivo-url'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
const ventasClientsRepository = useService(ventasClientsRepositoryKey)
const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)

const fileAccess = useService(FILE_ACCESS)

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
  {
    key: 'property',
    label: 'Inmueble',
    sortAccessor: (r: unknown) => (r as SaleClosingRow).property.code,
  },
  {
    key: 'buyer',
    label: 'Cliente',
    sortAccessor: (r: unknown) => (r as SaleClosingRow).buyer.fullName,
  },
  {
    key: 'price',
    label: 'Precio final',
    sortAccessor: (r: unknown) => (r as SaleClosingRow).finalPrice,
  },
  { key: 'pay', label: 'Pago', sortAccessor: (r: unknown) => (r as SaleClosingRow).paymentType },
  {
    key: 'comm',
    label: 'Comisión',
    sortAccessor: (r: unknown) => (r as SaleClosingRow).commission?.amount ?? 0,
  },
  { key: 'contract', label: 'Contrato' },
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

const initialClosingForm = () => ({
  buyerClientId: '',
  propertyId: '',
  agentId: '',
  finalPrice: 0,
  paymentType: 'CASH',
  commissionAmount: 0,
  commissionPercent: null as number | null,
  notes: '',
})

const form = ref(initialClosingForm())
const contractFile = ref<File | null>(null)
const contractError = ref('')

function resetClosingForm() {
  form.value = initialClosingForm()
  contractFile.value = null
  contractError.value = ''
}

const { mutateAsync: createClosing, isPending } = useVentasCreateClosing()
const { mutateAsync: uploadContract, isPending: uploadingContract } =
  useVentasUploadClosingContract()
const saving = computed(() => isPending.value || uploadingContract.value)

const showContractModal = ref(false)
const contractTargetId = ref<string | null>(null)
const rowContractFile = ref<File | null>(null)
const rowContractError = ref('')
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
  resetClosingForm()
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
    propertyOptions.value = props.data
      .filter((p) => p.listingStatus === 'AVAILABLE' || p.listingStatus === 'RESERVED')
      .map((p) => ({
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

async function submit() {
  if (!form.value.buyerClientId || !form.value.propertyId || form.value.finalPrice <= 0) return
  if (form.value.commissionAmount < 0) return
  const commissionAgentId = form.value.agentId
  if (!commissionAgentId) return
  if (!contractFile.value) {
    contractError.value = 'Adjunta el contrato de compraventa'
    return
  }
  try {
    const created = await createClosing({
      buyerClientId: form.value.buyerClientId,
      propertyId: form.value.propertyId,
      agentId: form.value.agentId || null,
      finalPrice: form.value.finalPrice,
      paymentType: form.value.paymentType,
      notes: form.value.notes || null,
      commissionAgentId,
      commissionAmount: form.value.commissionAmount,
      commissionPercent: form.value.commissionPercent,
    })
    if (contractFile.value && created?.closingId) {
      await uploadContract({ id: created.closingId, file: contractFile.value })
    }
    showNew.value = false
    resetClosingForm()
  } catch {
    /* toasts in mutations */
  }
}

function openUploadContract(row: SaleClosingRow) {
  contractTargetId.value = row.id
  rowContractFile.value = null
  rowContractError.value = ''
  showContractModal.value = true
}

async function submitRowContract() {
  if (!contractTargetId.value || !rowContractFile.value) {
    rowContractError.value = 'Selecciona un archivo'
    return
  }
  try {
    await uploadContract({ id: contractTargetId.value, file: rowContractFile.value })
    showContractModal.value = false
  } catch {
    /* toast in mutation */
  }
}

function hasContract(row: SaleClosingRow) {
  return !!(row.contractArchivoId || row.contractFilePath || row.downloadUrl)
}

async function openContract(row: SaleClosingRow) {
  try {
    if (row.downloadUrl) {
      window.open(row.downloadUrl, '_blank', 'noopener,noreferrer')
      return
    }
    if (row.contractArchivoId) {
      const data = await fileAccess.getDownloadUrl(encodeURIComponent(row.contractArchivoId), {
        applicationSlug: 'ventas',
      })
      if (data?.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer')
        return
      }
    }
    const legacy = resolveFileDownloadUrl({ filePath: row.contractFilePath ?? undefined })
    if (legacy !== '#') {
      window.open(legacy, '_blank', 'noopener,noreferrer')
      return
    }
    void markapAlert.toast.error('No hay archivo disponible')
  } catch (e) {
    void markapAlert.toast.error('No se pudo abrir el archivo', getApiErrorMessage(e))
  }
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
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3 border-gray-200 dark:border-gray-800 bg-warning-50 dark:bg-warning-500/15"
    >
      <span class="max-w-xl text-error-500 dark:text-error-400">{{ newModalLoadError }}</span>
      <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" class="ml-auto shrink-0" :loading="loadingNewModalData" @click="openModal">
        Reintentar
      </BaseButton>
    </div>

    <div
      v-if="agentsQueryError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3 border-gray-200 dark:border-gray-800 bg-warning-50 dark:bg-warning-500/15"
    >
      <span class="text-gray-800 dark:text-white/90">No se pudieron cargar los asesores para el formulario de cierre.</span>
      <span class="text-xs max-w-md text-error-500 dark:text-error-400">{{ getApiErrorMessage(agentsFetchError) }}</span>
      <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" class="ml-auto shrink-0" @click="() => refetchAgents()">Reintentar</BaseButton>
    </div>

    <BaseCard padding="sm" class="block space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div class="flex items-start gap-3 min-w-0">
          <div
            class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-brand-500/12"
          >
            <AppIcon icon="lucide:scale" :size="18" color="var(--color-primary)" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">Pendientes legales</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
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

      <LoadingState v-if="loadingPendingBoard" class="py-8" />
      <div
        v-else-if="pendingBoardQueryError"
        class="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center"
      >
        <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(pendingBoardFetchError) }}</p>
        <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchPendingBoard()">Reintentar</BaseButton>
      </div>
      <div v-else class="overflow-auto">
        <Table class="w-full text-sm">
          <TableHeader>
            <TableRow class="border-b text-left border-gray-200 dark:border-gray-800">
              <TableCell is-header class="py-2 px-3">Severidad</TableCell>
              <TableCell is-header class="py-2 px-3">Propiedad</TableCell>
              <TableCell is-header class="py-2 px-3">Comprador</TableCell>
              <TableCell is-header class="py-2 px-3">SUNARP</TableCell>
              <TableCell is-header class="py-2 px-3">Pendientes</TableCell>
              <TableCell is-header class="py-2 px-3">Próxima acción</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="r in pendingBoard?.data ?? []"
              :key="r.checklistId"
              class="border-b border-gray-200 dark:border-gray-800"
            >
              <TableCell class="py-2 px-3">
                <Badge :variant="r.severity === 'HIGH' ? 'error' : r.severity === 'MEDIUM' ? 'warning' : 'success'">
                  {{ r.severity }}
                </Badge>
              </TableCell>
              <TableCell class="py-2 px-3 font-mono text-xs">{{ r.propertyId }}</TableCell>
              <TableCell class="py-2 px-3 font-mono text-xs">{{ r.buyerClientId }}</TableCell>
              <TableCell class="py-2 px-3">{{ r.sunarpStatus }}</TableCell>
              <TableCell class="py-2 px-3">{{ r.missing.length }}</TableCell>
              <TableCell class="py-2 px-3">
                {{ r.nextActionAt ? formatShortDate(r.nextActionAt) : '—' }}
              </TableCell>
            </TableRow>
            <TableRow v-if="!(pendingBoard?.data ?? []).length">
              <TableCell colspan="6" class="py-4 px-3 text-center opacity-70">Sin pendientes en filtros actuales.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
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
          <td class="py-3 px-4">
            <BaseButton
              v-if="hasContract(row as SaleClosingRow)"
              variant="ghost"
              size="sm"
              icon="lucide:external-link"
              @click="openContract(row as SaleClosingRow)"
            >
              Ver
            </BaseButton>
            <BaseButton
              v-else
              variant="ghost"
              size="sm"
              icon="lucide:upload"
              @click="openUploadContract(row as SaleClosingRow)"
            >
              Subir
            </BaseButton>
          </td>
          <td class="py-3 px-4 text-right">
            <BaseButton variant="ghost" size="sm" icon="lucide:clipboard-check" @click="goCompliance(row as SaleClosingRow)">
              Cumplimiento
            </BaseButton>
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

    <BaseModal v-model="showNew" title="Registrar cierre de venta" size="lg">
      <div class="p-4 space-y-3">
        <FormSelect v-model="form.buyerClientId" label="Cliente comprador" :options="buyerOptions" required />
        <FormSelect v-model="form.propertyId" label="Inmueble" :options="propertyOptions" required />
        <FormSelect v-model="form.agentId" label="Asesor (comisión)" :options="agentOptions" required />
        <div class="grid sm:grid-cols-2 gap-3">
          <FormInput v-model="form.finalPrice" type="number" min="0" step="1" label="Precio final (S/)" />
          <FormSelect v-model="form.paymentType" label="Tipo de pago" :options="[...PAYMENT_TYPE_OPTIONS]" />
        </div>
        <div class="grid sm:grid-cols-2 gap-3">
          <FormInput v-model="form.commissionAmount" type="number" min="0" step="0.01" label="Monto comisión (S/)" />
          <FormInput v-model="form.commissionPercent" type="number" min="0" max="100" step="0.1" label="% comisión (opcional)" />
        </div>
        <FormTextarea v-model="form.notes" :rows="2" label="Notas" />
        <FileDropzone
          v-model="contractFile"
          label="Contrato de compraventa"
          :multiple="false"
          required
          :error="contractError"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          hint="PDF o documento firmado"
          @error="(m: string) => (contractError = m)"
        />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="outline" icon="lucide:x" @click="showNew = false">Cancelar</BaseButton>
          <BaseButton variant="primary" icon="lucide:check-circle" :loading="saving" @click="submit">Registrar cierre</BaseButton>
        </div>
      </div>
    </BaseModal>

    <BaseModal v-model="showContractModal" title="Adjuntar contrato" size="md">
      <div class="p-4 space-y-3">
        <FileDropzone
          v-model="rowContractFile"
          label="Archivo"
          :multiple="false"
          :error="rowContractError"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          @error="(m: string) => (rowContractError = m)"
        />
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" icon="lucide:x" @click="showContractModal = false">Cancelar</BaseButton>
          <BaseButton variant="primary" icon="lucide:upload" :loading="uploadingContract" @click="submitRowContract">
            Subir
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
