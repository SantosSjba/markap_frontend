<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('produccion')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { useProduccionQuotationsList } from '../composables/useProduccionSales'
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
  <div class="space-y-6">
    <PageHeader
      title="Cotizaciones"
      subtitle="Propuestas comerciales para clientes — borrador, envío y aceptación."
    >
      <template #actions>
        <BaseButton v-if="canWrite" variant="primary" @click="goNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nueva cotización
      </BaseButton>
      </template>
    </PageHeader>

    <BaseCard padding="none" class="block overflow-hidden">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin cotizaciones." row-key="id">
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar código o cliente…" />
          </div>
          <div class="w-full sm:w-[200px] min-w-0 shrink-0">
            <FormSelect
              v-model="statusFilter"
              :options="QUOTATION_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))"
            />
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4">
            <BaseButton @click="goDetail(row as ProduccionQuotationListItem)" variant="link" class="font-mono font-medium">{{ (row as ProduccionQuotationListItem).code }}</BaseButton>
          </td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionQuotationListItem).clientName }}</td>
          <td class="py-3 px-4 text-sm font-medium" :class="quotationStatusClass((row as ProduccionQuotationListItem).status)">
            {{ QUOTATION_STATUS_LABELS[(row as ProduccionQuotationListItem).status] }}
          </td>
          <td class="py-3 px-4 text-sm">{{ formatDate((row as ProduccionQuotationListItem).validUntil) }}</td>
          <td class="py-3 px-4 text-sm font-medium">{{ formatSol((row as ProduccionQuotationListItem).totalAmount) }}</td>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
