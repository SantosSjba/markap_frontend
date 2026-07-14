<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as yup from 'yup'
import {
  DataTable,
  BaseButton,
  FormSelect,
  FormInput,
  FormTextarea,
  AppIcon,
  BasePagination,
  Badge,
} from '@shared/components'
import BaseModal from '@shared/components/ui/BaseModal.vue'
import { useForm, toTypedSchema } from '@shared/components/forms'
import { ventasClientsRepository } from '@modules/ventas/features/clientes'
import { ventasSalesRepository } from '@ventas/sales'
import type { BuyerPaymentRow } from '../../domain/finanzas.types'
import {
  useVentasBuyerPaymentsList,
  useVentasCreateBuyerPayment,
  useVentasMarkBuyerPaymentPaid,
} from '../../application/useVentasFinanzas'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { formatShortDate } from '@/shared/utils/formatters'

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

const { data: listResult, isLoading, isError, error: listQueryError, refetch: refetchList } =
  useVentasBuyerPaymentsList(listApi)
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

const buyerFilterOptions = ref<{ value: string; label: string }[]>([{ value: '', label: 'Todos los clientes' }])
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
  { key: 'client', label: 'Cliente', sortAccessor: (r: unknown) => (r as BuyerPaymentRow).closing.buyer.fullName },
  { key: 'prop', label: 'Inmueble', sortAccessor: (r: unknown) => (r as BuyerPaymentRow).closing.property.code },
  { key: 'kind', label: 'Tipo', sortAccessor: (r: unknown) => (r as BuyerPaymentRow).kind },
  { key: 'amt', label: 'Monto', sortAccessor: (r: unknown) => (r as BuyerPaymentRow).amount },
  { key: 'due', label: 'Vencimiento', sortAccessor: (r: unknown) => (r as BuyerPaymentRow).dueDate },
  { key: 'st', label: 'Estado', sortAccessor: (r: unknown) => (r as BuyerPaymentRow).displayStatus },
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
    <div class="flex flex-col sm:flex-row sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Pagos</h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Inicial y cuotas del comprador por cierre; pendiente, pagado o atrasado según vencimiento.
        </p>
      </div>
      <BaseButton
        variant="primary"
        class="flex items-center gap-2"
        :loading="loadingNewModalData"
        @click="openNewModal"
      >
        <AppIcon icon="lucide:plus" :size="18" />
        Registrar pago
      </BaseButton>
    </div>

    <div
      class="flex flex-wrap gap-3 items-end rounded-xl border p-4"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div
        v-if="buyersLoadState === 'error'"
        class="w-full flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
        style="border-color: var(--color-border); color: var(--color-error)"
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
    </div>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div v-if="isLoading" class="flex justify-center py-16">
        <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
      </div>
      <div
        v-else-if="isError"
        class="p-8 text-center space-y-3"
        :style="{ color: 'var(--color-text-secondary)' }"
      >
        <p class="text-sm" style="color: var(--color-error)">{{ getApiErrorMessage(listQueryError) }}</p>
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
      <div class="border-t p-2" :style="{ borderColor: 'var(--color-border)' }">
        <BasePagination
          v-bind="paginationProps"
          :show-page-size="true"
          @update:current-page="(p: number) => (listParams.page = p)"
          @update:page-size="(s: number) => { listParams.limit = s; listParams.page = 1 }"
        />
      </div>
    </div>

    <BaseModal v-model="showNew" title="Registrar pago" size="md">
      <form class="space-y-4" @submit.prevent="onSubmitPayment">
        <FormSelect label="Cierre de venta" v-bind="binds.saleClosingId" :options="closingOptions" />
        <p v-if="paymentErrors.saleClosingId" class="text-sm text-red-600">{{ paymentErrors.saleClosingId }}</p>

        <FormSelect label="Tipo" v-bind="binds.kind" :options="kindOptions" />

        <FormInput label="Monto" type="number" step="0.01" v-bind="binds.amount" />
        <p v-if="paymentErrors.amount" class="text-sm text-red-600">{{ paymentErrors.amount }}</p>

        <FormInput label="Vencimiento" type="date" v-bind="binds.dueDate" />
        <p v-if="paymentErrors.dueDate" class="text-sm text-red-600">{{ paymentErrors.dueDate }}</p>

        <FormTextarea label="Notas (opcional)" v-bind="binds.notes" />

        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" icon="lucide:x" @click="showNew = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" icon="lucide:save" :loading="creating">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
