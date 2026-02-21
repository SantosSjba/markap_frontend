<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  BasePagination,
  StatsCard,
  Badge,
  Avatar,
  DataTable,
  ActionsDropdown,
} from '@shared/components'
import { useClientsList, useClientStats } from '../composables/useClients'
import type { ClientListItem, ListClientsParams } from '../services/clients.service'

const router = useRouter()
const ITEMS_PER_PAGE = 10

const listParams = ref<ListClientsParams>({
  applicationSlug: 'alquileres',
  page: 1,
  limit: ITEMS_PER_PAGE,
})
const searchInput = ref('')
const filterType = ref<'ALL' | 'OWNER' | 'TENANT'>('ALL')
const filterStatus = ref<'ALL' | 'active' | 'inactive'>('ALL')

const { data: listResult, isLoading: loadingList } = useClientsList(listParams)
const { data: stats, isLoading: loadingStats } = useClientStats('alquileres')

const clients = computed(() => listResult.value?.data ?? [])
const totalFromApi = computed(() => listResult.value?.total ?? 0)

watch(
  [searchInput, filterType, filterStatus],
  () => {
    listParams.value = {
      ...listParams.value,
      page: 1,
      search: searchInput.value.trim() || undefined,
      clientType: filterType.value === 'ALL' ? undefined : filterType.value,
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
  { key: 'cliente', label: 'Cliente', align: 'left' as const },
  { key: 'contacto', label: 'Contacto', align: 'left' as const },
  { key: 'tipo', label: 'Tipo', align: 'left' as const },
  { key: 'propiedades', label: 'Propiedades', align: 'left' as const },
  { key: 'contratos', label: 'Contratos', align: 'left' as const },
  { key: 'estado', label: 'Estado', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

const goToNew = () => router.push('/alquileres/clientes/nuevo')
const goToEdit = (client: ClientListItem) =>
  router.push(`/alquileres/clientes/${client.id}/editar`)

const getActions = (client: ClientListItem) => [
  { label: 'Editar', onClick: () => goToEdit(client) },
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
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1
          class="text-xl font-bold"
          :style="{ color: 'var(--color-text-primary)' }"
        >
          Clientes
        </h1>
        <p
          class="text-sm mt-0.5"
          :style="{ color: 'var(--color-text-secondary)' }"
        >
          Gestión de propietarios e inquilinos
        </p>
      </div>
      <BaseButton variant="primary" class="flex items-center gap-2" @click="goToNew">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Nuevo Cliente
      </BaseButton>
    </div>

    <!-- Stats -->
    <div
      v-if="loadingStats"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-20"
    />
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <StatsCard :title="'Total Clientes'" :value="stats?.total ?? 0">
        <template #icon>
          <svg class="w-5 h-5" :style="{ color: 'var(--color-primary)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </template>
      </StatsCard>
      <StatsCard :title="'Propietarios'" :value="stats?.owners ?? 0">
        <template #icon>
          <svg class="w-5 h-5" :style="{ color: 'var(--color-info, #2563eb)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </template>
      </StatsCard>
      <StatsCard :title="'Inquilinos'" :value="stats?.tenants ?? 0">
        <template #icon>
          <svg class="w-5 h-5" :style="{ color: 'var(--color-success, #16a34a)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </template>
      </StatsCard>
      <StatsCard :title="'Activos'" :value="stats?.active ?? 0">
        <template #icon>
          <svg class="w-5 h-5" :style="{ color: 'var(--color-warning, #d97706)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </template>
      </StatsCard>
    </div>

    <!-- Search & Filters -->
    <div
      class="flex flex-col sm:flex-row gap-3"
      :style="{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '0.75rem',
        padding: '1rem',
      }"
    >
      <div class="relative flex-1">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
          :style="{ color: 'var(--color-text-muted)' }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchInput"
          type="text"
          placeholder="Buscar por nombre, documento o email..."
          class="w-full py-2.5 pl-10 pr-4 rounded-lg border text-sm"
          :style="{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
          }"
        />
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <select
          v-model="filterType"
          class="py-2.5 px-3 rounded-lg border text-sm"
          :style="{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
          }"
        >
          <option value="ALL">Todos los tipos</option>
          <option value="OWNER">Propietario</option>
          <option value="TENANT">Inquilino</option>
        </select>
        <select
          v-model="filterStatus"
          class="py-2.5 px-3 rounded-lg border text-sm"
          :style="{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
          }"
        >
          <option value="ALL">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div
      class="rounded-xl border overflow-hidden"
      :style="{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }"
    >
      <div v-if="loadingList" class="flex justify-center py-16">
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
        <DataTable :columns="tableColumns" :data="clients" row-key="id">
          <template #row="{ row }">
            <td class="py-3 px-4">
              <div class="flex items-center gap-3">
                <Avatar :name="(row as ClientListItem).fullName" size="md" />
                <div>
                  <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
                    {{ (row as ClientListItem).fullName }}
                  </p>
                  <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
                    {{ (row as ClientListItem).documentTypeCode }}: {{ (row as ClientListItem).documentNumber }}
                  </p>
                </div>
              </div>
            </td>
            <td class="py-3 px-4">
              <div class="flex flex-col gap-0.5 text-sm">
                <span class="flex items-center gap-1.5" :style="{ color: 'var(--color-text-primary)' }">
                  <svg class="w-4 h-4 shrink-0" :style="{ color: 'var(--color-text-muted)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {{ (row as ClientListItem).primaryPhone }}
                </span>
                <span class="flex items-center gap-1.5" :style="{ color: 'var(--color-text-primary)' }">
                  <svg class="w-4 h-4 shrink-0" :style="{ color: 'var(--color-text-muted)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {{ (row as ClientListItem).primaryEmail }}
                </span>
              </div>
            </td>
            <td class="py-3 px-4">
              <Badge
                :variant="(row as ClientListItem).clientType === 'OWNER' ? 'info' : 'success'"
              >
                {{ (row as ClientListItem).clientType === 'OWNER' ? 'Propietario' : 'Inquilino' }}
              </Badge>
            </td>
            <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              <span class="inline-flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
                {{ (row as ClientListItem).propertiesCount ?? '-' }}
              </span>
            </td>
            <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              <span class="inline-flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {{ (row as ClientListItem).contractsCount !== undefined && (row as ClientListItem).contractsCount > 0
                  ? `${(row as ClientListItem).contractsCount} activo(s)`
                  : 'Sin contratos' }}
              </span>
            </td>
            <td class="py-3 px-4">
              <Badge :variant="(row as ClientListItem).isActive ? 'success' : 'error'">
                {{ (row as ClientListItem).isActive ? 'Activo' : 'Inactivo' }}
              </Badge>
            </td>
            <td class="py-3 px-4 text-right">
              <ActionsDropdown :items="getActions(row as ClientListItem)" />
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
</template>
