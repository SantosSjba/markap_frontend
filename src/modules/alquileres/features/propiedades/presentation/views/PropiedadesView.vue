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
  SearchInput,
  BaseModal,
  AppIcon,
  ExcelIcon,
} from '@shared/components'
import { useExcelExport } from '@shared/composables'
import {
  usePropertiesList,
  usePropertyStats,
  usePropertyTypes,
  useUpdatePropertyListingStatus,
  useDeleteProperty,
} from '../../application/useProperties'
import type { PropertyListItem, ListPropertiesParams } from '../../domain/property.types'
import { propertiesRepository } from '@modules/alquileres/features/propiedades'
import { useDebouncedRef } from '@/shared/composables/useDebouncedRef'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { formatShortDate, toCalendarDateString } from '@/shared/utils/formatters'

const router = useRouter()
const ITEMS_PER_PAGE = 10

const tableRowSelection = ref<RowSelectionState>({})

const listParams = ref<ListPropertiesParams>({
  applicationSlug: 'alquileres',
  page: 1,
  limit: ITEMS_PER_PAGE,
})
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const filterListingStatus = ref<string>('')
const filterPropertyTypeId = ref<string>('')

const {
  data: listResult,
  isFetching: fetchingList,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = usePropertiesList(listParams)
const {
  data: stats,
  isLoading: loadingStats,
  isError: statsQueryError,
  error: statsFetchError,
  refetch: refetchStats,
} = usePropertyStats('alquileres')
const {
  data: propertyTypes,
  isError: propertyTypesQueryError,
  error: propertyTypesFetchError,
  refetch: refetchPropertyTypes,
} = usePropertyTypes()

const properties = computed(() => listResult.value?.data ?? [])
const totalFromApi = computed(() => listResult.value?.total ?? 0)

watch(
  [debouncedSearch, filterListingStatus, filterPropertyTypeId],
  () => {
    listParams.value = {
      ...listParams.value,
      page: 1,
      search: debouncedSearch.value.trim() || undefined,
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
  {
    key: 'propiedad',
    label: 'Propiedad',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => {
      const p = r as PropertyListItem
      return `${p.code} ${p.addressLine} ${p.districtName}`
    },
  },
  {
    key: 'propietario',
    label: 'Propietario',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as PropertyListItem).ownerFullName,
  },
  {
    key: 'inquilino',
    label: 'Inquilino',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as PropertyListItem).activeRentalTenantName ?? '',
  },
  {
    key: 'estado',
    label: 'Estado',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as PropertyListItem).listingStatus ?? '',
  },
  {
    key: 'vencimiento',
    label: 'Vencimiento',
    align: 'left' as const,
    sortable: true,
    sortType: 'basic' as const,
    sortAccessor: (r: unknown) => {
      const d = (r as PropertyListItem).activeRentalEndDate
      return d ? new Date(d).getTime() : 0
    },
  },
  {
    key: 'alquiler',
    label: 'Alquiler',
    align: 'left' as const,
    sortable: true,
    sortType: 'basic' as const,
    sortAccessor: (r: unknown) => (r as PropertyListItem).monthlyRent ?? -1,
  },
  { key: 'actions', label: '', align: 'right' as const },
]

const goToNew = () => router.push('/alquileres/propiedades/nueva')
const goToEdit = (row: PropertyListItem) =>
  router.push(`/alquileres/propiedades/${row.id}/editar`)

const showStatusModal = ref(false)
const propertyForStatus = ref<PropertyListItem | null>(null)
const newListingStatus = ref<'RENTED' | 'EXPIRING' | 'MAINTENANCE'>('RENTED')
const statusModalError = ref('')
const updateListingStatusMutation = useUpdatePropertyListingStatus()

const openChangeStatusModal = (row: PropertyListItem) => {
  propertyForStatus.value = row
  newListingStatus.value = (row.listingStatus === 'RENTED' || row.listingStatus === 'EXPIRING' || row.listingStatus === 'MAINTENANCE')
    ? row.listingStatus
    : 'RENTED'
  statusModalError.value = ''
  showStatusModal.value = true
}

const closeStatusModal = () => {
  showStatusModal.value = false
  propertyForStatus.value = null
  statusModalError.value = ''
}

const listingStatusChangeOptions = [
  { value: 'RENTED' as const, label: 'Alquilada' },
  { value: 'EXPIRING' as const, label: 'Por Vencer' },
  { value: 'MAINTENANCE' as const, label: 'En Mantenimiento' },
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
    }
  )
}

// Confirm delete modal
const showDeleteModal = ref(false)
const propertyToDelete = ref<PropertyListItem | null>(null)
const { mutate: deleteProperty, isPending: isDeletingProperty } = useDeleteProperty()

const openDeleteModal = (row: PropertyListItem) => {
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

const getActions = (row: PropertyListItem) => {
  const items: { label: string; icon: string; onClick: () => void }[] = [
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => goToEdit(row) },
  ]
  if (row.hasActiveRental) {
    items.push({
      label: 'Cambiar estado',
      icon: 'lucide:refresh-cw',
      onClick: () => openChangeStatusModal(row),
    })
  }
  items.push({ label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => openDeleteModal(row) })
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

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return formatShortDate(d)
  } catch {
    return d
  }
}

const { isExporting, exportToExcel } = useExcelExport()

async function handleExport() {
  const result = await propertiesRepository.getList({
    applicationSlug: 'alquileres',
    page: 1,
    limit: 10000,
    search: searchInput.value.trim() || undefined,
    listingStatus: filterListingStatus.value || undefined,
    propertyTypeId: filterPropertyTypeId.value || undefined,
  })
  const now = toCalendarDateString()
  await exportToExcel({
    fileName: `propiedades_${now}`,
    sheetName: 'Propiedades',
    columns: [
      { header: 'Código', key: 'code', width: 14 },
      { header: 'Dirección', key: 'addressLine', width: 32 },
      { header: 'Distrito', key: 'districtName', width: 18 },
      { header: 'Tipo', key: 'propertyTypeName', width: 16 },
      { header: 'Área (m²)', key: 'area', width: 12 },
      { header: 'Propietario', key: 'ownerFullName', width: 26 },
      { header: 'Inquilino activo', key: 'activeRentalTenantName', width: 26 },
      { header: 'Estado', key: 'listingStatus', width: 18 },
      { header: 'Vencimiento contrato', key: 'activeRentalEndDate', width: 20 },
      { header: 'Alquiler mensual', key: 'monthlyRent', width: 18 },
    ],
    rows: result.data.map((p: PropertyListItem) => ({
      code: p.code,
      addressLine: p.addressLine,
      districtName: p.districtName,
      propertyTypeName: p.propertyTypeName,
      area: p.area ?? '—',
      ownerFullName: p.ownerFullName,
      activeRentalTenantName: p.activeRentalTenantName ?? 'Sin inquilino',
      listingStatus: listingStatusLabel(p.listingStatus),
      activeRentalEndDate: p.hasActiveRental && p.activeRentalEndDate ? formatDate(p.activeRentalEndDate) : '—',
      monthlyRent: p.monthlyRent ?? '—',
    })),
  })
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
          Nueva Propiedad
        </BaseButton>
      </div>
    </div>

    <!-- Stats -->
    <div
      v-if="loadingStats"
      class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 h-20"
    />
    <div
      v-else-if="statsQueryError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-warning-light)' }"
    >
      <span class="max-w-xl" style="color: var(--color-error)">{{ getApiErrorMessage(statsFetchError) }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => refetchStats()">Reintentar</BaseButton>
    </div>
    <div
      v-else
      class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      <StatsCard :title="'Total'" :value="String(stats?.total ?? 0)">
        <template #icon><AppIcon icon="lucide:building-2" :size="20" color="var(--color-primary)" /></template>
      </StatsCard>
      <StatsCard :title="'Alquiladas'" :value="String(stats?.rented ?? 0)">
        <template #icon><AppIcon icon="lucide:circle-check" :size="20" color="#16a34a" /></template>
      </StatsCard>
      <StatsCard :title="'Disponibles'" :value="String(stats?.available ?? 0)">
        <template #icon><AppIcon icon="lucide:door-open" :size="20" color="#2563eb" /></template>
      </StatsCard>
      <StatsCard :title="'Por Vencer'" :value="String(stats?.expiring ?? 0)">
        <template #icon><AppIcon icon="lucide:triangle-alert" :size="20" color="#dc2626" /></template>
      </StatsCard>
    </div>

    <div
      v-if="propertyTypesQueryError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-warning-light)' }"
    >
      <span :style="{ color: 'var(--color-text-primary)' }">No se cargaron los tipos de propiedad para el filtro.</span>
      <span class="text-xs max-w-md" style="color: var(--color-error)">{{ getApiErrorMessage(propertyTypesFetchError) }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => refetchPropertyTypes()">Reintentar</BaseButton>
    </div>

    <!-- Table -->
    <div
      class="rounded-xl border overflow-hidden"
      :style="{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }"
    >
      <div class="overflow-x-auto">
        <div
          v-if="listQueryError"
          class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center"
        >
          <p class="text-sm font-medium" style="color: var(--color-error)">{{ getApiErrorMessage(listFetchError) }}</p>
          <BaseButton variant="outline" size="sm" @click="() => refetchList()">Reintentar</BaseButton>
        </div>
        <template v-else>
          <DataTable
            v-model:row-selection="tableRowSelection"
            selectable
            empty-text="No hay propiedades en esta página."
            :columns="tableColumns"
            :data="properties"
            row-key="id"
            :loading="fetchingList"
          >
            <template #toolbar>
              <div class="flex-1 min-w-0">
                <SearchInput v-model="searchInput" placeholder="Buscar por dirección, código, propietario o inquilino..." />
              </div>
              <div class="flex flex-wrap gap-3 shrink-0 sm:flex-nowrap">
                <div class="w-full sm:w-[175px] min-w-0">
                  <FormSelect v-model="filterListingStatus" :options="statusOptions" placeholder="Todos los estados" />
                </div>
                <div class="w-full sm:w-[175px] min-w-0">
                  <FormSelect v-model="filterPropertyTypeId" :options="typeOptions" placeholder="Todos los tipos" />
                </div>
              </div>
            </template>
            <template #row="{ row }">
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <AppIcon icon="lucide:building-2" :size="20" color="var(--color-text-muted)" class="shrink-0" />
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
                  <AppIcon icon="lucide:user" :size="16" color="var(--color-text-muted)" class="shrink-0" />
                  {{ (row as PropertyListItem).ownerFullName }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm" :style="{ color: (row as PropertyListItem).activeRentalTenantName ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }">
                {{ (row as PropertyListItem).activeRentalTenantName || 'Sin inquilino' }}
              </td>
              <td class="py-3 px-4">
                <Badge :variant="listingStatusVariant((row as PropertyListItem).listingStatus)">
                  {{ listingStatusLabel((row as PropertyListItem).listingStatus) }}
                </Badge>
              </td>
              <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
                {{ (row as PropertyListItem).hasActiveRental && (row as PropertyListItem).activeRentalEndDate
                  ? formatDate((row as PropertyListItem).activeRentalEndDate)
                  : '—' }}
              </td>
              <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-primary)' }">
                {{ formatRent((row as PropertyListItem).monthlyRent) }}
              </td>
              <td class="py-3 px-4 text-right">
                <ActionsDropdown :items="getActions(row as PropertyListItem)" />
              </td>
            </template>
          </DataTable>
          <div v-if="!listQueryError" class="border-t" :style="{ borderColor: 'var(--color-border)' }">
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

    <!-- Modal Cambiar estado (solo si tiene alquiler en vigencia) -->
    <BaseModal
      v-model="showStatusModal"
      title="Cambiar estado de la propiedad"
      size="sm"
    >
      <template v-if="propertyForStatus">
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          {{ propertyForStatus.code }} – {{ propertyForStatus.addressLine }}
        </p>
        <p v-if="statusModalError" class="text-sm mb-3 px-3 py-2 rounded-lg" :style="{ color: 'var(--color-error)', backgroundColor: 'var(--color-error-light)' }">
          {{ statusModalError }}
        </p>
        <FormSelect
          v-model="newListingStatus"
          label="Nuevo estado"
          :options="listingStatusChangeOptions"
          placeholder="Seleccionar"
        />
        <div class="flex justify-end gap-3 mt-6">
          <BaseButton variant="outline" @click="closeStatusModal">
            Cancelar
          </BaseButton>
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

  <!-- Confirm Delete Property Modal -->
  <BaseModal v-model="showDeleteModal" :closable="true" size="sm" @close="closeDeleteModal">
    <template #title>
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--color-error-subtle);">
          <AppIcon icon="lucide:trash-2" :size="16" style="color: var(--color-error);" />
        </div>
        <span class="text-base font-semibold" style="color: var(--color-text-primary);">Eliminar propiedad</span>
      </div>
    </template>
    <div class="p-4 space-y-3">
      <p class="text-sm" style="color: var(--color-text-secondary);">
        ¿Estás seguro de que deseas eliminar la propiedad
        <span class="font-semibold" style="color: var(--color-text-primary);">{{ propertyToDelete?.addressLine }}</span>?
      </p>
      <p class="text-xs px-3 py-2 rounded-lg" style="background: var(--color-warning-subtle); color: var(--color-warning);">
        Esta acción desactivará la propiedad. Si tiene contratos activos, considera cancelarlos primero.
      </p>
    </div>
    <div class="flex justify-end gap-3 p-4 border-t" style="border-color: var(--color-border);">
      <BaseButton variant="ghost" @click="closeDeleteModal">Cancelar</BaseButton>
      <BaseButton variant="danger" :loading="isDeletingProperty" @click="executeDeleteProperty">
        <AppIcon icon="lucide:trash-2" :size="16" class="mr-1" />
        Eliminar
      </BaseButton>
    </div>
  </BaseModal>
  </div>
</template>
