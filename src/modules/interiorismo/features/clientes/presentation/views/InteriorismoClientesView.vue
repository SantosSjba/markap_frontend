<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin, filterActions } = useApplicationAccess('interiorismo')

import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import Avatar from '@shared/presentation/components/ui/Avatar.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ExcelIcon from '@shared/presentation/components/ui/ExcelIcon.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { useService } from '@shared/presentation/di/services'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { toCalendarDateString } from '@shared/utils/formatters'
import { INTERIORISMO_APP_SLUG } from '../../../../config/app.constants'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { interiorClientsRepositoryKey } from '../../application/ports/clients.port'
import { useInteriorClientsProjectsSummary } from '../../../proyectos/presentation/composables/useInteriorProjects'
import { useDeleteInteriorClient, useInteriorClientStats, useInteriorClientsList } from '../composables/useClients'
import type { ClientListItem, InteriorClientType, ListClientsParams } from '../../domain/client.types'
/**
 * Clientes de Interiorismo (patrón de Alquileres): indicadores compactos y una fila por cliente
 * con documento, contacto, tipo y cuántos proyectos tiene (activos).
 */

const router = useRouter()
const clientsRepository = useService(interiorClientsRepositoryKey)
const PAGE_SIZE = 10

// ── Filtros ──
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const filterType = ref<'ALL' | InteriorClientType>('ALL')
const filterStatus = ref<'ALL' | 'active' | 'inactive'>('ALL')
const page = ref(1)
const pageSize = ref(PAGE_SIZE)
watch([debouncedSearch, filterType, filterStatus], () => (page.value = 1))

const filters = computed(() => ({
  search: debouncedSearch.value.trim() || undefined,
  clientType: filterType.value === 'ALL' ? undefined : filterType.value,
  isActive: filterStatus.value === 'ALL' ? undefined : filterStatus.value === 'active',
}))
const listParams = computed<ListClientsParams>(() => ({
  applicationSlug: INTERIORISMO_APP_SLUG,
  page: page.value,
  limit: pageSize.value,
  ...filters.value,
}))

const { data: listResult, isLoading, isFetching, isError, error, refetch } = useInteriorClientsList(listParams)
const clients = computed(() => listResult.value?.data ?? [])
const total = computed(() => listResult.value?.total ?? 0)

const statsQuery = useInteriorClientStats(INTERIORISMO_APP_SLUG)
const stats = computed(() => statsQuery.data.value)

// ── Proyectos por cliente (solo los de la página) ──
const pageIds = computed(() => clients.value.map((c) => c.id))
const { data: summary } = useInteriorClientsProjectsSummary(pageIds)
const projectsOf = (id: string) => summary.value?.find((s) => s.clientId === id)

const typeOptions = [
  { value: 'ALL', label: 'Todos los tipos' },
  { value: 'RESIDENTIAL', label: 'Residencial' },
  { value: 'CORPORATE', label: 'Corporativo' },
]
const statusOptions = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
]
const typeLabel = (t: InteriorClientType) => (t === 'CORPORATE' ? 'Corporativo' : 'Residencial')

const columns = [
  { key: 'client', label: 'Cliente', align: 'left' as const },
  { key: 'contact', label: 'Contacto', align: 'left' as const },
  { key: 'type', label: 'Tipo', align: 'left' as const },
  { key: 'projects', label: 'Proyectos', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]
const asClient = (r: unknown) => r as ClientListItem

const paginationProps = computed(() => {
  const totalPages = Math.max(1, Math.ceil(total.value / pageSize.value))
  return {
    currentPage: page.value,
    totalPages,
    totalItems: total.value,
    pageSize: pageSize.value,
    hasPrevPage: page.value > 1,
    hasNextPage: page.value < totalPages,
  }
})

// ── Acciones ──
const goToNew = () => router.push(`${INTERIORISMO_BASE_PATH}/clientes/nuevo`)
const goToDetail = (c: ClientListItem) => router.push(`${INTERIORISMO_BASE_PATH}/clientes/${c.id}`)
const goToEdit = (c: ClientListItem) => router.push(`${INTERIORISMO_BASE_PATH}/clientes/${c.id}/editar`)
const goToNewProject = () => router.push(`${INTERIORISMO_BASE_PATH}/proyectos/nuevo`)

const { mutateAsync: deleteClient } = useDeleteInteriorClient()
async function confirmDelete(c: ClientListItem) {
  const ok = await markapAlert.confirmDanger({
    title: 'Desactivar cliente',
    text: `«${c.fullName}» quedará inactivo en Interiorismo.`,
    confirmText: 'Desactivar',
  })
  if (ok) await deleteClient(c.id).catch(() => undefined)
}
const getActions = (c: ClientListItem) => {
  const items: { label: string; icon: string; onClick: () => void }[] = [
    { label: 'Ver ficha', icon: 'lucide:eye', onClick: () => goToDetail(c) },
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => goToEdit(c) },
    { label: 'Nuevo proyecto', icon: 'lucide:folder-plus', onClick: goToNewProject },
  ]
  if (canAdmin.value) items.push({ label: 'Desactivar', icon: 'lucide:user-x', onClick: () => void confirmDelete(c) })
  return items
}

// ── Exportar ──
const { isExporting, exportToExcel } = useExcelExport()
async function handleExport() {
  const result = await clientsRepository.getList({ applicationSlug: INTERIORISMO_APP_SLUG, page: 1, limit: 10000, ...filters.value })
  await exportToExcel({
    fileName: `clientes_interiorismo_${toCalendarDateString()}`,
    sheetName: 'Clientes',
    columns: [
      { header: 'Nombre / razón social', key: 'fullName', width: 32 },
      { header: 'Tipo doc.', key: 'documentTypeCode', width: 10 },
      { header: 'N° documento', key: 'documentNumber', width: 16 },
      { header: 'Tipo', key: 'type', width: 14 },
      { header: 'Teléfono', key: 'primaryPhone', width: 16 },
      { header: 'Email', key: 'primaryEmail', width: 28 },
      { header: 'Estado', key: 'status', width: 10 },
    ],
    rows: result.data.map((c) => ({
      fullName: c.fullName,
      documentTypeCode: c.documentTypeCode,
      documentNumber: c.documentNumber,
      type: typeLabel(c.clientType),
      primaryPhone: c.primaryPhone,
      primaryEmail: c.primaryEmail,
      status: c.isActive ? 'Activo' : 'Inactivo',
    })),
  })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Clientes" subtitle="Personas y empresas con proyectos de interiorismo">
      <template #actions>
        <div class="flex w-full gap-2 sm:w-auto">
          <BaseButton variant="outline" class="flex-1 justify-center sm:flex-none" :loading="isExporting" @click="handleExport">
            <ExcelIcon class="size-5" /> Exportar
          </BaseButton>
          <BaseButton v-if="canWrite" variant="primary" icon="lucide:plus" class="flex-1 justify-center sm:flex-none" @click="goToNew">
            Nuevo cliente
          </BaseButton>
        </div>
      </template>
    </PageHeader>

    <div
      v-if="statsQuery.isError.value"
      class="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-warning-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-warning-500/15"
    >
      <span class="max-w-xl text-error-500 dark:text-error-400">{{ getApiErrorMessage(statsQuery.error.value) }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => statsQuery.refetch()">Reintentar</BaseButton>
    </div>
    <div v-else class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatsCard compact title="Clientes" :value="String(stats?.total ?? 0)" :subtitle="`${stats?.active ?? 0} activos`" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:users" :size="20" color="var(--color-primary)" /></template>
      </StatsCard>
      <StatsCard compact title="Residenciales" :value="String(stats?.residential ?? 0)" subtitle="personas" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:home" :size="20" color="#2563eb" /></template>
      </StatsCard>
      <StatsCard compact title="Corporativos" :value="String(stats?.corporate ?? 0)" subtitle="empresas" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:building-2" :size="20" color="#16a34a" /></template>
      </StatsCard>
      <StatsCard compact title="Inactivos" :value="String((stats?.total ?? 0) - (stats?.active ?? 0))" subtitle="sin seguimiento" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:user-x" :size="20" color="#d97706" /></template>
      </StatsCard>
    </div>

    <BaseCard padding="none" class="block overflow-hidden">
      <div v-if="isError" class="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(error) }}</p>
        <BaseButton variant="outline" size="sm" @click="() => refetch()">Reintentar</BaseButton>
      </div>
      <template v-else>
        <DataTable :columns="columns" :data="clients" row-key="id" :loading="isLoading || isFetching" empty-text="No hay clientes con estos filtros.">
          <template #toolbar>
            <div class="min-w-0 flex-1"><SearchInput v-model="searchInput" placeholder="Buscar por nombre, documento o email..." /></div>
            <div class="flex shrink-0 flex-wrap gap-3 sm:flex-nowrap">
              <div class="w-full min-w-0 sm:w-[170px]"><FormSelect v-model="filterType" :options="typeOptions" /></div>
              <div class="w-full min-w-0 sm:w-[170px]"><FormSelect v-model="filterStatus" :options="statusOptions" /></div>
            </div>
          </template>
          <template #row="{ row }">
            <td class="px-4 py-3">
              <button type="button" class="flex items-center gap-3 text-left" @click="goToDetail(asClient(row))">
                <Avatar :name="asClient(row).fullName" size="md" />
                <span class="min-w-0">
                  <span class="block font-medium text-gray-800 hover:text-brand-500 dark:text-white/90 dark:hover:text-brand-400">{{ asClient(row).fullName }}</span>
                  <span class="block text-xs text-gray-400 dark:text-gray-500">{{ asClient(row).documentTypeCode }} {{ asClient(row).documentNumber }}</span>
                </span>
              </button>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-col gap-0.5 text-sm text-gray-800 dark:text-white/90">
                <span class="flex items-center gap-1.5"><AppIcon icon="lucide:phone" :size="14" color="var(--color-text-muted)" />{{ asClient(row).primaryPhone || '—' }}</span>
                <span v-if="asClient(row).primaryEmail" class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400"><AppIcon icon="lucide:mail" :size="14" color="var(--color-text-muted)" />{{ asClient(row).primaryEmail }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <Badge :variant="asClient(row).clientType === 'CORPORATE' ? 'success' : 'info'">{{ typeLabel(asClient(row).clientType) }}</Badge>
            </td>
            <td class="px-4 py-3 text-sm">
              <template v-if="projectsOf(asClient(row).id)?.total">
                <span class="font-medium text-gray-800 dark:text-white/90">{{ projectsOf(asClient(row).id)?.total }}</span>
                <span class="text-gray-500 dark:text-gray-400"> · {{ projectsOf(asClient(row).id)?.active }} activos</span>
              </template>
              <span v-else class="text-gray-400">Sin proyectos</span>
            </td>
            <td class="px-4 py-3">
              <Badge :variant="asClient(row).isActive ? 'success' : 'neutral'">{{ asClient(row).isActive ? 'Activo' : 'Inactivo' }}</Badge>
            </td>
            <td class="px-4 py-3 text-right"><ActionsDropdown :items="filterActions(getActions(asClient(row)))" /></td>
          </template>
        </DataTable>
        <div class="border-t border-gray-200 dark:border-gray-800">
          <BasePagination
            v-bind="paginationProps"
            :show-page-size="true"
            @update:current-page="(p: number) => (page = p)"
            @update:page-size="(s: number) => { pageSize = s; page = 1 }"
          />
        </div>
      </template>
    </BaseCard>
  </div>
</template>
