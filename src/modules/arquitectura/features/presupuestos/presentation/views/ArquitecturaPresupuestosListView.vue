<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { formatDateTime } from '@shared/utils/formatters'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import { useArquitecturaBudgetSummariesList } from '../composables/useArquitecturaBudgets'
import type {
  ArquitecturaBudgetSummaryListItem,
  ListArquitecturaBudgetSummariesParams,
} from '../../domain/budget.types'
import {
  PROJECT_TYPE_LABELS,
  projectStatusLabel,
  formatSol,
} from '../../../proyectos/presentation/labels'
import { useArquitecturaProjectStageOptions } from '../../../proyectos/presentation/composables/useArquitecturaProjectStageOptions'
import { ARQUITECTURA_BASE_PATH } from '../../../../config/routes.constants'
const router = useRouter()
const ITEMS = 10

const listParams = ref<ListArquitecturaBudgetSummariesParams>({
  page: 1,
  limit: ITEMS,
  onlyWithBudget: false,
})
const searchInput = ref('')
const filterOnlyWithBudget = ref<'ALL' | 'WITH_BUDGET'>('ALL')

watch(
  [searchInput, filterOnlyWithBudget],
  () => {
    listParams.value = {
      ...listParams.value,
      page: 1,
      search: searchInput.value.trim() || undefined,
      onlyWithBudget: filterOnlyWithBudget.value === 'WITH_BUDGET',
    }
  },
  { immediate: true },
)

const { data: result, isLoading, isError, refetch } = useArquitecturaBudgetSummariesList(listParams)

const rows = computed(() => result.value?.data ?? [])
const total = computed(() => result.value?.total ?? 0)

const paginationProps = computed(() => {
  const limit = listParams.value.limit ?? ITEMS
  const page = listParams.value.page ?? 1
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

const onPage = (p: number) => {
  listParams.value = { ...listParams.value, page: p }
}
const onSize = (s: number) => {
  listParams.value = { ...listParams.value, limit: s, page: 1 }
}

const { stageLabelMap } = useArquitecturaProjectStageOptions()

const columns = [
  { key: 'code', label: 'Código', align: 'left' as const },
  { key: 'project', label: 'Proyecto', align: 'left' as const },
  { key: 'client', label: 'Cliente', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
  { key: 'sections', label: 'Secciones', align: 'left' as const },
  { key: 'items', label: 'Partidas', align: 'left' as const },
  { key: 'total', label: 'Total presup.', align: 'left' as const },
  { key: 'updated', label: 'Actualizado', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

const formatMoney = (row: ArquitecturaBudgetSummaryListItem) => {
  if (row.currency === 'USD') {
    return `US$ ${row.priceTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return formatSol(row.priceTotal)
}

const goBudget = (row: ArquitecturaBudgetSummaryListItem) => {
  router.push({
    path: `${ARQUITECTURA_BASE_PATH}/proyectos/${row.projectId}`,
    query: { tab: 'presupuesto' },
  })
}

const goNew = () => router.push(`${ARQUITECTURA_BASE_PATH}/presupuestos/nuevo`)

const rowActions = (row: ArquitecturaBudgetSummaryListItem) => [
  {
    id: 'open',
    label: row.hasBudget ? 'Abrir presupuesto' : 'Configurar presupuesto',
    icon: 'lucide:file-spreadsheet',
    onClick: () => goBudget(row),
  },
  {
    id: 'project',
    label: 'Ver proyecto',
    icon: 'lucide:folder-kanban',
    onClick: () => router.push(`${ARQUITECTURA_BASE_PATH}/proyectos/${row.projectId}`),
  },
]
</script>

<template>
  <div class="max-w-[1200px] mx-auto space-y-6">
    <PageHeader
      title="Presupuestos"
      subtitle="Vista transversal por proyecto. Cada presupuesto se edita en el detalle del proyecto."
    >
      <template #actions>
        <BaseButton variant="primary" @click="goNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nuevo presupuesto
      </BaseButton>
      </template>
    </PageHeader>

    <div class="flex flex-wrap items-center gap-3">
      <SearchInput
        v-model="searchInput"
        placeholder="Buscar por código, proyecto o cliente…"
        class="w-full sm:w-72"
      />
      <FormSelect
        v-model="filterOnlyWithBudget"
        label=""
        :options="[
          { value: 'ALL', label: 'Todos los proyectos' },
          { value: 'WITH_BUDGET', label: 'Con presupuesto armado' },
        ]"
        class="w-52"
      />
    </div>

    <BaseCard padding="none" class="block overflow-hidden">
      <LoadingState v-if="isLoading" class="py-20" />
      <div
        v-else-if="isError"
        class="text-center py-16 text-sm space-y-3 text-gray-500 dark:text-gray-400"
      >
        No se pudo cargar el listado.
        <div>
          <BaseButton variant="outline" size="sm" @click="() => refetch()">Reintentar</BaseButton>
        </div>
      </div>
      <template v-else>
        <DataTable
          :columns="columns"
          :data="rows"
          row-key="projectId"
          empty-text="No hay proyectos que coincidan con el filtro."
        >
          <template #row="{ row }">
            <td class="py-2.5 px-3 text-sm font-medium">{{ (row as ArquitecturaBudgetSummaryListItem).projectCode }}</td>
            <td class="py-2.5 px-3 text-sm">
              <div>{{ (row as ArquitecturaBudgetSummaryListItem).projectName }}</div>
              <div class="text-xs text-gray-400 dark:text-gray-500">
                {{ PROJECT_TYPE_LABELS[(row as ArquitecturaBudgetSummaryListItem).projectType as keyof typeof PROJECT_TYPE_LABELS] ?? (row as ArquitecturaBudgetSummaryListItem).projectType }}
              </div>
            </td>
            <td class="py-2.5 px-3 text-sm">
              {{ (row as ArquitecturaBudgetSummaryListItem).client.fullName }}
            </td>
            <td class="py-2.5 px-3 text-sm">
              <Badge variant="info">
                {{ projectStatusLabel((row as ArquitecturaBudgetSummaryListItem).projectStatus, stageLabelMap) }}
              </Badge>
            </td>
            <td class="py-2.5 px-3 text-sm">{{ (row as ArquitecturaBudgetSummaryListItem).sectionCount }}</td>
            <td class="py-2.5 px-3 text-sm">{{ (row as ArquitecturaBudgetSummaryListItem).lineItemCount }}</td>
            <td class="py-2.5 px-3 text-sm font-medium">
              <span v-if="(row as ArquitecturaBudgetSummaryListItem).hasBudget">
                {{ formatMoney(row as ArquitecturaBudgetSummaryListItem) }}
              </span>
              <span class="text-gray-400 dark:text-gray-500" v-else>Sin armar</span>
            </td>
            <td class="py-2.5 px-3 text-sm text-xs text-gray-400 dark:text-gray-500">
              {{
                (row as ArquitecturaBudgetSummaryListItem).budgetUpdatedAt
                  ? formatDateTime((row as ArquitecturaBudgetSummaryListItem).budgetUpdatedAt!)
                  : '—'
              }}
            </td>
            <td class="py-2.5 px-3 text-right">
              <ActionsDropdown :items="rowActions(row as ArquitecturaBudgetSummaryListItem)" />
            </td>
          </template>
        </DataTable>
        <div v-if="total > 0" class="p-4 border-t border-gray-200 dark:border-gray-800">
          <BasePagination
            v-bind="paginationProps"
            :show-page-size="true"
            @update:current-page="onPage"
            @update:page-size="onSize"
          />
        </div>
      </template>
    </BaseCard>
  </div>
</template>
