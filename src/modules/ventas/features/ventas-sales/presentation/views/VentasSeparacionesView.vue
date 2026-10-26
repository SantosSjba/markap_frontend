<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { ventasClientsRepositoryKey } from '../../../clientes/application/ports/ventas-clients.port'
import { ventasPropertiesRepositoryKey } from '../../../propiedades/application/ports/ventas-properties.port'
import { useService } from '@shared/presentation/di/services'
import { FILE_ACCESS } from '@shared/application/ports/file-access.port'
import { ref, computed } from 'vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import {
  useVentasSeparationsList,
  useVentasCreateSeparation,
  useVentasUploadSeparationReceipt,
} from '../composables/useVentasSales'
import type { SaleSeparationRow } from '../../domain/sales.types'
import { SEPARATION_STATUS_OPTIONS, separationStatusLabel } from '../../domain/pipeline.constants'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { toCalendarDateString } from '@shared/utils/formatters'
import { resolveFileDownloadUrl } from '@shared/utils/archivo-url'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
const ventasClientsRepository = useService(ventasClientsRepositoryKey)
const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)

const fileAccess = useService(FILE_ACCESS)

const ITEMS = 10
const listParams = ref({ page: 1, limit: ITEMS, status: '' as string | undefined })
const listApi = computed(() => ({
  page: listParams.value.page,
  limit: listParams.value.limit,
  status: listParams.value.status || undefined,
}))
const {
  data: listResult,
  isLoading,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useVentasSeparationsList(listApi)
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
    sortAccessor: (r: unknown) => (r as SaleSeparationRow).property.code,
  },
  {
    key: 'buyer',
    label: 'Cliente',
    sortAccessor: (r: unknown) => (r as SaleSeparationRow).buyer.fullName,
  },
  { key: 'amount', label: 'Monto', sortAccessor: (r: unknown) => (r as SaleSeparationRow).amount },
  { key: 'status', label: 'Estado', sortAccessor: (r: unknown) => (r as SaleSeparationRow).status },
  { key: 'receipt', label: 'Comprobante' },
]

const showNew = ref(false)
const loadingNewModalData = ref(false)
const newModalLoadError = ref('')
const buyerOptions = ref<{ value: string; label: string }[]>([])
const propertyOptions = ref<{ value: string; label: string }[]>([])
const receiptFile = ref<File | null>(null)
const receiptError = ref('')
const initialSeparationForm = () => ({
  buyerClientId: '',
  propertyId: '',
  amount: 0,
  separationDate: toCalendarDateString(),
  notes: '',
})

const form = ref(initialSeparationForm())

function resetSeparationForm() {
  form.value = initialSeparationForm()
  receiptFile.value = null
  receiptError.value = ''
}

const { mutateAsync: createSep, isPending } = useVentasCreateSeparation()
const { mutateAsync: uploadReceipt, isPending: uploadingReceipt } =
  useVentasUploadSeparationReceipt()
const saving = computed(() => isPending.value || uploadingReceipt.value)

const showReceiptModal = ref(false)
const receiptTargetId = ref<string | null>(null)
const rowReceiptFile = ref<File | null>(null)
const rowReceiptError = ref('')

async function openModal() {
  newModalLoadError.value = ''
  resetSeparationForm()
  loadingNewModalData.value = true
  try {
    const [buyers, props] = await Promise.all([
      ventasClientsRepository.getList({ clientType: 'BUYER', page: 1, limit: 500 }),
      ventasPropertiesRepository.getList({ page: 1, limit: 500, listingStatus: 'AVAILABLE' }),
    ])
    buyerOptions.value = buyers.data.map((c) => ({
      value: c.id,
      label: `${c.fullName} (${c.documentNumber})`,
    }))
    propertyOptions.value = props.data.map((p) => ({
      value: p.id,
      label: `${p.code} — ${p.addressLine}`,
    }))
    showNew.value = true
  } catch (e) {
    newModalLoadError.value = getApiErrorMessage(e)
  } finally {
    loadingNewModalData.value = false
  }
}

async function submit() {
  if (!form.value.buyerClientId || !form.value.propertyId || form.value.amount <= 0) return
  if (!receiptFile.value) {
    receiptError.value = 'Adjunta el comprobante de separación'
    return
  }
  try {
    const created = await createSep({
      buyerClientId: form.value.buyerClientId,
      propertyId: form.value.propertyId,
      amount: form.value.amount,
      separationDate: form.value.separationDate,
      notes: form.value.notes || null,
    })
    if (receiptFile.value && created?.id) {
      await uploadReceipt({ id: created.id, file: receiptFile.value })
    }
    showNew.value = false
    resetSeparationForm()
  } catch {
    /* toasts handled in mutations */
  }
}

function openUploadReceipt(row: SaleSeparationRow) {
  receiptTargetId.value = row.id
  rowReceiptFile.value = null
  rowReceiptError.value = ''
  showReceiptModal.value = true
}

async function submitRowReceipt() {
  if (!receiptTargetId.value || !rowReceiptFile.value) {
    rowReceiptError.value = 'Selecciona un archivo'
    return
  }
  try {
    await uploadReceipt({ id: receiptTargetId.value, file: rowReceiptFile.value })
    showReceiptModal.value = false
  } catch {
    /* toast in mutation */
  }
}

function hasReceipt(row: SaleSeparationRow) {
  return !!(row.receiptArchivoId || row.receiptFilePath || row.downloadUrl)
}

async function openReceipt(row: SaleSeparationRow) {
  try {
    if (row.downloadUrl) {
      window.open(row.downloadUrl, '_blank', 'noopener,noreferrer')
      return
    }
    if (row.receiptArchivoId) {
      const data = await fileAccess.getDownloadUrl(encodeURIComponent(row.receiptArchivoId), {
        applicationSlug: 'ventas',
      })
      if (data?.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer')
        return
      }
    }
    const legacy = resolveFileDownloadUrl({ filePath: row.receiptFilePath ?? undefined })
    if (legacy !== '#') {
      window.open(legacy, '_blank', 'noopener,noreferrer')
      return
    }
    void markapAlert.toast.error('No hay archivo disponible')
  } catch (e) {
    void markapAlert.toast.error('No se pudo abrir el archivo', getApiErrorMessage(e))
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Separaciones"
      subtitle="Reserva con dinero — la propiedad pasa a estado Separada (bloqueo de inventario)."
      icon="lucide:bookmark"
    >
      <template #actions>
        <BaseButton variant="primary" icon="lucide:plus" :loading="loadingNewModalData" @click="openModal">
          Nueva separación
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

    <BaseCard padding="none" class="block overflow-hidden">
      <LoadingState v-if="isLoading" />
      <div
        v-else-if="listQueryError"
        class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center"
      >
        <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(listFetchError) }}</p>
        <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchList()">Reintentar</BaseButton>
      </div>
      <DataTable v-else :columns="columns" :data="rows" row-key="id" empty-text="Sin separaciones.">
        <template #toolbar>
          <FormSelect
            v-model="listParams.status"
            class="w-full sm:w-[200px]"
            :options="[{ value: '', label: 'Todos los estados' }, ...SEPARATION_STATUS_OPTIONS]"
            placeholder="Estado"
            @update:model-value="listParams.page = 1"
          />
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ (row as SaleSeparationRow).property.code }}</td>
          <td class="py-3 px-4">{{ (row as SaleSeparationRow).buyer.fullName }}</td>
          <td class="py-3 px-4">
            {{ (row as SaleSeparationRow).currency }}
            {{ (row as SaleSeparationRow).amount.toLocaleString('es-PE') }}
          </td>
          <td class="py-3 px-4">{{ separationStatusLabel((row as SaleSeparationRow).status) }}</td>
          <td class="py-3 px-4">
            <BaseButton
              v-if="hasReceipt(row as SaleSeparationRow)"
              variant="ghost"
              size="sm"
              icon="lucide:external-link"
              @click="openReceipt(row as SaleSeparationRow)"
            >
              Ver
            </BaseButton>
            <BaseButton
              v-else
              variant="ghost"
              size="sm"
              icon="lucide:upload"
              @click="openUploadReceipt(row as SaleSeparationRow)"
            >
              Subir
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

    <BaseModal v-model="showNew" title="Nueva separación" size="lg">
      <div class="p-4 space-y-3">
        <FormSelect v-model="form.buyerClientId" label="Cliente comprador" :options="buyerOptions" required />
        <FormSelect v-model="form.propertyId" label="Inmueble disponible" :options="propertyOptions" required />
        <FormInput v-model="form.amount" type="number" min="0" step="0.01" label="Monto (S/)" />
        <FormInput v-model="form.separationDate" type="date" label="Fecha" />
        <FormTextarea v-model="form.notes" :rows="2" label="Notas" />
        <FileDropzone
          v-model="receiptFile"
          label="Comprobante de separación"
          :multiple="false"
          required
          :error="receiptError"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          hint="PDF o imagen del voucher / transferencia"
          @error="(m: string) => (receiptError = m)"
        />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="outline" icon="lucide:x" @click="showNew = false">Cancelar</BaseButton>
          <BaseButton variant="primary" icon="lucide:save" :loading="saving" @click="submit">Guardar</BaseButton>
        </div>
      </div>
    </BaseModal>

    <BaseModal v-model="showReceiptModal" title="Subir comprobante" size="md">
      <div class="p-4 space-y-3">
        <FileDropzone
          v-model="rowReceiptFile"
          label="Archivo"
          :multiple="false"
          :error="rowReceiptError"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          @error="(m: string) => (rowReceiptError = m)"
        />
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" icon="lucide:x" @click="showReceiptModal = false">Cancelar</BaseButton>
          <BaseButton variant="primary" icon="lucide:upload" :loading="uploadingReceipt" @click="submitRowReceipt">
            Subir
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
