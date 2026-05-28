<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  DataTable,
  SearchInput,
  FormSelect,
  Badge,
  AppIcon,
  BasePagination,
} from '@shared/components'
import { useVentasProcessesList } from '../../application/useVentasSales'
import type { SaleProcessListRow } from '../../domain/sales.types'
import { useVentasPipelineStages } from '@ventas/configuracion'
import { PROCESS_STATUS_OPTIONS, processStatusLabel } from '../../domain/pipeline.constants'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

const router = useRouter()
const { stageOptions, labelFor: pipelineStageLabel, query: pipelineConfigQuery } = useVentasPipelineStages()
const pipelineFilterOptions = computed(() => [
  { value: '', label: 'Todas las etapas' },
  ...stageOptions.value,
])

const ITEMS = 10
const listParams = ref({
  page: 1,
  limit: ITEMS,
  search: '',
  pipelineStage: '' as string | undefined,
  status: '' as string | undefined,
})

const listParamsForApi = computed(() => ({
  page: listParams.value.page,
  limit: listParams.value.limit,
  search: listParams.value.search?.trim() || undefined,
  pipelineStage: listParams.value.pipelineStage || undefined,
  status: listParams.value.status || undefined,
}))

const { data: listResult, isLoading, isError: listQueryError, error: listFetchError, refetch: refetchList } =
  useVentasProcessesList(listParamsForApi)
const rows = computed(() => listResult.value?.data ?? [])
const total = computed(() => listResult.value?.total ?? 0)

const paginationProps = computed(() => {
  const page = listParams.value.page
  const limit = listParams.value.limit
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

const tableColumns = [
  { key: 'code', label: 'Código', sortable: true, sortAccessor: (r: unknown) => (r as SaleProcessListRow).code },
  {
    key: 'buyer',
    label: 'Cliente',
    sortable: true,
    sortAccessor: (r: unknown) => (r as SaleProcessListRow).buyer.fullName,
  },
  {
    key: 'property',
    label: 'Inmueble',
    sortable: true,
    sortAccessor: (r: unknown) => (r as SaleProcessListRow).property.code,
  },
  { key: 'stage', label: 'Etapa', sortable: true, sortAccessor: (r: unknown) => (r as SaleProcessListRow).pipelineStage },
  { key: 'status', label: 'Estado', sortable: true, sortAccessor: (r: unknown) => (r as SaleProcessListRow).status },
  { key: 'actions', label: '', align: 'right' as const },
]

function goDetail(row: SaleProcessListRow) {
  void router.push(`/ventas/procesos/${row.id}`)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Procesos de venta
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Separación → contrato de arras → minuta → escritura pública. Cliente + inmueble + asesor.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="secondary" class="flex items-center gap-2" @click="router.push('/ventas/procesos/pipeline')">
          <AppIcon icon="lucide:layout-grid" :size="18" />
          Pipeline
        </BaseButton>
        <BaseButton variant="primary" class="flex items-center gap-2" @click="router.push('/ventas/procesos/nuevo')">
          <AppIcon icon="lucide:plus" :size="18" />
          Nuevo proceso
        </BaseButton>
      </div>
    </div>

    <div
      v-if="pipelineConfigQuery.isError.value"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-warning-light)' }"
    >
      <span :style="{ color: 'var(--color-text-primary)' }">
        No se cargó la configuración de etapas; se muestran valores por defecto.
      </span>
      <span class="text-xs max-w-md" style="color: var(--color-error)">{{
        getApiErrorMessage(pipelineConfigQuery.error.value)
      }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => pipelineConfigQuery.refetch()">
        Reintentar configuración
      </BaseButton>
    </div>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div v-if="isLoading" class="flex justify-center py-16">
        <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
      </div>
      <div
        v-else-if="listQueryError"
        class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center"
      >
        <p class="text-sm font-medium" style="color: var(--color-error)">{{ getApiErrorMessage(listFetchError) }}</p>
        <BaseButton variant="outline" size="sm" @click="() => refetchList()">Reintentar</BaseButton>
      </div>
      <DataTable
        v-else
        :columns="tableColumns"
        :data="rows"
        row-key="id"
        empty-text="No hay procesos en esta página."
      >
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput
              v-model="listParams.search"
              placeholder="Buscar por código, cliente o inmueble..."
              @update:model-value="listParams.page = 1"
            />
          </div>
          <div class="flex flex-wrap gap-3">
            <div class="w-full sm:w-[200px]">
              <FormSelect
                v-model="listParams.pipelineStage"
                :options="pipelineFilterOptions"
                placeholder="Etapa"
                @update:model-value="listParams.page = 1"
              />
            </div>
            <div class="w-full sm:w-[180px]">
              <FormSelect
                v-model="listParams.status"
                :options="[{ value: '', label: 'Todos' }, ...PROCESS_STATUS_OPTIONS]"
                placeholder="Estado"
                @update:model-value="listParams.page = 1"
              />
            </div>
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4 font-mono text-sm">{{ (row as SaleProcessListRow).code }}</td>
          <td class="py-3 px-4">
            <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{
              (row as SaleProcessListRow).buyer.fullName
            }}</span>
            <p
              v-if="(row as SaleProcessListRow).buyers && (row as SaleProcessListRow).buyers!.length > 1"
              class="text-xs"
              :style="{ color: 'var(--color-text-muted)' }"
            >
              +{{ (row as SaleProcessListRow).buyers!.length - 1 }} comprador(es)
            </p>
          </td>
          <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
            {{ (row as SaleProcessListRow).property.code }}
          </td>
          <td class="py-3 px-4">
            <Badge variant="info">{{ pipelineStageLabel((row as SaleProcessListRow).pipelineStage) }}</Badge>
          </td>
          <td class="py-3 px-4">
            <Badge
              :variant="
                (row as SaleProcessListRow).status === 'ACTIVE'
                  ? 'success'
                  : (row as SaleProcessListRow).status === 'WON'
                    ? 'success'
                    : 'neutral'
              "
            >
              {{ processStatusLabel((row as SaleProcessListRow).status) }}
            </Badge>
          </td>
          <td class="py-3 px-4 text-right">
            <BaseButton variant="ghost" size="sm" @click="goDetail(row as SaleProcessListRow)">
              Ver detalle
            </BaseButton>
          </td>
        </template>
      </DataTable>
      <div v-if="!isLoading && !listQueryError" class="border-t p-2" :style="{ borderColor: 'var(--color-border)' }">
        <BasePagination
          v-bind="paginationProps"
          :show-page-size="true"
          @update:current-page="(p: number) => (listParams.page = p)"
          @update:page-size="(s: number) => { listParams.limit = s; listParams.page = 1 }"
        />
      </div>
    </div>

  </div>
</template>
