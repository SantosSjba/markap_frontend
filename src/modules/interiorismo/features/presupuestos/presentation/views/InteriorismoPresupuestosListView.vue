<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  BasePagination,
  BaseModal,
  Badge,
  DataTable,
  SearchInput,
  FormSelect,
  AppIcon,
  ActionsDropdown,
} from '@shared/components'
import {
  useInteriorBudgetsList,
  useDuplicateInteriorBudget,
  useDeleteInteriorBudget,
} from '../../application/useInteriorBudgets'
import type { InteriorBudgetListItem, ListInteriorBudgetsParams } from '../../domain/budget.types'
import { BUDGET_STATUS_LABELS, formatSol } from '../labels'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'

const router = useRouter()
const ITEMS = 10

const listParams = ref<ListInteriorBudgetsParams>({
  page: 1,
  limit: ITEMS,
})
const searchInput = ref('')
const filterStatus = ref<'ALL' | string>('ALL')

watch(
  [searchInput, filterStatus],
  () => {
    listParams.value = {
      ...listParams.value,
      page: 1,
      search: searchInput.value.trim() || undefined,
      status: filterStatus.value === 'ALL' ? undefined : filterStatus.value,
    }
  },
  { immediate: true },
)

const { data: result, isLoading } = useInteriorBudgetsList(listParams)
const duplicateMut = useDuplicateInteriorBudget()
const { mutateAsync: deleteBudget, isPending: isDeletingBudget } = useDeleteInteriorBudget()

const showDeleteModal = ref(false)
const deleteTarget = ref<InteriorBudgetListItem | null>(null)

const openDeleteConfirm = (r: InteriorBudgetListItem) => {
  deleteTarget.value = r
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteTarget.value = null
}

const executeDelete = async () => {
  const r = deleteTarget.value
  if (!r) return
  try {
    await deleteBudget(r.id)
    closeDeleteModal()
  } catch {
    void 0
  }
}

const rows = computed(() => result.value?.data ?? [])
const total = computed(() => result.value?.total ?? 0)

const onPage = (p: number) => {
  listParams.value = { ...listParams.value, page: p }
}
const onSize = (s: number) => {
  listParams.value = { ...listParams.value, limit: s, page: 1 }
}

const columns = [
  { key: 'code', label: 'Código', align: 'left' as const },
  { key: 'version', label: 'Ver.', align: 'left' as const },
  { key: 'project', label: 'Proyecto', align: 'left' as const },
  { key: 'client', label: 'Cliente', align: 'left' as const },
  { key: 'total', label: 'Total', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

const statusOptions = [
  { value: 'ALL', label: 'Todos los estados' },
  ...Object.entries(BUDGET_STATUS_LABELS).map(([value, label]) => ({ value, label })),
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

const goDetail = (r: InteriorBudgetListItem) =>
  router.push(`${INTERIORISMO_BASE_PATH}/presupuestos/${r.id}`)
const goNew = () => router.push(`${INTERIORISMO_BASE_PATH}/presupuestos/nuevo`)

const statusLabel = (s: string) => BUDGET_STATUS_LABELS[s] ?? s

async function duplicateRow(b: InteriorBudgetListItem) {
  try {
    const created = await duplicateMut.mutateAsync(b.id)
    router.push(`${INTERIORISMO_BASE_PATH}/presupuestos/${created.id}`)
  } catch {
    void 0
  }
}

const getActions = (r: InteriorBudgetListItem): { label: string; icon: string; onClick: () => void }[] => {
  const items: { label: string; icon: string; onClick: () => void }[] = [
    { label: 'Ver ficha', icon: 'lucide:eye', onClick: () => goDetail(r) },
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => goDetail(r) },
    { label: 'Duplicar versión', icon: 'lucide:copy', onClick: () => void duplicateRow(r) },
  ]
  if (r.status === 'DRAFT') {
    items.push({
      label: 'Eliminar',
      icon: 'lucide:trash-2',
      onClick: () => openDeleteConfirm(r),
    })
  }
  return items
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Presupuestos
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Cliente → proyecto → presupuesto jerárquico (nivel · ambiente · categoría · ítems)
        </p>
      </div>
      <BaseButton variant="primary" class="flex items-center gap-2 justify-center shrink-0" @click="goNew">
        <AppIcon icon="lucide:plus" :size="18" />
        Nuevo presupuesto
      </BaseButton>
    </div>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }"
    >
      <div class="overflow-x-auto">
        <div v-if="isLoading" class="flex justify-center py-16 px-4">
          <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
        </div>
        <template v-else>
          <DataTable
            empty-text="Sin presupuestos registrados."
            :columns="columns"
            :data="rows"
            row-key="id"
          >
            <template #toolbar>
              <div class="flex-1 min-w-0">
                <SearchInput v-model="searchInput" placeholder="Buscar por código, proyecto o cliente…" />
              </div>
              <div class="w-full sm:w-[200px] shrink-0">
                <FormSelect v-model="filterStatus" :options="statusOptions" placeholder="Estado" />
              </div>
            </template>
            <template #row="{ row }">
              <td class="py-3 px-4">
                <button
                  type="button"
                  class="font-medium text-left hover:underline"
                  :style="{ color: 'var(--color-primary)' }"
                  @click="goDetail(row as InteriorBudgetListItem)"
                >
                  {{ (row as InteriorBudgetListItem).code }}
                </button>
              </td>
              <td class="py-3 px-4 text-sm">
                <button type="button" class="text-left" @click="goDetail(row as InteriorBudgetListItem)">
                  v{{ (row as InteriorBudgetListItem).version }}
                </button>
              </td>
              <td class="py-3 px-4 text-sm max-w-[260px] truncate">
                <button type="button" class="text-left w-full truncate" @click="goDetail(row as InteriorBudgetListItem)">
                  <span :style="{ color: 'var(--color-text-primary)' }">
                    {{ (row as InteriorBudgetListItem).projectCode }} · {{ (row as InteriorBudgetListItem).projectName }}
                  </span>
                </button>
              </td>
              <td class="py-3 px-4 text-sm max-w-[220px] truncate" :style="{ color: 'var(--color-text-secondary)' }">
                {{ (row as InteriorBudgetListItem).clientFullName }}
              </td>
              <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-primary)' }">
                {{ formatSol((row as InteriorBudgetListItem).grandTotal) }}
              </td>
              <td class="py-3 px-4">
                <Badge variant="neutral">{{ statusLabel((row as InteriorBudgetListItem).status) }}</Badge>
              </td>
              <td class="py-3 px-4 text-right">
                <ActionsDropdown :items="getActions(row as InteriorBudgetListItem)" />
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
    </div>

    <BaseModal v-model="showDeleteModal" :closable="true" size="sm" @close="closeDeleteModal">
      <template #title>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--color-error-subtle);">
            <AppIcon icon="lucide:trash-2" :size="16" style="color: var(--color-error);" />
          </div>
          <span class="text-base font-semibold" style="color: var(--color-text-primary);">Eliminar presupuesto</span>
        </div>
      </template>
      <div class="p-4 space-y-3">
        <p class="text-sm" style="color: var(--color-text-secondary);">
          ¿Eliminar el borrador
          <span class="font-semibold" style="color: var(--color-text-primary);">{{ deleteTarget?.code }}</span>
          v{{ deleteTarget?.version }}?
        </p>
        <p class="text-xs px-3 py-2 rounded-lg" style="background: var(--color-warning-subtle); color: var(--color-warning);">
          Solo los presupuestos en estado borrador se pueden eliminar.
        </p>
      </div>
      <div class="flex justify-end gap-3 p-4 border-t" style="border-color: var(--color-border);">
        <BaseButton variant="ghost" @click="closeDeleteModal">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="isDeletingBudget" @click="executeDelete">
          <AppIcon icon="lucide:trash-2" :size="16" class="mr-1" />
          Eliminar
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
