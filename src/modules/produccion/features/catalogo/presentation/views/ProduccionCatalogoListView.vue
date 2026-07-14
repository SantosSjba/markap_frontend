<script setup lang="ts">
import { formatDateTime, toCalendarDateString } from '@/shared/utils/formatters'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  BasePagination,
  BaseModal,
  DataTable,
  SearchInput,
  AppIcon,
  ActionsDropdown,
  ExcelIcon,
} from '@shared/components'
import { useExcelExport } from '@shared/composables'
import type { ProduccionFurnitureListItem, ListProduccionFurnitureParams } from '../../domain/catalog.types'
import {
  useProduccionCatalogList,
  useProduccionCatalogStats,
  useDeleteProduccionCatalogItem,
} from '../../application/useProduccionCatalog'
import { produccionCatalogRepository } from '@modules/produccion/features/catalogo'
import { useProduccionFurnitureCategoryOptions } from '@modules/produccion/features/configuracion'
import { formatSol } from '../labels'
import { PRODUCCION_BASE_PATH } from '@modules/produccion/config/routes.constants'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

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
    isActive:
      activeFilter.value === 'all'
        ? undefined
        : activeFilter.value === 'active',
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

const getActions = (r: ProduccionFurnitureListItem): { label: string; icon: string; onClick: () => void }[] => [
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
    isActive:
      activeFilter.value === 'all'
        ? undefined
        : activeFilter.value === 'active',
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
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Catálogo de muebles
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Fichas de producto para costeo, cotizaciones y órdenes de trabajo.
        </p>
        <p v-if="stats" class="text-xs mt-2" :style="{ color: 'var(--color-text-secondary)' }">
          {{ stats.total }} muebles · {{ stats.active }} activos · {{ stats.inactive }} inactivos
        </p>
      </div>
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
      <template v-else>
        <DataTable empty-text="No hay muebles en el catálogo." :columns="columns" :data="rows" row-key="id">
          <template #toolbar>
            <div class="flex-1 min-w-0">
              <SearchInput v-model="searchInput" placeholder="Buscar por código o nombre…" />
            </div>
            <div class="flex flex-wrap gap-3 shrink-0 sm:flex-nowrap">
              <div class="w-full sm:w-[200px] min-w-0">
                <select
                  v-model="categoryFilter"
                  class="w-full px-3 py-2 rounded-lg border text-sm"
                  :style="{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                  }"
                >
                  <option value="">Todas las categorías</option>
                  <option v-for="c in categoryOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
                </select>
              </div>
              <div class="w-full sm:w-[160px] min-w-0">
                <select
                  v-model="activeFilter"
                  class="w-full px-3 py-2 rounded-lg border text-sm"
                  :style="{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                  }"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
            </div>
          </template>
          <template #row="{ row }">
            <td class="py-3 px-4">
              <button
                type="button"
                class="font-medium text-left hover:underline"
                :style="{ color: 'var(--color-primary)' }"
                @click="goDetail(row as ProduccionFurnitureListItem)"
              >
                {{ (row as ProduccionFurnitureListItem).code }}
              </button>
            </td>
            <td class="py-3 px-4">
              <button type="button" class="text-left" @click="goDetail(row as ProduccionFurnitureListItem)">
                <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
                  {{ (row as ProduccionFurnitureListItem).name }}
                </span>
              </button>
            </td>
            <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              {{ (row as ProduccionFurnitureListItem).category }}
            </td>
            <td class="py-3 px-4 text-sm">
              {{ formatSol((row as ProduccionFurnitureListItem).referencePrice) }}
            </td>
            <td class="py-3 px-4 text-sm">
              <span
                class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                :style="{
                  background: (row as ProduccionFurnitureListItem).isActive
                    ? 'var(--color-success-subtle)'
                    : 'var(--color-border)',
                  color: (row as ProduccionFurnitureListItem).isActive
                    ? 'var(--color-success)'
                    : 'var(--color-text-secondary)',
                }"
              >
                {{ (row as ProduccionFurnitureListItem).isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="py-3 px-4 text-sm">{{ (row as ProduccionFurnitureListItem).bomLineCount }}</td>
            <td class="py-3 px-4 text-sm">{{ (row as ProduccionFurnitureListItem).imageCount }}</td>
            <td class="py-3 px-4 text-right">
              <ActionsDropdown :items="getActions(row as ProduccionFurnitureListItem)" />
            </td>
          </template>
        </DataTable>
        <div v-if="!isLoading && !listQueryError" class="border-t" :style="{ borderColor: 'var(--color-border)' }">
          <BasePagination
            v-bind="paginationProps"
            :show-page-size="true"
            @update:current-page="onPage"
            @update:page-size="onSize"
          />
        </div>
      </template>
    </div>

    <BaseModal v-model="showDeleteModal" :closable="true" size="sm" @close="closeDeleteModal">
      <template #title>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--color-error-subtle);">
            <AppIcon icon="lucide:trash-2" :size="16" style="color: var(--color-error);" />
          </div>
          <span class="text-base font-semibold" style="color: var(--color-text-primary);">Eliminar mueble</span>
        </div>
      </template>
      <div class="p-4 space-y-3">
        <p class="text-sm" style="color: var(--color-text-secondary);">
          ¿Eliminar del catálogo
          <span class="font-semibold" style="color: var(--color-text-primary);">{{ deleteTarget?.code }}</span>
          — {{ deleteTarget?.name }}?
        </p>
      </div>
      <div class="flex justify-end gap-3 p-4 border-t" style="border-color: var(--color-border);">
        <BaseButton variant="ghost" @click="closeDeleteModal">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="isDeleting" @click="executeDelete">
          <AppIcon icon="lucide:trash-2" :size="16" class="mr-1" />
          Eliminar
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
