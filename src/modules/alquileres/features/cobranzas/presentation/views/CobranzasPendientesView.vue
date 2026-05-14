<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as yup from 'yup'
import StatsCard from '@shared/components/ui/StatsCard.vue'
import BaseModal from '@shared/components/ui/BaseModal.vue'
import BaseButton from '@shared/components/ui/BaseButton.vue'
import Badge from '@shared/components/ui/Badge.vue'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import ExcelIcon from '@shared/components/ui/ExcelIcon.vue'
import SearchInput from '@shared/components/forms/SearchInput.vue'
import FormSelect from '@shared/components/forms/FormSelect.vue'
import FormInput from '@shared/components/forms/FormInput.vue'
import FormTextarea from '@shared/components/forms/FormTextarea.vue'
import ActionsDropdown from '@shared/components/ui/ActionsDropdown.vue'
import { useExcelExport } from '@shared/composables'
import { useForm, toTypedSchema } from '@shared/components/forms'
import { usePendingPayments, usePaymentStats, useRegisterPayment } from '../../application/usePayments'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import type { PendingPaymentItem, PaymentMethod } from '../../domain/payment.types'
import { paymentsRepository } from '@modules/alquileres/features/cobranzas'

const router = useRouter()

const search = ref('')
const statusFilter = ref<string>('ALL')

const params = computed(() => ({
  search: search.value || undefined,
  status: statusFilter.value as any,
}))

const {
  data: payments,
  isLoading,
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
    paidDate: new Date().toISOString().slice(0, 10),
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
      paidDate: new Date().toISOString().slice(0, 10),
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

function getStatusBadge(status: string): { variant: 'success' | 'warning' | 'error' | 'info'; label: string } {
  switch (status) {
    case 'PAID':   return { variant: 'success', label: 'Pagado' }
    case 'OVERDUE': return { variant: 'error', label: 'Atrasado' }
    case 'PARTIAL': return { variant: 'warning', label: 'Parcial' }
    default:        return { variant: 'warning', label: 'Pendiente' }
  }
}

function getStatusBadgeLabel(item: PendingPaymentItem) {
  if (item.status === 'OVERDUE') return `Atrasado (${item.daysOverdue}d)`
  if (item.status === 'PENDING' && item.daysOverdue > 0) return `Pendiente (+${item.daysOverdue}d)`
  if (item.status === 'PENDING' && item.daysOverdue < 0) return `Pendiente (${Math.abs(item.daysOverdue)}d)`
  return getStatusBadge(item.status).label
}

function formatCurrency(amount: number, currency = 'PEN') {
  return `${currency === 'PEN' ? 'S/' : '$'} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#14b8a6', '#3b82f6', '#f97316']

function getAvatarColor(name: string) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % avatarColors.length
  return avatarColors[Math.abs(hash)]
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
  const now = new Date().toLocaleDateString('es-PE')
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
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Cobranzas</h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">Seguimiento de pagos de alquiler</p>
      </div>
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
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover-surface"
          :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }"
          @click="router.push({ name: 'alquileres-cobranzas-historial' })"
        >
          <AppIcon icon="lucide:history" :size="16" />
          Ver Historial
        </button>
      </div>
    </div>

    <div
      v-if="statsQueryError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-warning-light)' }"
    >
      <span class="max-w-xl" style="color: var(--color-error)">{{ getApiErrorMessage(statsFetchError) }}</span>
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
    <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }">
      <!-- Skeleton loading animado -->
      <template v-if="isLoading">
        <div class="flex flex-col items-center justify-center py-12 gap-3">
          <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
          <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Cargando pagos...</p>
        </div>
      </template>

      <template v-else-if="listQueryError">
        <div class="flex flex-col items-center justify-center py-16 gap-3 px-4 text-center">
          <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
          <p class="text-sm font-medium max-w-md" style="color: var(--color-error)">{{ getApiErrorMessage(listFetchError) }}</p>
          <BaseButton variant="outline" size="sm" @click="() => refetchList()">Reintentar</BaseButton>
        </div>
      </template>

      <!-- Empty -->
      <template v-else-if="!payments?.length">
        <div class="flex flex-col items-center justify-center py-16 gap-3">
          <AppIcon icon="lucide:circle-check-big" :size="48" color="var(--color-text-muted)" />
          <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">No hay pagos pendientes</p>
        </div>
      </template>

      <!-- List -->
      <template v-else>
        <div
          class="hidden lg:grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b"
          :style="{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }"
        >
          <span>Inquilino</span>
          <span>Propiedad</span>
          <span>Período</span>
          <span>Estado</span>
          <span class="text-right">Monto</span>
          <span></span>
        </div>

        <div
          v-for="item in payments"
          :key="item.paymentId"
          class="grid grid-cols-1 lg:grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-4 border-b transition-colors hover-surface items-center"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <!-- Inquilino -->
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              :style="{ backgroundColor: getAvatarColor(item.tenantName) }"
            >
              {{ getInitials(item.tenantName) }}
            </div>
            <div>
              <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ item.tenantName }}</p>
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">{{ item.tenantHistoryNote ?? 'Sin historial' }}</p>
            </div>
          </div>

          <!-- Propiedad -->
          <div>
            <p class="text-sm" :style="{ color: 'var(--color-text-primary)' }">{{ item.propertyAddress }}</p>
            <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Prop. {{ item.ownerName }}</p>
          </div>

          <!-- Período -->
          <div class="flex items-center gap-2">
            <AppIcon icon="lucide:calendar" :size="16" color="var(--color-text-muted)" class="flex-shrink-0" />
            <div>
              <p class="text-sm" :style="{ color: 'var(--color-text-primary)' }">{{ item.periodLabel }}</p>
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Vence: {{ formatDate(item.dueDate) }}</p>
            </div>
          </div>

          <!-- Estado -->
          <div>
            <Badge :variant="getStatusBadge(item.status).variant" :label="getStatusBadgeLabel(item)" />
          </div>

          <!-- Monto -->
          <div class="text-right">
            <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">{{ formatCurrency(item.amount, item.currency) }}</p>
          </div>

          <!-- Acciones -->
          <div class="flex items-center gap-2 justify-end">
            <button
              v-if="item.status !== 'PAID'"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
              :style="{ backgroundColor: 'var(--color-primary)' }"
              @click="openModal(item)"
            >
              <AppIcon icon="lucide:credit-card" :size="16" />
              Pagar
            </button>
            <ActionsDropdown :items="getPaymentActions(item)" />
          </div>
        </div>
      </template>
    </div>

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
          class="flex items-center gap-4 p-4 rounded-xl mb-5"
          :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
        >
          <div
            class="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            :style="{ backgroundColor: getAvatarColor(selectedPayment.tenantName) }"
          >
            {{ getInitials(selectedPayment.tenantName) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate" :style="{ color: 'var(--color-text-primary)' }">
              {{ selectedPayment.tenantName }}
            </p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <AppIcon icon="lucide:map-pin" :size="12" color="var(--color-text-muted)" />
              <p class="text-xs truncate" :style="{ color: 'var(--color-text-muted)' }">{{ selectedPayment.propertyAddress }}</p>
            </div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <AppIcon icon="lucide:calendar" :size="12" color="var(--color-text-muted)" />
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">{{ selectedPayment.periodLabel }}</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <p class="text-xs font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Monto</p>
            <p class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
              {{ formatCurrency(selectedPayment.amount, selectedPayment.currency) }}
            </p>
          </div>
        </div>

        <!-- Sección: Datos del pago -->
        <div class="flex items-center gap-2 mb-3">
          <AppIcon icon="lucide:banknote" :size="15" color="var(--color-primary)" />
          <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Datos del pago</p>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <FormInput v-bind="paidDateBinds" type="date" label="Fecha de pago" :error="paymentErrors.paidDate" required />
          <FormInput v-bind="paidAmountBinds" type="number" label="Monto pagado" :error="paymentErrors.paidAmount" required />
        </div>

        <!-- Método de pago -->
        <div class="flex items-center gap-2 mb-3">
          <AppIcon icon="lucide:wallet" :size="15" color="var(--color-primary)" />
          <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Método de pago</p>
        </div>
        <FormSelect v-bind="paymentMethodBinds" :options="paymentMethodOptions" label="" :error="paymentErrors.paymentMethod" required class="mb-4" />

        <!-- Sección: Referencia y notas -->
        <div class="flex items-center gap-2 mb-3">
          <AppIcon icon="lucide:notebook-pen" :size="15" color="var(--color-primary)" />
          <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Referencia y notas</p>
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

        <div
          v-if="modalError"
          class="mt-3 flex items-center gap-2 text-sm rounded-lg px-3 py-2"
          :style="{ color: 'var(--color-error)', backgroundColor: 'rgba(239,68,68,0.1)' }"
        >
          <AppIcon icon="lucide:alert-circle" :size="14" />
          {{ modalError }}
        </div>
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
