<script setup lang="ts">
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
} from '@shared/components'
import type { InteriorSupplierListItem, ListInteriorMaterialSuppliersParams } from '../../domain/suppliers.types'
import {
  useInteriorMaterialSuppliersList,
  useDeleteInteriorMaterialSupplier,
} from '../../application/useInteriorMaterialSuppliers'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

const router = useRouter()
const ITEMS = 10

const listParams = ref<ListInteriorMaterialSuppliersParams>({
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
} = useInteriorMaterialSuppliersList(listParams)

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

const goDetail = (r: InteriorSupplierListItem) =>
  router.push(`${INTERIORISMO_BASE_PATH}/materiales/proveedores/${r.id}`)
const goNew = () => router.push(`${INTERIORISMO_BASE_PATH}/materiales/proveedores/nuevo`)

const showDeleteModal = ref(false)
const deleteTarget = ref<InteriorSupplierListItem | null>(null)
const { mutateAsync: deleteSupplier, isPending: isDeletingSupplier } = useDeleteInteriorMaterialSupplier()

const openDeleteConfirm = (r: InteriorSupplierListItem) => {
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

const getActions = (r: InteriorSupplierListItem): { label: string; icon: string; onClick: () => void }[] => [
  { label: 'Ver ficha', icon: 'lucide:eye', onClick: () => goDetail(r) },
  { label: 'Editar', icon: 'lucide:pencil', onClick: () => goDetail(r) },
  { label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => openDeleteConfirm(r) },
]
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1200px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Proveedores</h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Empresa, RUC, contacto; vínculos al catálogo e historial de compras en cada ficha.
        </p>
      </div>
      <BaseButton variant="primary" class="shrink-0" @click="goNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nuevo proveedor
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
      <template v-else>
        <DataTable empty-text="No hay proveedores registrados." :columns="columns" :data="rows" row-key="id">
          <template #toolbar>
            <div class="flex-1 min-w-0">
              <SearchInput v-model="searchInput" placeholder="Buscar por empresa o RUC…" />
            </div>
          </template>
          <template #row="{ row }">
            <td class="py-3 px-4">
              <button
                type="button"
                class="font-medium text-left hover:underline"
                :style="{ color: 'var(--color-primary)' }"
                @click="goDetail(row as InteriorSupplierListItem)"
              >
                {{ (row as InteriorSupplierListItem).companyName }}
              </button>
            </td>
            <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              {{ (row as InteriorSupplierListItem).ruc }}
            </td>
            <td class="py-3 px-4 text-sm">{{ (row as InteriorSupplierListItem).contactName ?? '—' }}</td>
            <td class="py-3 px-4 text-sm">{{ (row as InteriorSupplierListItem).phone ?? '—' }}</td>
            <td class="py-3 px-4 text-sm">{{ (row as InteriorSupplierListItem).linkedMaterialsCount }}</td>
            <td class="py-3 px-4 text-right">
              <ActionsDropdown :items="getActions(row as InteriorSupplierListItem)" />
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
          <span class="text-base font-semibold" style="color: var(--color-text-primary);">Eliminar proveedor</span>
        </div>
      </template>
      <div class="p-4 space-y-3">
        <p class="text-sm" style="color: var(--color-text-secondary);">
          ¿Eliminar al proveedor
          <span class="font-semibold" style="color: var(--color-text-primary);">{{ deleteTarget?.companyName }}</span>
          (RUC {{ deleteTarget?.ruc }})?
        </p>
      </div>
      <div class="flex justify-end gap-3 p-4 border-t" style="border-color: var(--color-border);">
        <BaseButton variant="ghost" @click="closeDeleteModal">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="isDeletingSupplier" @click="executeDelete">
          <AppIcon icon="lucide:trash-2" :size="16" class="mr-1" />
          Eliminar
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
