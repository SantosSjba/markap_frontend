<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  BaseButton,
  BasePagination,
  Badge,
  BaseModal,
  DataTable,
  SearchInput,
  FormSelect,
  AppIcon,
  ActionsDropdown,
} from '@shared/components'
import { useInteriorProjectsList, useUpdateInteriorProject } from '../../application/useInteriorProjects'
import type { InteriorProjectListItem, InteriorProjectStatus, ListInteriorProjectsParams } from '../../domain/project.types'
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from '../labels'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'

const router = useRouter()
const route = useRoute()
const ITEMS = 10

const inProgressOnly = computed(() => route.name === 'interiorismo-proyectos-en-progreso')

const listParams = ref<ListInteriorProjectsParams>({
  page: 1,
  limit: ITEMS,
  inProgressOnly: false,
})
const searchInput = ref('')
const filterStatus = ref<'ALL' | InteriorProjectStatus>('ALL')

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

const { data: result, isLoading } = useInteriorProjectsList(listParams)

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

const statusOptions = [
  { value: 'ALL', label: 'Todos los estados' },
  ...Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
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

const goDetail = (r: InteriorProjectListItem) =>
  router.push(`${INTERIORISMO_BASE_PATH}/proyectos/${r.id}`)
const goEdit = (r: InteriorProjectListItem) =>
  router.push(`${INTERIORISMO_BASE_PATH}/proyectos/${r.id}/editar`)
const goNew = () => router.push(`${INTERIORISMO_BASE_PATH}/proyectos/nuevo`)

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

const getActions = (r: InteriorProjectListItem): { label: string; icon: string; onClick: () => void }[] => {
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
  inProgressOnly.value ? 'Proyectos en progreso' : 'Listado de proyectos',
)
const pageSubtitle = computed(() =>
  inProgressOnly.value
    ? 'Diseño, cotización, aprobados y en ejecución'
    : 'Gestión de proyectos de interiorismo',
)
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          {{ pageTitle }}
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          {{ pageSubtitle }}
        </p>
      </div>
      <BaseButton variant="primary" class="flex items-center gap-2 justify-center" @click="goNew">
        <AppIcon icon="lucide:plus" :size="18" />
        Nuevo proyecto
      </BaseButton>
    </div>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div v-if="isLoading" class="flex justify-center py-16">
        <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
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
              <button
                type="button"
                class="font-medium text-left hover:underline"
                :style="{ color: 'var(--color-primary)' }"
                @click="goDetail(row as InteriorProjectListItem)"
              >
                {{ (row as InteriorProjectListItem).code }}
              </button>
            </td>
            <td class="py-3 px-4">
              <button type="button" class="text-left" @click="goDetail(row as InteriorProjectListItem)">
                <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
                  {{ (row as InteriorProjectListItem).name }}
                </span>
              </button>
            </td>
            <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              {{ (row as InteriorProjectListItem).client.fullName }}
            </td>
            <td class="py-3 px-4">
              <Badge variant="neutral">
                {{ PROJECT_TYPE_LABELS[(row as InteriorProjectListItem).projectType] }}
              </Badge>
            </td>
            <td class="py-3 px-4">
              <Badge variant="info">
                {{ PROJECT_STATUS_LABELS[(row as InteriorProjectListItem).status] }}
              </Badge>
            </td>
            <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              {{ Math.round((row as InteriorProjectListItem).progressPct) }}%
            </td>
            <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              {{ (row as InteriorProjectListItem).estimatedEndDate ?? '—' }}
            </td>
            <td class="py-3 px-4 text-right">
              <ActionsDropdown :items="getActions(row as InteriorProjectListItem)" />
            </td>
          </template>
        </DataTable>
        <div class="border-t" :style="{ borderColor: 'var(--color-border)' }">
          <BasePagination
            v-bind="paginationProps"
            :show-page-size="true"
            @update:current-page="onPage"
            @update:page-size="onSize"
          />
        </div>
      </template>
    </div>

    <BaseModal v-model="showCancelModal" :closable="true" size="sm" @close="closeCancelModal">
      <template #title>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--color-error-subtle);">
            <AppIcon icon="lucide:trash-2" :size="16" style="color: var(--color-error);" />
          </div>
          <span class="text-base font-semibold" style="color: var(--color-text-primary);">Cancelar proyecto</span>
        </div>
      </template>
      <div class="p-4 space-y-3">
        <p class="text-sm" style="color: var(--color-text-secondary);">
          ¿Marcar como cancelado el proyecto
          <span class="font-semibold" style="color: var(--color-text-primary);">{{ cancelTarget?.code }}</span>
          — {{ cancelTarget?.name }}?
        </p>
        <p class="text-xs px-3 py-2 rounded-lg" style="background: var(--color-warning-subtle); color: var(--color-warning);">
          El proyecto pasará al estado «Cancelado». Podrá revertirlo desde Editar si lo necesita.
        </p>
      </div>
      <div class="flex justify-end gap-3 p-4 border-t" style="border-color: var(--color-border);">
        <BaseButton variant="ghost" @click="closeCancelModal">Cerrar</BaseButton>
        <BaseButton variant="danger" :loading="isCancelPending" @click="executeCancel">
          <AppIcon icon="lucide:trash-2" :size="16" class="mr-1" />
          Confirmar
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
