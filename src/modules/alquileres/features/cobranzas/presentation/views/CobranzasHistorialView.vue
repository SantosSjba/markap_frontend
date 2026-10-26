<script setup lang="ts">
import {useApplicationAccess} from '@modules/applications/presentation/composables/useApplicationAccess'
const { filterActions } = useApplicationAccess('alquileres')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import Avatar from '@shared/presentation/components/ui/Avatar.vue'
import { paymentsRepositoryKey } from '../../application/ports/payments.port'
import { useService } from '@shared/presentation/di/services'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ExcelIcon from '@shared/presentation/components/ui/ExcelIcon.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import ListRowsSkeleton from '@shared/presentation/components/ui/ListRowsSkeleton.vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { usePaymentHistory } from '../composables/usePayments'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatCurrency as formatMoneyAmount, formatShortDate, toCalendarDateString } from '@shared/utils/formatters'
import type { PaymentCurrencyAmount, PaymentHistoryItem } from '../../domain/payment.types'
const paymentsRepository = useService(paymentsRepositoryKey)

const router = useRouter()

const search = ref('')
const debouncedSearch = useDebouncedRef(search)
const filterYear = ref<string>('')
const filterMonth = ref<string>('')
const filterMethod = ref<string>('')
const currentPage = ref(1)
const pageSize = ref(20)

const params = computed(() => ({
  search: debouncedSearch.value.trim() || undefined,
  periodYear: filterYear.value ? parseInt(filterYear.value) : undefined,
  periodMonth: filterMonth.value ? parseInt(filterMonth.value) : undefined,
  paymentMethod: filterMethod.value || undefined,
  page: currentPage.value,
  limit: pageSize.value,
}))

// Un filtro nuevo vuelve a la primera página
watch([debouncedSearch, filterYear, filterMonth, filterMethod], () => {
  currentPage.value = 1
})

const {
  data: historyData,
  isFetching,
  isError: historyIsError,
  error: historyFetchError,
  refetch: refetchHistory,
} = usePaymentHistory(params)

const totalItems = computed(() => historyData.value?.total ?? 0)
const paginationProps = computed(() => {
  const totalPages = Math.max(1, Math.ceil(totalItems.value / pageSize.value))
  return {
    currentPage: currentPage.value,
    totalPages,
    totalItems: totalItems.value,
    pageSize: pageSize.value,
    hasPrevPage: currentPage.value > 1,
    hasNextPage: currentPage.value < totalPages,
  }
})
function onPageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
}

const totalsByCurrency = computed(() => historyData.value?.totalsByCurrency ?? [])
/** Promedio por pago en cada moneda */
const averageByCurrency = computed<PaymentCurrencyAmount[]>(() =>
  totalsByCurrency.value.map((t) => ({ ...t, amount: t.count ? t.amount / t.count : 0 })),
)

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 4 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}))

const monthOptions = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
]

const methodOptions = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'DEPOSIT', label: 'Depósito' },
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
  { value: 'CHECK', label: 'Cheque' },
  { value: 'OTHER', label: 'Otro' },
]

const methodLabels: Record<string, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  DEPOSIT: 'Depósito',
  YAPE: 'Yape',
  PLIN: 'Plin',
  CHECK: 'Cheque',
  OTHER: 'Otro',
}

function formatCurrency(amount: number, currency = 'PEN') {
  return formatMoneyAmount(amount, currency)
}

/** Soles y dólares por separado («S/ 1,200.00 · $ 300.00») */
function formatAmounts(rows: PaymentCurrencyAmount[]) {
  return rows.length ? rows.map((r) => formatCurrency(r.amount, r.currency)).join(' · ') : formatCurrency(0)
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return formatShortDate(dateStr)
}



function clearFilters() {
  search.value = ''
  filterYear.value = ''
  filterMonth.value = ''
  filterMethod.value = ''
  currentPage.value = 1
}

const { isExporting, exportToExcel } = useExcelExport()

function getHistoryActions(item: PaymentHistoryItem) {
  return [
    {
      label: 'Ver contrato',
      icon: 'lucide:file-text',
      onClick: () => router.push(`/alquileres/contratos/${item.rentalId}`),
    },
  ]
}

async function handleExport() {
  const result = await paymentsRepository.listHistory({
    applicationSlug: 'alquileres',
    page: 1,
    limit: 10000,
    search: debouncedSearch.value.trim() || undefined,
    periodYear: filterYear.value ? parseInt(filterYear.value) : undefined,
    periodMonth: filterMonth.value ? parseInt(filterMonth.value) : undefined,
    paymentMethod: filterMethod.value || undefined,
  })
  const now = toCalendarDateString()
  await exportToExcel({
    fileName: `historial_pagos_${now}`,
    sheetName: 'Historial de Pagos',
    columns: [
      { header: 'Código alquiler', key: 'rentalCode', width: 16 },
      { header: 'Inquilino', key: 'tenantName', width: 26 },
      { header: 'Propiedad', key: 'propertyAddress', width: 32 },
      { header: 'Propietario', key: 'ownerName', width: 24 },
      { header: 'Período', key: 'periodLabel', width: 14 },
      { header: 'Fecha pago', key: 'paidDate', width: 14 },
      { header: 'Moneda', key: 'currency', width: 10 },
      { header: 'Monto pagado', key: 'paidAmount', width: 16 },
      { header: 'Método', key: 'paymentMethod', width: 16 },
      { header: 'N° referencia', key: 'referenceNumber', width: 18 },
      { header: 'Notas', key: 'notes', width: 28 },
    ],
    rows: result.data.map((h: PaymentHistoryItem) => ({
      rentalCode: h.rentalCode,
      tenantName: h.tenantName,
      propertyAddress: h.propertyAddress,
      ownerName: h.ownerName,
      periodLabel: h.periodLabel,
      paidDate: formatDate(h.paidDate),
      currency: h.currency,
      paidAmount: h.paidAmount,
      paymentMethod: methodLabels[h.paymentMethod] ?? h.paymentMethod,
      referenceNumber: h.referenceNumber ?? '—',
      notes: h.notes ?? '—',
    })),
  })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <PageHeader
      title="Historial de Pagos"
      subtitle="Registro de todos los pagos realizados"
      back
      @back="router.push({ name: 'alquileres-cobranzas' })"
    >
      <template #actions>
        <BaseButton
          variant="outline"
          class="flex items-center gap-2"
          :loading="isExporting"
          title="Exportar historial a Excel"
          @click="handleExport"
        >
          <ExcelIcon class="w-5 h-5" />
          Exportar
        </BaseButton>
      </template>
    </PageHeader>

    <!-- KPIs -->
    <div v-if="!historyIsError" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <StatsCard compact title="Total cobrado" :value="formatAmounts(totalsByCurrency)" :loading="isFetching && !historyData">
        <template #icon><AppIcon icon="lucide:circle-dollar-sign" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Pagos registrados" :value="String(totalItems)" :loading="isFetching && !historyData">
        <template #icon><AppIcon icon="lucide:circle-check" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Promedio por pago" :value="formatAmounts(averageByCurrency)" :loading="isFetching && !historyData">
        <template #icon><AppIcon icon="lucide:trending-up" :size="20" /></template>
      </StatsCard>
    </div>

    <!-- Filtros -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="flex-1">
        <SearchInput v-model="search" placeholder="Buscar por código, inquilino, propiedad, propietario o referencia..." />
      </div>
      <div class="w-full sm:w-40">
        <FormSelect v-model="filterYear" :options="yearOptions" placeholder="Todos los años" />
      </div>
      <div class="w-full sm:w-40">
        <FormSelect v-model="filterMonth" :options="monthOptions" placeholder="Todos los meses" />
      </div>
      <div class="w-full sm:w-44">
        <FormSelect v-model="filterMethod" :options="methodOptions" placeholder="Todos los métodos" />
      </div>
      <BaseButton v-if="search || filterYear || filterMonth || filterMethod" @click="clearFilters" variant="ghost" size="sm" icon="lucide:x">Limpiar</BaseButton>
    </div>

    <!-- Tabla -->
    <BaseCard padding="none" class="block overflow-hidden">
      <template v-if="historyIsError">
        <div class="flex flex-col items-center justify-center py-16 gap-3 px-4 text-center">
          <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
          <p class="text-sm font-medium max-w-md text-error-500 dark:text-error-400">{{ getApiErrorMessage(historyFetchError) }}</p>
          <BaseButton variant="outline" size="sm" @click="() => refetchHistory()">Reintentar</BaseButton>
        </div>
      </template>

      <template v-else>
        <div
          class="hidden lg:grid grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-800"
        >
          <span>Fecha</span>
          <span>Inquilino</span>
          <span>Propiedad</span>
          <span>Período</span>
          <span>Método</span>
          <span>Referencia</span>
          <span class="text-right">Monto</span>
          <span></span>
        </div>

        <ListRowsSkeleton
          v-if="isFetching"
          :rows="8"
          :columns="8"
          grid-class="grid-cols-1 lg:grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr_1fr_auto]"
        />

        <div
          v-else-if="!historyData?.data?.length"
          class="flex flex-col items-center justify-center py-16 gap-3"
        >
          <AppIcon icon="lucide:clipboard-list" :size="48" color="var(--color-text-muted)" />
          <p class="text-sm text-gray-400 dark:text-gray-500">No se encontraron pagos</p>
        </div>

        <div
          v-else
          v-for="item in historyData.data"
          :key="item.paymentId"
          class="grid grid-cols-1 lg:grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 border-b transition-colors hover-surface items-center border-gray-200 dark:border-gray-800"
        >
          <!-- Fecha -->
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ formatDate(item.paidDate) }}</p>
          </div>

          <!-- Inquilino -->
          <div class="flex items-center gap-2">
            <Avatar :name="item.tenantName" size="sm" />
            <div>
              <p class="text-sm text-gray-800 dark:text-white/90">{{ item.tenantName }}</p>
            </div>
          </div>

          <!-- Propiedad -->
          <div>
            <p class="text-sm text-gray-800 dark:text-white/90">{{ item.propertyAddress }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ item.ownerName }}</p>
          </div>

          <!-- Período -->
          <div>
            <Badge>{{ item.periodLabel }}</Badge>
          </div>

          <!-- Método -->
          <div class="flex items-center gap-1.5">
            <AppIcon
              :icon="item.paymentMethod === 'CASH' ? 'lucide:banknote' : item.paymentMethod === 'TRANSFER' || item.paymentMethod === 'DEPOSIT' ? 'lucide:arrow-right-left' : 'lucide:smartphone'"
              :size="14"
              color="var(--color-text-muted)"
            />
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ methodLabels[item.paymentMethod] ?? item.paymentMethod }}</p>
          </div>

          <!-- Referencia -->
          <div>
            <p class="text-sm font-mono text-gray-400 dark:text-gray-500">{{ item.referenceNumber ?? '—' }}</p>
          </div>

          <!-- Monto -->
          <div class="text-right">
            <p class="text-sm font-semibold text-success-600 dark:text-success-500">
              {{ formatCurrency(item.paidAmount, item.currency) }}
            </p>
          </div>

          <!-- Acciones -->
          <div class="flex justify-end">
            <ActionsDropdown :items="filterActions(getHistoryActions(item))" />
          </div>
        </div>
        <div class="border-t border-gray-200 dark:border-gray-800">
          <BasePagination
            v-bind="paginationProps"
            :show-page-size="true"
            @update:current-page="currentPage = $event"
            @update:page-size="onPageSizeChange"
          />
        </div>
      </template>
    </BaseCard>
  </div>
</template>
