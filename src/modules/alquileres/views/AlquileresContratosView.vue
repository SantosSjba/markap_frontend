<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  BasePagination,
  StatsCard,
  Badge,
  DataTable,
  ActionsDropdown,
  FormSelect,
  SearchInput,
} from '@shared/components'
import { useRentalsList, useRentalStats } from '../composables/useRentals'
import type { RentalListItem, ListRentalsParams } from '../services/rentals.service'

const router = useRouter()
const ITEMS_PER_PAGE = 10

const listParams = ref<ListRentalsParams>({
  applicationSlug: 'alquileres',
  page: 1,
  limit: ITEMS_PER_PAGE,
})
const searchInput = ref('')
const filterStatus = ref<'ALL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'>('ALL')

const { data: listResult, isLoading: loadingList } = useRentalsList(listParams)
const { data: stats, isLoading: loadingStats } = useRentalStats('alquileres')

const rentals = computed(() => listResult.value?.data ?? [])
const totalFromApi = computed(() => listResult.value?.total ?? 0)

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
  { immediate: true }
)

const onPageChange = (page: number) => {
  listParams.value = { ...listParams.value, page }
}

const onPageSizeChange = (size: number) => {
  listParams.value = { ...listParams.value, limit: size, page: 1 }
}

const tableColumns = [
  { key: 'alquiler', label: 'Alquiler', align: 'left' as const },
  { key: 'partes', label: 'Partes', align: 'left' as const },
  { key: 'vigencia', label: 'Vigencia', align: 'left' as const },
  { key: 'estado', label: 'Estado', align: 'left' as const },
  { key: 'monto', label: 'Alquiler', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

function getDisplayStatus(item: RentalListItem): 'vigente' | 'proximo' | 'porVencer' | 'vencido' {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(item.startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(item.endDate)
  end.setHours(0, 0, 0, 0)
  if (item.status === 'EXPIRED' || item.status === 'CANCELLED' || end < today) return 'vencido'
  if (start > today) return 'proximo'
  const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 30) return 'porVencer'
  return 'vigente'
}

function getDaysLabel(item: RentalListItem): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(item.endDate)
  end.setHours(0, 0, 0, 0)
  const days = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0) return `Vence hace ${Math.abs(days)} días`
  if (days === 0) return 'Vence hoy'
  return `${days} días restantes`
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatMoney(item: RentalListItem): string {
  const sym = item.currency === 'USD' ? 'US$' : 'S/'
  return `${sym} ${Number(item.monthlyAmount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function formatGuarantee(item: RentalListItem): string {
  if (item.securityDeposit == null) return ''
  const sym = item.currency === 'USD' ? 'US$' : 'S/'
  return `Garantía: ${sym} ${Number(item.securityDeposit).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

const statusBadgeVariant = (display: string) => {
  switch (display) {
    case 'vigente': return 'success'
    case 'porVencer': return 'warning'
    case 'vencido': return 'error'
    case 'proximo': return 'info'
    default: return 'default'
  }
}

const statusBadgeLabel = (display: string) => {
  switch (display) {
    case 'vigente': return 'Vigente'
    case 'porVencer': return 'Por Vencer'
    case 'vencido': return 'Vencido'
    case 'proximo': return 'Próximo'
    default: return display
  }
}

const goToNew = () => router.push('/alquileres/contratos/nuevo')

const getActions = (_item: RentalListItem) => [
  { label: 'Ver detalle', onClick: () => {} },
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

const statusOptions = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Vigentes / Activos' },
  { value: 'EXPIRED', label: 'Vencidos' },
  { value: 'CANCELLED', label: 'Cancelados' },
]
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1
          class="text-xl sm:text-2xl font-bold"
          :style="{ color: 'var(--color-text-primary)' }"
        >
          Alquileres
        </h1>
        <p
          class="text-sm mt-1"
          :style="{ color: 'var(--color-text-secondary)' }"
        >
          Gestión de contratos de alquiler
        </p>
      </div>
      <BaseButton variant="primary" class="flex items-center gap-2 w-full sm:w-auto justify-center" @click="goToNew">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Nuevo Alquiler
      </BaseButton>
    </div>

    <!-- Stats -->
    <div
      v-if="loadingStats"
      class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 h-20"
    />
    <div
      v-else
      class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      <StatsCard :title="'Total'" :value="stats?.total ?? 0">
        <template #icon>
          <svg class="w-5 h-5" :style="{ color: 'var(--color-primary)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </template>
      </StatsCard>
      <StatsCard :title="'Vigentes'" :value="stats?.vigentes ?? 0">
        <template #icon>
          <svg class="w-5 h-5" :style="{ color: 'var(--color-success, #16a34a)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </template>
      </StatsCard>
      <StatsCard :title="'Por Vencer'" :value="stats?.porVencer ?? 0">
        <template #icon>
          <svg class="w-5 h-5" :style="{ color: 'var(--color-warning, #d97706)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </template>
      </StatsCard>
      <StatsCard :title="'Vencidos'" :value="stats?.vencidos ?? 0">
        <template #icon>
          <svg class="w-5 h-5" :style="{ color: 'var(--color-error, #dc2626)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </template>
      </StatsCard>
    </div>

    <!-- Search & Filters -->
    <div
      class="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border"
      :style="{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }"
    >
      <div class="flex-1 min-w-0">
        <SearchInput
          v-model="searchInput"
          placeholder="Buscar por código, propiedad, inquilino o propietario..."
        />
      </div>
      <div class="flex flex-wrap gap-3 flex-shrink-0 sm:flex-nowrap">
        <div class="w-full sm:w-[200px] min-w-0">
          <FormSelect
            v-model="filterStatus"
            :options="statusOptions"
            placeholder="Todos los estados"
          />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div
      class="rounded-xl border overflow-visible"
      :style="{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }"
    >
      <div class="overflow-x-auto overflow-y-visible">
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
          <DataTable :columns="tableColumns" :data="rentals" row-key="id">
            <template #row="{ row }">
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <span
                    class="w-2 h-2 rounded-full shrink-0"
                    :style="{
                      backgroundColor:
                        getDisplayStatus(row as RentalListItem) === 'vencido'
                          ? 'var(--color-error, #dc2626)'
                          : getDisplayStatus(row as RentalListItem) === 'porVencer'
                            ? 'var(--color-warning, #d97706)'
                            : getDisplayStatus(row as RentalListItem) === 'proximo'
                              ? 'var(--color-info, #2563eb)'
                              : 'var(--color-success, #16a34a)',
                    }"
                  />
                  <div>
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 shrink-0" :style="{ color: 'var(--color-text-muted)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
                        {{ (row as RentalListItem).code }}
                      </span>
                    </div>
                    <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
                      {{ (row as RentalListItem).propertyAddress }}
                    </p>
                    <p v-if="(row as RentalListItem).hasContract" class="text-xs mt-1 flex items-center gap-1" :style="{ color: 'var(--color-text-muted)' }">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      PDF Adjunto
                    </p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex flex-col gap-1 text-sm">
                  <span class="flex items-center gap-1.5" :style="{ color: 'var(--color-text-primary)' }">
                    <svg class="w-4 h-4 shrink-0" :style="{ color: 'var(--color-text-muted)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {{ (row as RentalListItem).tenantName }}
                  </span>
                  <span class="flex items-center gap-1.5 text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                    Inquilino
                  </span>
                  <span class="flex items-center gap-1.5 mt-1" :style="{ color: 'var(--color-text-primary)' }">
                    <svg class="w-4 h-4 shrink-0" :style="{ color: 'var(--color-text-muted)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {{ (row as RentalListItem).ownerName }}
                  </span>
                  <span class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">Propietario</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex flex-col gap-0.5">
                  <span class="flex items-center gap-1.5 text-sm" :style="{ color: 'var(--color-text-primary)' }">
                    <svg class="w-4 h-4 shrink-0" :style="{ color: 'var(--color-text-muted)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {{ formatDate((row as RentalListItem).startDate) }} - {{ formatDate((row as RentalListItem).endDate) }}
                  </span>
                  <span
                    class="text-xs font-medium"
                    :style="{
                      color:
                        getDisplayStatus(row as RentalListItem) === 'vencido'
                          ? 'var(--color-error, #dc2626)'
                          : 'var(--color-success, #16a34a)',
                    }"
                  >
                    {{ getDaysLabel(row as RentalListItem) }}
                  </span>
                </div>
              </td>
              <td class="py-3 px-4">
                <Badge :variant="statusBadgeVariant(getDisplayStatus(row as RentalListItem))">
                  {{ statusBadgeLabel(getDisplayStatus(row as RentalListItem)) }}
                </Badge>
              </td>
              <td class="py-3 px-4">
                <div class="flex flex-col gap-0.5 text-sm">
                  <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
                    {{ formatMoney(row as RentalListItem) }}
                  </span>
                  <span v-if="formatGuarantee(row as RentalListItem)" class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                    {{ formatGuarantee(row as RentalListItem) }}
                  </span>
                </div>
              </td>
              <td class="py-3 px-4 text-right">
                <ActionsDropdown :items="getActions(row as RentalListItem)" />
              </td>
            </template>
          </DataTable>
          <div class="border-t px-4 py-3" :style="{ borderColor: 'var(--color-border)' }">
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
