<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  BasePagination,
  BaseModal,
  DataTable,
  SearchInput,
  Badge,
  AppIcon,
  ActionsDropdown,
} from '@shared/components'
import { useInteriorProjectsList, useUpdateInteriorProject } from '@modules/interiorismo/features/proyectos/application/useInteriorProjects'
import type { InteriorProjectListItem, ListInteriorProjectsParams } from '@modules/interiorismo/features/proyectos/domain/project.types'
import { PROJECT_STATUS_LABELS } from '@modules/interiorismo/features/proyectos/presentation/labels'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'

const router = useRouter()
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
  router.push(`${INTERIORISMO_BASE_PATH}/ejecucion/${r.id}`)
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

const getActions = (r: InteriorProjectListItem): { label: string; icon: string; onClick: () => void }[] => {
  const items: { label: string; icon: string; onClick: () => void }[] = [
    { label: 'Ver ficha', icon: 'lucide:eye', onClick: () => goDetail(r) },
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => goEdit(r) },
    { label: 'Abrir tablero de obra', icon: 'lucide:hard-hat', onClick: () => openBoard(r) },
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
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1400px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Ejecución</h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Opera la obra real: tareas por fase, Kanban, cronograma, costos ejecutados vs presupuesto aprobado, evidencias e incidencias.
        </p>
      </div>
      <BaseButton variant="outline" type="button" @click="goProjects">
        <AppIcon icon="lucide:folder-kanban" :size="18" class="mr-1.5" />
        Ver todos los proyectos
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
          empty-text="No hay proyectos en curso. Avance un proyecto a obra o consulte el listado general."
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
              <button
                type="button"
                class="font-medium hover:underline"
                :style="{ color: 'var(--color-primary)' }"
                @click="goDetail(row as InteriorProjectListItem)"
              >
                {{ (row as InteriorProjectListItem).code }}
              </button>
            </td>
            <td class="py-3 px-4">
              <button type="button" class="text-left font-medium" @click="goDetail(row as InteriorProjectListItem)">
                <span :style="{ color: 'var(--color-text-primary)' }">{{ (row as InteriorProjectListItem).name }}</span>
              </button>
            </td>
            <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              {{ (row as InteriorProjectListItem).client.fullName }}
            </td>
            <td class="py-3 px-4 text-sm">{{ Math.round((row as InteriorProjectListItem).progressPct) }}%</td>
            <td class="py-3 px-4">
              <Badge variant="neutral">{{ PROJECT_STATUS_LABELS[(row as InteriorProjectListItem).status] }}</Badge>
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
          · {{ cancelTarget?.name }}?
        </p>
      </div>
      <div class="flex justify-end gap-3 p-4 border-t" style="border-color: var(--color-border);">
        <BaseButton variant="ghost" @click="closeCancelModal">Volver</BaseButton>
        <BaseButton variant="danger" :loading="isCancelPending" @click="executeCancel">
          <AppIcon icon="lucide:trash-2" :size="16" class="mr-1" />
          Cancelar proyecto
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
