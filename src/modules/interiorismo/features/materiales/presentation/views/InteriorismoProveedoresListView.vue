<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, BasePagination, DataTable, SearchInput, AppIcon } from '@shared/components'
import type { InteriorSupplierListItem, ListInteriorMaterialSuppliersParams } from '../../domain/suppliers.types'
import { useInteriorMaterialSuppliersList } from '../../application/useInteriorMaterialSuppliers'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'

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

const { data: result, isLoading } = useInteriorMaterialSuppliersList(listParams)

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
          </template>
        </DataTable>
        <div class="border-t" :style="{ borderColor: 'var(--color-border)' }">
          <BasePagination
            v-bind="paginationProps"
            :show-page-size="true"
            @update:current-page="onPage"
            @update:page-size="onSize"
          />
        </div>
      </template>
    </div>
  </div>
</template>
