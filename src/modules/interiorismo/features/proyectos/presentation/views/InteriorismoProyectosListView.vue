<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, filterActions } = useApplicationAccess('interiorismo')

import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { useService } from '@shared/presentation/di/services'
import { DIRECTORY } from '@shared/application/ports/directory.port'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatShortDate } from '@shared/utils/formatters'
import { formatMoney, splitCurrencyTotals } from '@shared/utils/money'
import { INTERIORISMO_APP_SLUG } from '../../../../config/app.constants'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import {
  useInteriorProjectStats,
  useInteriorProjectsList,
  useUpdateInteriorProject,
} from '../composables/useInteriorProjects'
import type {
  InteriorProjectListItem,
  InteriorProjectStatus,
  InteriorProjectType,
  ListInteriorProjectsParams,
} from '../../domain/project.types'
import { PROJECT_TYPE_LABELS, projectStatusLabel } from '../labels'
import { useInteriorProjectStageOptions } from '../composables/useInteriorProjectStageOptions'
/**
 * Listado de proyectos (patrón Procesos de Venta): indicadores compactos, una fila por proyecto
 * con cliente, etapa, presupuesto en su moneda, cobrado y avance. La etapa llega por `?status=`
 * (así «En progreso» del menú anterior abre el listado ya filtrado).
 */

const router = useRouter()
const route = useRoute()
const PAGE_SIZE = 10

// ── Filtros ──
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const filterStatus = ref<'ALL' | InteriorProjectStatus>(
  typeof route.query.status === 'string' ? (route.query.status as InteriorProjectStatus) : 'ALL',
)
const filterType = ref<'ALL' | InteriorProjectType>('ALL')
const filterAgent = ref('ALL')
const page = ref(1)
const pageSize = ref(PAGE_SIZE)

watch(
  () => route.query.status,
  (s) => {
    filterStatus.value = typeof s === 'string' ? (s as InteriorProjectStatus) : 'ALL'
  },
)
watch([debouncedSearch, filterStatus, filterType, filterAgent], () => {
  page.value = 1
})

const listParams = computed<ListInteriorProjectsParams>(() => ({
  page: page.value,
  limit: pageSize.value,
  search: debouncedSearch.value.trim() || undefined,
  status: filterStatus.value === 'ALL' ? undefined : filterStatus.value,
  projectType: filterType.value === 'ALL' ? undefined : filterType.value,
  agentId: filterAgent.value === 'ALL' ? undefined : filterAgent.value,
}))

const {
  data: result,
  isLoading,
  isFetching,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useInteriorProjectsList(listParams)
const rows = computed(() => result.value?.data ?? [])
const total = computed(() => result.value?.total ?? 0)

const { filterOptions: stageFilterOptions, stageLabelMap } = useInteriorProjectStageOptions({
  includeCancelled: true,
})
const statusOptions = computed(() => [{ value: 'ALL', label: 'Todas las etapas' }, ...stageFilterOptions.value])
const typeOptions = [
  { value: 'ALL', label: 'Todos los tipos' },
  ...(Object.keys(PROJECT_TYPE_LABELS) as InteriorProjectType[]).map((k) => ({ value: k, label: PROJECT_TYPE_LABELS[k] })),
]
const directory = useService(DIRECTORY)
const { data: agentsRes } = useQuery({
  queryKey: ['agents', INTERIORISMO_APP_SLUG, 'interior-pick'],
  queryFn: () => directory.listAgents({ applicationSlug: INTERIORISMO_APP_SLUG, limit: 500, page: 1 }),
})
const agentOptions = computed(() => [
  { value: 'ALL', label: 'Todos los responsables' },
  ...(agentsRes.value?.data ?? []).map((a) => ({ value: a.id, label: a.fullName })),
])

// ── Indicadores ──
const statsQuery = useInteriorProjectStats()
const stats = computed(() => statsQuery.data.value)
const activeCount = computed(() => {
  const s = stats.value?.byStatus
  return s ? s.DESIGN + s.QUOTE + s.APPROVED + s.IN_PROGRESS : 0
})
const portfolio = computed(() => splitCurrencyTotals(stats.value?.activeBudgetByCurrency ?? [], true))

// ── Tabla ──
const columns = [
  { key: 'project', label: 'Proyecto', align: 'left' as const },
  { key: 'client', label: 'Cliente', align: 'left' as const },
  { key: 'stage', label: 'Etapa', align: 'left' as const },
  { key: 'money', label: 'Presupuesto', align: 'left' as const },
  { key: 'progress', label: 'Avance', align: 'left' as const },
  { key: 'dates', label: 'Fechas', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

const asRow = (r: unknown) => r as InteriorProjectListItem
const STATUS_DOT: Record<InteriorProjectStatus, string> = {
  DESIGN: 'bg-gray-400',
  QUOTE: 'bg-warning-500',
  APPROVED: 'bg-blue-light-500',
  IN_PROGRESS: 'bg-brand-500',
  FINISHED: 'bg-success-500',
  CANCELLED: 'bg-error-500',
}
const STATUS_BADGE: Record<InteriorProjectStatus, 'neutral' | 'warning' | 'info' | 'primary' | 'success' | 'error'> = {
  DESIGN: 'neutral',
  QUOTE: 'warning',
  APPROVED: 'info',
  IN_PROGRESS: 'primary',
  FINISHED: 'success',
  CANCELLED: 'error',
}
const paidPct = (r: InteriorProjectListItem) =>
  r.estimatedBudget ? Math.min(100, Math.round((r.paidTotal / r.estimatedBudget) * 100)) : null
const dateRange = (r: InteriorProjectListItem) =>
  r.startDate || r.estimatedEndDate
    ? `${r.startDate ? formatShortDate(r.startDate) : '—'} – ${r.estimatedEndDate ? formatShortDate(r.estimatedEndDate) : '—'}`
    : 'Sin fechas'

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
const onPage = (p: number) => (page.value = p)
const onSize = (s: number) => {
  pageSize.value = s
  page.value = 1
}

// ── Navegación y acciones ──
const goDetail = (r: InteriorProjectListItem) => router.push(`${INTERIORISMO_BASE_PATH}/proyectos/${r.id}`)
const goEdit = (r: InteriorProjectListItem) => router.push(`${INTERIORISMO_BASE_PATH}/proyectos/${r.id}/editar`)
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

const getActions = (r: InteriorProjectListItem) => {
  const items: { label: string; icon: string; onClick: () => void }[] = [
    { label: 'Ver ficha', icon: 'lucide:eye', onClick: () => goDetail(r) },
    { label: 'Presupuesto', icon: 'lucide:file-spreadsheet', onClick: () => router.push({ path: `${INTERIORISMO_BASE_PATH}/proyectos/${r.id}`, query: { tab: 'presupuesto' } }) },
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => goEdit(r) },
  ]
  if (r.status !== 'CANCELLED') {
    items.push({ label: 'Cancelar proyecto', icon: 'lucide:ban', onClick: () => openCancelConfirm(r) })
  }
  return items
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Proyectos" subtitle="Diseño → cotización → aprobación → ejecución → finalizado">
      <template #actions>
        <BaseButton v-if="canWrite" variant="primary" icon="lucide:plus" class="w-full justify-center sm:w-auto" @click="goNew">
          Nuevo proyecto
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Resumen -->
    <div
      v-if="statsQuery.isError.value"
      class="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-warning-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-warning-500/15"
    >
      <span class="max-w-xl text-error-500 dark:text-error-400">{{ getApiErrorMessage(statsQuery.error.value) }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => statsQuery.refetch()">Reintentar</BaseButton>
    </div>
    <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatsCard compact title="Activos" :value="String(activeCount)" :subtitle="`${stats?.createdThisMonth ?? 0} nuevos este mes`" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:folder-kanban" :size="20" color="var(--color-primary)" /></template>
      </StatsCard>
      <StatsCard compact title="En cotización" :value="String(stats?.byStatus.QUOTE ?? 0)" :subtitle="`${stats?.byStatus.DESIGN ?? 0} en diseño`" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:file-spreadsheet" :size="20" color="#d97706" /></template>
      </StatsCard>
      <StatsCard compact title="En ejecución" :value="String(stats?.byStatus.IN_PROGRESS ?? 0)" :subtitle="`${stats?.byStatus.APPROVED ?? 0} aprobados`" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:hammer" :size="20" color="#2563eb" /></template>
      </StatsCard>
      <StatsCard compact title="Finalizados" :value="String(stats?.byStatus.FINISHED ?? 0)" :subtitle="`${stats?.byStatus.CANCELLED ?? 0} cancelados`" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:check-circle-2" :size="20" color="#16a34a" /></template>
      </StatsCard>
      <StatsCard
        compact
        class="col-span-2 sm:col-span-1"
        title="Cartera activa"
        :value="portfolio.main"
        :subtitle="portfolio.rest || 'presupuesto estimado'"
        :loading="statsQuery.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:banknote" :size="20" color="#ca8a04" /></template>
      </StatsCard>
    </div>

    <BaseCard padding="none" class="block overflow-hidden">
      <div v-if="listQueryError" class="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(listFetchError) }}</p>
        <BaseButton variant="outline" size="sm" @click="() => refetchList()">Reintentar</BaseButton>
      </div>
      <template v-else>
        <DataTable
          :columns="columns"
          :data="rows"
          row-key="id"
          :loading="isLoading || isFetching"
          empty-text="No hay proyectos con estos filtros."
        >
          <template #toolbar>
            <div class="min-w-0 flex-1">
              <SearchInput v-model="searchInput" placeholder="Buscar por código, nombre o cliente..." />
            </div>
            <div class="flex shrink-0 flex-wrap gap-3 sm:flex-nowrap">
              <div class="w-full min-w-0 sm:w-[170px]"><FormSelect v-model="filterStatus" :options="statusOptions" /></div>
              <div class="w-full min-w-0 sm:w-[170px]"><FormSelect v-model="filterType" :options="typeOptions" /></div>
              <div class="w-full min-w-0 sm:w-[190px]"><FormSelect v-model="filterAgent" :options="agentOptions" /></div>
            </div>
          </template>
          <template #row="{ row }">
            <td class="px-4 py-3">
              <button type="button" class="flex items-start gap-3 text-left" @click="goDetail(asRow(row))">
                <span class="mt-1.5 size-2 shrink-0 rounded-full" :class="STATUS_DOT[asRow(row).status]" />
                <span class="min-w-0">
                  <span class="block font-medium text-gray-800 hover:text-brand-500 dark:text-white/90 dark:hover:text-brand-400">
                    {{ asRow(row).name }}
                  </span>
                  <span class="mt-0.5 block text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400">{{ asRow(row).code }}</span>
                  <span v-if="asRow(row).district" class="mt-0.5 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <AppIcon icon="lucide:map-pin" :size="12" class="shrink-0" />
                    {{ asRow(row).district?.name }}
                  </span>
                </span>
              </button>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-col gap-0.5 text-sm">
                <span class="flex items-center gap-1.5 text-gray-800 dark:text-white/90">
                  <AppIcon icon="lucide:user" :size="16" color="var(--color-text-muted)" class="shrink-0" />
                  {{ asRow(row).client.fullName }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ asRow(row).client.documentNumber }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-col items-start gap-1.5">
                <Badge :variant="STATUS_BADGE[asRow(row).status]">{{ projectStatusLabel(asRow(row).status, stageLabelMap) }}</Badge>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ PROJECT_TYPE_LABELS[asRow(row).projectType] }}<template v-if="asRow(row).interventionLevel"> · Nivel {{ asRow(row).interventionLevel }}</template>
                </span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-col gap-0.5 text-sm">
                <span class="font-medium text-gray-800 dark:text-white/90">{{ formatMoney(asRow(row).estimatedBudget, asRow(row).currency) }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  Cobrado {{ formatMoney(asRow(row).paidTotal, asRow(row).currency) }}<template v-if="paidPct(asRow(row)) !== null"> · {{ paidPct(asRow(row)) }}%</template>
                </span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex w-28 items-center gap-2">
                <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                  <div class="h-full rounded-full bg-brand-500" :style="{ width: `${Math.min(100, Math.max(0, asRow(row).progressPct))}%` }" />
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ Math.round(asRow(row).progressPct) }}%</span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">{{ dateRange(asRow(row)) }}</td>
            <td class="px-4 py-3 text-right">
              <ActionsDropdown :items="filterActions(getActions(asRow(row)))" />
            </td>
          </template>
        </DataTable>
        <div class="border-t border-gray-200 dark:border-gray-800">
          <BasePagination v-bind="paginationProps" :show-page-size="true" @update:current-page="onPage" @update:page-size="onSize" />
        </div>
      </template>
    </BaseCard>

    <BaseModal v-model="showCancelModal" :closable="true" size="sm" @close="closeCancelModal">
      <template #title>
        <div class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/15">
            <AppIcon class="text-error-500 dark:text-error-400" icon="lucide:ban" :size="16" />
          </div>
          <span class="text-base font-semibold text-gray-800 dark:text-white/90">Cancelar proyecto</span>
        </div>
      </template>
      <div class="space-y-3 p-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          ¿Marcar como cancelado el proyecto
          <span class="font-semibold text-gray-800 dark:text-white/90">{{ cancelTarget?.code }}</span>
          — {{ cancelTarget?.name }}?
        </p>
        <p class="rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-600 dark:bg-warning-500/15 dark:text-orange-400">
          El proyecto pasará a «Cancelado». Puede revertirlo desde Editar.
        </p>
      </div>
      <div class="flex justify-end gap-3 border-t border-gray-200 p-4 dark:border-gray-800">
        <BaseButton variant="ghost" @click="closeCancelModal">Cerrar</BaseButton>
        <BaseButton variant="danger" icon="lucide:ban" :loading="isCancelPending" @click="executeCancel">Confirmar</BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
