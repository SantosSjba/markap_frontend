<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { RowSelectionState } from '@tanstack/vue-table'
import {
  BaseButton,
  BasePagination,
  StatsCard,
  Badge,
  DataTable,
  ActionsDropdown,
  FormSelect,
  FormInput,
  SearchInput,
  BaseModal,
  AppIcon,
  ExcelIcon,
} from '@shared/components'
import { useExcelExport } from '@shared/composables'
import {
  useVentasPropertiesList,
  useVentasPropertyStats,
  useVentasPropertyTypes,
  useVentasPropertyDepartments,
  useVentasPropertyProvinces,
  useVentasPropertyDistricts,
  useVentasUpdatePropertyListingStatus,
  useVentasDeleteProperty,
} from '../../application/useVentasProperties'
import type { VentasPropertyListItem, VentasListPropertiesParams } from '../../domain/property.types'
import { ventasPropertiesRepository } from '@modules/ventas/features/propiedades'

const router = useRouter()
const ITEMS_PER_PAGE = 10

const tableRowSelection = ref<RowSelectionState>({})

const listParams = ref<VentasListPropertiesParams>({
  page: 1,
  limit: ITEMS_PER_PAGE,
})
const searchInput = ref('')
const filterListingStatus = ref<string>('')
const filterPropertyTypeId = ref<string>('')
const filterDepartmentId = ref('')
const filterProvinceId = ref('')
const filterDistrictId = ref('')
const filterMinPrice = ref<string>('')
const filterMaxPrice = ref<string>('')

const selectedFilterDepartmentId = computed(() => filterDepartmentId.value || undefined)
const selectedFilterProvinceId = computed(() => filterProvinceId.value || undefined)

const { data: listResult, isLoading: loadingList } = useVentasPropertiesList(listParams)
const { data: stats, isLoading: loadingStats } = useVentasPropertyStats()
const { data: propertyTypes } = useVentasPropertyTypes()
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

watch(
  [
    searchInput,
    filterListingStatus,
    filterPropertyTypeId,
    filterDistrictId,
    filterMinPrice,
    filterMaxPrice,
  ],
  () => {
    listParams.value = {
      ...listParams.value,
      page: 1,
      search: searchInput.value.trim() || undefined,
      listingStatus: filterListingStatus.value || undefined,
      propertyTypeId: filterPropertyTypeId.value || undefined,
      districtId: filterDistrictId.value || undefined,
      minSalePrice: parsePriceFilter(filterMinPrice.value),
      maxSalePrice: parsePriceFilter(filterMaxPrice.value),
    }
  },
  { immediate: true },
)

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
    key: 'tipo',
    label: 'Tipo',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as VentasPropertyListItem).propertyTypeName,
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
    label: 'Precio venta',
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
const newListingStatus = ref<'AVAILABLE' | 'RESERVED' | 'SOLD'>('AVAILABLE')
const statusModalError = ref('')
const updateListingStatusMutation = useVentasUpdatePropertyListingStatus()

const openChangeStatusModal = (row: VentasPropertyListItem) => {
  propertyForStatus.value = row
  const cur = row.listingStatus
  newListingStatus.value =
    cur === 'AVAILABLE' || cur === 'RESERVED' || cur === 'SOLD' ? cur : 'AVAILABLE'
  statusModalError.value = ''
  showStatusModal.value = true
}

const closeStatusModal = () => {
  showStatusModal.value = false
  propertyForStatus.value = null
  statusModalError.value = ''
}

const listingStatusChangeOptions = [
  { value: 'AVAILABLE' as const, label: 'Disponible' },
  { value: 'RESERVED' as const, label: 'Separada' },
  { value: 'SOLD' as const, label: 'Vendida' },
]

const saveListingStatus = () => {
  if (!propertyForStatus.value) return
  statusModalError.value = ''
  updateListingStatusMutation.mutate(
    { id: propertyForStatus.value.id, listingStatus: newListingStatus.value },
    {
      onSuccess: () => closeStatusModal(),
      onError: (err: unknown) => {
        statusModalError.value =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as Error)?.message ||
          'No se pudo cambiar el estado'
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

const getActions = (row: VentasPropertyListItem) => {
  const items: { label: string; icon: string; onClick: () => void }[] = [
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => goToEdit(row) },
    {
      label: 'Cambiar estado',
      icon: 'lucide:refresh-cw',
      onClick: () => openChangeStatusModal(row),
    },
    { label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => openDeleteModal(row) },
  ]
  return items
}

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
  { value: '', label: 'Todos los estados comerciales' },
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'RESERVED', label: 'Separada' },
  { value: 'SOLD', label: 'Vendida' },
]

const typeOptions = computed(() => {
  const base = [{ value: '', label: 'Todos los tipos de propiedad' }]
  const types = propertyTypes.value ?? []
  return [...base, ...types.map((t) => ({ value: t.id, label: t.name }))]
})

const departmentFilterOptions = computed(() =>
  (departments.value ?? []).map((d) => ({ value: d.id, label: d.name })),
)
const provinceFilterOptions = computed(() =>
  (filterProvinces.value ?? []).map((p) => ({ value: p.id, label: p.name })),
)
const districtFilterOptions = computed(() =>
  (filterDistricts.value ?? []).map((d) => ({ value: d.id, label: d.name })),
)

function listingStatusVariant(status: string | null): 'success' | 'info' | 'warning' | 'error' | 'neutral' {
  if (!status) return 'neutral'
  switch (status) {
    case 'AVAILABLE':
      return 'info'
    case 'RESERVED':
      return 'warning'
    case 'SOLD':
      return 'success'
    default:
      return 'neutral'
  }
}

function listingStatusLabel(status: string | null): string {
  if (!status) return '—'
  switch (status) {
    case 'AVAILABLE':
      return 'Disponible'
    case 'RESERVED':
      return 'Separada'
    case 'SOLD':
      return 'Vendida'
    default:
      return status
  }
}

function formatSalePrice(salePrice: number | null): string {
  if (salePrice == null) return '—'
  return `S/ ${Number(salePrice).toLocaleString('es-PE', { maximumFractionDigits: 0 })}`
}

const { isExporting, exportToExcel } = useExcelExport()

async function handleExport() {
  const result = await ventasPropertiesRepository.getList({
    page: 1,
    limit: 10000,
    search: searchInput.value.trim() || undefined,
    listingStatus: filterListingStatus.value || undefined,
    propertyTypeId: filterPropertyTypeId.value || undefined,
    districtId: filterDistrictId.value || undefined,
    minSalePrice: parsePriceFilter(filterMinPrice.value),
    maxSalePrice: parsePriceFilter(filterMaxPrice.value),
  })
  const now = new Date().toLocaleDateString('es-PE')
  await exportToExcel({
    fileName: `propiedades_ventas_${now}`,
    sheetName: 'Propiedades',
    columns: [
      { header: 'Código', key: 'code', width: 14 },
      { header: 'Proyecto', key: 'projectName', width: 22 },
      { header: 'Dirección', key: 'addressLine', width: 32 },
      { header: 'Distrito', key: 'districtName', width: 18 },
      { header: 'Tipo', key: 'propertyTypeName', width: 16 },
      { header: 'Área (m²)', key: 'area', width: 12 },
      { header: 'Propietario', key: 'ownerFullName', width: 26 },
      { header: 'Estado', key: 'listingStatus', width: 14 },
      { header: 'Precio venta', key: 'salePrice', width: 16 },
    ],
    rows: result.data.map((p: VentasPropertyListItem) => ({
      code: p.code,
      projectName: p.projectName ?? '—',
      addressLine: p.addressLine,
      districtName: p.districtName,
      propertyTypeName: p.propertyTypeName,
      area: p.area ?? '—',
      ownerFullName: p.ownerFullName,
      listingStatus: listingStatusLabel(p.listingStatus),
      salePrice: p.salePrice ?? '—',
    })),
  })
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Propiedades en venta
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Inventario inmobiliario — aplicación Ventas
        </p>
      </div>
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
        <BaseButton variant="primary" class="flex items-center gap-2 flex-1 sm:flex-none justify-center" @click="goToNew">
          <AppIcon icon="lucide:plus" :size="18" />
          Nueva propiedad
        </BaseButton>
      </div>
    </div>

    <div v-if="loadingStats" class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 h-20" />
    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatsCard :title="'Total'" :value="stats?.total ?? 0">
        <template #icon><AppIcon icon="lucide:building-2" :size="20" color="var(--color-primary)" /></template>
      </StatsCard>
      <StatsCard :title="'Disponibles'" :value="stats?.available ?? 0">
        <template #icon><AppIcon icon="lucide:door-open" :size="20" color="#2563eb" /></template>
      </StatsCard>
      <StatsCard :title="'Separadas'" :value="stats?.reserved ?? 0">
        <template #icon><AppIcon icon="lucide:bookmark" :size="20" color="#ca8a04" /></template>
      </StatsCard>
      <StatsCard :title="'Vendidas'" :value="stats?.sold ?? 0">
        <template #icon><AppIcon icon="lucide:circle-check" :size="20" color="#16a34a" /></template>
      </StatsCard>
    </div>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }"
    >
      <div class="overflow-x-auto">
        <div v-if="loadingList" class="flex justify-center py-16 px-4">
          <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
        </div>
        <template v-else>
          <DataTable
            v-model:row-selection="tableRowSelection"
            selectable
            empty-text="No hay propiedades en esta página."
            :columns="tableColumns"
            :data="properties"
            row-key="id"
          >
            <template #toolbar>
              <div class="w-full min-w-0 space-y-5">
                <div>
                  <p
                    class="text-xs font-semibold uppercase tracking-wider mb-2"
                    :style="{ color: 'var(--color-text-secondary)' }"
                  >
                    Búsqueda
                  </p>
                  <SearchInput
                    v-model="searchInput"
                    placeholder="Código, dirección, proyecto o propietario…"
                  />
                </div>

                <div>
                  <p
                    class="text-xs font-semibold uppercase tracking-wider mb-2"
                    :style="{ color: 'var(--color-text-secondary)' }"
                  >
                    Filtros del listado
                  </p>
                  <div
                    class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-3"
                  >
                    <FormSelect
                      v-model="filterListingStatus"
                      label="Estado comercial"
                      :options="statusOptions"
                      placeholder="Seleccionar"
                    />
                    <FormSelect
                      v-model="filterPropertyTypeId"
                      label="Tipo de propiedad"
                      :options="typeOptions"
                      placeholder="Seleccionar"
                    />
                    <FormInput
                      v-model="filterMinPrice"
                      type="text"
                      inputmode="numeric"
                      label="Precio mín. (S/)"
                      placeholder="Sin límite"
                    />
                    <FormInput
                      v-model="filterMaxPrice"
                      type="text"
                      inputmode="numeric"
                      label="Precio máx. (S/)"
                      placeholder="Sin límite"
                    />
                  </div>
                </div>

                <div
                  class="pt-4 border-t"
                  :style="{ borderColor: 'var(--color-border)' }"
                >
                  <p
                    class="text-xs font-semibold uppercase tracking-wider mb-2"
                    :style="{ color: 'var(--color-text-secondary)' }"
                  >
                    Ubicación
                  </p>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                    <FormSelect
                      v-model="filterDepartmentId"
                      label="Departamento"
                      :options="departmentFilterOptions"
                      placeholder="Seleccionar"
                      :loading="loadingFilterDepartments"
                    />
                    <FormSelect
                      v-model="filterProvinceId"
                      label="Provincia"
                      :options="provinceFilterOptions"
                      placeholder="Seleccionar"
                      :loading="loadingFilterProvinces"
                      :disabled="!filterDepartmentId"
                    />
                    <FormSelect
                      v-model="filterDistrictId"
                      label="Distrito"
                      :options="districtFilterOptions"
                      placeholder="Seleccionar"
                      :loading="loadingFilterDistricts"
                      :disabled="!filterProvinceId"
                    />
                  </div>
                </div>
              </div>
            </template>
            <template #row="{ row }">
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <AppIcon icon="lucide:building-2" :size="20" color="var(--color-text-muted)" class="shrink-0" />
                  <div>
                    <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
                      {{ (row as VentasPropertyListItem).code }}
                    </p>
                    <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
                      {{ (row as VentasPropertyListItem).addressLine }}, {{ (row as VentasPropertyListItem).districtName }}
                    </p>
                    <p
                      v-if="(row as VentasPropertyListItem).area != null"
                      class="text-xs mt-0.5"
                      :style="{ color: 'var(--color-text-secondary)' }"
                    >
                      {{ (row as VentasPropertyListItem).area }} m²
                    </p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-primary)' }">
                {{ (row as VentasPropertyListItem).projectName || '—' }}
              </td>
              <td class="py-3 px-4">
                <span class="inline-flex items-center gap-1.5 text-sm" :style="{ color: 'var(--color-text-primary)' }">
                  <AppIcon icon="lucide:user" :size="16" color="var(--color-text-muted)" class="shrink-0" />
                  {{ (row as VentasPropertyListItem).ownerFullName }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
                {{ (row as VentasPropertyListItem).propertyTypeName }}
              </td>
              <td class="py-3 px-4">
                <Badge :variant="listingStatusVariant((row as VentasPropertyListItem).listingStatus)">
                  {{ listingStatusLabel((row as VentasPropertyListItem).listingStatus) }}
                </Badge>
              </td>
              <td class="py-3 px-4 text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">
                {{ formatSalePrice((row as VentasPropertyListItem).salePrice) }}
              </td>
              <td class="py-3 px-4 text-right">
                <ActionsDropdown :items="getActions(row as VentasPropertyListItem)" />
              </td>
            </template>
          </DataTable>
          <div class="border-t" :style="{ borderColor: 'var(--color-border)' }">
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

    <BaseModal v-model="showStatusModal" title="Estado comercial" size="sm">
      <template v-if="propertyForStatus">
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          {{ propertyForStatus.code }} – {{ propertyForStatus.addressLine }}
        </p>
        <p
          v-if="statusModalError"
          class="text-sm mb-3 px-3 py-2 rounded-lg"
          :style="{ color: 'var(--color-error)', backgroundColor: 'var(--color-error-light)' }"
        >
          {{ statusModalError }}
        </p>
        <FormSelect
          v-model="newListingStatus"
          label="Nuevo estado"
          :options="listingStatusChangeOptions"
          placeholder="Seleccionar"
        />
        <div class="flex justify-end gap-3 mt-6">
          <BaseButton variant="outline" @click="closeStatusModal">Cancelar</BaseButton>
          <BaseButton
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
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center"
            style="background: var(--color-error-subtle)"
          >
            <AppIcon icon="lucide:trash-2" :size="16" style="color: var(--color-error)" />
          </div>
          <span class="text-base font-semibold" style="color: var(--color-text-primary)">Eliminar propiedad</span>
        </div>
      </template>
      <div class="p-4 space-y-3">
        <p class="text-sm" style="color: var(--color-text-secondary)">
          ¿Eliminar la propiedad
          <span class="font-semibold" style="color: var(--color-text-primary)">{{ propertyToDelete?.code }}</span>?
        </p>
      </div>
      <div class="flex justify-end gap-3 p-4 border-t" style="border-color: var(--color-border)">
        <BaseButton variant="ghost" @click="closeDeleteModal">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="isDeletingProperty" @click="executeDeleteProperty">
          <AppIcon icon="lucide:trash-2" :size="16" class="mr-1" />
          Eliminar
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
