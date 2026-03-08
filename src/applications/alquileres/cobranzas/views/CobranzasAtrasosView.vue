<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import StatsCard from '@shared/components/ui/StatsCard.vue'
import Badge from '@shared/components/ui/Badge.vue'
import BaseModal from '@shared/components/ui/BaseModal.vue'
import BaseButton from '@shared/components/ui/BaseButton.vue'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import ExcelIcon from '@shared/components/ui/ExcelIcon.vue'
import SearchInput from '@shared/components/forms/SearchInput.vue'
import FormInput from '@shared/components/forms/FormInput.vue'
import FormSelect from '@shared/components/forms/FormSelect.vue'
import FormTextarea from '@shared/components/forms/FormTextarea.vue'
import { useExcelExport } from '@shared/composables'
import { useOverduePayments, useRegisterPayment, usePendingPayments } from '../composables/usePayments'
import type { OverduePaymentItem, RegisterPaymentPayload } from '../services/payments.service'
import { paymentsService } from '../services/payments.service'

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

const { isExporting, exportToExcel } = useExcelExport()

async function handleExport() {
  const data = await paymentsService.listOverdue('alquileres', search.value || undefined)
  const now = new Date().toLocaleDateString('es-PE')
  await exportToExcel({
    fileName: `cobranzas_atrasos_${now}`,
    sheetName: 'Con Atraso',
    columns: [
      { header: 'Inquilino', key: 'tenantName', width: 26 },
      { header: 'Documento', key: 'tenantDocument', width: 16 },
      { header: 'Propiedad', key: 'propertyAddress', width: 32 },
      { header: 'Propietario', key: 'ownerName', width: 24 },
      { header: 'Nivel atraso', key: 'overdueLevel', width: 14 },
      { header: 'Meses vencidos', key: 'monthsOverdue', width: 16 },
      { header: 'Días máx. atraso', key: 'maxDaysOverdue', width: 16 },
      { header: 'Moneda', key: 'currency', width: 10 },
      { header: 'Total adeudado', key: 'totalOwed', width: 16 },
      { header: 'Último pago', key: 'lastPaymentDate', width: 16 },
    ],
    rows: data.map((o: OverduePaymentItem) => ({
      tenantName: o.tenantName,
      tenantDocument: o.tenantDocument ?? '—',
      propertyAddress: o.propertyAddress,
      ownerName: o.ownerName,
      overdueLevel: getOverdueLevelBadge(o.overdueLevel).label,
      monthsOverdue: o.monthsOverdue,
      maxDaysOverdue: o.maxDaysOverdue,
      currency: o.currency,
      totalOwed: o.totalOwed,
      lastPaymentDate: formatDate(o.lastPaymentDate),
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
          <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Clientes con Atraso</h1>
          <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">Seguimiento de pagos pendientes</p>
        </div>
      </div>
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
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard :value="isLoading ? '...' : String(overdueList?.length ?? 0)" title="Con atraso">
        <template #icon>
          <AppIcon icon="lucide:triangle-alert" :size="20" color="#ef4444" />
        </template>
      </StatsCard>
      <StatsCard :value="isLoading ? '...' : formatCurrency(totalOwed)" title="Total adeudado">
        <template #icon>
          <AppIcon icon="lucide:circle-dollar-sign" :size="20" color="#f59e0b" />
        </template>
      </StatsCard>
      <StatsCard :value="isLoading ? '...' : String(criticalCount)" title="Estado crítico">
        <template #icon>
          <AppIcon icon="lucide:clock-alert" :size="20" color="#ef4444" />
        </template>
      </StatsCard>
      <StatsCard value="0" title="Comunicaciones">
        <template #icon>
          <AppIcon icon="lucide:message-circle" :size="20" color="#6366f1" />
        </template>
      </StatsCard>
    </div>

    <!-- Búsqueda -->
    <div>
      <SearchInput v-model="search" placeholder="Buscar por inquilino o propiedad..." />
    </div>

    <!-- Skeleton loading -->
    <template v-if="isLoading">
      <div class="flex flex-col items-center justify-center py-12 gap-3">
        <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
        <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Cargando atrasos...</p>
      </div>
    </template>

    <!-- Empty -->
    <template v-else-if="!overdueList?.length">
      <div
        class="flex flex-col items-center justify-center py-20 gap-3 rounded-xl border"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <AppIcon icon="lucide:circle-check-big" :size="48" color="var(--color-text-muted)" />
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
                <AppIcon icon="lucide:map-pin" :size="14" color="var(--color-text-muted)" />
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
                <AppIcon icon="lucide:phone" :size="14" /> Llamar
              </button>
              <button class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border hover-surface transition-colors" :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }">
                <AppIcon icon="lucide:mail" :size="14" /> Email
              </button>
              <button class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border hover-surface transition-colors" :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }">
                <AppIcon icon="lucide:pencil-line" :size="14" /> Nota
              </button>
              <button
                class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                :style="{ backgroundColor: 'var(--color-primary)' }"
                @click="openModal(item)"
              >
                <AppIcon icon="lucide:circle-dollar-sign" :size="14" /> Cobrar
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
