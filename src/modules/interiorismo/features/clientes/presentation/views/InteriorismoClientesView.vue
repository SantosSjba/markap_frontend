<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
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
import {
  useInteriorClientsList,
  useInteriorClientStats,
  useDeleteInteriorClient,
} from '../../application/useClients'
import type { ClientListItem, ListClientsParams } from '../../domain/client.types'
import { interiorClientsRepository } from '@modules/interiorismo/features/clientes'
import { BaseModal } from '@shared/components'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

const router = useRouter()
const ITEMS_PER_PAGE = 10

const tableRowSelection = ref<RowSelectionState>({})

const listParams = ref<ListClientsParams>({
  applicationSlug: INTERIORISMO_APP_SLUG,
  page: 1,
  limit: ITEMS_PER_PAGE,
})
const searchInput = ref('')
const filterType = ref<'ALL' | 'RESIDENTIAL' | 'CORPORATE'>('ALL')
const filterStatus = ref<'ALL' | 'active' | 'inactive'>('ALL')

const {
  data: listResult,
  isLoading: loadingList,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useInteriorClientsList(listParams)
const {
  data: stats,
  isLoading: loadingStats,
  isError: statsQueryError,
  error: statsFetchError,
  refetch: refetchStats,
} = useInteriorClientStats(INTERIORISMO_APP_SLUG)

const clients = computed(() => listResult.value?.data ?? [])
const totalFromApi = computed(() => listResult.value?.total ?? 0)

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
    key: 'proyectos',
    label: 'Proyectos',
    align: 'left' as const,
    sortable: false,
  },
  {
    key: 'presupuestos',
    label: 'Presupuestos',
    align: 'left' as const,
    sortable: false,
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

const goToNew = () => router.push(`${INTERIORISMO_BASE_PATH}/clientes/nuevo`)
const goToDetail = (client: ClientListItem) =>
  router.push(`${INTERIORISMO_BASE_PATH}/clientes/${client.id}`)
const goToEdit = (client: ClientListItem) =>
  router.push(`${INTERIORISMO_BASE_PATH}/clientes/${client.id}/editar`)

const showConfirmModal = ref(false)
const confirmClient = ref<ClientListItem | null>(null)
const { mutate: deleteClient, isPending: isDeletingClient } = useDeleteInteriorClient()

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

const typeLabel = (t: ClientListItem['clientType']) =>
  t === 'RESIDENTIAL' ? 'Residencial' : 'Corporativo'

const getActions = (client: ClientListItem): { label: string; icon: string; onClick: () => void }[] => [
  { label: 'Ver ficha', icon: 'lucide:eye', onClick: () => goToDetail(client) },
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
  { value: 'RESIDENTIAL', label: 'Residencial' },
  { value: 'CORPORATE', label: 'Corporativo' },
]
const statusOptions = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

const { isExporting, exportToExcel } = useExcelExport()

async function handleExport() {
  const result = await interiorClientsRepository.getList({
    applicationSlug: INTERIORISMO_APP_SLUG,
    page: 1,
    limit: 10000,
    search: searchInput.value.trim() || undefined,
    clientType: filterType.value === 'ALL' ? undefined : filterType.value,
    isActive: filterStatus.value === 'ALL' ? undefined : filterStatus.value === 'active',
  })
  const now = new Date().toLocaleDateString('es-PE')
  await exportToExcel({
    fileName: `clientes_interiorismo_${now}`,
    sheetName: 'Clientes',
    columns: [
      { header: 'Nombre completo', key: 'fullName', width: 28 },
      { header: 'Tipo doc.', key: 'documentTypeCode', width: 12 },
      { header: 'N° documento', key: 'documentNumber', width: 16 },
      { header: 'Tipo cliente', key: 'clientTypeLabel', width: 14 },
      { header: 'Teléfono', key: 'primaryPhone', width: 16 },
      { header: 'Email', key: 'primaryEmail', width: 28 },
      { header: 'Estado', key: 'isActive', width: 10 },
    ],
    rows: result.data.map((c: ClientListItem) => ({
      fullName: c.fullName,
      documentTypeCode: c.documentTypeCode,
      documentNumber: c.documentNumber,
      clientTypeLabel: typeLabel(c.clientType),
      primaryPhone: c.primaryPhone,
      primaryEmail: c.primaryEmail,
      isActive: c.isActive ? 'Activo' : 'Inactivo',
    })),
  })
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1
          class="text-xl sm:text-2xl font-bold"
          :style="{ color: 'var(--color-text-primary)' }"
        >
          Clientes
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Clientes residenciales y corporativos del estudio (DNI / RUC y contacto)
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
          Nuevo cliente
        </BaseButton>
      </div>
    </div>

    <div v-if="loadingStats" class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 h-20" />
    <div
      v-else-if="statsQueryError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-warning-light)' }"
    >
      <span class="max-w-xl" style="color: var(--color-error)">{{ getApiErrorMessage(statsFetchError) }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => refetchStats()">Reintentar</BaseButton>
    </div>
    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatsCard :title="'Total'" :value="String(stats?.total ?? 0)">
        <template #icon><AppIcon icon="lucide:users" :size="20" color="var(--color-primary)" /></template>
      </StatsCard>
      <StatsCard :title="'Residencial'" :value="String(stats?.residential ?? 0)">
        <template #icon><AppIcon icon="lucide:home" :size="20" color="#2563eb" /></template>
      </StatsCard>
      <StatsCard :title="'Corporativo'" :value="String(stats?.corporate ?? 0)">
        <template #icon><AppIcon icon="lucide:building-2" :size="20" color="#16a34a" /></template>
      </StatsCard>
      <StatsCard :title="'Activos'" :value="String(stats?.active ?? 0)">
        <template #icon><AppIcon icon="lucide:trending-up" :size="20" color="#d97706" /></template>
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
        <div
          v-else-if="listQueryError"
          class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center"
        >
          <p class="text-sm font-medium" style="color: var(--color-error)">{{ getApiErrorMessage(listFetchError) }}</p>
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
          >
            <template #toolbar>
              <div class="flex-1 min-w-0">
                <SearchInput v-model="searchInput" placeholder="Buscar por nombre, documento o email..." />
              </div>
              <div class="flex flex-wrap gap-3 shrink-0 sm:flex-nowrap">
                <div class="w-full sm:w-[175px] min-w-0">
                  <FormSelect v-model="filterType" :options="typeOptions" placeholder="Todos los tipos" />
                </div>
                <div class="w-full sm:w-[175px] min-w-0">
                  <FormSelect v-model="filterStatus" :options="statusOptions" placeholder="Todos los estados" />
                </div>
              </div>
            </template>
            <template #row="{ row }">
              <td class="py-3 px-4">
                <button
                  type="button"
                  class="text-left w-full"
                  @click="goToDetail(row as ClientListItem)"
                >
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
                </button>
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
                <Badge :variant="(row as ClientListItem).clientType === 'RESIDENTIAL' ? 'info' : 'success'">
                  {{ typeLabel((row as ClientListItem).clientType) }}
                </Badge>
              </td>
              <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
                <span class="inline-flex items-center gap-1">
                  <AppIcon icon="lucide:folder-kanban" :size="16" />
                  —
                </span>
              </td>
              <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
                <span class="inline-flex items-center gap-1">
                  <AppIcon icon="lucide:file-text" :size="16" />
                  —
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
          <div v-if="!loadingList && !listQueryError" class="border-t" :style="{ borderColor: 'var(--color-border)' }">
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
        ¿Eliminar al cliente
        <span class="font-semibold" style="color: var(--color-text-primary);">{{ confirmClient?.fullName }}</span>?
      </p>
      <p class="text-xs px-3 py-2 rounded-lg" style="background: var(--color-warning-subtle); color: var(--color-warning);">
        Se desactivará el cliente en esta aplicación.
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
