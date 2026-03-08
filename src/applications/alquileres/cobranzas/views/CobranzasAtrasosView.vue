<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import StatsCard from '@shared/components/ui/StatsCard.vue'
import Badge from '@shared/components/ui/Badge.vue'
import BaseModal from '@shared/components/ui/BaseModal.vue'
import BaseButton from '@shared/components/ui/BaseButton.vue'
import SearchInput from '@shared/components/forms/SearchInput.vue'
import FormInput from '@shared/components/forms/FormInput.vue'
import FormSelect from '@shared/components/forms/FormSelect.vue'
import FormTextarea from '@shared/components/forms/FormTextarea.vue'
import { useOverduePayments, useRegisterPayment, usePendingPayments } from '../composables/usePayments'
import type { OverduePaymentItem, RegisterPaymentPayload } from '../services/payments.service'

const router = useRouter()

const search = ref('')

const { data: overdueList, isLoading } = useOverduePayments('alquileres', search)

// KPI stats derivados
const totalOwed = computed(() => overdueList.value?.reduce((s, i) => s + i.totalOwed, 0) ?? 0)
const criticalCount = computed(() => overdueList.value?.filter((i) => i.overdueLevel === 'critical').length ?? 0)

// Modal de cobro rápido
const showModal = ref(false)
const selectedOverdue = ref<OverduePaymentItem | null>(null)
const selectedPaymentId = ref<string | null>(null)
const modalError = ref('')
const registering = ref(false)

const pendingParams = computed(() => ({
  search: selectedOverdue.value?.tenantName,
  status: 'OVERDUE' as const,
}))

const { data: tenantPendingPayments } = usePendingPayments(pendingParams)

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

const { mutateAsync: doRegisterPayment } = useRegisterPayment()

function openModal(item: OverduePaymentItem) {
  selectedOverdue.value = item
  selectedPaymentId.value = null
  modalError.value = ''
  form.value = {
    paidDate: new Date().toISOString().slice(0, 10),
    paidAmount: item.totalOwed,
    paymentMethod: 'CASH',
    referenceNumber: '',
    notes: '',
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedOverdue.value = null
  selectedPaymentId.value = null
  modalError.value = ''
}

async function submitPayment() {
  if (!selectedPaymentId.value) {
    modalError.value = 'Selecciona el período a pagar'
    return
  }
  modalError.value = ''
  registering.value = true
  try {
    await doRegisterPayment({
      paymentId: selectedPaymentId.value,
      data: {
        ...form.value,
        referenceNumber: form.value.referenceNumber || null,
        notes: form.value.notes || null,
      },
    })
    closeModal()
  } catch (e: any) {
    modalError.value = e?.response?.data?.message ?? 'Error al registrar el pago'
  } finally {
    registering.value = false
  }
}

function getOverdueLevelBadge(level: string): { variant: 'error' | 'warning' | 'info'; label: string } {
  switch (level) {
    case 'critical': return { variant: 'error', label: 'Crítico' }
    case 'high': return { variant: 'warning', label: 'Alto' }
    default: return { variant: 'info', label: 'Moderado' }
  }
}

function getBorderColor(level: string) {
  switch (level) {
    case 'critical': return 'var(--color-error, #ef4444)'
    case 'high': return '#f59e0b'
    default: return '#3b82f6'
  }
}

function formatCurrency(amount: number, currency = 'PEN') {
  return `${currency === 'PEN' ? 'S/' : '$'} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-PE')
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
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button
        class="p-2 rounded-lg hover-surface transition-colors"
        :style="{ color: 'var(--color-text-muted)' }"
        @click="router.push({ name: 'alquileres-cobranzas' })"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Clientes con Atraso</h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">Seguimiento de pagos pendientes</p>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard :value="isLoading ? '...' : String(overdueList?.length ?? 0)" title="Con atraso">
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: '#ef4444' }">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </template>
      </StatsCard>
      <StatsCard :value="isLoading ? '...' : formatCurrency(totalOwed)" title="Total adeudado">
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: '#f59e0b' }">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </template>
      </StatsCard>
      <StatsCard :value="isLoading ? '...' : String(criticalCount)" title="Estado crítico">
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: '#ef4444' }">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </template>
      </StatsCard>
      <StatsCard value="0" title="Comunicaciones">
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: '#6366f1' }">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </template>
      </StatsCard>
    </div>

    <!-- Búsqueda -->
    <div>
      <SearchInput v-model="search" placeholder="Buscar por inquilino o propiedad..." />
    </div>

    <!-- Skeleton -->
    <template v-if="isLoading">
      <div class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-40 rounded-xl animate-pulse" :style="{ backgroundColor: 'var(--color-surface)' }" />
      </div>
    </template>

    <!-- Empty -->
    <template v-else-if="!overdueList?.length">
      <div
        class="flex flex-col items-center justify-center py-20 gap-3 rounded-xl border"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: 'var(--color-text-muted)' }">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">No hay clientes con pagos en atraso</p>
      </div>
    </template>

    <!-- Cards de atraso -->
    <div v-else class="flex flex-col gap-4">
      <div
        v-for="item in overdueList"
        :key="item.tenantId"
        class="rounded-xl border-l-4 p-5 transition-colors"
        :style="{
          borderLeftColor: getBorderColor(item.overdueLevel),
          backgroundColor: 'var(--color-surface)',
          border: `1px solid var(--color-border)`,
          borderLeftWidth: '4px',
        }"
      >
        <!-- Row 1: nombre + nivel + monto + acciones -->
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              :style="{ backgroundColor: getAvatarColor(item.tenantName) }"
            >
              {{ getInitials(item.tenantName) }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">{{ item.tenantName }}</p>
                <Badge :variant="getOverdueLevelBadge(item.overdueLevel).variant" :label="getOverdueLevelBadge(item.overdueLevel).label" />
              </div>
              <div class="flex items-center gap-1 mt-0.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: 'var(--color-text-muted)' }">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span class="text-xs" :style="{ color: 'var(--color-text-muted)' }">{{ item.propertyAddress }}</span>
              </div>
              <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">Propietario: {{ item.ownerName }}</p>
            </div>
          </div>

          <!-- Monto + acciones -->
          <div class="flex items-start sm:items-center gap-3">
            <div class="text-right">
              <p class="text-lg font-bold" :style="{ color: '#ef4444' }">{{ formatCurrency(item.totalOwed, item.currency) }}</p>
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">{{ item.monthsOverdue }} {{ item.monthsOverdue === 1 ? 'mes' : 'meses' }}</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <button class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border hover-surface transition-colors" :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Llamar
              </button>
              <button class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border hover-surface transition-colors" :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </button>
              <button class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border hover-surface transition-colors" :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Nota
              </button>
              <button
                class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                :style="{ backgroundColor: 'var(--color-primary)' }"
                @click="openModal(item)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cobrar
              </button>
            </div>
          </div>
        </div>

        <!-- Row 2: datos adicionales -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t" :style="{ borderColor: 'var(--color-border)' }">
          <div>
            <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">DNI</p>
            <p class="text-sm font-medium mt-0.5" :style="{ color: 'var(--color-text-primary)' }">{{ item.tenantDocument ?? '—' }}</p>
          </div>
          <div>
            <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Días de atraso</p>
            <p class="text-sm font-medium mt-0.5" :style="{ color: '#ef4444' }">{{ item.maxDaysOverdue }} días</p>
          </div>
          <div>
            <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Último pago</p>
            <p class="text-sm font-medium mt-0.5" :style="{ color: 'var(--color-text-primary)' }">{{ formatDate(item.lastPaymentDate) }}</p>
          </div>
          <div>
            <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Última comunicación</p>
            <p class="text-sm font-medium mt-0.5" :style="{ color: 'var(--color-text-primary)' }">{{ formatDate(item.lastCommunicationDate) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal cobro -->
    <BaseModal v-model="showModal" title="Registrar Cobro" size="md" @close="closeModal">
      <template v-if="selectedOverdue">
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Cobrar a <strong :style="{ color: 'var(--color-text-primary)' }">{{ selectedOverdue.tenantName }}</strong>
        </p>

        <!-- Seleccionar período a pagar -->
        <div
          class="p-3 rounded-lg mb-4"
          :style="{ backgroundColor: 'var(--color-surface-elevated)' }"
        >
          <p class="text-xs font-semibold mb-2" :style="{ color: 'var(--color-text-muted)' }">Seleccionar período a regularizar:</p>
          <div class="flex flex-col gap-2">
            <label
              v-for="pending in tenantPendingPayments?.filter(p => p.rentalId === selectedOverdue?.rentalId)"
              :key="pending.paymentId"
              class="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover-surface"
              :style="selectedPaymentId === pending.paymentId ? { backgroundColor: 'var(--color-primary)', opacity: 0.15 } : {}"
            >
              <input
                type="radio"
                :value="pending.paymentId"
                v-model="selectedPaymentId"
                class="accent-primary"
              />
              <span class="text-sm flex-1" :style="{ color: 'var(--color-text-primary)' }">
                {{ pending.periodLabel }} — {{ formatCurrency(pending.amount, pending.currency) }}
              </span>
              <Badge variant="error" :label="`${pending.daysOverdue}d`" />
            </label>
            <p
              v-if="!tenantPendingPayments?.filter(p => p.rentalId === selectedOverdue?.rentalId).length"
              class="text-xs"
              :style="{ color: 'var(--color-text-muted)' }"
            >
              Cargando períodos...
            </p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="form.paidDate" type="date" label="Fecha de Pago" required />
          <FormInput v-model="form.paidAmount" type="number" label="Monto Pagado" required />
        </div>
        <div class="mt-4">
          <FormSelect v-model="form.paymentMethod" :options="paymentMethodOptions" label="Método de Pago" required />
        </div>
        <div class="mt-4">
          <FormInput v-model="(form.referenceNumber as string)" type="text" label="Referencia / Operación" placeholder="Ej: 001234567890" />
        </div>
        <div class="mt-4">
          <FormTextarea v-model="(form.notes as string)" label="Notas" placeholder="Observaciones..." :rows="2" />
        </div>

        <p v-if="modalError" class="mt-3 text-sm rounded-lg px-3 py-2" :style="{ color: 'var(--color-error)', backgroundColor: 'rgba(239,68,68,0.1)' }">
          {{ modalError }}
        </p>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" @click="closeModal">Cancelar</BaseButton>
          <BaseButton variant="primary" :loading="registering" :disabled="registering || !selectedPaymentId" @click="submitPayment">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Confirmar Cobro
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
