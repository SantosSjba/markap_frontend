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
  AppIcon,
  ExcelIcon,
} from '@shared/components'
import { useExcelExport } from '@shared/composables'
import { useRentalsList, useRentalStats } from '../composables/useRentals'
import type { RentalListItem, ListRentalsParams } from '../services/rentals.service'
import { rentalsService } from '../services/rentals.service'

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

const statusBadgeVariant = (display: string): 'success' | 'info' | 'warning' | 'error' | 'neutral' => {
  switch (display) {
    case 'vigente': return 'success'
    case 'porVencer': return 'warning'
    case 'vencido': return 'error'
    case 'proximo': return 'info'
    default: return 'neutral'
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

const goToDetail = (item: RentalListItem) => router.push(`/alquileres/contratos/${item.id}`)
const goToEdit = (item: RentalListItem) => router.push(`/alquileres/contratos/${item.id}/editar`)
const goToFinancialConfig = (item: RentalListItem) => router.push(`/alquileres/contratos/${item.id}/distribucion-financiera`)

const getActions = (item: RentalListItem) => [
  { label: 'Ver detalle', onClick: () => goToDetail(item) },
  { label: 'Editar', onClick: () => goToEdit(item) },
  { label: 'Distribución financiera', onClick: () => goToFinancialConfig(item) },
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

const { isExporting, exportToExcel } = useExcelExport()

async function handleExport() {
  const result = await rentalsService.getList({
    applicationSlug: 'alquileres',
    page: 1,
    limit: 10000,
    search: searchInput.value.trim() || undefined,
    status: filterStatus.value === 'ALL' ? undefined : filterStatus.value,
  })
  const now = new Date().toLocaleDateString('es-PE')
  await exportToExcel({
    fileName: `alquileres_${now}`,
    sheetName: 'Alquileres',
    columns: [
      { header: 'Código', key: 'code', width: 14 },
      { header: 'Propiedad', key: 'propertyAddress', width: 32 },
      { header: 'Inquilino', key: 'tenantName', width: 26 },
      { header: 'Propietario', key: 'ownerName', width: 26 },
      { header: 'Inicio', key: 'startDate', width: 14 },
      { header: 'Vencimiento', key: 'endDate', width: 14 },
      { header: 'Estado', key: 'status', width: 14 },
      { header: 'Moneda', key: 'currency', width: 10 },
      { header: 'Monto mensual', key: 'monthlyAmount', width: 16 },
      { header: 'Garantía', key: 'securityDeposit', width: 14 },
      { header: 'Con contrato', key: 'hasContract', width: 14 },
    ],
    rows: result.data.map((r: RentalListItem) => ({
      code: r.code,
      propertyAddress: r.propertyAddress,
      tenantName: r.tenantName,
      ownerName: r.ownerName,
      startDate: formatDate(r.startDate),
      endDate: formatDate(r.endDate),
      status: statusBadgeLabel(getDisplayStatus(r)),
      currency: r.currency,
      monthlyAmount: Number(r.monthlyAmount),
      securityDeposit: r.securityDeposit ?? '—',
      hasContract: r.hasContract ? 'Sí' : 'No',
    })),
  })
}
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
      <div class="flex gap-2 w-full sm:w-auto">
        <BaseButton
          variant="outline"
          class="flex items-center gap-2 flex-1 sm:flex-none justify-center"
          :loading="isExporting"
          title="Exportar a Excel"
          @click="handleExport"
        >
          <ExcelIcon class="w-5 h-5" />
          Exportar
        </BaseButton>
        <BaseButton variant="primary" class="flex items-center gap-2 flex-1 sm:flex-none justify-center" @click="goToNew">
          <AppIcon icon="lucide:plus" :size="18" />
          Nuevo Alquiler
        </BaseButton>
      </div>
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
        <template #icon><AppIcon icon="lucide:file-text" :size="20" color="var(--color-primary)" /></template>
      </StatsCard>
      <StatsCard :title="'Vigentes'" :value="stats?.vigentes ?? 0">
        <template #icon><AppIcon icon="lucide:circle-check" :size="20" color="#16a34a" /></template>
      </StatsCard>
      <StatsCard :title="'Por Vencer'" :value="stats?.porVencer ?? 0">
        <template #icon><AppIcon icon="lucide:triangle-alert" :size="20" color="#d97706" /></template>
      </StatsCard>
      <StatsCard :title="'Vencidos'" :value="stats?.vencidos ?? 0">
        <template #icon><AppIcon icon="lucide:circle-x" :size="20" color="#dc2626" /></template>
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
          <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
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
                      <AppIcon icon="lucide:file-text" :size="16" color="var(--color-text-muted)" class="shrink-0" />
                      <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
                        {{ (row as RentalListItem).code }}
                      </span>
                    </div>
                    <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
                      {{ (row as RentalListItem).propertyAddress }}
                    </p>
                    <p v-if="(row as RentalListItem).hasContract" class="text-xs mt-1 flex items-center gap-1" :style="{ color: 'var(--color-text-muted)' }">
                      <AppIcon icon="lucide:paperclip" :size="14" />
                      PDF Adjunto
                    </p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex flex-col gap-1 text-sm">
                  <span class="flex items-center gap-1.5" :style="{ color: 'var(--color-text-primary)' }">
                    <AppIcon icon="lucide:user" :size="16" color="var(--color-text-muted)" class="shrink-0" />
                    {{ (row as RentalListItem).tenantName }}
                  </span>
                  <span class="flex items-center gap-1.5 text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                    Inquilino
                  </span>
                  <span class="flex items-center gap-1.5 mt-1" :style="{ color: 'var(--color-text-primary)' }">
                    <AppIcon icon="lucide:building-2" :size="16" color="var(--color-text-muted)" class="shrink-0" />
                    {{ (row as RentalListItem).ownerName }}
                  </span>
                  <span class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">Propietario</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex flex-col gap-0.5">
                  <span class="flex items-center gap-1.5 text-sm" :style="{ color: 'var(--color-text-primary)' }">
                    <AppIcon icon="lucide:calendar" :size="16" color="var(--color-text-muted)" class="shrink-0" />
                    {{ formatDate((row as RentalListItem).startDate) }} - {{ formatDate((row as RentalListItem).endDate) }}
                  </span>
                  <span
                    class="text-xs font-medium"
                    :style="{
                      color:
                        getDisplayStatus(row as RentalListItem) === 'vencido'
                          ? 'var(--color-error)'
                          : getDisplayStatus(row as RentalListItem) === 'porVencer'
                            ? 'var(--color-warning)'
                            : getDisplayStatus(row as RentalListItem) === 'proximo'
                              ? 'var(--color-info, #3B82F6)'
                              : 'var(--color-success)',
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
