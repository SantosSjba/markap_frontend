<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { produccionCatalogRepositoryKey } from '../../application/ports/catalog.port'
import { useService } from '@shared/presentation/di/services'
import { formatDateTime, toCalendarDateString } from '@shared/utils/formatters'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import ExcelIcon from '@shared/presentation/components/ui/ExcelIcon.vue'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import type {
  ProduccionFurnitureListItem,
  ListProduccionFurnitureParams,
} from '../../domain/catalog.types'
import {
  useProduccionCatalogList,
  useProduccionCatalogStats,
  useDeleteProduccionCatalogItem,
} from '../composables/useProduccionCatalog'
import { useProduccionFurnitureCategoryOptions } from '../../../configuracion/presentation/composables/useProduccionConfigOptions'
import { formatSol } from '../labels'
import { PRODUCCION_BASE_PATH } from '../../../../config/routes.constants'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
const produccionCatalogRepository = useService(produccionCatalogRepositoryKey)

const router = useRouter()
const ITEMS = 10

const listParams = ref<ListProduccionFurnitureParams>({
  page: 1,
  limit: ITEMS,
})
const searchInput = ref('')
const categoryFilter = ref('')
const activeFilter = ref<'all' | 'active' | 'inactive'>('all')

watch([searchInput, categoryFilter, activeFilter], () => {
  listParams.value = {
    ...listParams.value,
    page: 1,
    search: searchInput.value.trim() || undefined,
    category: categoryFilter.value.trim() || undefined,
    isActive: activeFilter.value === 'all' ? undefined : activeFilter.value === 'active',
  }
})

const {
  data: result,
  isLoading,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useProduccionCatalogList(listParams)

const { data: stats } = useProduccionCatalogStats()
const { options: categoryOptions } = useProduccionFurnitureCategoryOptions()

const rows = computed(() => result.value?.data ?? [])
const total = computed(() => result.value?.total ?? 0)

const onPage = (p: number) => {
  listParams.value = { ...listParams.value, page: p }
}
const onSize = (s: number) => {
  listParams.value = { ...listParams.value, limit: s, page: 1 }
}

const columns = [
  { key: 'code', label: 'Código', align: 'left' as const, sortable: true },
  { key: 'name', label: 'Nombre', align: 'left' as const, sortable: true },
  { key: 'category', label: 'Categoría', align: 'left' as const },
  { key: 'referencePrice', label: 'Precio ref.', align: 'left' as const },
  { key: 'isActive', label: 'Estado', align: 'left' as const },
  { key: 'bomLineCount', label: 'BOM', align: 'left' as const },
  { key: 'imageCount', label: 'Imgs.', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

const paginationProps = computed(() => {
  const page = listParams.value.page ?? 1
  const limit = listParams.value.limit ?? ITEMS
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

const goDetail = (r: ProduccionFurnitureListItem) =>
  router.push(`${PRODUCCION_BASE_PATH}/catalogo/${r.id}`)
const goNew = () => router.push(`${PRODUCCION_BASE_PATH}/catalogo/nuevo`)

const showDeleteModal = ref(false)
const deleteTarget = ref<ProduccionFurnitureListItem | null>(null)
const { mutateAsync: deleteItem, isPending: isDeleting } = useDeleteProduccionCatalogItem()

const openDeleteConfirm = (r: ProduccionFurnitureListItem) => {
  deleteTarget.value = r
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteTarget.value = null
}

const executeDelete = async () => {
  const r = deleteTarget.value
  if (!r) return
  try {
    await deleteItem(r.id)
    closeDeleteModal()
  } catch {
    void 0
  }
}

const getActions = (
  r: ProduccionFurnitureListItem,
): { label: string; icon: string; onClick: () => void }[] => [
  { label: 'Ver ficha', icon: 'lucide:eye', onClick: () => goDetail(r) },
  { label: 'Editar', icon: 'lucide:pencil', onClick: () => goDetail(r) },
  { label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => openDeleteConfirm(r) },
]

const { isExporting, exportToExcel } = useExcelExport()

async function handleExport() {
  const exportResult = await produccionCatalogRepository.getList({
    page: 1,
    limit: 10000,
    search: searchInput.value.trim() || undefined,
    category: categoryFilter.value.trim() || undefined,
    isActive: activeFilter.value === 'all' ? undefined : activeFilter.value === 'active',
  })
  const now = toCalendarDateString()
  await exportToExcel({
    fileName: `catalogo_muebles_${now}`,
    sheetName: 'Catálogo',
    columns: [
      { header: 'Código', key: 'code', width: 14 },
      { header: 'Nombre', key: 'name', width: 32 },
      { header: 'Categoría', key: 'category', width: 14 },
      { header: 'Precio ref. (S/)', key: 'referencePrice', width: 16 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Líneas BOM', key: 'bomLineCount', width: 12 },
      { header: 'Imágenes', key: 'imageCount', width: 10 },
      { header: 'Actualizado', key: 'updatedAt', width: 18 },
    ],
    rows: exportResult.data.map((r) => ({
      code: r.code,
      name: r.name,
      category: r.category,
      referencePrice: r.referencePrice,
      status: r.isActive ? 'Activo' : 'Inactivo',
      bomLineCount: r.bomLineCount,
      imageCount: r.imageCount,
      updatedAt: formatDateTime(r.updatedAt),
    })),
  })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Catálogo de muebles"
    >
      <template #subtitle>
        Fichas de producto para costeo, cotizaciones y órdenes de trabajo.
<span v-if="stats" class="mt-2 block">{{ stats.total }} muebles · {{ stats.active }} activos · {{ stats.inactive }} inactivos</span>
      </template>
      <template #actions>
        <div class="flex flex-wrap gap-2 shrink-0">
        <BaseButton
          variant="outline"
          class="flex items-center gap-2"
          :loading="isExporting"
          title="Exportar a Excel"
          @click="handleExport"
        >
          <ExcelIcon class="w-5 h-5" />
          Exportar
        </BaseButton>
        <BaseButton variant="primary" class="shrink-0" @click="goNew">
          <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
          Nuevo mueble
        </BaseButton>
      </div>
      </template>
    </PageHeader>

    <BaseCard padding="none" class="block overflow-hidden">
      <LoadingState v-if="isLoading" />
      <div
        v-else-if="listQueryError"
        class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center"
      >
        <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(listFetchError) }}</p>
        <BaseButton variant="outline" size="sm" @click="() => refetchList()">Reintentar</BaseButton>
      </div>
      <template v-else>
        <DataTable empty-text="No hay muebles en el catálogo." :columns="columns" :data="rows" row-key="id">
          <template #toolbar>
            <div class="flex-1 min-w-0">
              <SearchInput v-model="searchInput" placeholder="Buscar por código o nombre…" />
            </div>
            <div class="flex flex-wrap gap-3 shrink-0 sm:flex-nowrap">
              <div class="w-full sm:w-[200px] min-w-0">
                <FormSelect
                  :model-value="categoryFilter"
                  @update:model-value="categoryFilter = ($event as string | null) ?? ''"
                  :options="[{ value: '', label: 'Todas las categorías' }, ...categoryOptions]"
                />
              </div>
              <div class="w-full sm:w-[160px] min-w-0">
                <FormSelect
                  v-model="activeFilter"
                  :options="[{ value: 'all', label: 'Todos' }, { value: 'active', label: 'Activos' }, { value: 'inactive', label: 'Inactivos' }]"
                />
              </div>
            </div>
          </template>
          <template #row="{ row }">
            <td class="py-3 px-4">
              <BaseButton @click="goDetail(row as ProduccionFurnitureListItem)" variant="link" class="font-medium">{{ (row as ProduccionFurnitureListItem).code }}</BaseButton>
            </td>
            <td class="py-3 px-4">
              <BaseButton variant="link" class="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90 dark:hover:text-brand-400" @click="goDetail(row as ProduccionFurnitureListItem)">{{ (row as ProduccionFurnitureListItem).name }}</BaseButton>
            </td>
            <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
              {{ (row as ProduccionFurnitureListItem).category }}
            </td>
            <td class="py-3 px-4 text-sm">
              {{ formatSol((row as ProduccionFurnitureListItem).referencePrice) }}
            </td>
            <td class="py-3 px-4 text-sm">
              <Badge :variant="(row as ProduccionFurnitureListItem).isActive ? 'success' : 'neutral'">{{ (row as ProduccionFurnitureListItem).isActive ? 'Activo' : 'Inactivo' }}</Badge>
            </td>
            <td class="py-3 px-4 text-sm">{{ (row as ProduccionFurnitureListItem).bomLineCount }}</td>
            <td class="py-3 px-4 text-sm">{{ (row as ProduccionFurnitureListItem).imageCount }}</td>
            <td class="py-3 px-4 text-right">
              <ActionsDropdown :items="getActions(row as ProduccionFurnitureListItem)" />
            </td>
          </template>
        </DataTable>
        <div v-if="!isLoading && !listQueryError" class="border-t border-gray-200 dark:border-gray-800">
          <BasePagination
            v-bind="paginationProps"
            :show-page-size="true"
            @update:current-page="onPage"
            @update:page-size="onSize"
          />
        </div>
      </template>
    </BaseCard>

    <BaseModal v-model="showDeleteModal" :closable="true" size="sm" @close="closeDeleteModal">
      <template #title>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center bg-error-50 dark:bg-error-500/15">
            <AppIcon class="text-error-500 dark:text-error-400" icon="lucide:trash-2" :size="16" />
          </div>
          <span class="text-base font-semibold text-gray-800 dark:text-white/90">Eliminar mueble</span>
        </div>
      </template>
      <div class="p-4 space-y-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          ¿Eliminar del catálogo
          <span class="font-semibold text-gray-800 dark:text-white/90">{{ deleteTarget?.code }}</span>
          — {{ deleteTarget?.name }}?
        </p>
      </div>
      <div class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
        <BaseButton variant="ghost" @click="closeDeleteModal">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="isDeleting" @click="executeDelete">
          <AppIcon icon="lucide:trash-2" :size="16" class="mr-1" />
          Eliminar
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
