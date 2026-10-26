<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { ventasClientsRepositoryKey } from '../../../clientes/application/ports/ventas-clients.port'
import { useService } from '@shared/presentation/di/services'
import { formatShortDate, toCalendarDateString } from '@shared/utils/formatters'
import { computed, ref } from 'vue'
import * as yup from 'yup'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { useVentasClosingsList } from '../../../ventas-sales/presentation/composables/useVentasSales'
import type { DocumentationCostRow } from '../../domain/finanzas.types'
import {
  useVentasDocumentationCostsList,
  useVentasCreateDocumentationCost,
  useVentasClosingProfitability,
} from '../composables/useVentasFinanzas'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
const ventasClientsRepository = useService(ventasClientsRepositoryKey)

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

const buyerOptions = ref<{ value: string; label: string }[]>([
  { value: '', label: 'Todos los clientes' },
])
async function loadBuyers() {
  const res = await ventasClientsRepository.getList({ clientType: 'BUYER', page: 1, limit: 500 })
  buyerOptions.value = [
    { value: '', label: 'Todos los clientes' },
    ...res.data.map((c) => ({ value: c.id, label: `${c.fullName} (${c.documentNumber})` })),
  ]
}
void loadBuyers()

const columns = [
  {
    key: 'prop',
    label: 'Inmueble',
    sortAccessor: (r: unknown) => (r as DocumentationCostRow).closing.property.code,
  },
  {
    key: 'buyer',
    label: 'Cliente',
    sortAccessor: (r: unknown) => (r as DocumentationCostRow).closing.buyer.fullName,
  },
  {
    key: 'type',
    label: 'Tipo',
    sortAccessor: (r: unknown) => (r as DocumentationCostRow).costType,
  },
  {
    key: 'desc',
    label: 'Detalle',
    sortAccessor: (r: unknown) => (r as DocumentationCostRow).description ?? '',
  },
  { key: 'amt', label: 'Monto', sortAccessor: (r: unknown) => (r as DocumentationCostRow).amount },
  {
    key: 'dt',
    label: 'Fecha gasto',
    sortAccessor: (r: unknown) => (r as DocumentationCostRow).expenseDate,
  },
]

function costTypeLabel(t: string) {
  if (t === 'NOTARY') return 'Notaría'
  if (t === 'REGISTRY') return 'Registros'
  return 'Otro'
}

const showNew = ref(false)

const closingsListParams = ref({ page: 1, limit: 500 })
const { data: closingsListResult } = useVentasClosingsList(closingsListParams)
const closingSelectOptions = computed(() =>
  (closingsListResult.value?.data ?? []).map((c) => ({
    value: c.id,
    label: `${c.property.code} — ${c.buyer.fullName}`,
  })),
)

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
    expenseDate: toCalendarDateString(),
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

function openNewModal() {
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
    {
      onSuccess: () => {
        showNew.value = false
        resetCostForm()
      },
    },
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
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Costos de documentación"
    >
      <template #actions>
        <p class="text-sm mt-1 text-gray-500 dark:text-gray-400">
        Notaría, registros u otros gastos ligados al cierre; afectan la rentabilidad neta estimada.
      </p>
      </template>
    </PageHeader>

    <FormSectionCard
      title="Rentabilidad por cierre (precio − gastos − comisión)"
      dense
    >
      <div class="space-y-3">
        <div class="flex flex-wrap gap-3 items-end">
        <div class="min-w-[280px] flex-1">
          <FormSelect
            v-model="profitabilityClosingId"
            label="Cierre"
            placeholder="Seleccione un cierre"
            :options="closingSelectOptions"
          />
        </div>
      </div>
        <div v-if="!profitabilityClosingId" class="text-sm opacity-70">Elija un cierre para ver el resumen.</div>
        <template v-else>
        <LoadingState v-if="profitLoading" class="py-4" />
        <div
          v-else-if="profitQueryError"
          class="flex flex-col sm:flex-row sm:items-center gap-2 py-4 text-sm"
        >
          <span class="text-error-500 dark:text-error-400">{{ getApiErrorMessage(profitFetchError) }}</span>
          <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" class="self-start shrink-0" @click="() => refetchProfit()">Reintentar</BaseButton>
        </div>
        <div
          v-else-if="profit"
          class="grid sm:grid-cols-2 gap-3 text-sm text-gray-500 dark:text-gray-400"
        >
        <p>
          <span class="font-medium text-gray-800 dark:text-white/90">Precio final:</span>
          S/ {{ profit.finalPrice.toLocaleString('es-PE') }}
        </p>
        <p>
          <span class="font-medium text-gray-800 dark:text-white/90">Gastos documentación:</span>
          S/ {{ profit.documentationCostsTotal.toLocaleString('es-PE') }}
        </p>
        <p>
          <span class="font-medium text-gray-800 dark:text-white/90">Comisión:</span>
          S/ {{ profit.commissionAmount.toLocaleString('es-PE') }}
          <Badge v-if="profit.commissionStatus" variant="neutral" class="ml-1">{{ profit.commissionStatus }}</Badge>
        </p>
        <p>
          <span class="font-medium text-gray-800 dark:text-white/90">Neto estimado:</span>
          S/ {{ profit.netEstimated.toLocaleString('es-PE') }}
        </p>
        </div>
        <p v-else class="text-sm opacity-70">No hay datos de rentabilidad para este cierre.</p>
      </template>
      </div>
    </FormSectionCard>

    <div class="flex flex-col sm:flex-row sm:justify-between gap-4">
      <div class="min-w-[240px] flex-1 max-w-md">
        <FormSelect v-model="listParams.buyerClientId" label="Filtrar por cliente" :options="buyerOptions" />
      </div>
      <BaseButton variant="primary" icon="lucide:plus" class="shrink-0" @click="openNewModal">
        Registrar costo
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
            {{ formatShortDate((row as DocumentationCostRow).expenseDate) }}
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

    <BaseModal v-model="showNew" title="Registrar costo de documentación" size="md">
      <form class="space-y-4" @submit.prevent="onSubmitCost">
        <FormSelect label="Cierre de venta" v-bind="costBinds.saleClosingId" :options="closingSelectOptions" />
        <p v-if="costErrors.saleClosingId" class="text-sm text-error-600 dark:text-error-500">{{ costErrors.saleClosingId }}</p>

        <FormSelect label="Tipo" v-bind="costBinds.costType" :options="costTypeOptions" />

        <FormInput label="Monto" type="number" step="0.01" v-bind="costBinds.amount" />
        <p v-if="costErrors.amount" class="text-sm text-error-600 dark:text-error-500">{{ costErrors.amount }}</p>

        <FormInput label="Fecha del gasto" type="date" v-bind="costBinds.expenseDate" />
        <p v-if="costErrors.expenseDate" class="text-sm text-error-600 dark:text-error-500">{{ costErrors.expenseDate }}</p>

        <FormTextarea label="Descripción (opcional)" v-bind="costBinds.description" />

        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" icon="lucide:x" @click="showNew = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" icon="lucide:save" :disabled="creating">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
