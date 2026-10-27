<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin, filterActions } = useApplicationAccess('ventas')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import { ventasPropertiesRepositoryKey } from '../../application/ports/ventas-properties.port'
import { useService } from '@shared/presentation/di/services'
import { toCalendarDateString } from '@shared/utils/formatters'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { RowSelectionState } from '@tanstack/vue-table'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import CollapsibleFilters from '@shared/presentation/components/ui/CollapsibleFilters.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ExcelIcon from '@shared/presentation/components/ui/ExcelIcon.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { fetchAllPages } from '@shared/utils/fetchAllPages'
import {
  useVentasPropertiesList,
  useVentasPropertyStats,
  useVentasPropertyTypes,
  useVentasPropertyCurrencies,
  useVentasPropertyDepartments,
  useVentasPropertyProvinces,
  useVentasPropertyDistricts,
  useVentasUpdatePropertyListingStatus,
  useVentasDeleteProperty,
} from '../composables/useVentasProperties'
import type { VentasPropertyListItem, VentasListPropertiesParams } from '../../domain/property.types'
import {
  VENTAS_LISTING_STATUS_OPTIONS,
  listingStatusLabel,
  listingStatusVariant,
  type VentasListingStatus,
} from '../../domain/listing-status'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)

const router = useRouter()
const ITEMS_PER_PAGE = 10

const tableRowSelection = ref<RowSelectionState>({})

const listParams = ref<VentasListPropertiesParams>({ page: 1, limit: ITEMS_PER_PAGE })
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const filterListingStatus = ref('')
const filterPropertyTypeId = ref('')
const filterDepartmentId = ref('')
const filterProvinceId = ref('')
const filterDistrictId = ref('')
const filterMinPrice = ref('')
const filterMaxPrice = ref('')
const debouncedMinPrice = useDebouncedRef(filterMinPrice)
const debouncedMaxPrice = useDebouncedRef(filterMaxPrice)

const selectedFilterDepartmentId = computed(() => filterDepartmentId.value || undefined)
const selectedFilterProvinceId = computed(() => filterProvinceId.value || undefined)

const {
  data: listResult,
  isFetching: fetchingList,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useVentasPropertiesList(listParams)
const {
  data: stats,
  isLoading: loadingStats,
  isError: statsQueryError,
  error: statsFetchError,
  refetch: refetchStats,
} = useVentasPropertyStats()
const {
  data: propertyTypes,
  isError: propertyTypesQueryError,
  error: propertyTypesFetchError,
  refetch: refetchPropertyTypes,
} = useVentasPropertyTypes()
const { data: currencies } = useVentasPropertyCurrencies()
const { data: departments, isLoading: loadingFilterDepartments } = useVentasPropertyDepartments()
const { data: filterProvinces, isLoading: loadingFilterProvinces } =
  useVentasPropertyProvinces(selectedFilterDepartmentId)
const { data: filterDistricts, isLoading: loadingFilterDistricts } =
  useVentasPropertyDistricts(selectedFilterProvinceId)

const properties = computed(() => listResult.value?.data ?? [])
const totalFromApi = computed(() => listResult.value?.total ?? 0)

function parsePriceFilter(v: string): number | undefined {
  const t = v.trim()
  if (!t) return undefined
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}

watch(filterDepartmentId, () => {
  filterProvinceId.value = ''
  filterDistrictId.value = ''
})
watch(filterProvinceId, () => {
  filterDistrictId.value = ''
})

/** Filtros del servidor (los mismos para el listado y la exportación) */
const serverFilters = computed(() => ({
  search: debouncedSearch.value.trim() || undefined,
  listingStatus: filterListingStatus.value || undefined,
  propertyTypeId: filterPropertyTypeId.value || undefined,
  districtId: filterDistrictId.value || undefined,
  minSalePrice: parsePriceFilter(debouncedMinPrice.value),
  maxSalePrice: parsePriceFilter(debouncedMaxPrice.value),
}))

watch(
  serverFilters,
  (filters) => {
    listParams.value = { ...listParams.value, page: 1, ...filters }
  },
  { immediate: true },
)

/** Filtros del panel con valor (la ubicación cuenta como uno) */
const activeFilterCount = computed(
  () =>
    [
      filterListingStatus.value,
      filterPropertyTypeId.value,
      filterDepartmentId.value,
      filterMinPrice.value.trim(),
      filterMaxPrice.value.trim(),
    ].filter(Boolean).length,
)

function clearFilters() {
  filterListingStatus.value = ''
  filterPropertyTypeId.value = ''
  filterDepartmentId.value = ''
  filterMinPrice.value = ''
  filterMaxPrice.value = ''
}

const onPageChange = (page: number) => {
  listParams.value = { ...listParams.value, page }
}

const onPageSizeChange = (size: number) => {
  listParams.value = { ...listParams.value, limit: size, page: 1 }
}

const tableColumns = [
  {
    key: 'propiedad',
    label: 'Propiedad',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => {
      const p = r as VentasPropertyListItem
      return `${p.code} ${p.addressLine} ${p.districtName}`
    },
  },
  {
    key: 'proyecto',
    label: 'Proyecto',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as VentasPropertyListItem).projectName ?? '',
  },
  {
    key: 'propietario',
    label: 'Propietario',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as VentasPropertyListItem).ownerFullName,
  },
  {
    key: 'estado',
    label: 'Estado',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as VentasPropertyListItem).listingStatus ?? '',
  },
  {
    key: 'precio',
    label: 'Precio de venta',
    align: 'left' as const,
    sortable: true,
    sortType: 'basic' as const,
    sortAccessor: (r: unknown) => (r as VentasPropertyListItem).salePrice ?? -1,
  },
  { key: 'actions', label: '', align: 'right' as const },
]

const goToNew = () => router.push('/ventas/propiedades/nueva')
const goToEdit = (row: VentasPropertyListItem) => router.push(`/ventas/propiedades/${row.id}/editar`)

const showStatusModal = ref(false)
const propertyForStatus = ref<VentasPropertyListItem | null>(null)
const newListingStatus = ref<VentasListingStatus>('AVAILABLE')
const statusModalError = ref('')
const updateListingStatusMutation = useVentasUpdatePropertyListingStatus()

const openChangeStatusModal = (row: VentasPropertyListItem) => {
  propertyForStatus.value = row
  newListingStatus.value = VENTAS_LISTING_STATUS_OPTIONS.some((o) => o.value === row.listingStatus)
    ? (row.listingStatus as VentasListingStatus)
    : 'AVAILABLE'
  statusModalError.value = ''
  showStatusModal.value = true
}

const closeStatusModal = () => {
  showStatusModal.value = false
  propertyForStatus.value = null
  statusModalError.value = ''
}

const saveListingStatus = () => {
  if (!propertyForStatus.value) return
  statusModalError.value = ''
  updateListingStatusMutation.mutate(
    { id: propertyForStatus.value.id, listingStatus: newListingStatus.value },
    {
      onSuccess: () => closeStatusModal(),
      onError: (err: unknown) => {
        statusModalError.value = getApiErrorMessage(err, 'No se pudo cambiar el estado')
      },
    },
  )
}

const showDeleteModal = ref(false)
const propertyToDelete = ref<VentasPropertyListItem | null>(null)
const { mutate: deleteProperty, isPending: isDeletingProperty } = useVentasDeleteProperty()

const openDeleteModal = (row: VentasPropertyListItem) => {
  propertyToDelete.value = row
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  propertyToDelete.value = null
}

const executeDeleteProperty = () => {
  if (!propertyToDelete.value) return
  deleteProperty(propertyToDelete.value.id, { onSuccess: closeDeleteModal })
}

const getActions = (row: VentasPropertyListItem) => [
  { label: 'Editar', icon: 'lucide:pencil', onClick: () => goToEdit(row) },
  { label: 'Cambiar estado', icon: 'lucide:refresh-cw', onClick: () => openChangeStatusModal(row) },
  { label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => openDeleteModal(row) },
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

const statusOptions = [{ value: '', label: 'Todos los estados' }, ...VENTAS_LISTING_STATUS_OPTIONS]

const typeOptions = computed(() => [
  { value: '', label: 'Todos los tipos' },
  ...(propertyTypes.value ?? []).map((t) => ({ value: t.id, label: t.name })),
])

const departmentFilterOptions = computed(() =>
  (departments.value ?? []).map((d) => ({ value: d.id, label: d.name })),
)
const provinceFilterOptions = computed(() =>
  (filterProvinces.value ?? []).map((p) => ({ value: p.id, label: p.name })),
)
const districtFilterOptions = computed(() =>
  (filterDistricts.value ?? []).map((d) => ({ value: d.id, label: d.name })),
)

function currencySymbol(code: string | null | undefined): string {
  return (currencies.value ?? []).find((c) => c.code === code)?.symbol ?? code ?? 'S/'
}

function formatSalePrice(salePrice: number | null, saleCurrency?: string | null): string {
  if (salePrice == null) return '—'
  return `${currencySymbol(saleCurrency ?? 'PEN')} ${Number(salePrice).toLocaleString('es-PE', { maximumFractionDigits: 0 })}`
}

const { isExporting, exportToExcel } = useExcelExport()

async function handleExport() {
  // Todas las páginas: el backend topa cada página en 50 filas
  const rows = await fetchAllPages((page, limit) =>
    ventasPropertiesRepository.getList({ page, limit, ...serverFilters.value }),
  )
  await exportToExcel({
    fileName: `propiedades_ventas_${toCalendarDateString()}`,
    sheetName: 'Propiedades',
    columns: [
      { header: 'Código', key: 'code', width: 30 },
      { header: 'Tipo', key: 'propertyTypeName', width: 16 },
      { header: 'Proyecto', key: 'projectName', width: 24 },
      { header: 'Dirección', key: 'addressLine', width: 34 },
      { header: 'Distrito', key: 'districtName', width: 18 },
      { header: 'Área (m²)', key: 'area', width: 12 },
      { header: 'Propietario', key: 'ownerFullName', width: 28 },
      { header: 'Estado', key: 'listingStatus', width: 14 },
      { header: 'Moneda', key: 'saleCurrency', width: 10 },
      { header: 'Precio de venta', key: 'salePrice', width: 18 },
      { header: 'Precio por m²', key: 'pricePerM2', width: 16 },
    ],
    rows: rows.map((p: VentasPropertyListItem) => ({
      code: p.code,
      propertyTypeName: p.propertyTypeName,
      projectName: p.projectName ?? '—',
      addressLine: p.addressLine,
      districtName: p.districtName,
      area: p.area ?? '—',
      ownerFullName: p.ownerFullName,
      listingStatus: listingStatusLabel(p.listingStatus),
      saleCurrency: p.saleCurrency ?? 'PEN',
      salePrice: p.salePrice ?? '—',
      pricePerM2: p.salePrice != null && p.area ? Math.round(p.salePrice / p.area) : '—',
    })),
  })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Propiedades" subtitle="Inventario de inmuebles en venta">
      <template #actions>
        <div class="flex gap-2 w-full sm:w-auto">
          <BaseButton
            variant="outline"
            class="flex items-center gap-2 flex-1 sm:flex-none justify-center"
            :loading="isExporting"
            title="Exportar a Excel"
            @click="handleExport"
          >
            <ExcelIcon class="w-5 h-5" />
            Exportar
          </BaseButton>
          <BaseButton
            v-if="canWrite"
            variant="primary"
            class="flex items-center gap-2 flex-1 sm:flex-none justify-center"
            @click="goToNew"
          >
            <AppIcon icon="lucide:plus" :size="18" />
            Nueva Propiedad
          </BaseButton>
        </div>
      </template>
    </PageHeader>

    <!-- Stats -->
    <div
      v-if="statsQueryError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3 border-gray-200 dark:border-gray-800 bg-warning-50 dark:bg-warning-500/15"
    >
      <span class="max-w-xl text-error-500 dark:text-error-400">{{ getApiErrorMessage(statsFetchError) }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => refetchStats()">Reintentar</BaseButton>
    </div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatsCard compact title="Total" :value="String(stats?.total ?? 0)" :loading="loadingStats">
        <template #icon><AppIcon icon="lucide:building-2" :size="20" color="var(--color-primary)" /></template>
      </StatsCard>
      <StatsCard compact title="Disponibles" :value="String(stats?.available ?? 0)" :loading="loadingStats">
        <template #icon><AppIcon icon="lucide:door-open" :size="20" color="#2563eb" /></template>
      </StatsCard>
      <StatsCard compact title="Separadas" :value="String(stats?.reserved ?? 0)" :loading="loadingStats">
        <template #icon><AppIcon icon="lucide:bookmark" :size="20" color="#ca8a04" /></template>
      </StatsCard>
      <StatsCard compact title="Vendidas" :value="String(stats?.sold ?? 0)" :loading="loadingStats">
        <template #icon><AppIcon icon="lucide:circle-check" :size="20" color="#16a34a" /></template>
      </StatsCard>
    </div>

    <div
      v-if="propertyTypesQueryError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3 border-gray-200 dark:border-gray-800 bg-warning-50 dark:bg-warning-500/15"
    >
      <span class="text-gray-800 dark:text-white/90">No se cargaron los tipos de propiedad para el filtro.</span>
      <span class="text-xs max-w-md text-error-500 dark:text-error-400">{{ getApiErrorMessage(propertyTypesFetchError) }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => refetchPropertyTypes()">Reintentar</BaseButton>
    </div>

    <!-- Table -->
    <BaseCard padding="none" class="block overflow-hidden">
      <div class="overflow-x-auto">
        <div v-if="listQueryError" class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
          <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(listFetchError) }}</p>
          <BaseButton variant="outline" size="sm" @click="() => refetchList()">Reintentar</BaseButton>
        </div>
        <template v-else>
          <DataTable
            v-model:row-selection="tableRowSelection"
            selectable
            empty-text="No hay propiedades con estos filtros."
            :columns="tableColumns"
            :data="properties"
            row-key="id"
            :loading="fetchingList"
          >
            <template #toolbar>
              <div class="flex-1 min-w-0">
                <SearchInput v-model="searchInput" placeholder="Buscar por código, dirección, proyecto o propietario..." />
              </div>
              <CollapsibleFilters
                :active-count="activeFilterCount"
                storage-key="markap.ventas.propiedades.filtros"
                @clear="clearFilters"
              >
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <FormSelect v-model="filterListingStatus" label="Estado comercial" :options="statusOptions" />
                  <FormSelect v-model="filterPropertyTypeId" label="Tipo de propiedad" :options="typeOptions" />
                  <FormInput
                    v-model="filterMinPrice"
                    type="number"
                    min="0"
                    label="Precio mínimo"
                    placeholder="Sin límite"
                  />
                  <FormInput
                    v-model="filterMaxPrice"
                    type="number"
                    min="0"
                    label="Precio máximo"
                    placeholder="Sin límite"
                  />
                  <FormSelect
                    v-model="filterDepartmentId"
                    label="Departamento"
                    :options="departmentFilterOptions"
                    placeholder="Todos"
                    :loading="loadingFilterDepartments"
                  />
                  <FormSelect
                    v-model="filterProvinceId"
                    label="Provincia"
                    :options="provinceFilterOptions"
                    placeholder="Todas"
                    :loading="loadingFilterProvinces"
                    :disabled="!filterDepartmentId"
                  />
                  <FormSelect
                    v-model="filterDistrictId"
                    label="Distrito"
                    :options="districtFilterOptions"
                    placeholder="Todos"
                    :loading="loadingFilterDistricts"
                    :disabled="!filterProvinceId"
                  />
                </div>
                <p class="mt-2 text-theme-xs text-gray-400 dark:text-gray-500">
                  El rango de precio compara el monto de venta tal cual, en la moneda de cada propiedad.
                </p>
              </CollapsibleFilters>
            </template>
            <template #row="{ row }">
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <AppIcon icon="lucide:building-2" :size="20" color="var(--color-text-muted)" class="shrink-0" />
                  <div>
                    <p class="font-medium text-gray-800 dark:text-white/90">{{ (row as VentasPropertyListItem).code }}</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500">
                      {{ (row as VentasPropertyListItem).addressLine }}, {{ (row as VentasPropertyListItem).districtName }}
                    </p>
                    <p class="text-xs mt-0.5 text-gray-500 dark:text-gray-400">
                      {{ (row as VentasPropertyListItem).propertyTypeName }}
                      <template v-if="(row as VentasPropertyListItem).area != null">
                        · {{ (row as VentasPropertyListItem).area }} m²
                      </template>
                    </p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 text-sm text-gray-800 dark:text-white/90">
                {{ (row as VentasPropertyListItem).projectName || '—' }}
              </td>
              <td class="py-3 px-4">
                <span class="inline-flex items-center gap-1.5 text-sm text-gray-800 dark:text-white/90">
                  <AppIcon icon="lucide:user" :size="16" color="var(--color-text-muted)" class="shrink-0" />
                  {{ (row as VentasPropertyListItem).ownerFullName }}
                </span>
              </td>
              <td class="py-3 px-4">
                <Badge :variant="listingStatusVariant((row as VentasPropertyListItem).listingStatus)">
                  {{ listingStatusLabel((row as VentasPropertyListItem).listingStatus) }}
                </Badge>
              </td>
              <td class="py-3 px-4 text-sm font-medium text-gray-800 dark:text-white/90">
                {{ formatSalePrice((row as VentasPropertyListItem).salePrice, (row as VentasPropertyListItem).saleCurrency) }}
              </td>
              <td class="py-3 px-4 text-right">
                <ActionsDropdown :items="filterActions(getActions(row as VentasPropertyListItem))" />
              </td>
            </template>
          </DataTable>
          <div class="border-t border-gray-200 dark:border-gray-800">
            <BasePagination
              v-bind="paginationProps"
              :show-page-size="true"
              @update:current-page="onPageChange"
              @update:page-size="onPageSizeChange"
            />
          </div>
        </template>
      </div>
    </BaseCard>

    <BaseModal v-model="showStatusModal" title="Cambiar estado comercial" size="sm">
      <template v-if="propertyForStatus">
        <p class="text-sm mb-4 text-gray-500 dark:text-gray-400">
          {{ propertyForStatus.code }} – {{ propertyForStatus.addressLine }}
        </p>
        <p
          v-if="statusModalError"
          class="text-sm mb-3 px-3 py-2 rounded-lg text-error-500 dark:text-error-400 bg-error-50 dark:bg-error-500/15"
        >
          {{ statusModalError }}
        </p>
        <FormSelect
          v-model="newListingStatus"
          label="Nuevo estado"
          :options="VENTAS_LISTING_STATUS_OPTIONS"
          placeholder="Seleccionar"
        />
        <div class="flex justify-end gap-3 mt-6">
          <BaseButton variant="outline" @click="closeStatusModal">Cancelar</BaseButton>
          <BaseButton
            v-if="canWrite"
            variant="primary"
            :loading="updateListingStatusMutation.isPending.value"
            @click="saveListingStatus"
          >
            Guardar
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <BaseModal v-model="showDeleteModal" :closable="true" size="sm" @close="closeDeleteModal">
      <template #title>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center bg-error-50 dark:bg-error-500/15">
            <AppIcon class="text-error-500 dark:text-error-400" icon="lucide:trash-2" :size="16" />
          </div>
          <span class="text-base font-semibold text-gray-800 dark:text-white/90">Eliminar propiedad</span>
        </div>
      </template>
      <div class="p-4 space-y-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          ¿Estás seguro de que deseas eliminar la propiedad
          <span class="font-semibold text-gray-800 dark:text-white/90">{{ propertyToDelete?.code }}</span>?
        </p>
        <p class="text-xs px-3 py-2 rounded-lg bg-warning-50 dark:bg-warning-500/15 text-warning-600 dark:text-orange-400">
          Esta acción desactivará la propiedad. Si tiene procesos de venta activos, revísalos primero.
        </p>
      </div>
      <div class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
        <BaseButton variant="ghost" @click="closeDeleteModal">Cancelar</BaseButton>
        <BaseButton v-if="canAdmin" variant="danger" :loading="isDeletingProperty" @click="executeDeleteProperty">
          <AppIcon icon="lucide:trash-2" :size="16" class="mr-1" />
          Eliminar
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
