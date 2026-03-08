<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import StatsCard from '@shared/components/ui/StatsCard.vue'
import BaseModal from '@shared/components/ui/BaseModal.vue'
import BaseButton from '@shared/components/ui/BaseButton.vue'
import Badge from '@shared/components/ui/Badge.vue'
import SearchInput from '@shared/components/forms/SearchInput.vue'
import FormSelect from '@shared/components/forms/FormSelect.vue'
import FormInput from '@shared/components/forms/FormInput.vue'
import FormTextarea from '@shared/components/forms/FormTextarea.vue'
import { usePendingPayments, usePaymentStats, useRegisterPayment } from '../composables/usePayments'
import type { PendingPaymentItem, RegisterPaymentPayload } from '../services/payments.service'

const router = useRouter()

const search = ref('')
const statusFilter = ref<string>('ALL')

const params = computed(() => ({
  search: search.value || undefined,
  status: statusFilter.value as any,
}))

const { data: payments, isLoading } = usePendingPayments(params)
const { data: stats, isLoading: statsLoading } = usePaymentStats()
const { mutateAsync: registerPayment, isPending: registering } = useRegisterPayment()

// Modal
const showModal = ref(false)
const selectedPayment = ref<PendingPaymentItem | null>(null)
const modalError = ref('')

const form = ref<RegisterPaymentPayload>({
  paidDate: new Date().toISOString().slice(0, 10),
  paidAmount: 0,
  paymentMethod: 'CASH',
  referenceNumber: '',
  notes: '',
})

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
  form.value = {
    paidDate: new Date().toISOString().slice(0, 10),
    paidAmount: payment.amount,
    paymentMethod: 'CASH',
    referenceNumber: '',
    notes: '',
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedPayment.value = null
  modalError.value = ''
}

async function submitPayment() {
  if (!selectedPayment.value) return
  modalError.value = ''
  try {
    await registerPayment({
      paymentId: selectedPayment.value.paymentId,
      data: {
        ...form.value,
        referenceNumber: form.value.referenceNumber || null,
        notes: form.value.notes || null,
      },
    })
    closeModal()
  } catch (e: any) {
    modalError.value = e?.response?.data?.message ?? 'Error al registrar el pago'
  }
}

function getStatusBadge(status: string): { variant: 'success' | 'warning' | 'error' | 'info'; label: string } {
  switch (status) {
    case 'PAID':
      return { variant: 'success', label: 'Pagado' }
    case 'OVERDUE':
      return { variant: 'error', label: `Atrasado` }
    case 'PARTIAL':
      return { variant: 'warning', label: 'Parcial' }
    default:
      return { variant: 'warning', label: 'Pendiente' }
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
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
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
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Cobranzas</h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">Seguimiento de pagos de alquiler</p>
      </div>
      <button
        class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover-surface"
        :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }"
        @click="router.push({ name: 'alquileres-cobranzas-historial' })"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Ver Historial
      </button>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        :value="statsLoading ? '...' : formatCurrency(stats?.totalPending ?? 0)"
        title="Por Cobrar"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: '#f59e0b' }">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </template>
      </StatsCard>
      <StatsCard
        :value="statsLoading ? '...' : formatCurrency(stats?.totalCollected ?? 0)"
        title="Cobrado (mes)"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: '#10b981' }">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </template>
      </StatsCard>
      <StatsCard
        :value="statsLoading ? '...' : String(stats?.pendingCount ?? 0)"
        title="Pendientes"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: '#3b82f6' }">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </template>
      </StatsCard>
      <StatsCard
        :value="statsLoading ? '...' : String(stats?.overdueCount ?? 0)"
        title="Con Atraso"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: '#ef4444' }">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </template>
      </StatsCard>
    </div>

    <!-- Filtros -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="flex-1">
        <SearchInput
          v-model="search"
          placeholder="Buscar por inquilino, propiedad o propietario..."
        />
      </div>
      <div class="w-full sm:w-40">
        <FormSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="Estado"
        />
      </div>
    </div>

    <!-- Tabla -->
    <div
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <!-- Skeleton -->
      <template v-if="isLoading">
        <div class="p-4 space-y-3">
          <div v-for="i in 5" :key="i" class="h-16 rounded-lg animate-pulse" :style="{ backgroundColor: 'var(--color-surface-elevated)' }" />
        </div>
      </template>

      <!-- Empty -->
      <template v-else-if="!payments?.length">
        <div class="flex flex-col items-center justify-center py-16 gap-3">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: 'var(--color-text-muted)' }">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">No hay pagos pendientes</p>
        </div>
      </template>

      <!-- List -->
      <template v-else>
        <!-- Header -->
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
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: 'var(--color-text-muted)' }">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p class="text-sm" :style="{ color: 'var(--color-text-primary)' }">{{ item.periodLabel }}</p>
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Vence: {{ formatDate(item.dueDate) }}</p>
            </div>
          </div>

          <!-- Estado -->
          <div>
            <Badge
              :variant="getStatusBadge(item.status).variant"
              :label="getStatusBadgeLabel(item)"
            />
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
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Pagar
            </button>
            <button
              class="p-1.5 rounded-lg hover-surface"
              :style="{ color: 'var(--color-text-muted)' }"
              title="Más opciones"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Modal Registrar Pago -->
    <BaseModal
      v-model="showModal"
      :title="`Registrar Pago`"
      size="md"
      @close="closeModal"
    >
      <template v-if="selectedPayment">
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Registrar el pago de alquiler de <strong :style="{ color: 'var(--color-text-primary)' }">{{ selectedPayment.tenantName }}</strong>
        </p>

        <!-- Resumen -->
        <div
          class="flex items-center justify-between p-4 rounded-xl mb-5"
          :style="{ backgroundColor: 'var(--color-surface-elevated)' }"
        >
          <div>
            <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">{{ selectedPayment.propertyAddress }}</p>
            <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">{{ selectedPayment.periodLabel }}</p>
          </div>
          <p class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
            {{ formatCurrency(selectedPayment.amount, selectedPayment.currency) }}
          </p>
        </div>

        <!-- Formulario -->
        <div class="grid grid-cols-2 gap-4">
          <FormInput
            v-model="form.paidDate"
            type="date"
            label="Fecha de Pago"
            required
          />
          <FormInput
            v-model="form.paidAmount"
            type="number"
            label="Monto Pagado"
            required
          />
        </div>
        <div class="mt-4">
          <FormSelect
            v-model="form.paymentMethod"
            :options="paymentMethodOptions"
            label="Método de Pago"
            required
          />
        </div>
        <div class="mt-4">
          <FormInput
            v-model="(form.referenceNumber as string)"
            type="text"
            label="Número de Referencia / Operación"
            placeholder="Ej: 001234567890"
          />
        </div>
        <div class="mt-4">
          <FormTextarea
            v-model="(form.notes as string)"
            label="Notas"
            placeholder="Observaciones adicionales..."
            :rows="3"
          />
        </div>

        <!-- Error -->
        <p v-if="modalError" class="mt-3 text-sm rounded-lg px-3 py-2" :style="{ color: 'var(--color-error)', backgroundColor: 'var(--color-error-subtle, rgba(239,68,68,0.1))' }">
          {{ modalError }}
        </p>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" @click="closeModal">Cancelar</BaseButton>
          <BaseButton
            variant="primary"
            :loading="registering"
            :disabled="registering"
            @click="submitPayment"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Confirmar Pago
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
