<script setup lang="ts">
import { ref, computed } from 'vue'
import { DataTable, BaseButton, FormSelect, AppIcon, BasePagination } from '@shared/components'
import BaseModal from '@shared/components/ui/BaseModal.vue'
import { useVentasSeparationsList, useVentasCreateSeparation } from '../../application/useVentasSales'
import type { SaleSeparationRow } from '../../domain/sales.types'
import { ventasClientsRepository } from '@modules/ventas/features/clientes'
import { ventasPropertiesRepository } from '@modules/ventas/features/propiedades'
import { SEPARATION_STATUS_OPTIONS, separationStatusLabel } from '../../domain/pipeline.constants'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

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
  { key: 'property', label: 'Inmueble', sortAccessor: (r: unknown) => (r as SaleSeparationRow).property.code },
  { key: 'buyer', label: 'Cliente', sortAccessor: (r: unknown) => (r as SaleSeparationRow).buyer.fullName },
  { key: 'amount', label: 'Monto', sortAccessor: (r: unknown) => (r as SaleSeparationRow).amount },
  { key: 'status', label: 'Estado', sortAccessor: (r: unknown) => (r as SaleSeparationRow).status },
]

const showNew = ref(false)
const loadingNewModalData = ref(false)
const newModalLoadError = ref('')
const buyerOptions = ref<{ value: string; label: string }[]>([])
const propertyOptions = ref<{ value: string; label: string }[]>([])
const form = ref({
  buyerClientId: '',
  propertyId: '',
  amount: 0,
  separationDate: new Date().toISOString().slice(0, 10),
  notes: '',
})

const { mutate: createSep, isPending } = useVentasCreateSeparation()

async function openModal() {
  newModalLoadError.value = ''
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

function submit() {
  if (!form.value.buyerClientId || !form.value.propertyId || form.value.amount <= 0) return
  createSep(
    {
      buyerClientId: form.value.buyerClientId,
      propertyId: form.value.propertyId,
      amount: form.value.amount,
      separationDate: form.value.separationDate,
      notes: form.value.notes || null,
    },
    {
      onSuccess: () => {
        showNew.value = false
        form.value.amount = 0
      },
    },
  )
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Separaciones</h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Reserva con dinero — la propiedad pasa a estado Separada (bloqueo de inventario).
        </p>
      </div>
      <BaseButton variant="primary" class="flex items-center gap-2" :loading="loadingNewModalData" @click="openModal">
        <AppIcon icon="lucide:plus" :size="18" />
        Nueva separación
      </BaseButton>
    </div>

    <div
      v-if="newModalLoadError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-warning-light)' }"
    >
      <span class="max-w-xl" style="color: var(--color-error)">{{ newModalLoadError }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" :loading="loadingNewModalData" @click="openModal">
        Reintentar
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
        <BaseButton variant="outline" size="sm" @click="() => refetchList()">Reintentar</BaseButton>
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

    <BaseModal v-model="showNew" title="Nueva separación" size="lg">
      <div class="p-4 space-y-3">
        <FormSelect v-model="form.buyerClientId" label="Cliente comprador" :options="buyerOptions" required />
        <FormSelect v-model="form.propertyId" label="Inmueble disponible" :options="propertyOptions" required />
        <div>
          <label class="text-sm font-medium">Monto (S/)</label>
          <input
            v-model.number="form.amount"
            type="number"
            min="0"
            step="0.01"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :style="{ borderColor: 'var(--color-border)' }"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Fecha</label>
          <input
            v-model="form.separationDate"
            type="date"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :style="{ borderColor: 'var(--color-border)' }"
          />
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
          <BaseButton variant="outline" @click="showNew = false">Cancelar</BaseButton>
          <BaseButton variant="primary" :loading="isPending" @click="submit">Guardar</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
