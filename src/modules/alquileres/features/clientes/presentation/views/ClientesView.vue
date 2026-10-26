<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin, filterActions } = useApplicationAccess('alquileres')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { clientsRepositoryKey } from '../../application/ports/clients.port'
import { useService } from '@shared/presentation/di/services'
import { toCalendarDateString } from '@shared/utils/formatters'
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { RowSelectionState } from '@tanstack/vue-table'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import Avatar from '@shared/presentation/components/ui/Avatar.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ExcelIcon from '@shared/presentation/components/ui/ExcelIcon.vue'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { useClientsList, useClientStats, useDeleteClient } from '../composables/useClients'
import type { ClientListItem, ListClientsParams } from '../../domain/client.types'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { fetchAllPages } from '@shared/utils/fetchAllPages'
const clientsRepository = useService(clientsRepositoryKey)

const router = useRouter()
const route = useRoute()
const ITEMS_PER_PAGE = 10

const tableRowSelection = ref<RowSelectionState>({})

const listParams = ref<ListClientsParams>({
  applicationSlug: 'alquileres',
  page: 1,
  limit: ITEMS_PER_PAGE,
})
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const filterType = ref<'ALL' | 'OWNER' | 'TENANT'>('ALL')
const filterStatus = ref<'ALL' | 'active' | 'inactive'>('ALL')

const {
  data: listResult,
  isFetching: fetchingList,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useClientsList(listParams)
const {
  data: stats,
  isLoading: loadingStats,
  isError: statsQueryError,
  error: statsFetchError,
  refetch: refetchStats,
} = useClientStats('alquileres')

const clients = computed(() => listResult.value?.data ?? [])
const totalFromApi = computed(() => listResult.value?.total ?? 0)

// `?tipo=OWNER|TENANT` preselecciona el filtro (ej. redirección desde /clientes/propietarios)
watch(
  () => route.query.tipo,
  (tipo) => {
    filterType.value = tipo === 'OWNER' || tipo === 'TENANT' ? tipo : 'ALL'
  },
  { immediate: true },
)

watch(
  [debouncedSearch, filterType, filterStatus],
  () => {
    listParams.value = {
      ...listParams.value,
      page: 1,
      search: debouncedSearch.value.trim() || undefined,
      clientType: filterType.value === 'ALL' ? undefined : filterType.value,
      isActive: filterStatus.value === 'ALL' ? undefined : filterStatus.value === 'active',
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
    key: 'cliente',
    label: 'Cliente',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as ClientListItem).fullName,
  },
  {
    key: 'contacto',
    label: 'Contacto',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => {
      const c = r as ClientListItem
      return `${c.primaryPhone} ${c.primaryEmail ?? ''}`
    },
  },
  {
    key: 'tipo',
    label: 'Tipo',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as ClientListItem).clientType,
  },
  {
    key: 'propiedades',
    label: 'Propiedades',
    align: 'left' as const,
    sortable: true,
    sortType: 'basic' as const,
    sortAccessor: (r: unknown) => (r as ClientListItem).propertiesCount ?? 0,
  },
  {
    key: 'contratos',
    label: 'Alquileres',
    align: 'left' as const,
    sortable: true,
    sortType: 'basic' as const,
    sortAccessor: (r: unknown) => (r as ClientListItem).contractsCount ?? 0,
  },
  {
    key: 'estado',
    label: 'Estado',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => ((r as ClientListItem).isActive ? 1 : 0),
  },
  { key: 'actions', label: '', align: 'right' as const },
]


const goToNew = () => router.push('/alquileres/clientes/nuevo')
const goToEdit = (client: ClientListItem) => router.push(`/alquileres/clientes/${client.id}/editar`)

// Confirm modal
const showConfirmModal = ref(false)
const confirmClient = ref<ClientListItem | null>(null)
const { mutate: deleteClient, isPending: isDeletingClient } = useDeleteClient()

const openDeleteConfirm = (client: ClientListItem) => {
  confirmClient.value = client
  showConfirmModal.value = true
}

const closeConfirm = () => {
  showConfirmModal.value = false
  confirmClient.value = null
}

const executeDelete = () => {
  if (!confirmClient.value) return
  deleteClient(confirmClient.value.id, { onSuccess: closeConfirm })
}

const getActions = (
  client: ClientListItem,
): { label: string; icon: string; onClick: () => void }[] => [
  { label: 'Editar', icon: 'lucide:pencil', onClick: () => goToEdit(client) },
  { label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => openDeleteConfirm(client) },
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

const typeOptions = [
  { value: 'ALL', label: 'Todos los tipos' },
  { value: 'OWNER', label: 'Propietario' },
  { value: 'TENANT', label: 'Inquilino' },
]
const statusOptions = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

const { isExporting, exportToExcel } = useExcelExport()

async function handleExport() {
  // Todas las páginas: el backend topa cada página en 50 filas
  const rows = await fetchAllPages((page, limit) =>
    clientsRepository.getList({
      applicationSlug: 'alquileres',
      page,
      limit,
      search: searchInput.value.trim() || undefined,
      clientType: filterType.value === 'ALL' ? undefined : filterType.value,
      isActive: filterStatus.value === 'ALL' ? undefined : filterStatus.value === 'active',
    }),
  )
  const now = toCalendarDateString()
  await exportToExcel({
    fileName: `clientes_${now}`,
    sheetName: 'Clientes',

    columns: [
      { header: 'Nombre completo', key: 'fullName', width: 28 },
      { header: 'Tipo doc.', key: 'documentTypeCode', width: 12 },
      { header: 'N° documento', key: 'documentNumber', width: 16 },
      { header: 'Tipo cliente', key: 'clientType', width: 14 },
      { header: 'Teléfono', key: 'primaryPhone', width: 16 },
      { header: 'Email', key: 'primaryEmail', width: 28 },
      { header: 'Propiedades', key: 'propertiesCount', width: 14 },
      { header: 'Alquileres', key: 'contractsCount', width: 14 },
      { header: 'Estado', key: 'isActive', width: 10 },
    ],
    rows: rows.map((c: ClientListItem) => ({
      fullName: c.fullName,
      documentTypeCode: c.documentTypeCode,
      documentNumber: c.documentNumber,
      clientType: c.clientType === 'OWNER' ? 'Propietario' : 'Inquilino',
      primaryPhone: c.primaryPhone,
      primaryEmail: c.primaryEmail,
      propertiesCount: c.propertiesCount ?? 0,
      contractsCount: c.contractsCount ?? 0,
      isActive: c.isActive ? 'Activo' : 'Inactivo',
    })),
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <PageHeader
      title="Clientes"
      subtitle="Gestión de propietarios e inquilinos"
    >
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
        <BaseButton v-if="canWrite" variant="primary" class="flex items-center gap-2 flex-1 sm:flex-none justify-center" @click="goToNew">
          <AppIcon icon="lucide:plus" :size="18" />
          Nuevo Cliente
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
    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      <StatsCard compact :title="'Total Clientes'" :value="String(stats?.total ?? 0)" :loading="loadingStats">
        <template #icon><AppIcon icon="lucide:users" :size="20" color="var(--color-primary)" /></template>
      </StatsCard>
      <StatsCard compact :title="'Propietarios'" :value="String(stats?.owners ?? 0)" :loading="loadingStats">
        <template #icon><AppIcon icon="lucide:building-2" :size="20" color="#2563eb" /></template>
      </StatsCard>
      <StatsCard compact :title="'Inquilinos'" :value="String(stats?.tenants ?? 0)" :loading="loadingStats">
        <template #icon><AppIcon icon="lucide:user" :size="20" color="#16a34a" /></template>
      </StatsCard>
      <StatsCard compact :title="'Activos'" :value="String(stats?.active ?? 0)" :loading="loadingStats">
        <template #icon><AppIcon icon="lucide:trending-up" :size="20" color="#d97706" /></template>
      </StatsCard>
    </div>

    <!-- Table -->
    <BaseCard padding="none" class="block overflow-hidden">
      <div class="overflow-x-auto">
        <div
          v-if="listQueryError"
          class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center"
        >
          <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(listFetchError) }}</p>
          <BaseButton variant="outline" size="sm" @click="() => refetchList()">Reintentar</BaseButton>
        </div>
        <template v-else>
        <DataTable
          v-model:row-selection="tableRowSelection"
          selectable
          empty-text="No hay clientes en esta página."
          :columns="tableColumns"
          :data="clients"
          row-key="id"
          :loading="fetchingList"
        >
          <template #toolbar>
            <div class="flex-1 min-w-0">
              <SearchInput v-model="searchInput" placeholder="Buscar por nombre, documento o email..." />
            </div>
            <div class="flex flex-wrap gap-3 shrink-0 sm:flex-nowrap">
              <div class="w-full sm:w-[175px] min-w-0">
                <FormSelect
                  v-model="filterType"
                  :options="typeOptions"
                  placeholder="Todos los tipos"
                />
              </div>
              <div class="w-full sm:w-[175px] min-w-0">
                <FormSelect v-model="filterStatus" :options="statusOptions" placeholder="Todos los estados" />
              </div>
            </div>
          </template>
          <template #row="{ row }">
            <td class="py-3 px-4">
              <div class="flex items-center gap-3">
                <Avatar :name="(row as ClientListItem).fullName" size="md" />
                <div>
                  <p class="font-medium text-gray-800 dark:text-white/90">
                    {{ (row as ClientListItem).fullName }}
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500">
                    {{ (row as ClientListItem).documentTypeCode }}: {{ (row as ClientListItem).documentNumber }}
                  </p>
                </div>
              </div>
            </td>
            <td class="py-3 px-4">
              <div class="flex flex-col gap-0.5 text-sm">
                <span class="flex items-center gap-1.5 text-gray-800 dark:text-white/90">
                  <AppIcon icon="lucide:phone" :size="16" color="var(--color-text-muted)" />
                  {{ (row as ClientListItem).primaryPhone }}
                </span>
                <span class="flex items-center gap-1.5 text-gray-800 dark:text-white/90">
                  <AppIcon icon="lucide:mail" :size="16" color="var(--color-text-muted)" />
                  {{ (row as ClientListItem).primaryEmail || '—' }}
                </span>
              </div>
            </td>
            <td class="py-3 px-4">
              <Badge
                :variant="(row as ClientListItem).clientType === 'OWNER' ? 'info' : 'success'"
              >
                {{ (row as ClientListItem).clientType === 'OWNER' ? 'Propietario' : 'Inquilino' }}
              </Badge>
            </td>
              <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
              <span class="inline-flex items-center gap-1">
                <AppIcon icon="lucide:building-2" :size="16" />
                {{
                  (row as ClientListItem).clientType === 'OWNER'
                    ? (row as ClientListItem).propertiesCount ?? 0
                    : '—'
                }}
              </span>
            </td>
            <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
              <span class="inline-flex items-center gap-1">
                <AppIcon icon="lucide:file-text" :size="16" />
                {{
                  (row as ClientListItem).contractsCount > 0
                    ? `${(row as ClientListItem).contractsCount} contrato(s)`
                    : 'Sin contratos'
                }}
              </span>
            </td>
            <td class="py-3 px-4">
              <Badge :variant="(row as ClientListItem).isActive ? 'success' : 'error'">
                {{ (row as ClientListItem).isActive ? 'Activo' : 'Inactivo' }}
              </Badge>
            </td>
            <td class="py-3 px-4 text-right">
              <ActionsDropdown :items="filterActions(getActions(row as ClientListItem))" />
            </td>
          </template>
        </DataTable>
        <div v-if="!listQueryError" class="border-t border-gray-200 dark:border-gray-800">
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
  </div>

  <!-- Confirm Delete Modal -->
  <BaseModal v-model="showConfirmModal" :closable="true" size="sm" @close="closeConfirm">
    <template #title>
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center bg-error-50 dark:bg-error-500/15">
          <AppIcon class="text-error-500 dark:text-error-400" icon="lucide:trash-2" :size="16" />
        </div>
        <span class="text-base font-semibold text-gray-800 dark:text-white/90">Eliminar cliente</span>
      </div>
    </template>
    <div class="p-4 space-y-3">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        ¿Estás seguro de que deseas eliminar al cliente
        <span class="font-semibold text-gray-800 dark:text-white/90">{{ confirmClient?.fullName }}</span>?
      </p>
      <p class="text-xs px-3 py-2 rounded-lg bg-warning-50 dark:bg-warning-500/15 text-warning-600 dark:text-orange-400">
        Esta acción desactivará al cliente. Los registros relacionados (propiedades, contratos) se conservarán.
      </p>
    </div>
    <div class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
      <BaseButton variant="ghost" @click="closeConfirm">Cancelar</BaseButton>
      <BaseButton v-if="canAdmin" variant="danger" :loading="isDeletingClient" @click="executeDelete">
        <AppIcon icon="lucide:trash-2" :size="16" class="mr-1" />
        Eliminar
      </BaseButton>
    </div>
  </BaseModal>
</template>
