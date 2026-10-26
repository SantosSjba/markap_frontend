<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import type {
  InteriorCatalogMaterialListItem,
  ListInteriorCatalogMaterialsParams,
} from '../../domain/catalog.types'
import {
  useInteriorCatalogMaterialsList,
  useDeleteInteriorCatalogMaterial,
} from '../composables/useInteriorCatalogMaterials'
import { formatSol, formatQty } from '../labels'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
const router = useRouter()
const ITEMS = 10

const listParams = ref<ListInteriorCatalogMaterialsParams>({
  page: 1,
  limit: ITEMS,
})
const searchInput = ref('')
const categoryFilter = ref('')

watch([searchInput, categoryFilter], () => {
  listParams.value = {
    ...listParams.value,
    page: 1,
    search: searchInput.value.trim() || undefined,
    category: categoryFilter.value.trim() || undefined,
  }
})

const {
  data: result,
  isLoading,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useInteriorCatalogMaterialsList(listParams)

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
  { key: 'brand', label: 'Marca', align: 'left' as const },
  { key: 'unit', label: 'Unidad', align: 'left' as const },
  { key: 'price', label: 'Precio', align: 'left' as const },
  { key: 'stock', label: 'Stock', align: 'left' as const },
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

const goDetail = (r: InteriorCatalogMaterialListItem) =>
  router.push(`${INTERIORISMO_BASE_PATH}/materiales/catalogo/${r.id}`)
const goNew = () => router.push(`${INTERIORISMO_BASE_PATH}/materiales/catalogo/nuevo`)

const showDeleteModal = ref(false)
const deleteTarget = ref<InteriorCatalogMaterialListItem | null>(null)
const { mutateAsync: deleteMaterial, isPending: isDeletingMaterial } =
  useDeleteInteriorCatalogMaterial()

const openDeleteConfirm = (r: InteriorCatalogMaterialListItem) => {
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
    await deleteMaterial(r.id)
    closeDeleteModal()
  } catch {
    void 0
  }
}

const getActions = (
  r: InteriorCatalogMaterialListItem,
): { label: string; icon: string; onClick: () => void }[] => [
  { label: 'Ver ficha', icon: 'lucide:eye', onClick: () => goDetail(r) },
  { label: 'Editar', icon: 'lucide:pencil', onClick: () => goDetail(r) },
  { label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => openDeleteConfirm(r) },
]
</script>

<template>
  <div class="max-w-[1200px] mx-auto space-y-6">
    <PageHeader
      title="Catálogo de materiales"
      subtitle="Código, categoría, marca, precio y stock para usar en presupuestos y obra."
    >
      <template #actions>
        <BaseButton variant="primary" class="shrink-0" @click="goNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nuevo material
      </BaseButton>
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
        <DataTable empty-text="No hay materiales en el catálogo." :columns="columns" :data="rows" row-key="id">
          <template #toolbar>
            <div class="flex flex-col sm:flex-row gap-3 flex-1 min-w-0 w-full">
              <SearchInput v-model="searchInput" placeholder="Buscar por código o nombre…" class="flex-1 min-w-0" />
              <FormInput v-model="categoryFilter" placeholder="Filtrar por categoría…" class="w-full sm:w-52" />
            </div>
          </template>
          <template #row="{ row }">
            <td class="py-3 px-4">
              <BaseButton @click="goDetail(row as InteriorCatalogMaterialListItem)" variant="link" class="font-medium">{{ (row as InteriorCatalogMaterialListItem).code }}</BaseButton>
            </td>
            <td class="py-3 px-4">
              <BaseButton variant="link" class="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90 dark:hover:text-brand-400" @click="goDetail(row as InteriorCatalogMaterialListItem)">{{ (row as InteriorCatalogMaterialListItem).name }}</BaseButton>
            </td>
            <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
              {{ (row as InteriorCatalogMaterialListItem).category }}
            </td>
            <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
              {{ (row as InteriorCatalogMaterialListItem).brand }}
            </td>
            <td class="py-3 px-4 text-sm">{{ (row as InteriorCatalogMaterialListItem).unit }}</td>
            <td class="py-3 px-4 text-sm">{{ formatSol((row as InteriorCatalogMaterialListItem).price) }}</td>
            <td class="py-3 px-4 text-sm">{{ formatQty((row as InteriorCatalogMaterialListItem).stock) }}</td>
            <td class="py-3 px-4 text-sm">{{ (row as InteriorCatalogMaterialListItem).imageCount }}</td>
            <td class="py-3 px-4 text-right">
              <ActionsDropdown :items="getActions(row as InteriorCatalogMaterialListItem)" />
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
          <span class="text-base font-semibold text-gray-800 dark:text-white/90">Eliminar material</span>
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
        <BaseButton variant="danger" :loading="isDeletingMaterial" @click="executeDelete">
          <AppIcon icon="lucide:trash-2" :size="16" class="mr-1" />
          Eliminar
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
