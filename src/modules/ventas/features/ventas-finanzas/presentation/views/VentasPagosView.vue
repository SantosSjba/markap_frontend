<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { ventasClientsRepositoryKey } from '../../../clientes/application/ports/ventas-clients.port'
import { ventasSalesRepositoryKey } from '../../../ventas-sales/application/ports/ventas-sales.port'
import { useService } from '@shared/presentation/di/services'
import { computed, ref, watch } from 'vue'
import * as yup from 'yup'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import type { BuyerPaymentRow } from '../../domain/finanzas.types'
import {
  useVentasBuyerPaymentsList,
  useVentasCreateBuyerPayment,
  useVentasMarkBuyerPaymentPaid,
} from '../composables/useVentasFinanzas'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatShortDate } from '@shared/utils/formatters'
const ventasClientsRepository = useService(ventasClientsRepositoryKey)
const ventasSalesRepository = useService(ventasSalesRepositoryKey)

const ITEMS = 15
const listParams = ref({
  page: 1,
  limit: ITEMS,
  buyerClientId: '' as string | undefined,
  displayStatus: '' as string | undefined,
  kind: '' as string | undefined,
})
const listApi = computed(() => ({
  page: listParams.value.page,
  limit: listParams.value.limit,
  buyerClientId: listParams.value.buyerClientId || undefined,
  displayStatus: listParams.value.displayStatus || undefined,
  kind: listParams.value.kind || undefined,
}))

const {
  data: listResult,
  isLoading,
  isError,
  error: listQueryError,
  refetch: refetchList,
} = useVentasBuyerPaymentsList(listApi)
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

const buyerFilterOptions = ref<{ value: string; label: string }[]>([
  { value: '', label: 'Todos los clientes' },
])
const buyersLoadState = ref<'idle' | 'loading' | 'error'>('idle')
const buyersErrorMsg = ref('')

async function loadBuyers() {
  buyersLoadState.value = 'loading'
  buyersErrorMsg.value = ''
  try {
    const res = await ventasClientsRepository.getList({ clientType: 'BUYER', page: 1, limit: 500 })
    buyerFilterOptions.value = [
      { value: '', label: 'Todos los clientes' },
      ...res.data.map((c) => ({ value: c.id, label: `${c.fullName} (${c.documentNumber})` })),
    ]
    buyersLoadState.value = 'idle'
  } catch (e) {
    buyersLoadState.value = 'error'
    buyersErrorMsg.value = getApiErrorMessage(e)
  }
}

void loadBuyers()

watch(
  () => [listParams.value.buyerClientId, listParams.value.displayStatus, listParams.value.kind],
  () => {
    listParams.value.page = 1
  },
)

const statusFilterOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'OVERDUE', label: 'Atrasado' },
  { value: 'PAID', label: 'Pagado' },
]

const kindFilterOptions = [
  { value: '', label: 'Inicial y cuotas' },
  { value: 'DOWN_PAYMENT', label: 'Inicial' },
  { value: 'INSTALLMENT', label: 'Cuota' },
]

const columns = [
  {
    key: 'client',
    label: 'Cliente',
    sortAccessor: (r: unknown) => (r as BuyerPaymentRow).closing.buyer.fullName,
  },
  {
    key: 'prop',
    label: 'Inmueble',
    sortAccessor: (r: unknown) => (r as BuyerPaymentRow).closing.property.code,
  },
  { key: 'kind', label: 'Tipo', sortAccessor: (r: unknown) => (r as BuyerPaymentRow).kind },
  { key: 'amt', label: 'Monto', sortAccessor: (r: unknown) => (r as BuyerPaymentRow).amount },
  {
    key: 'due',
    label: 'Vencimiento',
    sortAccessor: (r: unknown) => (r as BuyerPaymentRow).dueDate,
  },
  {
    key: 'st',
    label: 'Estado',
    sortAccessor: (r: unknown) => (r as BuyerPaymentRow).displayStatus,
  },
  { key: 'act', label: '' },
]

function statusBadgeVariant(s: string): 'success' | 'warning' | 'error' | 'neutral' {
  if (s === 'PAID') return 'success'
  if (s === 'OVERDUE') return 'error'
  return 'warning'
}

function statusLabel(s: string) {
  if (s === 'PAID') return 'Pagado'
  if (s === 'OVERDUE') return 'Atrasado'
  return 'Pendiente'
}

const showNew = ref(false)
const loadingNewModalData = ref(false)
const closingOptions = ref<{ value: string; label: string }[]>([])

const paymentSchema = toTypedSchema(
  yup.object({
    saleClosingId: yup.string().required('Seleccione el cierre de venta'),
    kind: yup.string().oneOf(['DOWN_PAYMENT', 'INSTALLMENT']).required(),
    amount: yup.number().positive('Monto debe ser mayor a 0').required(),
    dueDate: yup.string().required('Indique la fecha de vencimiento'),
    notes: yup.string().optional(),
  }),
)

const {
  handleSubmit: submitPayment,
  errors: paymentErrors,
  defineComponentBinds,
  resetForm: resetPaymentForm,
} = useForm({
  validationSchema: paymentSchema,
  initialValues: {
    saleClosingId: '',
    kind: 'INSTALLMENT',
    amount: 0,
    dueDate: '',
    notes: '',
  },
})

const binds = {
  saleClosingId: defineComponentBinds('saleClosingId'),
  kind: defineComponentBinds('kind'),
  amount: defineComponentBinds('amount'),
  dueDate: defineComponentBinds('dueDate'),
  notes: defineComponentBinds('notes'),
}

const kindOptions = [
  { value: 'DOWN_PAYMENT', label: 'Inicial' },
  { value: 'INSTALLMENT', label: 'Cuota' },
]

const { mutate: createPayment, isPending: creating } = useVentasCreateBuyerPayment()
const { mutate: markPaid } = useVentasMarkBuyerPaymentPaid()
const markingPaymentId = ref<string | null>(null)

async function openNewModal() {
  loadingNewModalData.value = true
  try {
    const closings = await ventasSalesRepository.listClosings({ page: 1, limit: 500 })
    closingOptions.value = closings.data.map((c) => ({
      value: c.id,
      label: `${c.property.code} — ${c.buyer.fullName} — S/ ${c.finalPrice.toLocaleString('es-PE')}`,
    }))
    resetPaymentForm()
    showNew.value = true
  } catch (e) {
    void markapAlert.toast.error('No se pudo abrir el formulario', getApiErrorMessage(e))
  } finally {
    loadingNewModalData.value = false
  }
}

const onSubmitPayment = submitPayment((values) => {
  createPayment(
    {
      saleClosingId: values.saleClosingId,
      kind: values.kind,
      amount: values.amount,
      dueDate: values.dueDate,
      notes: values.notes || null,
    },
    {
      onSuccess: () => {
        showNew.value = false
        resetPaymentForm()
      },
    },
  )
})

function onMarkPaid(row: BuyerPaymentRow) {
  if (row.displayStatus === 'PAID' || markingPaymentId.value) return
  markingPaymentId.value = row.id
  markPaid(
    { id: row.id },
    {
      onSettled: () => {
        markingPaymentId.value = null
      },
    },
  )
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Pagos"
      subtitle="Inicial y cuotas del comprador por cierre; pendiente, pagado o atrasado según vencimiento."
    >
      <template #actions>
        <BaseButton
        variant="primary"
        class="flex items-center gap-2"
        :loading="loadingNewModalData"
        @click="openNewModal"
      >
        <AppIcon icon="lucide:plus" :size="18" />
        Registrar pago
      </BaseButton>
      </template>
    </PageHeader>

    <BaseCard padding="sm" class="flex flex-wrap gap-3 items-end flex-row">
      <div
        v-if="buyersLoadState === 'error'"
        class="w-full flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm border-gray-200 dark:border-gray-800 text-error-500 dark:text-error-400"
      >
        <span>No se pudieron cargar los clientes del filtro: {{ buyersErrorMsg }}</span>
        <BaseButton variant="secondary" size="sm" icon="lucide:refresh-cw" @click="loadBuyers">Reintentar</BaseButton>
      </div>
      <div class="min-w-[200px] flex-1">
        <FormSelect
          v-model="listParams.buyerClientId"
          label="Cliente (historial)"
          :options="buyerFilterOptions"
        />
      </div>
      <div class="min-w-[160px]">
        <FormSelect v-model="listParams.displayStatus" label="Estado" :options="statusFilterOptions" />
      </div>
      <div class="min-w-[160px]">
        <FormSelect v-model="listParams.kind" label="Tipo" :options="kindFilterOptions" />
      </div>
    </BaseCard>

    <BaseCard padding="none" class="block overflow-hidden">
      <LoadingState v-if="isLoading" />
      <div
        v-else-if="isError"
        class="p-8 text-center space-y-3 text-gray-500 dark:text-gray-400"
      >
        <p class="text-sm text-error-500 dark:text-error-400">{{ getApiErrorMessage(listQueryError) }}</p>
        <BaseButton variant="secondary" size="sm" icon="lucide:refresh-cw" @click="() => refetchList()">Reintentar</BaseButton>
      </div>
      <DataTable v-else :columns="columns" :data="rows" row-key="id" empty-text="Sin pagos registrados.">
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ (row as BuyerPaymentRow).closing.buyer.fullName }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as BuyerPaymentRow).closing.property.code }}</td>
          <td class="py-3 px-4">
            <Badge variant="neutral">{{
              (row as BuyerPaymentRow).kind === 'DOWN_PAYMENT' ? 'Inicial' : 'Cuota'
            }}</Badge>
          </td>
          <td class="py-3 px-4 text-sm">
            S/ {{ (row as BuyerPaymentRow).amount.toLocaleString('es-PE') }}
          </td>
          <td class="py-3 px-4 text-sm">
            {{ formatShortDate((row as BuyerPaymentRow).dueDate) }}
          </td>
          <td class="py-3 px-4">
            <Badge :variant="statusBadgeVariant((row as BuyerPaymentRow).displayStatus)">
              {{ statusLabel((row as BuyerPaymentRow).displayStatus) }}
            </Badge>
          </td>
          <td class="py-3 px-4">
            <BaseButton
              v-if="(row as BuyerPaymentRow).displayStatus !== 'PAID'"
              variant="secondary"
              size="sm"
              icon="lucide:circle-check"
              :loading="markingPaymentId === (row as BuyerPaymentRow).id"
              :disabled="!!markingPaymentId && markingPaymentId !== (row as BuyerPaymentRow).id"
              @click="onMarkPaid(row as BuyerPaymentRow)"
            >
              Marcar pagado
            </BaseButton>
          </td>
        </template>
      </DataTable>
      <div class="border-t p-2 border-gray-200 dark:border-gray-800">
        <BasePagination
          v-bind="paginationProps"
          :show-page-size="true"
          @update:current-page="(p: number) => (listParams.page = p)"
          @update:page-size="(s: number) => { listParams.limit = s; listParams.page = 1 }"
        />
      </div>
    </BaseCard>

    <BaseModal v-model="showNew" title="Registrar pago" size="md">
      <form class="space-y-4" @submit.prevent="onSubmitPayment">
        <FormSelect label="Cierre de venta" v-bind="binds.saleClosingId" :options="closingOptions" />
        <p v-if="paymentErrors.saleClosingId" class="text-sm text-error-600 dark:text-error-500">{{ paymentErrors.saleClosingId }}</p>

        <FormSelect label="Tipo" v-bind="binds.kind" :options="kindOptions" />

        <FormInput label="Monto" type="number" step="0.01" v-bind="binds.amount" />
        <p v-if="paymentErrors.amount" class="text-sm text-error-600 dark:text-error-500">{{ paymentErrors.amount }}</p>

        <FormInput label="Vencimiento" type="date" v-bind="binds.dueDate" />
        <p v-if="paymentErrors.dueDate" class="text-sm text-error-600 dark:text-error-500">{{ paymentErrors.dueDate }}</p>

        <FormTextarea label="Notas (opcional)" v-bind="binds.notes" />

        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" icon="lucide:x" @click="showNew = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" icon="lucide:save" :loading="creating">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
