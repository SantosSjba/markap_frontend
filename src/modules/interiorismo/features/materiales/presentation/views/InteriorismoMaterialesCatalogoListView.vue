<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  BasePagination,
  DataTable,
  SearchInput,
  FormInput,
  AppIcon,
} from '@shared/components'
import type { InteriorCatalogMaterialListItem, ListInteriorCatalogMaterialsParams } from '../../domain/catalog.types'
import { useInteriorCatalogMaterialsList } from '../../application/useInteriorCatalogMaterials'
import { formatSol, formatQty } from '../labels'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'

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

const { data: result, isLoading } = useInteriorCatalogMaterialsList(listParams)

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
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1200px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Catálogo de materiales
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Código, categoría, marca, precio y stock para usar en presupuestos y obra.
        </p>
      </div>
      <BaseButton variant="primary" class="shrink-0" @click="goNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nuevo material
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
        <DataTable empty-text="No hay materiales en el catálogo." :columns="columns" :data="rows" row-key="id">
          <template #toolbar>
            <div class="flex flex-col sm:flex-row gap-3 flex-1 min-w-0 w-full">
              <SearchInput v-model="searchInput" placeholder="Buscar por código o nombre…" class="flex-1 min-w-0" />
              <FormInput v-model="categoryFilter" placeholder="Filtrar por categoría…" class="w-full sm:w-52" />
            </div>
          </template>
          <template #row="{ row }">
            <td class="py-3 px-4">
              <button
                type="button"
                class="font-medium text-left hover:underline"
                :style="{ color: 'var(--color-primary)' }"
                @click="goDetail(row as InteriorCatalogMaterialListItem)"
              >
                {{ (row as InteriorCatalogMaterialListItem).code }}
              </button>
            </td>
            <td class="py-3 px-4">
              <button type="button" class="text-left" @click="goDetail(row as InteriorCatalogMaterialListItem)">
                <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
                  {{ (row as InteriorCatalogMaterialListItem).name }}
                </span>
              </button>
            </td>
            <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              {{ (row as InteriorCatalogMaterialListItem).category }}
            </td>
            <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              {{ (row as InteriorCatalogMaterialListItem).brand }}
            </td>
            <td class="py-3 px-4 text-sm">{{ (row as InteriorCatalogMaterialListItem).unit }}</td>
            <td class="py-3 px-4 text-sm">{{ formatSol((row as InteriorCatalogMaterialListItem).price) }}</td>
            <td class="py-3 px-4 text-sm">{{ formatQty((row as InteriorCatalogMaterialListItem).stock) }}</td>
            <td class="py-3 px-4 text-sm">{{ (row as InteriorCatalogMaterialListItem).imageCount }}</td>
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
