<script setup lang="ts">
import {useApplicationAccess} from '@modules/applications/presentation/composables/useApplicationAccess'
const { filterActions } = useApplicationAccess('interiorismo')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import {
  useInteriorProjectsList,
  useUpdateInteriorProject,
} from '../../../proyectos/presentation/composables/useInteriorProjects'
import type {
  InteriorProjectListItem,
  ListInteriorProjectsParams,
} from '../../../proyectos/domain/project.types'
import { projectStatusLabel } from '../../../proyectos/presentation/labels'
import { useInteriorProjectStageOptions } from '../../../proyectos/presentation/composables/useInteriorProjectStageOptions'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
const router = useRouter()
const { stageLabelMap } = useInteriorProjectStageOptions()
const ITEMS = 12

const listParams = ref<ListInteriorProjectsParams>({
  page: 1,
  limit: ITEMS,
  inProgressOnly: true,
})
const searchInput = ref('')

watch(
  searchInput,
  () => {
    listParams.value = {
      ...listParams.value,
      page: 1,
      search: searchInput.value.trim() || undefined,
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
} = useInteriorProjectsList(listParams)

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
  { key: 'progressPct', label: 'Avance', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

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

const openBoard = (r: InteriorProjectListItem) => {
  router.push(`${INTERIORISMO_BASE_PATH}/finanzas/${r.id}`)
}

const goDetail = (r: InteriorProjectListItem) =>
  router.push(`${INTERIORISMO_BASE_PATH}/proyectos/${r.id}`)
const goEdit = (r: InteriorProjectListItem) =>
  router.push(`${INTERIORISMO_BASE_PATH}/proyectos/${r.id}/editar`)

const showCancelModal = ref(false)
const cancelTarget = ref<InteriorProjectListItem | null>(null)
const { mutateAsync: updateProject, isPending: isCancelPending } = useUpdateInteriorProject()

const openCancelConfirm = (r: InteriorProjectListItem) => {
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
  r: InteriorProjectListItem,
): { label: string; icon: string; onClick: () => void }[] => {
  const items: { label: string; icon: string; onClick: () => void }[] = [
    { label: 'Ver ficha', icon: 'lucide:eye', onClick: () => goDetail(r) },
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => goEdit(r) },
    { label: 'Abrir panel financiero', icon: 'lucide:wallet', onClick: () => openBoard(r) },
  ]
  if (r.status !== 'CANCELLED') {
    items.push({
      label: 'Eliminar',
      icon: 'lucide:trash-2',
      onClick: () => openCancelConfirm(r),
    })
  }
  return items
}

const goProjects = () => router.push(`${INTERIORISMO_BASE_PATH}/proyectos`)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Finanzas"
      subtitle="Ingresos, adelantos, cuotas, pagos del cliente, egresos de obra (desde ejecución), flujo de caja y rentabilidad vs presupuesto."
    >
      <template #actions>
        <BaseButton variant="outline" type="button" @click="goProjects">
        <AppIcon icon="lucide:folder-kanban" :size="18" class="mr-1.5" />
        Ver todos los proyectos
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
          empty-text="No hay proyectos en curso. Avance un proyecto o consulte el listado general."
          :columns="columns"
          :data="rows"
          row-key="id"
        >
          <template #toolbar>
            <div class="flex-1 min-w-0">
              <SearchInput v-model="searchInput" placeholder="Buscar por código o nombre…" />
            </div>
          </template>
          <template #row="{ row }">
            <td class="py-3 px-4">
              <BaseButton @click="goDetail(row as InteriorProjectListItem)" variant="link" class="font-medium">{{ (row as InteriorProjectListItem).code }}</BaseButton>
            </td>
            <td class="py-3 px-4">
              <BaseButton variant="link" class="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90 dark:hover:text-brand-400" @click="goDetail(row as InteriorProjectListItem)">{{ (row as InteriorProjectListItem).name }}</BaseButton>
            </td>
            <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
              {{ (row as InteriorProjectListItem).client.fullName }}
            </td>
            <td class="py-3 px-4 text-sm">{{ Math.round((row as InteriorProjectListItem).progressPct) }}%</td>
            <td class="py-3 px-4">
              <Badge variant="neutral">{{ projectStatusLabel((row as InteriorProjectListItem).status, stageLabelMap) }}</Badge>
            </td>
            <td class="py-3 px-4 text-right">
              <ActionsDropdown :items="filterActions(getActions(row as InteriorProjectListItem))" />
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
          · {{ cancelTarget?.name }}?
        </p>
      </div>
      <div class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
        <BaseButton variant="ghost" @click="closeCancelModal">Volver</BaseButton>
        <BaseButton variant="danger" :loading="isCancelPending" @click="executeCancel">
          <AppIcon icon="lucide:trash-2" :size="16" class="mr-1" />
          Cancelar proyecto
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
