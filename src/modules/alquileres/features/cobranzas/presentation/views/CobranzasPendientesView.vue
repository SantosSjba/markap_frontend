<script setup lang="ts">
import {useApplicationAccess} from '@modules/applications/presentation/composables/useApplicationAccess'
const { filterActions } = useApplicationAccess('alquileres')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseAlert from '@shared/presentation/components/ui/BaseAlert.vue'
import Avatar from '@shared/presentation/components/ui/Avatar.vue'
import { paymentsRepositoryKey } from '../../application/ports/payments.port'
import { useService } from '@shared/presentation/di/services'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as yup from 'yup'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ExcelIcon from '@shared/presentation/components/ui/ExcelIcon.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import ListRowsSkeleton from '@shared/presentation/components/ui/ListRowsSkeleton.vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { usePendingPayments, usePaymentStats, useRegisterPayment } from '../composables/usePayments'
import { formatShortDate, toCalendarDateString } from '@shared/utils/formatters'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import type { PendingPaymentItem, PaymentMethod } from '../../domain/payment.types'
const paymentsRepository = useService(paymentsRepositoryKey)

const router = useRouter()

const search = ref('')
const debouncedSearch = useDebouncedRef(search)
const statusFilter = ref<string>('ALL')

const params = computed(() => ({
  search: debouncedSearch.value.trim() || undefined,
  status: statusFilter.value as any,
}))

const {
  data: payments,
  isFetching,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = usePendingPayments(params)
const {
  data: stats,
  isLoading: statsLoading,
  isError: statsQueryError,
  error: statsFetchError,
  refetch: refetchStats,
} = usePaymentStats()
const { mutateAsync: registerPayment, isPending: registering } = useRegisterPayment()

// Modal
const showModal = ref(false)
const selectedPayment = ref<PendingPaymentItem | null>(null)
const modalError = ref('')

const paymentSchema = yup.object({
  paidDate: yup.string().required('La fecha de pago es requerida'),
  paidAmount: yup
    .number()
    .transform((_v, originalValue) => {
      if (originalValue === '' || originalValue === null || originalValue === undefined) return NaN
      const n = Number(originalValue)
      return Number.isNaN(n) ? NaN : n
    })
    .min(0.01, 'El monto debe ser mayor a 0')
    .required('El monto es requerido'),
  paymentMethod: yup
    .string()
    .oneOf(['CASH', 'TRANSFER', 'DEPOSIT', 'YAPE', 'PLIN', 'CHECK', 'OTHER'])
    .required(),
  referenceNumber: yup.string().trim(),
  notes: yup.string().trim(),
})

const {
  handleSubmit: submitPaymentForm,
  errors: paymentErrors,
  defineComponentBinds,
  resetForm: resetPaymentForm,
} = useForm({
  validationSchema: toTypedSchema(paymentSchema),
  initialValues: {
    paidDate: toCalendarDateString(),
    paidAmount: 0,
    paymentMethod: 'CASH' as PaymentMethod,
    referenceNumber: '',
    notes: '',
  },
})

const paidDateBinds = defineComponentBinds('paidDate')
const paidAmountBinds = defineComponentBinds('paidAmount')
const paymentMethodBinds = defineComponentBinds('paymentMethod')
const referenceNumberBinds = defineComponentBinds('referenceNumber')
const notesBinds = defineComponentBinds('notes')

const paymentMethodOptions = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'DEPOSIT', label: 'Depósito' },
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
  { value: 'CHECK', label: 'Cheque' },
  { value: 'OTHER', label: 'Otro' },
]

const statusOptions = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'OVERDUE', label: 'Atrasado' },
  { value: 'PARTIAL', label: 'Parcial' },
]

function openModal(payment: PendingPaymentItem) {
  selectedPayment.value = payment
  modalError.value = ''
  resetPaymentForm({
    values: {
      paidDate: toCalendarDateString(),
      paidAmount: payment.amount,
      paymentMethod: 'CASH',
      referenceNumber: '',
      notes: '',
    },
  })
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedPayment.value = null
  modalError.value = ''
}

const onPaymentSubmit = submitPaymentForm(async (vals) => {
  if (!selectedPayment.value) return
  modalError.value = ''
  try {
    await registerPayment({
      paymentId: selectedPayment.value.paymentId,
      data: {
        paidDate: vals.paidDate,
        paidAmount: vals.paidAmount,
        paymentMethod: vals.paymentMethod as PaymentMethod,
        referenceNumber: vals.referenceNumber?.trim() || null,
        notes: vals.notes?.trim() || null,
      },
    })
    closeModal()
  } catch {
    /* useRegisterPayment onError muestra toast */
  }
})

function getStatusBadge(status: string): {
  variant: 'success' | 'warning' | 'error' | 'info'
  label: string
} {
  switch (status) {
    case 'PAID':
      return { variant: 'success', label: 'Pagado' }
    case 'OVERDUE':
      return { variant: 'error', label: 'Atrasado' }
    case 'PARTIAL':
      return { variant: 'warning', label: 'Parcial' }
    default:
      return { variant: 'warning', label: 'Pendiente' }
  }
}

function getStatusBadgeLabel(item: PendingPaymentItem) {
  if (item.status === 'OVERDUE') return `Atrasado (${item.daysOverdue}d)`
  if (item.status === 'PENDING' && item.daysOverdue > 0) return `Pendiente (+${item.daysOverdue}d)`
  if (item.status === 'PENDING' && item.daysOverdue < 0)
    return `Pendiente (${Math.abs(item.daysOverdue)}d)`
  return getStatusBadge(item.status).label
}

function formatCurrency(amount: number, currency = 'PEN') {
  return `${currency === 'PEN' ? 'S/' : '$'} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return formatShortDate(dateStr)
}




function getPaymentActions(item: PendingPaymentItem) {
  const actions = []
  if (item.status !== 'PAID') {
    actions.push({
      label: 'Registrar pago',
      icon: 'lucide:credit-card',
      onClick: () => openModal(item),
    })
  }
  actions.push({
    label: 'Ver contrato',
    icon: 'lucide:file-text',
    onClick: () => router.push(`/alquileres/contratos/${item.rentalId}`),
  })
  return actions
}

const { isExporting, exportToExcel } = useExcelExport()

async function handleExport() {
  const data = await paymentsRepository.listPending({
    applicationSlug: 'alquileres',
    search: search.value || undefined,
    status: statusFilter.value !== 'ALL' ? (statusFilter.value as any) : undefined,
  })
  const now = toCalendarDateString()
  await exportToExcel({
    fileName: `cobranzas_pendientes_${now}`,
    sheetName: 'Pagos Pendientes',
    columns: [
      { header: 'Código alquiler', key: 'rentalCode', width: 16 },
      { header: 'Inquilino', key: 'tenantName', width: 26 },
      { header: 'Propiedad', key: 'propertyAddress', width: 32 },
      { header: 'Propietario', key: 'ownerName', width: 24 },
      { header: 'Período', key: 'periodLabel', width: 14 },
      { header: 'Vencimiento', key: 'dueDate', width: 14 },
      { header: 'Días atraso', key: 'daysOverdue', width: 12 },
      { header: 'Moneda', key: 'currency', width: 10 },
      { header: 'Monto', key: 'amount', width: 14 },
      { header: 'Estado', key: 'status', width: 12 },
    ],
    rows: data.map((p: PendingPaymentItem) => ({
      rentalCode: p.rentalCode,
      tenantName: p.tenantName,
      propertyAddress: p.propertyAddress,
      ownerName: p.ownerName,
      periodLabel: p.periodLabel,
      dueDate: formatDate(p.dueDate),
      daysOverdue: p.daysOverdue,
      currency: p.currency,
      amount: p.amount,
      status: getStatusBadge(p.status).label,
    })),
  })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <PageHeader
      title="Cobranzas"
      subtitle="Seguimiento de pagos de alquiler"
    >
      <template #actions>
        <div class="flex items-center gap-2">
        <BaseButton
          variant="outline"
          class="flex items-center gap-2"
          :loading="isExporting"
          title="Exportar a Excel"
          @click="handleExport"
        >
          <ExcelIcon class="w-5 h-5" />
          Exportar
        </BaseButton>
        <BaseButton @click="router.push({ name: 'alquileres-cobranzas-historial' })" variant="secondary" size="sm" icon="lucide:history">Ver Historial</BaseButton>
      </div>
      </template>
    </PageHeader>

    <div
      v-if="statsQueryError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3 border-gray-200 dark:border-gray-800 bg-warning-50 dark:bg-warning-500/15"
    >
      <span class="max-w-xl text-error-500 dark:text-error-400">{{ getApiErrorMessage(statsFetchError) }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => refetchStats()">Reintentar</BaseButton>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        :value="statsQueryError ? '—' : statsLoading ? '...' : formatCurrency(stats?.totalPending ?? 0)"
        title="Por Cobrar"
      >
        <template #icon>
          <AppIcon icon="lucide:clock" :size="20" color="#f59e0b" />
        </template>
      </StatsCard>
      <StatsCard
        :value="statsQueryError ? '—' : statsLoading ? '...' : formatCurrency(stats?.totalCollected ?? 0)"
        title="Cobrado (mes)"
      >
        <template #icon>
          <AppIcon icon="lucide:circle-check" :size="20" color="#10b981" />
        </template>
      </StatsCard>
      <StatsCard :value="statsQueryError ? '—' : statsLoading ? '...' : String(stats?.pendingCount ?? 0)" title="Pendientes">
        <template #icon>
          <AppIcon icon="lucide:wallet" :size="20" color="#3b82f6" />
        </template>
      </StatsCard>
      <StatsCard :value="statsQueryError ? '—' : statsLoading ? '...' : String(stats?.overdueCount ?? 0)" title="Con Atraso">
        <template #icon>
          <AppIcon icon="lucide:triangle-alert" :size="20" color="#ef4444" />
        </template>
      </StatsCard>
    </div>

    <!-- Filtros -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="flex-1">
        <SearchInput v-model="search" placeholder="Buscar por inquilino, propiedad o propietario..." />
      </div>
      <div class="w-full sm:w-40">
        <FormSelect v-model="statusFilter" :options="statusOptions" placeholder="Estado" />
      </div>
    </div>

    <!-- Tabla -->
    <BaseCard padding="none" class="block overflow-hidden">
      <template v-if="listQueryError">
        <div class="flex flex-col items-center justify-center py-16 gap-3 px-4 text-center">
          <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
          <p class="text-sm font-medium max-w-md text-error-500 dark:text-error-400">{{ getApiErrorMessage(listFetchError) }}</p>
          <BaseButton variant="outline" size="sm" @click="() => refetchList()">Reintentar</BaseButton>
        </div>
      </template>

      <template v-else>
        <div
          class="hidden lg:grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-800"
        >
          <span>Inquilino</span>
          <span>Propiedad</span>
          <span>Período</span>
          <span>Estado</span>
          <span class="text-right">Monto</span>
          <span></span>
        </div>

        <ListRowsSkeleton
          v-if="isFetching"
          :rows="8"
          :columns="6"
          grid-class="grid-cols-1 lg:grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto]"
        />

        <div
          v-else-if="!payments?.length"
          class="flex flex-col items-center justify-center py-16 gap-3"
        >
          <AppIcon icon="lucide:circle-check-big" :size="48" color="var(--color-text-muted)" />
          <p class="text-sm text-gray-400 dark:text-gray-500">No hay pagos pendientes</p>
        </div>

        <div
          v-else
          v-for="item in payments"
          :key="item.paymentId"
          class="grid grid-cols-1 lg:grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-4 border-b transition-colors hover-surface items-center border-gray-200 dark:border-gray-800"
        >
          <!-- Inquilino -->
          <div class="flex items-center gap-3">
            <Avatar :name="item.tenantName" />
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ item.tenantName }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500">{{ item.tenantHistoryNote ?? 'Sin historial' }}</p>
            </div>
          </div>

          <!-- Propiedad -->
          <div>
            <p class="text-sm text-gray-800 dark:text-white/90">{{ item.propertyAddress }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500">Prop. {{ item.ownerName }}</p>
          </div>

          <!-- Período -->
          <div class="flex items-center gap-2">
            <AppIcon icon="lucide:calendar" :size="16" color="var(--color-text-muted)" class="flex-shrink-0" />
            <div>
              <p class="text-sm text-gray-800 dark:text-white/90">{{ item.periodLabel }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500">Vence: {{ formatDate(item.dueDate) }}</p>
            </div>
          </div>

          <!-- Estado -->
          <div>
            <Badge :variant="getStatusBadge(item.status).variant" :label="getStatusBadgeLabel(item)" />
          </div>

          <!-- Monto -->
          <div class="text-right">
            <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ formatCurrency(item.amount, item.currency) }}</p>
          </div>

          <!-- Acciones -->
          <div class="flex items-center gap-2 justify-end">
            <BaseButton v-if="item.status !== 'PAID'" @click="openModal(item)" size="sm" icon="lucide:credit-card">Pagar</BaseButton>
            <ActionsDropdown :items="filterActions(getPaymentActions(item))" />
          </div>
        </div>
      </template>
    </BaseCard>

    <!-- Modal Registrar Pago -->
    <BaseModal v-model="showModal" size="md" @close="closeModal">
      <template #title>
        <div class="flex items-center gap-2">
          <AppIcon icon="lucide:credit-card" :size="18" color="var(--color-primary)" />
          <span>Registrar Pago</span>
        </div>
      </template>

      <template v-if="selectedPayment">
        <form id="cobranzas-pendientes-register-payment" @submit.prevent="onPaymentSubmit">
        <!-- Resumen del cobro -->
        <div
          class="flex items-center gap-4 p-4 rounded-xl mb-5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
        >
          <Avatar :name="selectedPayment.tenantName" size="lg" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate text-gray-800 dark:text-white/90">
              {{ selectedPayment.tenantName }}
            </p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <AppIcon icon="lucide:map-pin" :size="12" color="var(--color-text-muted)" />
              <p class="text-xs truncate text-gray-400 dark:text-gray-500">{{ selectedPayment.propertyAddress }}</p>
            </div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <AppIcon icon="lucide:calendar" :size="12" color="var(--color-text-muted)" />
              <p class="text-xs text-gray-400 dark:text-gray-500">{{ selectedPayment.periodLabel }}</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <p class="text-xs font-medium mb-0.5 text-gray-400 dark:text-gray-500">Monto</p>
            <p class="text-xl font-bold text-gray-800 dark:text-white/90">
              {{ formatCurrency(selectedPayment.amount, selectedPayment.currency) }}
            </p>
          </div>
        </div>

        <!-- Sección: Datos del pago -->
        <div class="flex items-center gap-2 mb-3">
          <AppIcon icon="lucide:banknote" :size="15" color="var(--color-primary)" />
          <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Datos del pago</p>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <FormInput v-bind="paidDateBinds" type="date" label="Fecha de pago" :error="paymentErrors.paidDate" required />
          <FormInput v-bind="paidAmountBinds" type="number" label="Monto pagado" :error="paymentErrors.paidAmount" required />
        </div>

        <!-- Método de pago -->
        <div class="flex items-center gap-2 mb-3">
          <AppIcon icon="lucide:wallet" :size="15" color="var(--color-primary)" />
          <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Método de pago</p>
        </div>
        <FormSelect v-bind="paymentMethodBinds" :options="paymentMethodOptions" label="" :error="paymentErrors.paymentMethod" required class="mb-4" />

        <!-- Sección: Referencia y notas -->
        <div class="flex items-center gap-2 mb-3">
          <AppIcon icon="lucide:notebook-pen" :size="15" color="var(--color-primary)" />
          <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Referencia y notas</p>
        </div>
        <FormInput
          v-bind="referenceNumberBinds"
          type="text"
          label="N° Referencia / Operación"
          placeholder="Ej: 001234567890"
          :error="paymentErrors.referenceNumber"
          class="mb-4"
        />
        <FormTextarea
          v-bind="notesBinds"
          label="Notas adicionales"
          placeholder="Observaciones sobre el pago..."
          :error="paymentErrors.notes"
          :rows="2"
        />

        <BaseAlert v-if="modalError" type="error" class="mt-3">
          {{ modalError }}
        </BaseAlert>
        </form>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" @click="closeModal">
            <AppIcon icon="lucide:x" :size="16" />
            Cancelar
          </BaseButton>
          <BaseButton variant="primary" type="submit" form="cobranzas-pendientes-register-payment" :loading="registering" :disabled="registering">
            <AppIcon icon="lucide:circle-check" :size="16" />
            Confirmar Pago
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
