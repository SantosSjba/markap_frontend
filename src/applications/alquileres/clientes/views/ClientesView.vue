<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { RowSelectionState } from '@tanstack/vue-table'
import {
  BaseButton,
  BasePagination,
  StatsCard,
  Badge,
  Avatar,
  DataTable,
  ActionsDropdown,
  FormSelect,
  SearchInput,
  AppIcon,
  ExcelIcon,
} from '@shared/components'
import { useExcelExport } from '@shared/composables'
import { useClientsList, useClientStats, useDeleteClient } from '../composables/useClients'
import type { ClientListItem, ListClientsParams } from '../services/clients.service'
import { clientsService } from '../services/clients.service'
import { BaseModal } from '@shared/components'

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
const filterType = ref<'ALL' | 'OWNER' | 'TENANT'>('ALL')
const filterStatus = ref<'ALL' | 'active' | 'inactive'>('ALL')

const { data: listResult, isLoading: loadingList } = useClientsList(listParams)
const { data: stats, isLoading: loadingStats } = useClientStats('alquileres')

const clients = computed(() => listResult.value?.data ?? [])
const totalFromApi = computed(() => listResult.value?.total ?? 0)

watch(
  () => route.name,
  (name) => {
    if (name === 'alquileres-clientes-propietarios') {
      filterType.value = 'OWNER'
    } else if (name === 'alquileres-clientes') {
      filterType.value = 'ALL'
    }
  },
  { immediate: true },
)

watch(
  [searchInput, filterType, filterStatus],
  () => {
    listParams.value = {
      ...listParams.value,
      page: 1,
      search: searchInput.value.trim() || undefined,
      clientType: filterType.value === 'ALL' ? undefined : filterType.value,
      isActive:
        filterStatus.value === 'ALL'
          ? undefined
          : filterStatus.value === 'active',
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
      return `${c.primaryPhone} ${c.primaryEmail}`
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

const pageTitle = computed(() =>
  route.name === 'alquileres-clientes-propietarios' ? 'Propietarios' : 'Clientes',
)
const pageSubtitle = computed(() =>
  route.name === 'alquileres-clientes-propietarios'
    ? 'Titulares con inmuebles en Alquileres (inventario y contratos de esta app)'
    : 'Gestión de propietarios e inquilinos',
)

const goToNew = () => router.push('/alquileres/clientes/nuevo')
const goToEdit = (client: ClientListItem) =>
  router.push(`/alquileres/clientes/${client.id}/editar`)

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

const getActions = (client: ClientListItem): { label: string; icon: string; onClick: () => void }[] => [
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
  // Traer todos los clientes sin paginación
  const result = await clientsService.getList({
    applicationSlug: 'alquileres',
    page: 1,
    limit: 10000,
    search: searchInput.value.trim() || undefined,
    clientType: filterType.value === 'ALL' ? undefined : filterType.value,
    isActive: filterStatus.value === 'ALL' ? undefined : filterStatus.value === 'active',
  })
  const now = new Date().toLocaleDateString('es-PE')
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
    rows: result.data.map((c: ClientListItem) => ({
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
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1
          class="text-xl sm:text-2xl font-bold"
          :style="{ color: 'var(--color-text-primary)' }"
        >
          {{ pageTitle }}
        </h1>
        <p
          class="text-sm mt-1"
          :style="{ color: 'var(--color-text-secondary)' }"
        >
          {{ pageSubtitle }}
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
          Nuevo Cliente
        </BaseButton>
      </div>
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
      <StatsCard :title="'Total Clientes'" :value="stats?.total ?? 0">
        <template #icon><AppIcon icon="lucide:users" :size="20" color="var(--color-primary)" /></template>
      </StatsCard>
      <StatsCard :title="'Propietarios'" :value="stats?.owners ?? 0">
        <template #icon><AppIcon icon="lucide:building-2" :size="20" color="#2563eb" /></template>
      </StatsCard>
      <StatsCard :title="'Inquilinos'" :value="stats?.tenants ?? 0">
        <template #icon><AppIcon icon="lucide:user" :size="20" color="#16a34a" /></template>
      </StatsCard>
      <StatsCard :title="'Activos'" :value="stats?.active ?? 0">
        <template #icon><AppIcon icon="lucide:trending-up" :size="20" color="#d97706" /></template>
      </StatsCard>
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
        <div v-if="loadingList" class="flex justify-center py-16 px-4">
          <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
        </div>
        <template v-else>
        <DataTable
          v-model:row-selection="tableRowSelection"
          selectable
          empty-text="No hay clientes en esta página."
          :columns="tableColumns"
          :data="clients"
          row-key="id"
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
                  :disabled="route.name === 'alquileres-clientes-propietarios'"
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
                  <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
                    {{ (row as ClientListItem).fullName }}
                  </p>
                  <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
                    {{ (row as ClientListItem).documentTypeCode }}: {{ (row as ClientListItem).documentNumber }}
                  </p>
                </div>
              </div>
            </td>
            <td class="py-3 px-4">
              <div class="flex flex-col gap-0.5 text-sm">
                <span class="flex items-center gap-1.5" :style="{ color: 'var(--color-text-primary)' }">
                  <AppIcon icon="lucide:phone" :size="16" color="var(--color-text-muted)" />
                  {{ (row as ClientListItem).primaryPhone }}
                </span>
                <span class="flex items-center gap-1.5" :style="{ color: 'var(--color-text-primary)' }">
                  <AppIcon icon="lucide:mail" :size="16" color="var(--color-text-muted)" />
                  {{ (row as ClientListItem).primaryEmail }}
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
              <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              <span class="inline-flex items-center gap-1">
                <AppIcon icon="lucide:building-2" :size="16" />
                {{
                  (row as ClientListItem).clientType === 'OWNER'
                    ? (row as ClientListItem).propertiesCount ?? 0
                    : '—'
                }}
              </span>
            </td>
            <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
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
              <ActionsDropdown :items="getActions(row as ClientListItem)" />
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
  </div>

  <!-- Confirm Delete Modal -->
  <BaseModal v-model="showConfirmModal" :closable="true" size="sm" @close="closeConfirm">
    <template #title>
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--color-error-subtle);">
          <AppIcon icon="lucide:trash-2" :size="16" style="color: var(--color-error);" />
        </div>
        <span class="text-base font-semibold" style="color: var(--color-text-primary);">Eliminar cliente</span>
      </div>
    </template>
    <div class="p-4 space-y-3">
      <p class="text-sm" style="color: var(--color-text-secondary);">
        ¿Estás seguro de que deseas eliminar al cliente
        <span class="font-semibold" style="color: var(--color-text-primary);">{{ confirmClient?.fullName }}</span>?
      </p>
      <p class="text-xs px-3 py-2 rounded-lg" style="background: var(--color-warning-subtle); color: var(--color-warning);">
        Esta acción desactivará al cliente. Los registros relacionados (propiedades, contratos) se conservarán.
      </p>
    </div>
    <div class="flex justify-end gap-3 p-4 border-t" style="border-color: var(--color-border);">
      <BaseButton variant="ghost" @click="closeConfirm">Cancelar</BaseButton>
      <BaseButton variant="danger" :loading="isDeletingClient" @click="executeDelete">
        <AppIcon icon="lucide:trash-2" :size="16" class="mr-1" />
        Eliminar
      </BaseButton>
    </div>
  </BaseModal>
</template>
