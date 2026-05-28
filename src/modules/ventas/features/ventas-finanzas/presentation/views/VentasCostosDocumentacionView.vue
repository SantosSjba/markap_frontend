<script setup lang="ts">
import { computed, ref } from 'vue'
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
import type { DocumentationCostRow } from '../../domain/finanzas.types'
import {
  useVentasDocumentationCostsList,
  useVentasCreateDocumentationCost,
  useVentasClosingProfitability,
} from '../../application/useVentasFinanzas'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

const ITEMS = 12
const listParams = ref({
  page: 1,
  limit: ITEMS,
  buyerClientId: '' as string | undefined,
})
const listApi = computed(() => ({
  page: listParams.value.page,
  limit: listParams.value.limit,
  buyerClientId: listParams.value.buyerClientId || undefined,
}))

const {
  data: listResult,
  isLoading,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useVentasDocumentationCostsList(listApi)
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

const buyerOptions = ref<{ value: string; label: string }[]>([{ value: '', label: 'Todos los clientes' }])
async function loadBuyers() {
  const res = await ventasClientsRepository.getList({ clientType: 'BUYER', page: 1, limit: 500 })
  buyerOptions.value = [
    { value: '', label: 'Todos los clientes' },
    ...res.data.map((c) => ({ value: c.id, label: `${c.fullName} (${c.documentNumber})` })),
  ]
}
void loadBuyers()

const columns = [
  { key: 'prop', label: 'Inmueble', sortAccessor: (r: unknown) => (r as DocumentationCostRow).closing.property.code },
  { key: 'buyer', label: 'Cliente', sortAccessor: (r: unknown) => (r as DocumentationCostRow).closing.buyer.fullName },
  { key: 'type', label: 'Tipo', sortAccessor: (r: unknown) => (r as DocumentationCostRow).costType },
  { key: 'desc', label: 'Detalle', sortAccessor: (r: unknown) => (r as DocumentationCostRow).description ?? '' },
  { key: 'amt', label: 'Monto', sortAccessor: (r: unknown) => (r as DocumentationCostRow).amount },
  { key: 'dt', label: 'Fecha gasto', sortAccessor: (r: unknown) => (r as DocumentationCostRow).expenseDate },
]

function costTypeLabel(t: string) {
  if (t === 'NOTARY') return 'Notaría'
  if (t === 'REGISTRY') return 'Registros'
  return 'Otro'
}

const showNew = ref(false)
const closingOptions = ref<{ value: string; label: string }[]>([])

const costSchema = toTypedSchema(
  yup.object({
    saleClosingId: yup.string().required('Seleccione el cierre'),
    costType: yup.string().oneOf(['NOTARY', 'REGISTRY', 'OTHER']).required(),
    amount: yup.number().positive('Monto debe ser mayor a 0').required(),
    expenseDate: yup.string().required('Indique la fecha'),
    description: yup.string().optional(),
  }),
)

const {
  handleSubmit: submitCost,
  errors: costErrors,
  defineComponentBinds,
  resetForm: resetCostForm,
} = useForm({
  validationSchema: costSchema,
  initialValues: {
    saleClosingId: '',
    costType: 'NOTARY',
    amount: 0,
    expenseDate: new Date().toISOString().slice(0, 10),
    description: '',
  },
})

const costBinds = {
  saleClosingId: defineComponentBinds('saleClosingId'),
  costType: defineComponentBinds('costType'),
  amount: defineComponentBinds('amount'),
  expenseDate: defineComponentBinds('expenseDate'),
  description: defineComponentBinds('description'),
}

const costTypeOptions = [
  { value: 'NOTARY', label: 'Notaría' },
  { value: 'REGISTRY', label: 'Registros' },
  { value: 'OTHER', label: 'Otro' },
]

const { mutate: createCost, isPending: creating } = useVentasCreateDocumentationCost()

async function openNewModal() {
  const closings = await ventasSalesRepository.listClosings({ page: 1, limit: 500 })
  closingOptions.value = closings.data.map((c) => ({
    value: c.id,
    label: `${c.property.code} — ${c.buyer.fullName}`,
  }))
  resetCostForm()
  showNew.value = true
}

const onSubmitCost = submitCost((values) => {
  createCost(
    {
      saleClosingId: values.saleClosingId,
      costType: values.costType,
      amount: values.amount,
      expenseDate: values.expenseDate,
      description: values.description || null,
    },
    { onSuccess: () => (showNew.value = false) },
  )
})

const profitabilityClosingId = ref('')
const {
  data: profit,
  isLoading: profitLoading,
  isError: profitQueryError,
  error: profitFetchError,
  refetch: refetchProfit,
} = useVentasClosingProfitability(profitabilityClosingId)

const closingOptionsForProfit = ref<{ value: string; label: string }[]>([])
async function loadClosingsForProfit() {
  const closings = await ventasSalesRepository.listClosings({ page: 1, limit: 500 })
  closingOptionsForProfit.value = closings.data.map((c) => ({
    value: c.id,
    label: `${c.property.code} — ${c.buyer.fullName}`,
  }))
}
void loadClosingsForProfit()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Costos de documentación</h1>
      <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
        Notaría, registros u otros gastos ligados al cierre; afectan la rentabilidad neta estimada.
      </p>
    </div>

    <div
      class="rounded-xl border p-4 space-y-3"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <h2 class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">
        Rentabilidad por cierre (precio − gastos − comisión)
      </h2>
      <div class="flex flex-wrap gap-3 items-end">
        <div class="min-w-[280px] flex-1">
          <FormSelect
            v-model="profitabilityClosingId"
            label="Cierre"
            placeholder="Seleccione un cierre"
            :options="closingOptionsForProfit"
          />
        </div>
      </div>
      <div v-if="!profitabilityClosingId" class="text-sm opacity-70">Elija un cierre para ver el resumen.</div>
      <template v-else>
        <div v-if="profitLoading" class="flex py-4 justify-center">
          <AppIcon icon="svg-spinners:ring-resize" :size="24" color="var(--color-primary)" />
        </div>
        <div
          v-else-if="profitQueryError"
          class="flex flex-col sm:flex-row sm:items-center gap-2 py-4 text-sm"
        >
          <span style="color: var(--color-error)">{{ getApiErrorMessage(profitFetchError) }}</span>
          <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" class="self-start shrink-0" @click="() => refetchProfit()">Reintentar</BaseButton>
        </div>
        <div
          v-else-if="profit"
          class="grid sm:grid-cols-2 gap-3 text-sm"
          :style="{ color: 'var(--color-text-secondary)' }"
        >
        <p>
          <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">Precio final:</span>
          S/ {{ profit.finalPrice.toLocaleString('es-PE') }}
        </p>
        <p>
          <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">Gastos documentación:</span>
          S/ {{ profit.documentationCostsTotal.toLocaleString('es-PE') }}
        </p>
        <p>
          <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">Comisión:</span>
          S/ {{ profit.commissionAmount.toLocaleString('es-PE') }}
          <Badge v-if="profit.commissionStatus" variant="neutral" class="ml-1">{{ profit.commissionStatus }}</Badge>
        </p>
        <p>
          <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">Neto estimado:</span>
          S/ {{ profit.netEstimated.toLocaleString('es-PE') }}
        </p>
        </div>
        <p v-else class="text-sm opacity-70">No hay datos de rentabilidad para este cierre.</p>
      </template>
    </div>

    <div class="flex flex-col sm:flex-row sm:justify-between gap-4">
      <div class="min-w-[240px] flex-1 max-w-md">
        <FormSelect v-model="listParams.buyerClientId" label="Filtrar por cliente" :options="buyerOptions" />
      </div>
      <BaseButton variant="primary" icon="lucide:plus" class="shrink-0" @click="openNewModal">
        Registrar costo
      </BaseButton>
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
      <DataTable v-else :columns="columns" :data="rows" row-key="id" empty-text="Sin costos registrados.">
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ (row as DocumentationCostRow).closing.property.code }}</td>
          <td class="py-3 px-4">{{ (row as DocumentationCostRow).closing.buyer.fullName }}</td>
          <td class="py-3 px-4">
            <Badge variant="neutral">{{ costTypeLabel((row as DocumentationCostRow).costType) }}</Badge>
          </td>
          <td class="py-3 px-4 text-sm max-w-[200px] truncate" :title="(row as DocumentationCostRow).description ?? ''">
            {{ (row as DocumentationCostRow).description || '—' }}
          </td>
          <td class="py-3 px-4 text-sm">
            S/ {{ (row as DocumentationCostRow).amount.toLocaleString('es-PE') }}
          </td>
          <td class="py-3 px-4 text-sm">
            {{ new Date((row as DocumentationCostRow).expenseDate).toLocaleDateString('es-PE') }}
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

    <BaseModal v-model="showNew" title="Registrar costo de documentación" size="md">
      <form class="space-y-4" @submit.prevent="onSubmitCost">
        <FormSelect label="Cierre de venta" v-bind="costBinds.saleClosingId" :options="closingOptions" />
        <p v-if="costErrors.saleClosingId" class="text-sm text-red-600">{{ costErrors.saleClosingId }}</p>

        <FormSelect label="Tipo" v-bind="costBinds.costType" :options="costTypeOptions" />

        <FormInput label="Monto" type="number" step="0.01" v-bind="costBinds.amount" />
        <p v-if="costErrors.amount" class="text-sm text-red-600">{{ costErrors.amount }}</p>

        <FormInput label="Fecha del gasto" type="date" v-bind="costBinds.expenseDate" />
        <p v-if="costErrors.expenseDate" class="text-sm text-red-600">{{ costErrors.expenseDate }}</p>

        <FormTextarea label="Descripción (opcional)" v-bind="costBinds.description" />

        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" icon="lucide:x" @click="showNew = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" icon="lucide:save" :disabled="creating">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
