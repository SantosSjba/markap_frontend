<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, DataTable, FormSelect, SearchInput, AppIcon } from '@shared/components'
import { useProduccionQuotationsList } from '../../application/useProduccionSales'
import {
  formatSol,
  formatDate,
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUS_OPTIONS,
  quotationStatusClass,
} from '../labels'
import type { ProduccionQuotationListItem } from '../../domain/sales.types'

const route = useRoute()
const router = useRouter()

const listParams = ref({
  page: 1,
  limit: 50,
  clientId: typeof route.query.clientId === 'string' ? route.query.clientId : undefined,
})
const searchInput = ref('')
const statusFilter = ref('')

watch(
  () => route.query.clientId,
  (id) => {
    listParams.value.clientId = typeof id === 'string' ? id : undefined
  },
)

const { data: result, isLoading } = useProduccionQuotationsList(
  computed(() => ({
    ...listParams.value,
    search: searchInput.value.trim() || undefined,
    status: (statusFilter.value || undefined) as ProduccionQuotationListItem['status'] | undefined,
  })),
)

const rows = computed(() => result.value?.data ?? [])

const columns = [
  { key: 'code', label: 'Código', align: 'left' as const },
  { key: 'clientName', label: 'Cliente', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
  { key: 'validUntil', label: 'Vigencia', align: 'left' as const },
  { key: 'totalAmount', label: 'Total', align: 'left' as const },
]

function goDetail(r: ProduccionQuotationListItem) {
  void router.push({ name: 'produccion-ventas-cotizacion-detalle', params: { id: r.id } })
}

function goNew() {
  const q = listParams.value.clientId ? { clientId: listParams.value.clientId } : {}
  void router.push({ name: 'produccion-ventas-cotizacion-nueva', query: q })
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1100px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Cotizaciones</h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Propuestas comerciales para clientes — borrador, envío y aceptación.
        </p>
      </div>
      <BaseButton variant="primary" @click="goNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nueva cotización
      </BaseButton>
    </div>

    <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin cotizaciones." row-key="id">
        <template #toolbar>
          <div class="flex flex-wrap gap-3">
            <SearchInput v-model="searchInput" placeholder="Buscar código o cliente…" class="max-w-xs" />
            <FormSelect
              v-model="statusFilter"
              :options="QUOTATION_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))"
              class="max-w-[200px]"
            />
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4">
            <button
              type="button"
              class="font-mono text-sm font-medium hover:underline"
              :style="{ color: 'var(--color-primary)' }"
              @click="goDetail(row as ProduccionQuotationListItem)"
            >
              {{ (row as ProduccionQuotationListItem).code }}
            </button>
          </td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionQuotationListItem).clientName }}</td>
          <td class="py-3 px-4 text-sm font-medium" :class="quotationStatusClass((row as ProduccionQuotationListItem).status)">
            {{ QUOTATION_STATUS_LABELS[(row as ProduccionQuotationListItem).status] }}
          </td>
          <td class="py-3 px-4 text-sm">{{ formatDate((row as ProduccionQuotationListItem).validUntil) }}</td>
          <td class="py-3 px-4 text-sm font-medium">{{ formatSol((row as ProduccionQuotationListItem).totalAmount) }}</td>
        </template>
      </DataTable>
    </div>
  </div>
</template>
