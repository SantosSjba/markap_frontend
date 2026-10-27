<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('ventas')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { formatCurrency, formatCurrencyRounded, formatShortDate } from '@shared/utils/formatters'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { useVentasProcessesList, useVentasProcessStats } from '../composables/useVentasSales'
import type { SaleProcessListRow } from '../../domain/sales.types'
import { useVentasPipelineStages } from '../../../ventas-configuracion/presentation/composables/useVentasConfig'
import {
  PROCESS_STATUS_OPTIONS,
  processStatusBadgeVariant,
  processStatusLabel,
} from '../../domain/pipeline.constants'
import ProcessStageBadge from '../components/ProcessStageBadge.vue'
/**
 * Procesos de venta: resumen compacto (activos, ganados, caídos, nuevos del mes y valor en proceso
 * por moneda) y listado con filtros por etapa y estado.
 */
const router = useRouter()
const { stageOptions, query: pipelineConfigQuery } = useVentasPipelineStages()

const ITEMS = 10
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const filterStage = ref('')
const filterStatus = ref('')
const page = ref(1)
const limit = ref(ITEMS)

watch([debouncedSearch, filterStage, filterStatus], () => {
  page.value = 1
})

const listParams = computed(() => ({
  page: page.value,
  limit: limit.value,
  search: debouncedSearch.value.trim() || undefined,
  pipelineStage: filterStage.value || undefined,
  status: filterStatus.value || undefined,
}))

const {
  data: listResult,
  isFetching,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useVentasProcessesList(listParams)
const rows = computed(() => listResult.value?.data ?? [])
const total = computed(() => listResult.value?.total ?? 0)

const statsQuery = useVentasProcessStats()
const stats = computed(() => statsQuery.data.value)
/** Valor en proceso: la primera moneda como cifra principal y el resto debajo */
const valueMain = computed(() => {
  const v = stats.value?.activeValueByCurrency?.[0]
  return v ? formatCurrencyRounded(v.amount, v.currency) : formatCurrencyRounded(0, 'PEN')
})
const valueRest = computed(() =>
  (stats.value?.activeValueByCurrency ?? [])
    .slice(1)
    .map((v) => formatCurrencyRounded(v.amount, v.currency))
    .join(' · '),
)
const activeStagesText = computed(() => {
  const byStage = stats.value?.activeByStage ?? {}
  const first = stageOptions.value.find((s) => byStage[s.value])
  return first ? `${byStage[first.value]} en ${first.label.toLowerCase()}` : 'en el embudo'
})

const paginationProps = computed(() => {
  const totalPages = Math.max(1, Math.ceil(total.value / limit.value))
  return {
    currentPage: page.value,
    totalPages,
    totalItems: total.value,
    pageSize: limit.value,
    hasPrevPage: page.value > 1,
    hasNextPage: page.value < totalPages,
  }
})

const stageFilterOptions = computed(() => [{ value: '', label: 'Todas las etapas' }, ...stageOptions.value])
const statusFilterOptions = [{ value: '', label: 'Todos los estados' }, ...PROCESS_STATUS_OPTIONS]

const ownerName = (row: SaleProcessListRow) => row.owners?.[0]?.fullName ?? null
const extraBuyers = (row: SaleProcessListRow) => Math.max(0, (row.buyers?.length ?? 1) - 1)
const extraOwners = (row: SaleProcessListRow) => Math.max(0, (row.owners?.length ?? 0) - 1)

const tableColumns = [
  {
    key: 'proceso',
    label: 'Proceso',
    sortable: true,
    sortAccessor: (r: unknown) => (r as SaleProcessListRow).code,
  },
  {
    key: 'participantes',
    label: 'Participantes',
    sortable: true,
    sortAccessor: (r: unknown) => (r as SaleProcessListRow).buyer.fullName,
  },
  {
    key: 'etapa',
    label: 'Etapa',
    sortable: true,
    sortAccessor: (r: unknown) => (r as SaleProcessListRow).pipelineStage,
  },
  {
    key: 'precio',
    label: 'Precio',
    sortable: true,
    sortType: 'basic' as const,
    sortAccessor: (r: unknown) => (r as SaleProcessListRow).property.salePrice ?? -1,
  },
  {
    key: 'asesor',
    label: 'Asesor',
    sortable: true,
    sortAccessor: (r: unknown) => (r as SaleProcessListRow).agent?.fullName ?? '',
  },
  { key: 'actions', label: '', align: 'right' as const },
]

function goDetail(row: SaleProcessListRow) {
  void router.push({ name: 'ventas-proceso-detalle', params: { id: row.id } })
}

const getActions = (row: SaleProcessListRow) => [
  { label: 'Ver detalle', icon: 'lucide:eye', onClick: () => goDetail(row) },
  { label: 'Ver en pipeline', icon: 'lucide:columns-3', onClick: () => router.push({ name: 'ventas-procesos-pipeline' }) },
]
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Procesos de venta" subtitle="Separación → arras → minuta → escritura pública">
      <template #actions>
        <div class="flex gap-2 w-full sm:w-auto">
          <BaseButton
            variant="outline"
            icon="lucide:columns-3"
            class="flex-1 sm:flex-none justify-center"
            @click="router.push({ name: 'ventas-procesos-pipeline' })"
          >
            Pipeline
          </BaseButton>
          <BaseButton
            v-if="canWrite"
            variant="primary"
            icon="lucide:plus"
            class="flex-1 sm:flex-none justify-center"
            @click="router.push({ name: 'ventas-procesos-nuevo' })"
          >
            Nuevo Proceso
          </BaseButton>
        </div>
      </template>
    </PageHeader>

    <!-- Resumen -->
    <div
      v-if="statsQuery.isError.value"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3 border-gray-200 dark:border-gray-800 bg-warning-50 dark:bg-warning-500/15"
    >
      <span class="max-w-xl text-error-500 dark:text-error-400">{{ getApiErrorMessage(statsQuery.error.value) }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => statsQuery.refetch()">Reintentar</BaseButton>
    </div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatsCard compact title="Activos" :value="String(stats?.active ?? 0)" :subtitle="activeStagesText" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:git-branch" :size="20" color="var(--color-primary)" /></template>
      </StatsCard>
      <StatsCard compact title="Ganados" :value="String(stats?.won ?? 0)" subtitle="con cierre" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:trophy" :size="20" color="#16a34a" /></template>
      </StatsCard>
      <StatsCard compact title="Caídos" :value="String(stats?.lost ?? 0)" subtitle="no continuaron" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:ban" :size="20" color="#dc2626" /></template>
      </StatsCard>
      <StatsCard compact title="Nuevos" :value="String(stats?.createdThisMonth ?? 0)" subtitle="este mes" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:sparkles" :size="20" color="#2563eb" /></template>
      </StatsCard>
      <StatsCard
        compact
        class="col-span-2 sm:col-span-1"
        title="Valor en proceso"
        :value="valueMain"
        :subtitle="valueRest || 'precio de lista'"
        :loading="statsQuery.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:banknote" :size="20" color="#ca8a04" /></template>
      </StatsCard>
    </div>

    <div
      v-if="pipelineConfigQuery.isError.value"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3 border-gray-200 dark:border-gray-800 bg-warning-50 dark:bg-warning-500/15"
    >
      <span class="text-gray-800 dark:text-white/90">No se cargó la configuración de etapas; se muestran valores por defecto.</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => pipelineConfigQuery.refetch()">Reintentar</BaseButton>
    </div>

    <BaseCard padding="none" class="block overflow-hidden">
      <div class="overflow-x-auto">
        <div v-if="listQueryError" class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
          <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(listFetchError) }}</p>
          <BaseButton variant="outline" size="sm" @click="() => refetchList()">Reintentar</BaseButton>
        </div>
        <template v-else>
          <DataTable
            :columns="tableColumns"
            :data="rows"
            row-key="id"
            :loading="isFetching"
            empty-text="No hay procesos con estos filtros."
          >
            <template #toolbar>
              <div class="flex-1 min-w-0">
                <SearchInput v-model="searchInput" placeholder="Buscar por código, comprador, propietario o inmueble..." />
              </div>
              <div class="flex flex-wrap gap-3 shrink-0 sm:flex-nowrap">
                <div class="w-full sm:w-[190px] min-w-0">
                  <FormSelect v-model="filterStage" :options="stageFilterOptions" placeholder="Todas las etapas" />
                </div>
                <div class="w-full sm:w-[170px] min-w-0">
                  <FormSelect v-model="filterStatus" :options="statusFilterOptions" placeholder="Todos los estados" />
                </div>
              </div>
            </template>
            <template #row="{ row }">
              <td class="py-3 px-4">
                <button type="button" class="flex items-start gap-3 text-left" @click="goDetail(row as SaleProcessListRow)">
                  <span
                    class="mt-1.5 size-2 shrink-0 rounded-full"
                    :class="{
                      'bg-blue-light-500': (row as SaleProcessListRow).status === 'ACTIVE',
                      'bg-success-500': (row as SaleProcessListRow).status === 'WON',
                      'bg-error-500': (row as SaleProcessListRow).status === 'LOST',
                    }"
                  />
                  <span class="min-w-0">
                    <span class="flex items-center gap-2">
                      <AppIcon icon="lucide:handshake" :size="16" color="var(--color-text-muted)" class="shrink-0" />
                      <span class="font-medium text-gray-800 dark:text-white/90">{{ (row as SaleProcessListRow).code }}</span>
                    </span>
                    <span class="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <AppIcon icon="lucide:map-pin" :size="14" class="shrink-0" />
                      {{ (row as SaleProcessListRow).property.code }} · {{ (row as SaleProcessListRow).property.addressLine }}
                    </span>
                    <span v-if="(row as SaleProcessListRow).title" class="mt-0.5 block text-xs text-gray-400 dark:text-gray-500">
                      {{ (row as SaleProcessListRow).title }}
                    </span>
                  </span>
                </button>
              </td>
              <td class="py-3 px-4">
                <div class="flex flex-col gap-1 text-sm">
                  <span class="flex items-center gap-1.5 text-gray-800 dark:text-white/90">
                    <AppIcon icon="lucide:user" :size="16" color="var(--color-text-muted)" class="shrink-0" />
                    {{ (row as SaleProcessListRow).buyer.fullName }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    Comprador<template v-if="extraBuyers(row as SaleProcessListRow)"> · +{{ extraBuyers(row as SaleProcessListRow) }}</template>
                  </span>
                  <template v-if="ownerName(row as SaleProcessListRow)">
                    <span class="mt-1 flex items-center gap-1.5 text-gray-800 dark:text-white/90">
                      <AppIcon icon="lucide:building-2" :size="16" color="var(--color-text-muted)" class="shrink-0" />
                      {{ ownerName(row as SaleProcessListRow) }}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      Propietario<template v-if="extraOwners(row as SaleProcessListRow)"> · +{{ extraOwners(row as SaleProcessListRow) }}</template>
                    </span>
                  </template>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex flex-col items-start gap-1.5">
                  <ProcessStageBadge :stage="(row as SaleProcessListRow).pipelineStage" />
                  <Badge :variant="processStatusBadgeVariant((row as SaleProcessListRow).status)">
                    {{ processStatusLabel((row as SaleProcessListRow).status) }}
                  </Badge>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex flex-col gap-0.5 text-sm">
                  <span class="font-medium tabular-nums text-gray-800 dark:text-white/90">
                    {{
                      (row as SaleProcessListRow).property.salePrice != null
                        ? formatCurrency((row as SaleProcessListRow).property.salePrice!, (row as SaleProcessListRow).property.saleCurrency ?? 'PEN')
                        : '—'
                    }}
                  </span>
                  <span v-if="(row as SaleProcessListRow).financingChannel" class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <AppIcon icon="lucide:landmark" :size="13" />
                    {{ (row as SaleProcessListRow).financingChannel!.name }}
                  </span>
                  <span v-if="(row as SaleProcessListRow).createdAt" class="text-xs text-gray-400 dark:text-gray-500">
                    Desde {{ formatShortDate((row as SaleProcessListRow).createdAt!) }}
                  </span>
                </div>
              </td>
              <td class="py-3 px-4">
                <span class="flex items-center gap-1.5 text-sm" :class="(row as SaleProcessListRow).agent ? 'text-gray-800 dark:text-white/90' : 'text-gray-400 dark:text-gray-500'">
                  <AppIcon icon="lucide:user-check" :size="16" color="var(--color-text-muted)" class="shrink-0" />
                  {{ (row as SaleProcessListRow).agent?.fullName ?? 'Sin asesor' }}
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <ActionsDropdown :items="getActions(row as SaleProcessListRow)" />
              </td>
            </template>
          </DataTable>
          <div class="border-t border-gray-200 dark:border-gray-800">
            <BasePagination
              v-bind="paginationProps"
              :show-page-size="true"
              @update:current-page="(p: number) => (page = p)"
              @update:page-size="(s: number) => { limit = s; page = 1 }"
            />
          </div>
        </template>
      </div>
    </BaseCard>
  </div>
</template>
