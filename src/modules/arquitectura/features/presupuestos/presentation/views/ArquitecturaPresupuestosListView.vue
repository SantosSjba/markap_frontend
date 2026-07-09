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
  ActionsDropdown,
} from '@shared/components'
import { useArquitecturaBudgetSummariesList } from '../../application/useArquitecturaBudgets'
import type {
  ArquitecturaBudgetSummaryListItem,
  ListArquitecturaBudgetSummariesParams,
} from '../../domain/budget.types'
import {
  PROJECT_TYPE_LABELS,
  projectStatusLabel,
  formatSol,
} from '@modules/arquitectura/features/proyectos/presentation/labels'
import { useArquitecturaProjectStageOptions } from '@modules/arquitectura/features/proyectos/application/useArquitecturaProjectStageOptions'
import { ARQUITECTURA_BASE_PATH } from '@modules/arquitectura/config/routes.constants'

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
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1200px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Presupuestos
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Vista transversal por proyecto. Cada presupuesto se edita en el detalle del proyecto.
        </p>
      </div>
      <BaseButton variant="primary" @click="goNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nuevo presupuesto
      </BaseButton>
    </div>

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

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
    >
      <div v-if="isLoading" class="flex justify-center py-20">
        <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
      </div>
      <div
        v-else-if="isError"
        class="text-center py-16 text-sm space-y-3"
        :style="{ color: 'var(--color-text-secondary)' }"
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
              <div class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
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
              <span v-else :style="{ color: 'var(--color-text-muted)' }">Sin armar</span>
            </td>
            <td class="py-2.5 px-3 text-sm text-xs" :style="{ color: 'var(--color-text-muted)' }">
              {{
                (row as ArquitecturaBudgetSummaryListItem).budgetUpdatedAt
                  ? new Date((row as ArquitecturaBudgetSummaryListItem).budgetUpdatedAt!).toLocaleDateString('es-PE')
                  : '—'
              }}
            </td>
            <td class="py-2.5 px-3 text-right">
              <ActionsDropdown :items="rowActions(row as ArquitecturaBudgetSummaryListItem)" />
            </td>
          </template>
        </DataTable>
        <div v-if="total > 0" class="p-4 border-t" :style="{ borderColor: 'var(--color-border)' }">
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
</template>
