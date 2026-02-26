<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  BasePagination,
  Badge,
  DataTable,
  ActionsDropdown,
  FormSelect,
  SearchInput,
} from '@shared/components'
import { useAgentsList } from '../composables/useAgents'
import type { AgentListItem, ListAgentsParams } from '../services/agents.service'

const router = useRouter()
const ITEMS_PER_PAGE = 10

const listParams = ref<ListAgentsParams>({
  applicationSlug: 'alquileres',
  page: 1,
  limit: ITEMS_PER_PAGE,
})
const searchInput = ref('')
const filterType = ref<'ALL' | 'INTERNAL' | 'EXTERNAL'>('ALL')
const filterStatus = ref<'ALL' | 'active' | 'inactive'>('ALL')

const { data: listResult, isLoading: loadingList } = useAgentsList(listParams)

const agents = computed(() => listResult.value?.data ?? [])
const totalFromApi = computed(() => listResult.value?.total ?? 0)

watch(
  [searchInput, filterType, filterStatus],
  () => {
    listParams.value = {
      ...listParams.value,
      page: 1,
      search: searchInput.value.trim() || undefined,
      type: filterType.value === 'ALL' ? undefined : filterType.value,
      isActive:
        filterStatus.value === 'ALL'
          ? undefined
          : filterStatus.value === 'active',
    }
  },
  { immediate: true }
)

const onPageChange = (page: number) => {
  listParams.value = { ...listParams.value, page }
}

const onPageSizeChange = (size: number) => {
  listParams.value = { ...listParams.value, limit: size, page: 1 }
}

const tableColumns = [
  { key: 'agente', label: 'Agente', align: 'left' as const },
  { key: 'tipo', label: 'Tipo', align: 'left' as const },
  { key: 'contacto', label: 'Contacto', align: 'left' as const },
  { key: 'estado', label: 'Estado', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

const goToNew = () => router.push('/alquileres/agentes/nuevo')
const goToEdit = (agent: AgentListItem) =>
  router.push(`/alquileres/agentes/${agent.id}/editar`)

const getActions = (agent: AgentListItem) => [
  { label: 'Editar', onClick: () => goToEdit(agent) },
]

const paginationProps = computed(() => {
  const page = listParams.value.page ?? 1
  const limit = listParams.value.limit ?? ITEMS_PER_PAGE
  const totalPages = Math.max(1, Math.ceil(totalFromApi.value / limit))
  return {
    currentPage: page,
    totalPages,
    totalItems: totalFromApi.value,
    pageSize: limit,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  }
})

const typeOptions = [
  { value: 'ALL', label: 'Todos los tipos' },
  { value: 'INTERNAL', label: 'Interno' },
  { value: 'EXTERNAL', label: 'Externo' },
]
const statusOptions = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

function displayName(row: AgentListItem): string {
  if (row.type === 'INTERNAL' && row.user) {
    return `${row.user.firstName} ${row.user.lastName}`.trim() || row.fullName
  }
  return row.fullName
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Agentes
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Agentes internos (usuarios del sistema) y externos (terceros)
        </p>
      </div>
      <BaseButton variant="primary" class="flex items-center gap-2 w-full sm:w-auto justify-center" @click="goToNew">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Nuevo Agente
      </BaseButton>
    </div>

    <div
      class="flex flex-col sm:flex-row gap-3 p-4 rounded-xl border"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div class="flex-1 min-w-0">
        <SearchInput
          v-model="searchInput"
          placeholder="Buscar por nombre, email o teléfono..."
        />
      </div>
      <div class="flex flex-wrap gap-3 flex-shrink-0 sm:flex-nowrap">
        <div class="w-full sm:w-[180px] min-w-0">
          <FormSelect
            v-model="filterType"
            :options="typeOptions"
            placeholder="Todos los tipos"
          />
        </div>
        <div class="w-full sm:w-[180px] min-w-0">
          <FormSelect
            v-model="filterStatus"
            :options="statusOptions"
            placeholder="Todos los estados"
          />
        </div>
      </div>
    </div>

    <div
      class="rounded-xl border overflow-visible"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div class="overflow-x-auto">
        <div v-if="loadingList" class="flex justify-center py-16 px-4">
          <svg
            class="animate-spin h-8 w-8"
            :style="{ color: 'var(--color-primary)' }"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <template v-else>
          <DataTable :columns="tableColumns" :data="agents" row-key="id">
            <template #row="{ row }">
              <td class="py-3 px-4">
                <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
                  {{ displayName(row as AgentListItem) }}
                </p>
                <p v-if="(row as AgentListItem).documentType" class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
                  {{ (row as AgentListItem).documentType?.code }}: {{ (row as AgentListItem).documentNumber ?? '–' }}
                </p>
              </td>
              <td class="py-3 px-4">
                <Badge :variant="(row as AgentListItem).type === 'INTERNAL' ? 'info' : 'neutral'">
                  {{ (row as AgentListItem).type === 'INTERNAL' ? 'Interno' : 'Externo' }}
                </Badge>
              </td>
              <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
                <span v-if="(row as AgentListItem).phone">{{ (row as AgentListItem).phone }}</span>
                <span v-else-if="(row as AgentListItem).email">{{ (row as AgentListItem).email }}</span>
                <span v-else>–</span>
              </td>
              <td class="py-3 px-4">
                <Badge :variant="(row as AgentListItem).isActive ? 'success' : 'error'">
                  {{ (row as AgentListItem).isActive ? 'Activo' : 'Inactivo' }}
                </Badge>
              </td>
              <td class="py-3 px-4 text-right">
                <ActionsDropdown :items="getActions(row as AgentListItem)" />
              </td>
            </template>
          </DataTable>
          <div class="border-t" :style="{ borderColor: 'var(--color-border)' }">
            <BasePagination
              v-bind="paginationProps"
              :show-page-size="true"
              @update:current-page="onPageChange"
              @update:page-size="onPageSizeChange"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
