<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  BasePagination,
  Badge,
  DataTable,
  SearchInput,
  FormSelect,
  AppIcon,
} from '@shared/components'
import { useInteriorBudgetsList } from '../../application/useInteriorBudgets'
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
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1200px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Presupuestos
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Cliente → proyecto → presupuesto jerárquico (nivel · ambiente · categoría · ítems)
        </p>
      </div>
      <BaseButton variant="primary" class="shrink-0" @click="goNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nuevo presupuesto
      </BaseButton>
    </div>

    <div
      class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between p-4 rounded-xl border"
      :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
    >
      <SearchInput
        v-model="searchInput"
        placeholder="Buscar por código, proyecto o cliente…"
        class="flex-1 max-w-md"
      />
      <FormSelect
        v-model="filterStatus"
        :options="statusOptions"
        label="Estado"
        class="w-full sm:w-52"
      />
    </div>

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
    </div>

    <template v-else>
      <DataTable
        empty-text="Sin presupuestos registrados."
        :columns="columns"
        :data="
          rows.map((r) => ({
            ...r,
            version: `v${r.version}`,
            project: `${r.projectCode} · ${r.projectName}`,
            client: `${r.clientFullName}`,
            total: formatSol(r.grandTotal),
          }))
        "
        row-key="id"
      >
        <template #row="{ row }">
          <td
            class="py-2 px-3 text-sm font-medium cursor-pointer"
            @click="goDetail(row as InteriorBudgetListItem)"
          >
            {{ (row as InteriorBudgetListItem).code }}
          </td>
          <td class="py-2 px-3 text-sm cursor-pointer" @click="goDetail(row as InteriorBudgetListItem)">
            {{ (row as any).version }}
          </td>
          <td
            class="py-2 px-3 text-sm max-w-[260px] truncate cursor-pointer"
            @click="goDetail(row as InteriorBudgetListItem)"
          >
            {{ (row as any).project }}
          </td>
          <td
            class="py-2 px-3 text-sm max-w-[220px] truncate cursor-pointer"
            @click="goDetail(row as InteriorBudgetListItem)"
          >
            {{ (row as any).client }}
          </td>
          <td class="py-2 px-3 text-sm cursor-pointer" @click="goDetail(row as InteriorBudgetListItem)">
            {{ (row as any).total }}
          </td>
          <td class="py-2 px-3 cursor-pointer" @click="goDetail(row as InteriorBudgetListItem)">
            <Badge variant="neutral">{{ statusLabel((row as InteriorBudgetListItem).status) }}</Badge>
          </td>
        </template>
      </DataTable>

      <BasePagination v-bind="paginationProps" @page-change="onPage" @size-change="onSize" />
    </template>
  </div>
</template>
