<script setup lang="ts">
import { ref, computed } from 'vue'
import { DataTable, BaseButton, FormSelect, AppIcon, BasePagination, Badge } from '@shared/components'
import BaseModal from '@shared/components/ui/BaseModal.vue'
import { useVentasClosingsList, useVentasCreateClosing } from '../../application/useVentasSales'
import type { SaleClosingRow } from '../../domain/sales.types'
import { ventasClientsService } from '@modules/ventas/features/clientes'
import { ventasPropertiesService } from '@modules/ventas/features/propiedades'
import { useVentasAgentsList } from '@modules/ventas/features/agentes'
import { PAYMENT_TYPE_OPTIONS } from '../../domain/pipeline.constants'

const ITEMS = 10
const listParams = ref({ page: 1, limit: ITEMS })
const listApi = computed(() => listParams.value)
const { data: listResult, isLoading } = useVentasClosingsList(listApi)
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
]

const showNew = ref(false)
const buyerOptions = ref<{ value: string; label: string }[]>([])
const propertyOptions = ref<{ value: string; label: string }[]>([])
const agentParams = ref({ page: 1, limit: 500, isActive: true })
const { data: agentsRes } = useVentasAgentsList(agentParams)
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

async function openModal() {
  const [buyers, props] = await Promise.all([
    ventasClientsService.getList({ clientType: 'BUYER', page: 1, limit: 500 }),
    ventasPropertiesService.getList({ page: 1, limit: 500 }),
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
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Cierres</h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Venta final: propiedad en Vendida y comisión registrada (pendiente en Finanzas).
        </p>
      </div>
      <BaseButton variant="primary" class="flex items-center gap-2" @click="openModal">
        <AppIcon icon="lucide:plus" :size="18" />
        Registrar cierre
      </BaseButton>
    </div>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div v-if="isLoading" class="flex justify-center py-16">
        <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
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
          <BaseButton variant="outline" @click="showNew = false">Cancelar</BaseButton>
          <BaseButton variant="primary" :loading="isPending" @click="submit">Registrar cierre</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
