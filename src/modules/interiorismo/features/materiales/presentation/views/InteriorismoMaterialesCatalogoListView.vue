<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin, filterActions } = useApplicationAccess('interiorismo')

import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatMoney } from '@shared/utils/money'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import {
  useDeleteInteriorCatalogMaterial,
  useInteriorCatalogMaterialStats,
  useInteriorCatalogMaterialsList,
} from '../composables/useInteriorCatalogMaterials'
import type { InteriorCatalogMaterialListItem, ListInteriorCatalogMaterialsParams } from '../../domain/catalog.types'
import { formatQty } from '../labels'
/** Catálogo de materiales y productos: indicadores, filtros por categoría y stock, una fila por material. */

const router = useRouter()
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const filterCategory = ref('ALL')
const filterStock = ref<'ALL' | 'OUT'>('ALL')
const page = ref(1)
const pageSize = ref(10)
watch([debouncedSearch, filterCategory, filterStock], () => (page.value = 1))

const params = computed<ListInteriorCatalogMaterialsParams>(() => ({
  page: page.value,
  limit: pageSize.value,
  search: debouncedSearch.value.trim() || undefined,
  category: filterCategory.value === 'ALL' ? undefined : filterCategory.value,
  stock: filterStock.value === 'OUT' ? 'OUT' : undefined,
}))
const { data: result, isLoading, isFetching, isError, error, refetch } = useInteriorCatalogMaterialsList(params)
const rows = computed(() => result.value?.data ?? [])
const total = computed(() => result.value?.total ?? 0)

const statsQuery = useInteriorCatalogMaterialStats()
const stats = computed(() => statsQuery.data.value)
const categoryOptions = computed(() => [
  { value: 'ALL', label: 'Todas las categorías' },
  ...(stats.value?.categories ?? []).map((c) => ({ value: c, label: c })),
])
const stockOptions = [
  { value: 'ALL', label: 'Todo el stock' },
  { value: 'OUT', label: 'Sin stock' },
]

const columns = [
  { key: 'material', label: 'Material o producto', align: 'left' as const },
  { key: 'category', label: 'Categoría', align: 'left' as const },
  { key: 'price', label: 'Precio ref.', align: 'right' as const },
  { key: 'stock', label: 'Stock', align: 'right' as const },
  { key: 'suppliers', label: 'Proveedores', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]
const asRow = (r: unknown) => r as InteriorCatalogMaterialListItem
const paginationProps = computed(() => {
  const totalPages = Math.max(1, Math.ceil(total.value / pageSize.value))
  return { currentPage: page.value, totalPages, totalItems: total.value, pageSize: pageSize.value, hasPrevPage: page.value > 1, hasNextPage: page.value < totalPages }
})

const base = `${INTERIORISMO_BASE_PATH}/materiales/catalogo`
const goDetail = (m: InteriorCatalogMaterialListItem) => router.push(`${base}/${m.id}`)
const deleteMut = useDeleteInteriorCatalogMaterial()
async function remove(m: InteriorCatalogMaterialListItem) {
  const ok = await markapAlert.confirmDanger({ title: 'Eliminar material', text: `«${m.code} · ${m.name}» se eliminará del catálogo.`, confirmText: 'Eliminar' })
  if (ok) await deleteMut.mutateAsync(m.id).catch(() => undefined)
}
const actionsFor = (m: InteriorCatalogMaterialListItem) => {
  const items: { label: string; icon: string; onClick: () => void }[] = [
    { label: 'Ver ficha', icon: 'lucide:eye', onClick: () => goDetail(m) },
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => router.push(`${base}/${m.id}/editar`) },
  ]
  if (canAdmin.value) items.push({ label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => void remove(m) })
  return items
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Catálogo de materiales y productos" subtitle="Referencias reutilizables para presupuestar; cada proyecto conserva sus propios costos. Los servicios y trabajos completos también se pueden escribir directamente en el presupuesto.">
      <template #actions>
        <BaseButton v-if="canWrite" variant="primary" icon="lucide:plus" class="w-full justify-center sm:w-auto" @click="router.push(`${base}/nuevo`)">Nuevo material o producto</BaseButton>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatsCard compact title="Materiales y productos" :value="String(stats?.total ?? 0)" subtitle="en el catálogo" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:layers" :size="20" color="var(--color-primary)" /></template>
      </StatsCard>
      <StatsCard compact title="Categorías" :value="String(stats?.categories.length ?? 0)" subtitle="distintas" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:tags" :size="20" color="#2563eb" /></template>
      </StatsCard>
      <StatsCard compact title="Sin stock" :value="String(stats?.outOfStock ?? 0)" subtitle="por reponer" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:package-x" :size="20" color="#dc2626" /></template>
      </StatsCard>
      <StatsCard compact title="Sin proveedor" :value="String(stats?.withoutSupplier ?? 0)" subtitle="sin vincular" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:unlink" :size="20" color="#d97706" /></template>
      </StatsCard>
    </div>

    <BaseCard padding="none" class="block overflow-hidden">
      <div v-if="isError" class="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <p class="text-sm font-medium text-error-500">{{ getApiErrorMessage(error) }}</p>
        <BaseButton variant="outline" size="sm" @click="() => refetch()">Reintentar</BaseButton>
      </div>
      <template v-else>
        <DataTable :columns="columns" :data="rows" row-key="id" :loading="isLoading || isFetching" empty-text="No hay materiales ni productos con estos filtros.">
          <template #toolbar>
            <div class="min-w-0 flex-1"><SearchInput v-model="searchInput" placeholder="Buscar por código, nombre, marca o categoría..." /></div>
            <div class="flex shrink-0 flex-wrap gap-3 sm:flex-nowrap">
              <div class="w-full min-w-0 sm:w-[190px]"><FormSelect v-model="filterCategory" :options="categoryOptions" /></div>
              <div class="w-full min-w-0 sm:w-[150px]"><FormSelect v-model="filterStock" :options="stockOptions" /></div>
            </div>
          </template>
          <template #row="{ row }">
            <td class="px-4 py-3">
              <button type="button" class="text-left" @click="goDetail(asRow(row))">
                <span class="block font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">{{ asRow(row).name }}</span>
                <span class="block text-xs text-gray-400">{{ asRow(row).code }} · {{ asRow(row).brand }}</span>
              </button>
            </td>
            <td class="px-4 py-3"><Badge variant="neutral">{{ asRow(row).category }}</Badge></td>
            <td class="px-4 py-3 text-right text-sm tabular-nums">
              <span class="font-medium text-gray-800 dark:text-white/90">{{ formatMoney(asRow(row).price, asRow(row).currency) }}</span>
              <span class="block text-xs text-gray-400">por {{ asRow(row).unit }}</span>
            </td>
            <td class="px-4 py-3 text-right text-sm tabular-nums">
              <span :class="asRow(row).stock <= 0 ? 'font-medium text-error-500' : 'text-gray-800 dark:text-white/90'">{{ formatQty(asRow(row).stock) }}</span>
            </td>
            <td class="px-4 py-3 text-sm">
              <span v-if="asRow(row).suppliersCount" class="text-gray-800 dark:text-white/90">{{ asRow(row).suppliersCount }}</span>
              <span v-else class="text-warning-600 dark:text-warning-400">Sin proveedor</span>
            </td>
            <td class="px-4 py-3 text-right"><ActionsDropdown :items="filterActions(actionsFor(asRow(row)))" /></td>
          </template>
        </DataTable>
        <div class="border-t border-gray-200 dark:border-gray-800">
          <BasePagination v-bind="paginationProps" :show-page-size="true" @update:current-page="(p: number) => (page = p)" @update:page-size="(s: number) => { pageSize = s; page = 1 }" />
        </div>
      </template>
    </BaseCard>
  </div>
</template>
