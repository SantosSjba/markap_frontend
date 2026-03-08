<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import StatsCard from '@shared/components/ui/StatsCard.vue'
import BasePagination from '@shared/components/ui/BasePagination.vue'
import BaseButton from '@shared/components/ui/BaseButton.vue'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import ExcelIcon from '@shared/components/ui/ExcelIcon.vue'
import SearchInput from '@shared/components/forms/SearchInput.vue'
import FormSelect from '@shared/components/forms/FormSelect.vue'
import { useExcelExport } from '@shared/composables'
import { usePaymentHistory } from '../composables/usePayments'
import type { PaymentHistoryItem } from '../services/payments.service'
import { paymentsService } from '../services/payments.service'

const router = useRouter()

const search = ref('')
const filterYear = ref<string>('')
const filterMonth = ref<string>('')
const filterMethod = ref<string>('')
const currentPage = ref(1)
const pageSize = 20

const params = computed(() => ({
  search: search.value || undefined,
  periodYear: filterYear.value ? parseInt(filterYear.value) : undefined,
  periodMonth: filterMonth.value ? parseInt(filterMonth.value) : undefined,
  paymentMethod: filterMethod.value || undefined,
  page: currentPage.value,
  limit: pageSize,
}))

const { data: historyData, isLoading } = usePaymentHistory(params)

const totalPages = computed(() => Math.ceil((historyData.value?.total ?? 0) / pageSize))

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 4 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}))

const monthOptions = [
  { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
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
  CASH: 'Efectivo', TRANSFER: 'Transferencia', DEPOSIT: 'Depósito',
  YAPE: 'Yape', PLIN: 'Plin', CHECK: 'Cheque', OTHER: 'Otro',
}

function formatCurrency(amount: number, currency = 'PEN') {
  return `${currency === 'PEN' ? 'S/' : '$'} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-PE')
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

const avatarColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#14b8a6', '#3b82f6', '#f97316',
]
function getAvatarColor(name: string) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % avatarColors.length
  return avatarColors[Math.abs(hash)]
}

function clearFilters() {
  search.value = ''
  filterYear.value = ''
  filterMonth.value = ''
  filterMethod.value = ''
  currentPage.value = 1
}

const { isExporting, exportToExcel } = useExcelExport()

async function handleExport() {
  const result = await paymentsService.listHistory({
    applicationSlug: 'alquileres',
    page: 1,
    limit: 10000,
    search: search.value || undefined,
    periodYear: filterYear.value ? parseInt(filterYear.value) : undefined,
    periodMonth: filterMonth.value ? parseInt(filterMonth.value) : undefined,
    paymentMethod: filterMethod.value || undefined,
  })
  const now = new Date().toLocaleDateString('es-PE')
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
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          class="p-2 rounded-lg hover-surface transition-colors"
          :style="{ color: 'var(--color-text-muted)' }"
          @click="router.push({ name: 'alquileres-cobranzas' })"
        >
          <AppIcon icon="lucide:chevron-left" :size="20" />
        </button>
        <div>
          <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Historial de Pagos</h1>
          <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">Registro de todos los pagos realizados</p>
        </div>
      </div>
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
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatsCard :value="isLoading ? '...' : formatCurrency(historyData?.totalAmount ?? 0)" title="Total filtrado">
        <template #icon>
          <AppIcon icon="lucide:circle-dollar-sign" :size="20" color="#10b981" />
        </template>
      </StatsCard>
      <StatsCard :value="isLoading ? '...' : String(historyData?.total ?? 0)" title="Pagos registrados">
        <template #icon>
          <AppIcon icon="lucide:circle-check" :size="20" color="#6366f1" />
        </template>
      </StatsCard>
      <StatsCard
        :value="isLoading || !historyData?.total ? '...' : formatCurrency((historyData?.totalAmount ?? 0) / (historyData?.total ?? 1))"
        title="Promedio por pago"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: '#f59e0b' }">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </template>
      </StatsCard>
    </div>

    <!-- Filtros -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="flex-1">
        <SearchInput v-model="search" placeholder="Buscar por inquilino, propiedad o referencia..." />
      </div>
      <div class="w-full sm:w-40">
        <FormSelect v-model="filterYear" :options="yearOptions" placeholder="Todos los meses" />
      </div>
      <div class="w-full sm:w-40">
        <FormSelect v-model="filterMonth" :options="monthOptions" placeholder="Todos los meses" />
      </div>
      <div class="w-full sm:w-44">
        <FormSelect v-model="filterMethod" :options="methodOptions" placeholder="Todos los métodos" />
      </div>
      <button
        v-if="search || filterYear || filterMonth || filterMethod"
        class="px-3 py-2 text-sm rounded-lg hover-surface transition-colors"
        :style="{ color: 'var(--color-text-muted)' }"
        @click="clearFilters"
      >
        Limpiar
      </button>
    </div>

    <!-- Tabla -->
    <div
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <!-- Skeleton -->
      <template v-if="isLoading">
        <div class="flex flex-col items-center justify-center py-12 gap-3">
          <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
          <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Cargando historial...</p>
        </div>
      </template>

      <!-- Empty -->
      <template v-else-if="!historyData?.data?.length">
        <div class="flex flex-col items-center justify-center py-16 gap-3">
          <AppIcon icon="lucide:clipboard-list" :size="48" color="var(--color-text-muted)" />
          <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">No se encontraron pagos</p>
        </div>
      </template>

      <!-- Rows -->
      <template v-else>
        <!-- Table header -->
        <div
          class="hidden lg:grid grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b"
          :style="{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }"
        >
          <span>Fecha</span>
          <span>Inquilino</span>
          <span>Propiedad</span>
          <span>Período</span>
          <span>Método</span>
          <span>Referencia</span>
          <span class="text-right">Monto</span>
        </div>

        <div
          v-for="item in historyData.data"
          :key="item.paymentId"
          class="grid grid-cols-1 lg:grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-4 border-b transition-colors hover-surface items-center"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <!-- Fecha -->
          <div>
            <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ formatDate(item.paidDate) }}</p>
          </div>

          <!-- Inquilino -->
          <div class="flex items-center gap-2">
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              :style="{ backgroundColor: getAvatarColor(item.tenantName) }"
            >
              {{ getInitials(item.tenantName) }}
            </div>
            <div>
              <p class="text-sm" :style="{ color: 'var(--color-text-primary)' }">{{ item.tenantName }}</p>
            </div>
          </div>

          <!-- Propiedad -->
          <div>
            <p class="text-sm" :style="{ color: 'var(--color-text-primary)' }">{{ item.propertyAddress }}</p>
            <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">{{ item.ownerName }}</p>
          </div>

          <!-- Período -->
          <div>
            <span
              class="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' }"
            >
              {{ item.periodLabel }}
            </span>
          </div>

          <!-- Método -->
          <div>
            <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ methodLabels[item.paymentMethod] ?? item.paymentMethod }}</p>
          </div>

          <!-- Referencia -->
          <div>
            <p class="text-sm font-mono" :style="{ color: 'var(--color-text-muted)' }">{{ item.referenceNumber ?? '—' }}</p>
          </div>

          <!-- Monto -->
          <div class="text-right">
            <p class="text-sm font-semibold" :style="{ color: '#10b981' }">
              {{ formatCurrency(item.paidAmount, item.currency) }}
            </p>
          </div>
        </div>
      </template>
    </div>

    <!-- Paginación -->
    <BasePagination
      v-if="totalPages > 1"
      :current-page="currentPage"
      :total-pages="totalPages"
      @update:current-page="currentPage = $event"
    />
  </div>
</template>
