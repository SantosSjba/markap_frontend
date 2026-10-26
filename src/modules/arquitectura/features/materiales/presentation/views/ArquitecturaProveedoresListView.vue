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
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import type {
  ArquitecturaSupplierListItem,
  ListArquitecturaMaterialSuppliersParams,
} from '../../domain/suppliers.types'
import {
  useArquitecturaMaterialSuppliersList,
  useDeleteArquitecturaMaterialSupplier,
} from '../composables/useArquitecturaMaterialSuppliers'
import { ARQUITECTURA_BASE_PATH } from '../../../../config/routes.constants'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
const router = useRouter()
const ITEMS = 10

const listParams = ref<ListArquitecturaMaterialSuppliersParams>({
  page: 1,
  limit: ITEMS,
})
const searchInput = ref('')

watch(searchInput, () => {
  listParams.value = {
    ...listParams.value,
    page: 1,
    search: searchInput.value.trim() || undefined,
  }
})

const {
  data: result,
  isLoading,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useArquitecturaMaterialSuppliersList(listParams)

const rows = computed(() => result.value?.data ?? [])
const total = computed(() => result.value?.total ?? 0)

const onPage = (p: number) => {
  listParams.value = { ...listParams.value, page: p }
}
const onSize = (s: number) => {
  listParams.value = { ...listParams.value, limit: s, page: 1 }
}

const columns = [
  { key: 'companyName', label: 'Empresa', align: 'left' as const, sortable: true },
  { key: 'ruc', label: 'RUC', align: 'left' as const, sortable: true },
  { key: 'contactName', label: 'Contacto', align: 'left' as const },
  { key: 'phone', label: 'Teléfono', align: 'left' as const },
  { key: 'linkedMaterialsCount', label: 'Materiales', align: 'left' as const },
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

const goDetail = (r: ArquitecturaSupplierListItem) =>
  router.push(`${ARQUITECTURA_BASE_PATH}/materiales/proveedores/${r.id}`)
const goNew = () => router.push(`${ARQUITECTURA_BASE_PATH}/materiales/proveedores/nuevo`)

const showDeleteModal = ref(false)
const deleteTarget = ref<ArquitecturaSupplierListItem | null>(null)
const { mutateAsync: deleteSupplier, isPending: isDeletingSupplier } =
  useDeleteArquitecturaMaterialSupplier()

const openDeleteConfirm = (r: ArquitecturaSupplierListItem) => {
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
    await deleteSupplier(r.id)
    closeDeleteModal()
  } catch {
    void 0
  }
}

const getActions = (
  r: ArquitecturaSupplierListItem,
): { label: string; icon: string; onClick: () => void }[] => [
  { label: 'Ver ficha', icon: 'lucide:eye', onClick: () => goDetail(r) },
  { label: 'Editar', icon: 'lucide:pencil', onClick: () => goDetail(r) },
  { label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => openDeleteConfirm(r) },
]
</script>

<template>
  <div class="max-w-[1200px] mx-auto space-y-6">
    <PageHeader
      title="Proveedores"
      subtitle="Empresa, RUC, contacto; vínculos al catálogo e historial de compras en cada ficha."
    >
      <template #actions>
        <BaseButton variant="primary" class="shrink-0" @click="goNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nuevo proveedor
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
        <DataTable empty-text="No hay proveedores registrados." :columns="columns" :data="rows" row-key="id">
          <template #toolbar>
            <div class="flex-1 min-w-0">
              <SearchInput v-model="searchInput" placeholder="Buscar por empresa o RUC…" />
            </div>
          </template>
          <template #row="{ row }">
            <td class="py-3 px-4">
              <BaseButton @click="goDetail(row as ArquitecturaSupplierListItem)" variant="link" class="font-medium">{{ (row as ArquitecturaSupplierListItem).companyName }}</BaseButton>
            </td>
            <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
              {{ (row as ArquitecturaSupplierListItem).ruc }}
            </td>
            <td class="py-3 px-4 text-sm">{{ (row as ArquitecturaSupplierListItem).contactName ?? '—' }}</td>
            <td class="py-3 px-4 text-sm">{{ (row as ArquitecturaSupplierListItem).phone ?? '—' }}</td>
            <td class="py-3 px-4 text-sm">{{ (row as ArquitecturaSupplierListItem).linkedMaterialsCount }}</td>
            <td class="py-3 px-4 text-right">
              <ActionsDropdown :items="getActions(row as ArquitecturaSupplierListItem)" />
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
          <span class="text-base font-semibold text-gray-800 dark:text-white/90">Eliminar proveedor</span>
        </div>
      </template>
      <div class="p-4 space-y-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          ¿Eliminar al proveedor
          <span class="font-semibold text-gray-800 dark:text-white/90">{{ deleteTarget?.companyName }}</span>
          (RUC {{ deleteTarget?.ruc }})?
        </p>
      </div>
      <div class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
        <BaseButton variant="ghost" @click="closeDeleteModal">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="isDeletingSupplier" @click="executeDelete">
          <AppIcon icon="lucide:trash-2" :size="16" class="mr-1" />
          Eliminar
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
