<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { ventasAgentsRepositoryKey } from '../../application/ports/ventas-agents.port'
import { useService } from '@shared/presentation/di/services'
import { toCalendarDateString } from '@shared/utils/formatters'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { RowSelectionState } from '@tanstack/vue-table'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ExcelIcon from '@shared/presentation/components/ui/ExcelIcon.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import {
  useVentasAgentsList,
  useVentasUpdateAgent,
  useVentasDeleteAgent,
} from '../composables/useAgents'
import type { VentasAgentListItem, ListVentasAgentsParams } from '../../domain/agent.types'
const ventasAgentsRepository = useService(ventasAgentsRepositoryKey)

const router = useRouter()
const ITEMS_PER_PAGE = 10

const tableRowSelection = ref<RowSelectionState>({})

const listParams = ref<ListVentasAgentsParams>({
  page: 1,
  limit: ITEMS_PER_PAGE,
})
const searchInput = ref('')
const filterType = ref<'ALL' | 'INTERNAL' | 'EXTERNAL'>('ALL')
const filterStatus = ref<'ALL' | 'active' | 'inactive'>('ALL')

const {
  data: listResult,
  isLoading: loadingList,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useVentasAgentsList(listParams)

const agents = computed(() => listResult.value?.data ?? [])
const totalFromApi = computed(() => listResult.value?.total ?? 0)

watch(
  [searchInput, filterType, filterStatus],
  () => {
    listParams.value = {
      ...listParams.value,
      page: 1,
      search: searchInput.value.trim() || undefined,
      type: filterType.value === 'ALL' ? undefined : filterType.value,
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

const goToNew = () => router.push('/ventas/agentes/nuevo')
const goToEdit = (agent: VentasAgentListItem) => router.push(`/ventas/agentes/${agent.id}/editar`)

const showConfirmModal = ref(false)
const confirmModal = ref<{
  type: 'deactivate' | 'activate' | 'delete'
  agent: VentasAgentListItem
} | null>(null)

const updateMutation = useVentasUpdateAgent()
const deleteMutation = useVentasDeleteAgent()

const confirmActionPending = computed(
  () => updateMutation.isPending.value || deleteMutation.isPending.value,
)

function openConfirm(type: 'deactivate' | 'activate' | 'delete', agent: VentasAgentListItem) {
  confirmModal.value = { type, agent }
  showConfirmModal.value = true
}

function closeConfirm() {
  showConfirmModal.value = false
  confirmModal.value = null
}

async function executeConfirm() {
  if (!confirmModal.value) return
  const { type, agent } = confirmModal.value
  try {
    if (type === 'deactivate') {
      await updateMutation.mutateAsync({ id: agent.id, data: { isActive: false } })
    } else if (type === 'activate') {
      await updateMutation.mutateAsync({ id: agent.id, data: { isActive: true } })
    } else {
      await deleteMutation.mutateAsync(agent.id)
    }
    closeConfirm()
  } catch {
    /* onError en composables; invalidación en onSuccess */
  }
}

const getActions = (
  agent: VentasAgentListItem,
): { label: string; icon: string; onClick: () => void }[] => {
  const actions: { label: string; icon: string; onClick: () => void }[] = [
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => goToEdit(agent) },
  ]
  if (agent.isActive) {
    actions.push({
      label: 'Desactivar',
      icon: 'lucide:user-x',
      onClick: () => openConfirm('deactivate', agent),
    })
  } else {
    actions.push({
      label: 'Reactivar',
      icon: 'lucide:user-check',
      onClick: () => openConfirm('activate', agent),
    })
  }
  actions.push({
    label: 'Eliminar',
    icon: 'lucide:trash-2',
    onClick: () => openConfirm('delete', agent),
  })
  return actions
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

const typeOptions = [
  { value: 'ALL', label: 'Todos los tipos' },
  { value: 'INTERNAL', label: 'Interno' },
  { value: 'EXTERNAL', label: 'Externo' },
]
const statusOptions = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

function displayName(row: VentasAgentListItem): string {
  if (row.type === 'INTERNAL' && row.user) {
    return `${row.user.firstName} ${row.user.lastName}`.trim() || row.fullName
  }
  return row.fullName
}

const tableColumns = [
  {
    key: 'agente',
    label: 'Agente',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => displayName(r as VentasAgentListItem),
  },
  {
    key: 'tipo',
    label: 'Tipo',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as VentasAgentListItem).type,
  },
  {
    key: 'contacto',
    label: 'Contacto',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => {
      const a = r as VentasAgentListItem
      return `${a.phone ?? ''} ${a.email ?? ''}`
    },
  },
  {
    key: 'estado',
    label: 'Estado',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => ((r as VentasAgentListItem).isActive ? 1 : 0),
  },
  { key: 'actions', label: '', align: 'right' as const },
]

const { isExporting, exportToExcel } = useExcelExport()

async function handleExport() {
  try {
    const result = await ventasAgentsRepository.list({
      page: 1,
      limit: 10000,
      search: searchInput.value.trim() || undefined,
      type: filterType.value === 'ALL' ? undefined : filterType.value,
      isActive: filterStatus.value === 'ALL' ? undefined : filterStatus.value === 'active',
    })
    const now = toCalendarDateString()
    await exportToExcel({
      fileName: `agentes_ventas_${now}`,
      sheetName: 'Agentes Ventas',
      columns: [
        { header: 'Nombre', key: 'fullName', width: 28 },
        { header: 'Tipo', key: 'type', width: 12 },
        { header: 'Tipo doc.', key: 'documentTypeCode', width: 12 },
        { header: 'N° documento', key: 'documentNumber', width: 16 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Teléfono', key: 'phone', width: 16 },
        { header: 'Estado', key: 'isActive', width: 10 },
      ],
      rows: result.data.map((a: VentasAgentListItem) => ({
        fullName: displayName(a),
        type: a.type === 'INTERNAL' ? 'Interno' : 'Externo',
        documentTypeCode: a.documentType?.code ?? '—',
        documentNumber: a.documentNumber ?? '—',
        email: a.email ?? '—',
        phone: a.phone ?? '—',
        isActive: a.isActive ? 'Activo' : 'Inactivo',
      })),
    })
    void markapAlert.toast.success(
      'Exportación lista',
      `Se exportaron ${result.data.length} registro(s) a Excel.`,
    )
  } catch (err) {
    void markapAlert.toast.error('No se pudo exportar', getApiErrorMessage(err))
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Agentes"
      subtitle="Agentes de ventas: internos (usuarios del sistema) y externos (terceros)"
      icon="lucide:user-check"
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
        <BaseButton variant="primary" class="flex items-center gap-2 flex-1 sm:flex-none justify-center" @click="goToNew">
          <AppIcon icon="lucide:plus" :size="18" />
          Nuevo Agente
        </BaseButton>
      </template>
    </PageHeader>

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
            empty-text="No hay agentes en esta página."
            :columns="tableColumns"
            :data="agents"
            row-key="id"
          >
            <template #toolbar>
              <div class="flex-1 min-w-0">
                <SearchInput v-model="searchInput" placeholder="Buscar por nombre, email o teléfono..." />
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
                <div class="flex items-center gap-3">
                  <div :class="((row as VentasAgentListItem).isActive) ? 'bg-brand-500/10' : 'bg-gray-50 dark:bg-gray-800'"
                    class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  >
                    <AppIcon
                      :icon="(row as VentasAgentListItem).type === 'INTERNAL' ? 'lucide:user-check' : 'lucide:user-round-cog'"
                      :size="16"
                      :color="(row as VentasAgentListItem).isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'"
                    />
                  </div>
                  <div>
                    <p class="font-medium text-gray-800 dark:text-white/90">
                      {{ displayName(row as VentasAgentListItem) }}
                    </p>
                    <p v-if="(row as VentasAgentListItem).documentType" class="text-xs text-gray-400 dark:text-gray-500">
                      {{ (row as VentasAgentListItem).documentType?.code }}: {{ (row as VentasAgentListItem).documentNumber ?? '–' }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <Badge :variant="(row as VentasAgentListItem).type === 'INTERNAL' ? 'info' : 'neutral'">
                  {{ (row as VentasAgentListItem).type === 'INTERNAL' ? 'Interno' : 'Externo' }}
                </Badge>
              </td>
              <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                <div class="flex flex-col gap-0.5">
                  <span v-if="(row as VentasAgentListItem).phone" class="flex items-center gap-1.5">
                    <AppIcon icon="lucide:phone" :size="12" color="var(--color-text-muted)" />
                    {{ (row as VentasAgentListItem).phone }}
                  </span>
                  <span v-if="(row as VentasAgentListItem).email" class="flex items-center gap-1.5">
                    <AppIcon icon="lucide:mail" :size="12" color="var(--color-text-muted)" />
                    {{ (row as VentasAgentListItem).email }}
                  </span>
                  <span v-if="!(row as VentasAgentListItem).phone && !(row as VentasAgentListItem).email">–</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <Badge :variant="(row as VentasAgentListItem).isActive ? 'success' : 'error'">
                  {{ (row as VentasAgentListItem).isActive ? 'Activo' : 'Inactivo' }}
                </Badge>
              </td>
              <td class="py-3 px-4 text-right">
                <ActionsDropdown :items="getActions(row as VentasAgentListItem)" />
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

    <BaseModal
      v-model="showConfirmModal"
      size="sm"
      @close="closeConfirm"
    >
      <template #title>
        <div class="flex items-center gap-2">
          <AppIcon
            :icon="
              confirmModal?.type === 'delete'
                ? 'lucide:trash-2'
                : confirmModal?.type === 'activate'
                  ? 'lucide:user-check'
                  : 'lucide:user-x'
            "
            :size="17"
            :color="
              confirmModal?.type === 'delete'
                ? 'var(--color-error)'
                : confirmModal?.type === 'activate'
                  ? 'var(--color-success)'
                  : '#f59e0b'
            "
          />
          <span>{{
            confirmModal?.type === 'delete'
              ? 'Eliminar agente'
              : confirmModal?.type === 'activate'
                ? 'Reactivar agente'
                : 'Desactivar agente'
          }}</span>
        </div>
      </template>
      <template v-if="confirmModal">
        <div class="flex items-start gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-full"
            :class="
              confirmModal.type === 'delete'
                ? 'bg-error-50 text-error-500 dark:bg-error-500/15'
                : confirmModal.type === 'activate'
                  ? 'bg-success-50 text-success-600 dark:bg-success-500/15'
                  : 'bg-warning-50 text-warning-600 dark:bg-warning-500/15'
            "
          >
            <AppIcon
              :icon="
                confirmModal.type === 'delete'
                  ? 'lucide:trash-2'
                  : confirmModal.type === 'activate'
                    ? 'lucide:user-check'
                    : 'lucide:user-x'
              "
              :size="20"
              :color="
                confirmModal.type === 'delete'
                  ? 'var(--color-error)'
                  : confirmModal.type === 'activate'
                    ? 'var(--color-success)'
                    : '#f59e0b'
              "
            />
          </div>
          <div>
            <p class="font-semibold mb-1 text-gray-800 dark:text-white/90">
              {{ confirmModal.agent.fullName }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              <template v-if="confirmModal.type === 'delete'">
                Se realizará un <strong>soft delete</strong>: el agente no se eliminará de la base de datos pero no aparecerá en ningún listado ni podrá ser seleccionado.
              </template>
              <template v-else-if="confirmModal.type === 'activate'">
                El agente volverá a estado <strong>activo</strong> y aparecerá de nuevo en listados y búsquedas activas.
              </template>
              <template v-else>
                El agente pasará a estado <strong>inactivo</strong> y no aparecerá en búsquedas activas.
              </template>
            </p>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" icon="lucide:x" @click="closeConfirm">Cancelar</BaseButton>
          <BaseButton
            :variant="confirmModal?.type === 'delete' ? 'danger' : 'primary'"
            :icon="
              confirmModal?.type === 'delete'
                ? 'lucide:trash-2'
                : confirmModal?.type === 'activate'
                  ? 'lucide:user-check'
                  : 'lucide:user-x'
            "
            :loading="confirmActionPending"
            @click="executeConfirm"
          >
            {{
              confirmModal?.type === 'delete'
                ? 'Eliminar'
                : confirmModal?.type === 'activate'
                  ? 'Reactivar'
                  : 'Desactivar'
            }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
