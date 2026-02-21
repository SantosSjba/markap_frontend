<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  BasePagination,
  StatsCard,
  Badge,
  DataTable,
  ActionsDropdown,
  FormSelect,
  SearchInput,
} from '@shared/components'
import { usePropertiesList, usePropertyStats, usePropertyTypes } from '../composables/useProperties'
import type { PropertyListItem, ListPropertiesParams } from '../services/properties.service'

const router = useRouter()
const ITEMS_PER_PAGE = 10

const listParams = ref<ListPropertiesParams>({
  applicationSlug: 'alquileres',
  page: 1,
  limit: ITEMS_PER_PAGE,
})
const searchInput = ref('')
const filterListingStatus = ref<string>('')
const filterPropertyTypeId = ref<string>('')

const { data: listResult, isLoading: loadingList } = usePropertiesList(listParams)
const { data: stats, isLoading: loadingStats } = usePropertyStats('alquileres')
const { data: propertyTypes } = usePropertyTypes()

const properties = computed(() => listResult.value?.data ?? [])
const totalFromApi = computed(() => listResult.value?.total ?? 0)

watch(
  [searchInput, filterListingStatus, filterPropertyTypeId],
  () => {
    listParams.value = {
      ...listParams.value,
      page: 1,
      search: searchInput.value.trim() || undefined,
      listingStatus: filterListingStatus.value || undefined,
      propertyTypeId: filterPropertyTypeId.value || undefined,
    }
  },
  { immediate: true }
)

const onPageChange = (page: number) => {
  listParams.value = { ...listParams.value, page }
}

const onPageSizeChange = (size: number) => {
  listParams.value = { ...listParams.value, limit: size, page: 1 }
}

const tableColumns = [
  { key: 'propiedad', label: 'Propiedad', align: 'left' as const },
  { key: 'propietario', label: 'Propietario', align: 'left' as const },
  { key: 'inquilino', label: 'Inquilino', align: 'left' as const },
  { key: 'estado', label: 'Estado', align: 'left' as const },
  { key: 'vencimiento', label: 'Vencimiento', align: 'left' as const },
  { key: 'alquiler', label: 'Alquiler', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

const goToNew = () => router.push('/alquileres/propiedades/nueva')
const goToEdit = (row: PropertyListItem) =>
  router.push(`/alquileres/propiedades/${row.id}/editar`)

const getActions = (row: PropertyListItem) => [
  { label: 'Editar', onClick: () => goToEdit(row) },
]

const paginationProps = computed(() => {
  const page = listParams.value.page ?? 1
  const limit = listParams.value.limit ?? ITEMS_PER_PAGE
  const totalPages = Math.max(1, Math.ceil(totalFromApi.value / limit))
  return {
    currentPage: page,
    totalPages,
    totalItems: totalFromApi.value,
    pageSize: limit,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  }
})

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'RENTED', label: 'Alquilada' },
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'EXPIRING', label: 'Por Vencer' },
  { value: 'MAINTENANCE', label: 'En Mantenimiento' },
]

const typeOptions = computed(() => {
  const base = [{ value: '', label: 'Todos los tipos' }]
  const types = propertyTypes.value ?? []
  return [...base, ...types.map((t) => ({ value: t.id, label: t.name }))]
})

function listingStatusVariant(status: string | null): 'success' | 'info' | 'warning' | 'error' | 'neutral' {
  if (!status) return 'neutral'
  switch (status) {
    case 'RENTED': return 'success'
    case 'AVAILABLE': return 'info'
    case 'EXPIRING': return 'error'
    case 'MAINTENANCE': return 'warning'
    default: return 'neutral'
  }
}

function listingStatusLabel(status: string | null): string {
  if (!status) return '—'
  switch (status) {
    case 'RENTED': return 'Alquilada'
    case 'AVAILABLE': return 'Disponible'
    case 'EXPIRING': return 'Por Vencer'
    case 'MAINTENANCE': return 'En Mantenimiento'
    default: return status
  }
}

function formatRent(monthlyRent: number | null): string {
  if (monthlyRent == null) return '—'
  return `S/ ${Number(monthlyRent).toLocaleString('es-PE')} mensual`
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1
          class="text-xl sm:text-2xl font-bold"
          :style="{ color: 'var(--color-text-primary)' }"
        >
          Propiedades
        </h1>
        <p
          class="text-sm mt-1"
          :style="{ color: 'var(--color-text-secondary)' }"
        >
          Gestión de propiedades en administración
        </p>
      </div>
      <BaseButton variant="primary" class="flex items-center gap-2 w-full sm:w-auto justify-center" @click="goToNew">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Nueva Propiedad
      </BaseButton>
    </div>

    <!-- Stats -->
    <div
      v-if="loadingStats"
      class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 h-20"
    />
    <div
      v-else
      class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      <StatsCard :title="'Total'" :value="stats?.total ?? 0">
        <template #icon>
          <svg class="w-5 h-5" :style="{ color: 'var(--color-primary)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </template>
      </StatsCard>
      <StatsCard :title="'Alquiladas'" :value="stats?.rented ?? 0">
        <template #icon>
          <svg class="w-5 h-5" :style="{ color: 'var(--color-success, #16a34a)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </template>
      </StatsCard>
      <StatsCard :title="'Disponibles'" :value="stats?.available ?? 0">
        <template #icon>
          <svg class="w-5 h-5" :style="{ color: 'var(--color-info, #2563eb)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
          </svg>
        </template>
      </StatsCard>
      <StatsCard :title="'Por Vencer'" :value="stats?.expiring ?? 0">
        <template #icon>
          <svg class="w-5 h-5" :style="{ color: 'var(--color-error, #dc2626)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </template>
      </StatsCard>
    </div>

    <!-- Search & Filters -->
    <div
      class="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border"
      :style="{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }"
    >
      <div class="flex-1 min-w-0">
        <SearchInput
          v-model="searchInput"
          placeholder="Buscar por dirección, código, propietario o inquilino..."
        />
      </div>
      <div class="flex flex-wrap gap-3 flex-shrink-0 sm:flex-nowrap">
        <div class="w-full sm:w-[180px] min-w-0">
          <FormSelect
            v-model="filterListingStatus"
            :options="statusOptions"
            placeholder="Todos los estados"
          />
        </div>
        <div class="w-full sm:w-[180px] min-w-0">
          <FormSelect
            v-model="filterPropertyTypeId"
            :options="typeOptions"
            placeholder="Todos los tipos"
          />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div
      class="rounded-xl border overflow-visible"
      :style="{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }"
    >
      <div class="overflow-x-auto overflow-y-visible">
        <div v-if="loadingList" class="flex justify-center py-16 px-4">
          <svg
            class="animate-spin h-8 w-8"
            :style="{ color: 'var(--color-primary)' }"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <template v-else>
          <DataTable :columns="tableColumns" :data="properties" row-key="id">
            <template #row="{ row }">
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 shrink-0" :style="{ color: 'var(--color-text-muted)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                  </svg>
                  <div>
                    <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
                      {{ (row as PropertyListItem).code }}
                    </p>
                    <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
                      {{ (row as PropertyListItem).addressLine }}, {{ (row as PropertyListItem).districtName }}
                    </p>
                    <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
                      {{ (row as PropertyListItem).propertyTypeName }}
                      <template v-if="(row as PropertyListItem).area != null">
                        · {{ (row as PropertyListItem).area }} m²
                      </template>
                    </p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <span class="inline-flex items-center gap-1.5 text-sm" :style="{ color: 'var(--color-text-primary)' }">
                  <svg class="w-4 h-4 shrink-0" :style="{ color: 'var(--color-text-muted)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {{ (row as PropertyListItem).ownerFullName }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
                Sin inquilino
              </td>
              <td class="py-3 px-4">
                <Badge :variant="listingStatusVariant((row as PropertyListItem).listingStatus)">
                  {{ listingStatusLabel((row as PropertyListItem).listingStatus) }}
                </Badge>
              </td>
              <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
                —
              </td>
              <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-primary)' }">
                {{ formatRent((row as PropertyListItem).monthlyRent) }}
              </td>
              <td class="py-3 px-4 text-right">
                <ActionsDropdown :items="getActions(row as PropertyListItem)" />
              </td>
            </template>
          </DataTable>
          <div class="border-t px-4 py-3" :style="{ borderColor: 'var(--color-border)' }">
            <BasePagination
              v-bind="paginationProps"
              :show-page-size="true"
              @update:current-page="onPageChange"
              @update:page-size="onPageSizeChange"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
