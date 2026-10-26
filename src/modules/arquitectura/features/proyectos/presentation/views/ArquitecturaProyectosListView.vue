<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import {
  useArquitecturaProjectsList,
  useUpdateArquitecturaProject,
} from '../composables/useArquitecturaProjects'
import type {
  ArquitecturaProjectListItem,
  ArquitecturaProjectStatus,
  ListArquitecturaProjectsParams,
} from '../../domain/project.types'
import { PROJECT_TYPE_LABELS, projectStatusLabel } from '../labels'
import { useArquitecturaProjectStageOptions } from '../composables/useArquitecturaProjectStageOptions'
import { ARQUITECTURA_BASE_PATH } from '../../../../config/routes.constants'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
const router = useRouter()
const route = useRoute()
const ITEMS = 10

const inProgressOnly = computed(() => route.name === 'arquitectura-proyectos-en-ejecucion')

const listParams = ref<ListArquitecturaProjectsParams>({
  page: 1,
  limit: ITEMS,
  inProgressOnly: false,
})
const searchInput = ref('')
const filterStatus = ref<'ALL' | ArquitecturaProjectStatus>('ALL')

watch(
  [inProgressOnly, searchInput, filterStatus],
  () => {
    listParams.value = {
      ...listParams.value,
      page: 1,
      search: searchInput.value.trim() || undefined,
      status: filterStatus.value === 'ALL' ? undefined : filterStatus.value,
      inProgressOnly: inProgressOnly.value,
    }
  },
  { immediate: true },
)

const {
  data: result,
  isLoading,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useArquitecturaProjectsList(listParams)

const rows = computed(() => result.value?.data ?? [])
const total = computed(() => result.value?.total ?? 0)

const onPage = (p: number) => {
  listParams.value = { ...listParams.value, page: p }
}
const onSize = (s: number) => {
  listParams.value = { ...listParams.value, limit: s, page: 1 }
}

const columns = [
  { key: 'code', label: 'Código', align: 'left' as const, sortable: true },
  { key: 'name', label: 'Proyecto', align: 'left' as const, sortable: true },
  { key: 'client', label: 'Cliente', align: 'left' as const },
  { key: 'type', label: 'Tipo', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
  { key: 'pct', label: 'Avance', align: 'left' as const },
  { key: 'end', label: 'Fin est.', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

const { filterOptions: stageFilterOptions, stageLabelMap } = useArquitecturaProjectStageOptions({
  includeCancelled: true,
})

const statusOptions = computed(() => [
  { value: 'ALL', label: 'Todos los estados' },
  ...stageFilterOptions.value,
])

const paginationProps = computed(() => {
  const page = listParams.value.page ?? 1
  const limit = listParams.value.limit ?? ITEMS
  const totalPages = Math.max(1, Math.ceil(total.value / limit))
  return {
    currentPage: page,
    totalPages,
    totalItems: total.value,
    pageSize: limit,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  }
})

const goDetail = (r: ArquitecturaProjectListItem) =>
  router.push(`${ARQUITECTURA_BASE_PATH}/proyectos/${r.id}`)
const goEdit = (r: ArquitecturaProjectListItem) =>
  router.push(`${ARQUITECTURA_BASE_PATH}/proyectos/${r.id}/editar`)
const goNew = () => router.push(`${ARQUITECTURA_BASE_PATH}/proyectos/nuevo`)

const showCancelModal = ref(false)
const cancelTarget = ref<ArquitecturaProjectListItem | null>(null)
const { mutateAsync: updateProject, isPending: isCancelPending } = useUpdateArquitecturaProject()

const openCancelConfirm = (r: ArquitecturaProjectListItem) => {
  cancelTarget.value = r
  showCancelModal.value = true
}

const closeCancelModal = () => {
  showCancelModal.value = false
  cancelTarget.value = null
}

const executeCancel = async () => {
  const r = cancelTarget.value
  if (!r) return
  try {
    await updateProject({ id: r.id, payload: { status: 'CANCELLED' } })
    closeCancelModal()
  } catch {
    void 0
  }
}

const getActions = (
  r: ArquitecturaProjectListItem,
): { label: string; icon: string; onClick: () => void }[] => {
  const rows: { label: string; icon: string; onClick: () => void }[] = [
    { label: 'Ver ficha', icon: 'lucide:eye', onClick: () => goDetail(r) },
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => goEdit(r) },
  ]
  if (r.status !== 'CANCELLED') {
    rows.push({
      label: 'Eliminar',
      icon: 'lucide:trash-2',
      onClick: () => openCancelConfirm(r),
    })
  }
  return rows
}

const pageTitle = computed(() =>
  inProgressOnly.value ? 'Proyectos en ejecución' : 'Listado de proyectos',
)
const pageSubtitle = computed(() =>
  inProgressOnly.value ? 'Aprobados y en obra' : 'Gestión de proyectos de arquitectura',
)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      :title="pageTitle"
      :subtitle="pageSubtitle"
    >
      <template #actions>
        <BaseButton variant="primary" class="flex items-center gap-2 justify-center" @click="goNew">
        <AppIcon icon="lucide:plus" :size="18" />
        Nuevo proyecto
      </BaseButton>
      </template>
    </PageHeader>

    <BaseCard padding="none" class="block overflow-hidden">
      <LoadingState v-if="isLoading" />
      <div
        v-else-if="listQueryError"
        class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center"
      >
        <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(listFetchError) }}</p>
        <BaseButton variant="outline" size="sm" @click="() => refetchList()">Reintentar</BaseButton>
      </div>
      <template v-else>
        <DataTable
          empty-text="No hay proyectos en esta página."
          :columns="columns"
          :data="rows"
          row-key="id"
        >
          <template #toolbar>
            <div class="flex-1 min-w-0">
              <SearchInput v-model="searchInput" placeholder="Buscar por código o nombre..." />
            </div>
            <div class="w-full sm:w-[200px] shrink-0">
              <FormSelect
                v-if="!inProgressOnly"
                v-model="filterStatus"
                :options="statusOptions"
                placeholder="Estado"
              />
            </div>
          </template>
          <template #row="{ row }">
            <td class="py-3 px-4">
              <BaseButton @click="goDetail(row as ArquitecturaProjectListItem)" variant="link" class="font-medium">{{ (row as ArquitecturaProjectListItem).code }}</BaseButton>
            </td>
            <td class="py-3 px-4">
              <BaseButton variant="link" class="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90 dark:hover:text-brand-400" @click="goDetail(row as ArquitecturaProjectListItem)">{{ (row as ArquitecturaProjectListItem).name }}</BaseButton>
            </td>
            <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
              {{ (row as ArquitecturaProjectListItem).client.fullName }}
            </td>
            <td class="py-3 px-4">
              <Badge variant="neutral">
                {{ PROJECT_TYPE_LABELS[(row as ArquitecturaProjectListItem).projectType] }}
              </Badge>
            </td>
            <td class="py-3 px-4">
              <Badge variant="info">
                {{ projectStatusLabel((row as ArquitecturaProjectListItem).status, stageLabelMap) }}
              </Badge>
            </td>
            <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
              {{ Math.round((row as ArquitecturaProjectListItem).progressPct) }}%
            </td>
            <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
              {{ (row as ArquitecturaProjectListItem).estimatedEndDate ?? '—' }}
            </td>
            <td class="py-3 px-4 text-right">
              <ActionsDropdown :items="getActions(row as ArquitecturaProjectListItem)" />
            </td>
          </template>
        </DataTable>
        <div v-if="!isLoading && !listQueryError" class="border-t border-gray-200 dark:border-gray-800">
          <BasePagination
            v-bind="paginationProps"
            :show-page-size="true"
            @update:current-page="onPage"
            @update:page-size="onSize"
          />
        </div>
      </template>
    </BaseCard>

    <BaseModal v-model="showCancelModal" :closable="true" size="sm" @close="closeCancelModal">
      <template #title>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center bg-error-50 dark:bg-error-500/15">
            <AppIcon class="text-error-500 dark:text-error-400" icon="lucide:trash-2" :size="16" />
          </div>
          <span class="text-base font-semibold text-gray-800 dark:text-white/90">Cancelar proyecto</span>
        </div>
      </template>
      <div class="p-4 space-y-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          ¿Marcar como cancelado el proyecto
          <span class="font-semibold text-gray-800 dark:text-white/90">{{ cancelTarget?.code }}</span>
          — {{ cancelTarget?.name }}?
        </p>
        <p class="text-xs px-3 py-2 rounded-lg bg-warning-50 dark:bg-warning-500/15 text-warning-600 dark:text-orange-400">
          El proyecto pasará al estado «Cancelado». Podrá revertirlo desde Editar si lo necesita.
        </p>
      </div>
      <div class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
        <BaseButton variant="ghost" @click="closeCancelModal">Cerrar</BaseButton>
        <BaseButton variant="danger" :loading="isCancelPending" @click="executeCancel">
          <AppIcon icon="lucide:trash-2" :size="16" class="mr-1" />
          Confirmar
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
