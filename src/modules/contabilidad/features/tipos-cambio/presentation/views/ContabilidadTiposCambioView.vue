<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  BaseButton,
  AppIcon,
  BaseModal,
  DataTable,
  FormInput,
  FormSelect,
  PageHeader,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import {
  useContabilidadExchangeRates,
  useContabilidadUpsertExchangeRate,
} from '../../application/useContabilidadExchangeRates'
import {
  DEFAULT_CURRENCY_CODE,
  type ContabilidadExchangeRateDTO,
} from '../../domain/exchange-rate.types'
import { toCalendarDateString } from '@/shared/utils/formatters'

const now = new Date()
const fromDate = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)
const toDate = ref(toCalendarDateString())
const currencyFilter = ref(DEFAULT_CURRENCY_CODE)

const listParams = computed(() => ({
  fromDate: fromDate.value,
  toDate: toDate.value,
  currencyCode: currencyFilter.value || undefined,
}))

const { data, isLoading, refetch } = useContabilidadExchangeRates(listParams)
const rows = computed(() => data.value?.rates ?? [])

const { mutate: upsertRate, isPending: saving } = useContabilidadUpsertExchangeRate()

const modalOpen = ref(false)
const form = ref({
  rateDate: toDate.value,
  currencyCode: DEFAULT_CURRENCY_CODE,
  buyRate: '',
  sellRate: '',
})

const currencyOptions = [
  { value: 'USD', label: 'USD — Dólar americano' },
  { value: 'EUR', label: 'EUR — Euro' },
]

const columns = [
  { key: 'rateDate', label: 'Fecha', sortable: true },
  { key: 'currencyCode', label: 'Moneda' },
  { key: 'buyRate', label: 'Compra', align: 'right' as const },
  { key: 'sellRate', label: 'Venta', align: 'right' as const },
  { key: 'source', label: 'Fuente' },
  { key: 'actions', label: '', align: 'right' as const },
]

function openNew() {
  form.value = {
    rateDate: toDate.value,
    currencyCode: currencyFilter.value || DEFAULT_CURRENCY_CODE,
    buyRate: '',
    sellRate: '',
  }
  modalOpen.value = true
}

function openEdit(row: ContabilidadExchangeRateDTO) {
  form.value = {
    rateDate: row.rateDate,
    currencyCode: row.currencyCode,
    buyRate: row.buyRate,
    sellRate: row.sellRate,
  }
  modalOpen.value = true
}

function submit() {
  if (!form.value.rateDate || !form.value.buyRate || !form.value.sellRate) {
    void markapAlert.toast.warning('Complete fecha y tipos de cambio')
    return
  }
  upsertRate(
    {
      rateDate: form.value.rateDate,
      currencyCode: form.value.currencyCode,
      buyRate: form.value.buyRate,
      sellRate: form.value.sellRate,
      source: 'MANUAL',
    },
    { onSuccess: () => { modalOpen.value = false; void refetch() } },
  )
}
</script>

<template>
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
    <PageHeader
      icon="lucide:coins"
      title="Tipos de cambio"
      subtitle="Registro diario de tipos de cambio para operaciones en moneda extranjera."
    >
      <template #actions>
        <BaseButton variant="primary" @click="openNew">
          <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
          Registrar tipo
        </BaseButton>
      </template>
    </PageHeader>

    <div class="flex flex-wrap gap-3 items-end">
      <FormInput v-model="fromDate" label="Desde" type="date" class="w-40" />
      <FormInput v-model="toDate" label="Hasta" type="date" class="w-40" />
      <FormSelect v-model="currencyFilter" label="Moneda" :options="currencyOptions" class="w-48" />
      <BaseButton variant="secondary" @click="refetch()">Filtrar</BaseButton>
    </div>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <DataTable
        :columns="columns"
        :data="rows"
        :loading="isLoading"
        empty-text="Sin tipos de cambio en el rango seleccionado."
        row-key="id"
      >
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadExchangeRateDTO).rateDate }}</td>
          <td class="py-3 px-4 text-sm font-mono">{{ (row as ContabilidadExchangeRateDTO).currencyCode }}</td>
          <td class="py-3 px-4 text-sm text-right font-mono">{{ (row as ContabilidadExchangeRateDTO).buyRate }}</td>
          <td class="py-3 px-4 text-sm text-right font-mono">{{ (row as ContabilidadExchangeRateDTO).sellRate }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadExchangeRateDTO).source ?? '—' }}</td>
          <td class="py-3 px-4 text-right">
            <BaseButton variant="secondary" size="sm" @click="openEdit(row as ContabilidadExchangeRateDTO)">
              Editar
            </BaseButton>
          </td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="modalOpen" title="Tipo de cambio" size="md">
      <form class="space-y-4" @submit.prevent="submit">
        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput v-model="form.rateDate" label="Fecha" type="date" required />
          <FormSelect v-model="form.currencyCode" label="Moneda" :options="currencyOptions" />
          <FormInput v-model="form.buyRate" label="Tipo compra" type="number" min="0" step="0.000001" required />
          <FormInput v-model="form.sellRate" label="Tipo venta" type="number" min="0" step="0.000001" required />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="saving">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
