<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { ventasClientsRepositoryKey } from '../../application/ports/ventas-clients.port'
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
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import {
  useVentasClientsList,
  useVentasClientStats,
  useVentasDeleteClient,
} from '../composables/useVentasClients'
import type { VentasClientListItem, ListVentasClientsParams } from '../../domain/client.types'
import {
  VENTAS_LEAD_ORIGIN_OPTIONS,
  VENTAS_SALES_STATUS_OPTIONS,
} from '../../domain/leadOrigins.constants'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
const ventasClientsRepository = useService(ventasClientsRepositoryKey)

const router = useRouter()
const route = useRoute()
const ITEMS_PER_PAGE = 10

const tableRowSelection = ref<RowSelectionState>({})

const listParams = ref<ListVentasClientsParams>({
  page: 1,
  limit: ITEMS_PER_PAGE,
})
const searchInput = ref('')
const filterKind = ref<'ALL' | 'BUYER' | 'OWNER'>('ALL')
const filterPipeline = ref<'ALL' | 'PROSPECT' | 'INTERESTED' | 'CLIENT'>('ALL')

const {
  data: listResult,
  isLoading: loadingList,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useVentasClientsList(listParams)
const {
  data: stats,
  isLoading: loadingStats,
  isError: statsQueryError,
  error: statsFetchError,
  refetch: refetchStats,
} = useVentasClientStats()

const clients = computed(() => listResult.value?.data ?? [])
const totalFromApi = computed(() => listResult.value?.total ?? 0)

watch(
  () => route.name,
  (name) => {
    if (name === 'ventas-clientes-propietarios') {
      filterKind.value = 'OWNER'
    } else if (name === 'ventas-clientes') {
      filterKind.value = 'ALL'
    }
  },
  { immediate: true },
)

watch(
  [searchInput, filterKind, filterPipeline],
  () => {
    listParams.value = {
      ...listParams.value,
      page: 1,
      search: searchInput.value.trim() || undefined,
      clientType: filterKind.value === 'ALL' ? undefined : filterKind.value,
      salesStatus:
        filterKind.value === 'OWNER'
          ? undefined
          : filterPipeline.value === 'ALL'
            ? undefined
            : filterPipeline.value,
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

function salesStatusLabel(s: string | null) {
  if (!s) return '—'
  return VENTAS_SALES_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s
}

function salesStatusVariant(s: string | null): 'neutral' | 'info' | 'success' | 'warning' {
  if (s === 'PROSPECT') return 'info'
  if (s === 'INTERESTED') return 'warning'
  if (s === 'CLIENT') return 'success'
  return 'neutral'
}

function leadOriginLabel(code: string | null) {
  if (!code) return '—'
  return VENTAS_LEAD_ORIGIN_OPTIONS.find((o) => o.value === code)?.label ?? code
}

function clientKindLabel(t: string) {
  return t === 'OWNER' ? 'Propietario' : 'Comprador / lead'
}

const tableColumns = [
  {
    key: 'tipo',
    label: 'Tipo',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as VentasClientListItem).clientType,
  },
  {
    key: 'cliente',
    label: 'Cliente',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as VentasClientListItem).fullName,
  },
  {
    key: 'contacto',
    label: 'Contacto',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => {
      const c = r as VentasClientListItem
      return `${c.primaryPhone} ${c.primaryEmail ?? ''}`
    },
  },
  {
    key: 'inventario',
    label: 'Propiedades',
    align: 'left' as const,
    sortable: true,
    sortType: 'basic' as const,
    sortAccessor: (r: unknown) => (r as VentasClientListItem).propertiesCount,
  },
  {
    key: 'estado',
    label: 'Estado',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as VentasClientListItem).salesStatus ?? '',
  },
  {
    key: 'origen',
    label: 'Origen',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as VentasClientListItem).leadOrigin ?? '',
  },
  {
    key: 'asesor',
    label: 'Asesor',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as VentasClientListItem).assignedAgentName ?? '',
  },
  { key: 'actions', label: '', align: 'right' as const },
]

const pageTitle = computed(() =>
  route.name === 'ventas-clientes-propietarios' ? 'Propietarios' : 'Clientes',
)
const pageSubtitle = computed(() =>
  route.name === 'ventas-clientes-propietarios'
    ? 'Titulares registrados en Ventas (vinculados al inventario)'
    : 'Compradores / leads y propietarios de inventario (misma idea que en Alquileres)',
)
const pageIcon = computed(() =>
  route.name === 'ventas-clientes-propietarios' ? 'lucide:building-2' : 'lucide:users',
)

const goToNew = () => router.push('/ventas/clientes/nuevo')
const goToEdit = (client: VentasClientListItem) =>
  router.push(`/ventas/clientes/${client.id}/editar`)

const showConfirmModal = ref(false)
const confirmClient = ref<VentasClientListItem | null>(null)
const { mutate: deleteClient, isPending: isDeletingClient } = useVentasDeleteClient()

const openDeleteConfirm = (client: VentasClientListItem) => {
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
  client: VentasClientListItem,
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

const kindFilterOptions = [
  { value: 'ALL', label: 'Todos los tipos' },
  { value: 'BUYER', label: 'Compradores / leads' },
  { value: 'OWNER', label: 'Propietarios' },
]

const pipelineOptions = [
  { value: 'ALL', label: 'Todos los estados (embudo)' },
  ...VENTAS_SALES_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
]

const { isExporting, exportToExcel } = useExcelExport()

async function handleExport() {
  const result = await ventasClientsRepository.getList({
    page: 1,
    limit: 10000,
    search: searchInput.value.trim() || undefined,
    clientType: filterKind.value === 'ALL' ? undefined : filterKind.value,
    salesStatus:
      filterKind.value === 'OWNER'
        ? undefined
        : filterPipeline.value === 'ALL'
          ? undefined
          : filterPipeline.value,
  })
  const now = toCalendarDateString()
  await exportToExcel({
    fileName: `clientes_ventas_${now}`,
    sheetName: 'Clientes',
    columns: [
      { header: 'Tipo cliente', key: 'clientKind', width: 18 },
      { header: 'Nombre', key: 'fullName', width: 28 },
      { header: 'Tipo doc.', key: 'documentTypeCode', width: 12 },
      { header: 'N° documento', key: 'documentNumber', width: 16 },
      { header: 'Teléfono', key: 'primaryPhone', width: 16 },
      { header: 'Email', key: 'primaryEmail', width: 28 },
      { header: 'Propiedades', key: 'propertiesCount', width: 12 },
      { header: 'Estado embudo', key: 'salesStatus', width: 14 },
      { header: 'Origen', key: 'leadOrigin', width: 18 },
      { header: 'Asesor', key: 'assignedAgentName', width: 22 },
    ],
    rows: result.data.map((c) => ({
      clientKind: clientKindLabel(c.clientType),
      fullName: c.fullName,
      documentTypeCode: c.documentTypeCode,
      documentNumber: c.documentNumber,
      primaryPhone: c.primaryPhone,
      primaryEmail: c.primaryEmail ?? '—',
      propertiesCount: c.clientType === 'OWNER' ? String(c.propertiesCount) : '—',
      salesStatus: c.clientType === 'BUYER' ? salesStatusLabel(c.salesStatus) : '—',
      leadOrigin: c.clientType === 'BUYER' ? leadOriginLabel(c.leadOrigin) : '—',
      assignedAgentName: c.clientType === 'BUYER' ? (c.assignedAgentName ?? '—') : '—',
    })),
  })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      :title="pageTitle"
      :subtitle="pageSubtitle"
      :icon="pageIcon"
      large
    >
      <template #actions>
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
          variant="primary"
          class="flex items-center gap-2 flex-1 sm:flex-none justify-center"
          @click="goToNew"
        >
          <AppIcon icon="lucide:plus" :size="18" />
          Nuevo Cliente
        </BaseButton>
      </template>
    </PageHeader>

    <div v-if="loadingStats" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 h-20" />
    <div
      v-else-if="statsQueryError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3 border-gray-200 dark:border-gray-800 bg-warning-50 dark:bg-warning-500/15"
    >
      <span class="max-w-xl text-error-500 dark:text-error-400">{{ getApiErrorMessage(statsFetchError) }}</span>
      <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" class="ml-auto shrink-0" @click="() => refetchStats()">Reintentar</BaseButton>
    </div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <StatsCard :title="'Total'" :value="String(stats?.total ?? 0)">
        <template #icon>
          <AppIcon icon="lucide:users" :size="20" color="var(--color-primary)" />
        </template>
      </StatsCard>
      <StatsCard :title="'Propietarios'" :value="String(stats?.owners ?? 0)">
        <template #icon>
          <AppIcon icon="lucide:building-2" :size="20" color="#64748b" />
        </template>
      </StatsCard>
      <StatsCard :title="'Prospectos'" :value="String(stats?.prospects ?? 0)">
        <template #icon>
          <AppIcon icon="lucide:user-plus" :size="20" color="#2563eb" />
        </template>
      </StatsCard>
      <StatsCard :title="'Interesados'" :value="String(stats?.interested ?? 0)">
        <template #icon>
          <AppIcon icon="lucide:heart" :size="20" color="#d97706" />
        </template>
      </StatsCard>
      <StatsCard :title="'Clientes'" :value="String(stats?.salesClients ?? 0)">
        <template #icon>
          <AppIcon icon="lucide:badge-check" :size="20" color="#16a34a" />
        </template>
      </StatsCard>
    </div>

    <BaseCard padding="none" class="block overflow-hidden">
      <div class="overflow-x-auto">
        <LoadingState v-if="loadingList" class="px-4" />
        <div
          v-else-if="listQueryError"
          class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center"
        >
          <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(listFetchError) }}</p>
          <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchList()">Reintentar</BaseButton>
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
                <SearchInput
                  v-model="searchInput"
                  placeholder="Buscar por nombre, DNI o email..."
                />
              </div>
              <div class="flex flex-wrap gap-3 shrink-0 sm:flex-nowrap">
                <div class="w-full sm:w-[200px] min-w-0">
                  <FormSelect
                    v-model="filterKind"
                    :options="kindFilterOptions"
                    placeholder="Tipo de cliente"
                    :disabled="route.name === 'ventas-clientes-propietarios'"
                  />
                </div>
                <div class="w-full sm:w-[220px] min-w-0">
                  <FormSelect
                    v-model="filterPipeline"
                    :options="pipelineOptions"
                    placeholder="Embudo (compradores)"
                    :disabled="filterKind === 'OWNER'"
                  />
                </div>
              </div>
            </template>
            <template #row="{ row }">
              <td class="py-3 px-4">
                <Badge :variant="(row as VentasClientListItem).clientType === 'OWNER' ? 'neutral' : 'info'">
                  {{ clientKindLabel((row as VentasClientListItem).clientType) }}
                </Badge>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <Avatar :name="(row as VentasClientListItem).fullName" size="md" />
                  <div>
                    <p class="font-medium text-gray-800 dark:text-white/90">
                      {{ (row as VentasClientListItem).fullName }}
                    </p>
                    <p class="text-xs text-gray-400 dark:text-gray-500">
                      {{ (row as VentasClientListItem).documentTypeCode }}:
                      {{ (row as VentasClientListItem).documentNumber }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex flex-col gap-0.5 text-sm">
                  <span class="flex items-center gap-1.5 text-gray-800 dark:text-white/90">
                    <AppIcon icon="lucide:phone" :size="16" color="var(--color-text-muted)" />
                    {{ (row as VentasClientListItem).primaryPhone }}
                  </span>
                  <span class="flex items-center gap-1.5 text-gray-800 dark:text-white/90">
                    <AppIcon icon="lucide:mail" :size="16" color="var(--color-text-muted)" />
                    {{ (row as VentasClientListItem).primaryEmail || '—' }}
                  </span>
                </div>
              </td>
              <td class="py-3 px-4 text-sm tabular-nums text-gray-800 dark:text-white/90">
                <template v-if="(row as VentasClientListItem).clientType === 'OWNER'">
                  {{ (row as VentasClientListItem).propertiesCount }}
                </template>
                <span class="text-gray-400 dark:text-gray-500" v-else>—</span>
              </td>
              <td class="py-3 px-4">
                <template v-if="(row as VentasClientListItem).clientType === 'BUYER'">
                  <Badge :variant="salesStatusVariant((row as VentasClientListItem).salesStatus)">
                    {{ salesStatusLabel((row as VentasClientListItem).salesStatus) }}
                  </Badge>
                </template>
                <span v-else class="text-sm text-gray-400 dark:text-gray-500">—</span>
              </td>
              <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                {{
                  (row as VentasClientListItem).clientType === 'BUYER'
                    ? leadOriginLabel((row as VentasClientListItem).leadOrigin)
                    : '—'
                }}
              </td>
              <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                {{
                  (row as VentasClientListItem).clientType === 'BUYER'
                    ? (row as VentasClientListItem).assignedAgentName
                      ? (row as VentasClientListItem).assignedAgentName
                      : 'Sin asignar'
                    : '—'
                }}
              </td>
              <td class="py-3 px-4 text-right">
                <ActionsDropdown :items="getActions(row as VentasClientListItem)" />
              </td>
            </template>
          </DataTable>
          <div v-if="!loadingList && !listQueryError" class="border-t border-gray-200 dark:border-gray-800">
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

  <BaseModal v-model="showConfirmModal" :closable="true" size="sm" @close="closeConfirm">
    <template #title>
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center bg-error-50 dark:bg-error-500/15"
        >
          <AppIcon class="text-error-500 dark:text-error-400" icon="lucide:trash-2" :size="16" />
        </div>
        <span class="text-base font-semibold text-gray-800 dark:text-white/90">
          Eliminar cliente
        </span>
      </div>
    </template>
    <div class="p-4 space-y-3">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        ¿Eliminar al cliente
        <span class="font-semibold text-gray-800 dark:text-white/90">{{
          confirmClient?.fullName
        }}</span
        >?
      </p>
      <p
        class="text-xs px-3 py-2 rounded-lg bg-warning-50 dark:bg-warning-500/15 text-warning-600 dark:text-orange-400"
      >
        El registro se desactivará. Podrás conservar el historial asociado en otros módulos.
      </p>
    </div>
    <div class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
      <BaseButton variant="ghost" icon="lucide:x" @click="closeConfirm">Cancelar</BaseButton>
      <BaseButton variant="danger" icon="lucide:trash-2" :loading="isDeletingClient" @click="executeDelete">
        Eliminar
      </BaseButton>
    </div>
  </BaseModal>
</template>
