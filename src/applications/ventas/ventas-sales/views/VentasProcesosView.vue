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
import { useVentasProcessesList, useVentasCreateProcess } from '../composables/useVentasSales'
import type { SaleProcessListRow } from '../services/ventasSales.service'
import { ventasClientsService } from '../../clientes/services/clients.service'
import { ventasPropertiesService } from '../../propiedades/services/ventasProperties.service'
import { useVentasAgentsList } from '../../agentes/composables/useAgents'
import BaseModal from '@shared/components/ui/BaseModal.vue'
import { useVentasPipelineStages } from '../../ventas-configuracion/composables/useVentasConfig'
import { PROCESS_STATUS_OPTIONS, processStatusLabel } from '../constants/pipeline'

const router = useRouter()
const { stageOptions, labelFor: pipelineStageLabel } = useVentasPipelineStages()
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

const { data: listResult, isLoading } = useVentasProcessesList(listParamsForApi)
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

const showNew = ref(false)
const buyerOptions = ref<{ value: string; label: string }[]>([])
const propertyOptions = ref<{ value: string; label: string }[]>([])
const agentParams = ref({ page: 1, limit: 500, isActive: true })
const { data: agentsRes } = useVentasAgentsList(agentParams)
const agentOptions = computed(() => [
  { value: '', label: 'Sin asignar' },
  ...(agentsRes.value?.data ?? []).map((a) => ({ value: a.id, label: a.fullName })),
])

const form = ref({
  buyerClientId: '',
  propertyId: '',
  agentId: '',
  title: '',
  pipelineStage: 'PROSPECT',
})

const { mutate: createProcess, isPending: creating } = useVentasCreateProcess()

async function openNewModal() {
  const [buyers, props] = await Promise.all([
    ventasClientsService.getList({ clientType: 'BUYER', page: 1, limit: 500 }),
    ventasPropertiesService.getList({ page: 1, limit: 500, listingStatus: 'AVAILABLE' }),
  ])
  buyerOptions.value = buyers.data.map((c) => ({
    value: c.id,
    label: `${c.fullName} (${c.documentNumber})`,
  }))
  propertyOptions.value = props.data.map((p) => ({
    value: p.id,
    label: `${p.code} — ${p.addressLine}`,
  }))
  showNew.value = true
}

function submitNew() {
  if (!form.value.buyerClientId || !form.value.propertyId) return
  createProcess(
    {
      buyerClientId: form.value.buyerClientId,
      propertyId: form.value.propertyId,
      agentId: form.value.agentId || null,
      title: form.value.title || null,
      pipelineStage: form.value.pipelineStage,
    },
    {
      onSuccess: () => {
        showNew.value = false
        form.value = {
          buyerClientId: '',
          propertyId: '',
          agentId: '',
          title: '',
          pipelineStage: 'PROSPECT',
        }
      },
    },
  )
}

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
          Pipeline CRM: prospecto → visita → negociación → separación → cierre. Cliente + inmueble + asesor.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="secondary" class="flex items-center gap-2" @click="router.push('/ventas/procesos/pipeline')">
          <AppIcon icon="lucide:layout-grid" :size="18" />
          Pipeline
        </BaseButton>
        <BaseButton variant="primary" class="flex items-center gap-2" @click="openNewModal">
          <AppIcon icon="lucide:plus" :size="18" />
          Nuevo proceso
        </BaseButton>
      </div>
    </div>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div v-if="isLoading" class="flex justify-center py-16">
        <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
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
      <div class="border-t p-2" :style="{ borderColor: 'var(--color-border)' }">
        <BasePagination
          v-bind="paginationProps"
          :show-page-size="true"
          @update:current-page="(p: number) => (listParams.page = p)"
          @update:page-size="(s: number) => { listParams.limit = s; listParams.page = 1 }"
        />
      </div>
    </div>

    <BaseModal v-model="showNew" title="Nuevo proceso de venta" size="lg">
      <div class="p-4 space-y-4">
        <FormSelect
          v-model="form.buyerClientId"
          label="Cliente (comprador / lead)"
          :options="buyerOptions"
          required
        />
        <FormSelect
          v-model="form.propertyId"
          label="Inmueble (disponible)"
          :options="propertyOptions"
          required
        />
        <FormSelect v-model="form.agentId" label="Asesor" :options="agentOptions" />
        <FormSelect v-model="form.pipelineStage" label="Etapa inicial" :options="stageOptions" />
        <div>
          <label class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">Título (opcional)</label>
          <input
            v-model="form.title"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
            placeholder="Ej. Familia Pérez — Torre Vista Mar"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="outline" @click="showNew = false">Cancelar</BaseButton>
          <BaseButton variant="primary" :loading="creating" @click="submitNew">Crear</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
