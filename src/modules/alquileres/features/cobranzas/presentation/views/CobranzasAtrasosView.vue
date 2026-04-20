<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as yup from 'yup'
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
import ActionsDropdown from '@shared/components/ui/ActionsDropdown.vue'
import { useExcelExport } from '@shared/composables'
import { useForm, toTypedSchema } from '@shared/forms'
import {
  useOverduePayments,
  useRegisterPayment,
  usePendingPayments,
  useSaveCommunicationNote,
} from '../../application/usePayments'
import type { OverduePaymentItem, PaymentMethod } from '../../domain/payment.types'
import { paymentsService } from '../../infrastructure/payments.service'

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

const pendingParams = computed(() => ({
  search: selectedOverdue.value?.tenantName,
  status: 'OVERDUE' as const,
}))

const { data: tenantPendingPayments } = usePendingPayments(pendingParams)

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
  defineComponentBinds: definePaymentBinds,
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

const paidDateBinds = definePaymentBinds('paidDate')
const paidAmountBinds = definePaymentBinds('paidAmount')
const paymentMethodBinds = definePaymentBinds('paymentMethod')
const referenceNumberBinds = definePaymentBinds('referenceNumber')
const notesBinds = definePaymentBinds('notes')

const noteSchema = yup.object({
  note: yup.string().trim().required('Escriba una nota'),
})

const {
  handleSubmit: submitNoteForm,
  errors: noteErrors,
  defineComponentBinds: defineNoteBinds,
  resetForm: resetNoteForm,
} = useForm({
  validationSchema: toTypedSchema(noteSchema),
  initialValues: { note: '' },
})

const noteFieldBinds = defineNoteBinds('note')

const paymentMethodOptions = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'DEPOSIT', label: 'Depósito' },
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
  { value: 'CHECK', label: 'Cheque' },
  { value: 'OTHER', label: 'Otro' },
]

const { mutateAsync: doRegisterPayment, isPending: registeringPayment } = useRegisterPayment()

function openModal(item: OverduePaymentItem) {
  selectedOverdue.value = item
  selectedPaymentId.value = null
  modalError.value = ''
  resetPaymentForm({
    values: {
      paidDate: new Date().toISOString().slice(0, 10),
      paidAmount: item.totalOwed,
      paymentMethod: 'CASH',
      referenceNumber: '',
      notes: '',
    },
  })
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedOverdue.value = null
  selectedPaymentId.value = null
  modalError.value = ''
}

const onPaymentSubmit = submitPaymentForm(async (vals) => {
  if (!selectedPaymentId.value) {
    modalError.value = 'Selecciona el período a pagar'
    return
  }
  modalError.value = ''
  try {
    await doRegisterPayment({
      paymentId: selectedPaymentId.value,
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

// ─── Nota de comunicación ─────────────────────────────────────────────────────
const showNoteModal = ref(false)
const noteItem = ref<OverduePaymentItem | null>(null)
const { mutate: doSaveNote, isPending: savingNote } = useSaveCommunicationNote()

function openNoteModal(item: OverduePaymentItem) {
  noteItem.value = item
  resetNoteForm({ values: { note: item.lastCommunicationNote ?? '' } })
  showNoteModal.value = true
}

function closeNoteModal() {
  showNoteModal.value = false
  noteItem.value = null
}

const onNoteSave = submitNoteForm((vals) => {
  if (!noteItem.value) return
  doSaveNote(
    { rentalId: noteItem.value.rentalId, note: vals.note.trim() },
    { onSuccess: closeNoteModal },
  )
})

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

function getOverdueActions(item: OverduePaymentItem) {
  return [
    {
      label: 'Cobrar',
      icon: 'lucide:circle-dollar-sign',
      onClick: () => openModal(item),
    },
    {
      label: 'Ver contrato',
      icon: 'lucide:file-text',
      onClick: () => router.push(`/alquileres/contratos/${item.rentalId}`),
    },
  ]
}

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
              <a
                v-if="item.tenantPhone"
                :href="`tel:${item.tenantPhone}`"
                target="_blank"
                class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border hover-surface transition-colors"
                :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', textDecoration: 'none' }"
              >
                <AppIcon icon="lucide:phone" :size="14" /> Llamar
              </a>
              <button
                v-else
                disabled
                class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border opacity-40 cursor-not-allowed"
                :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }"
                title="Sin teléfono registrado"
              >
                <AppIcon icon="lucide:phone" :size="14" /> Llamar
              </button>

              <a
                v-if="item.tenantEmail"
                :href="`mailto:${item.tenantEmail}`"
                target="_blank"
                class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border hover-surface transition-colors"
                :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', textDecoration: 'none' }"
              >
                <AppIcon icon="lucide:mail" :size="14" /> Email
              </a>
              <button
                v-else
                disabled
                class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border opacity-40 cursor-not-allowed"
                :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }"
                title="Sin email registrado"
              >
                <AppIcon icon="lucide:mail" :size="14" /> Email
              </button>

              <button
                class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border hover-surface transition-colors"
                :style="{ borderColor: item.lastCommunicationDate ? 'var(--color-primary)' : 'var(--color-border)', color: item.lastCommunicationDate ? 'var(--color-primary)' : 'var(--color-text-secondary)' }"
                @click="openNoteModal(item)"
              >
                <AppIcon icon="lucide:pencil-line" :size="14" />
                {{ item.lastCommunicationDate ? 'Ver nota' : 'Nota' }}
              </button>
              <div class="flex items-center gap-1">
                <button
                  class="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                  :style="{ backgroundColor: 'var(--color-primary)' }"
                  @click="openModal(item)"
                >
                  <AppIcon icon="lucide:circle-dollar-sign" :size="14" /> Cobrar
                </button>
                <ActionsDropdown :items="getOverdueActions(item)" />
              </div>
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
    <BaseModal v-model="showModal" size="md" @close="closeModal">
      <template #title>
        <div class="flex items-center gap-2">
          <AppIcon icon="lucide:circle-dollar-sign" :size="18" color="var(--color-error)" />
          <span>Registrar Cobro</span>
        </div>
      </template>

      <template v-if="selectedOverdue">
        <form id="cobranzas-atrasos-register-payment" @submit.prevent="onPaymentSubmit">
        <!-- Resumen del cliente en atraso -->
        <div
          class="flex items-center gap-4 p-4 rounded-xl mb-5"
          :style="{ backgroundColor: 'var(--color-surface-elevated)', borderLeft: `4px solid ${getBorderColor(selectedOverdue.overdueLevel)}`, border: '1px solid var(--color-border)' }"
        >
          <div
            class="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            :style="{ backgroundColor: getAvatarColor(selectedOverdue.tenantName) }"
          >
            {{ getInitials(selectedOverdue.tenantName) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">
                {{ selectedOverdue.tenantName }}
              </p>
              <Badge :variant="getOverdueLevelBadge(selectedOverdue.overdueLevel).variant" :label="getOverdueLevelBadge(selectedOverdue.overdueLevel).label" />
            </div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <AppIcon icon="lucide:map-pin" :size="12" color="var(--color-text-muted)" />
              <p class="text-xs truncate" :style="{ color: 'var(--color-text-muted)' }">{{ selectedOverdue.propertyAddress }}</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <p class="text-xs font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Total adeudado</p>
            <p class="text-lg font-bold" :style="{ color: '#ef4444' }">
              {{ formatCurrency(selectedOverdue.totalOwed, selectedOverdue.currency) }}
            </p>
          </div>
        </div>

        <!-- Seleccionar período a pagar -->
        <div class="flex items-center gap-2 mb-3">
          <AppIcon icon="lucide:calendar-clock" :size="15" color="var(--color-primary)" />
          <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Período a regularizar</p>
        </div>
        <div
          class="p-3 rounded-xl mb-5"
          :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex flex-col gap-2">
            <label
              v-for="pending in tenantPendingPayments?.filter(p => p.rentalId === selectedOverdue?.rentalId)"
              :key="pending.paymentId"
              class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
              :style="selectedPaymentId === pending.paymentId
                ? { backgroundColor: 'var(--color-primary)15', border: '1px solid var(--color-primary)' }
                : { border: '1px solid transparent' }"
            >
              <input
                type="radio"
                :value="pending.paymentId"
                v-model="selectedPaymentId"
                class="accent-primary shrink-0"
              />
              <div class="flex-1 min-w-0">
                <span class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">
                  {{ pending.periodLabel }}
                </span>
                <span class="mx-2 text-sm" :style="{ color: 'var(--color-text-muted)' }">—</span>
                <span class="text-sm font-bold" :style="{ color: 'var(--color-text-primary)' }">
                  {{ formatCurrency(pending.amount, pending.currency) }}
                </span>
              </div>
              <Badge variant="error" :label="`${pending.daysOverdue}d`" />
            </label>
            <div
              v-if="!tenantPendingPayments?.filter(p => p.rentalId === selectedOverdue?.rentalId).length"
              class="flex items-center gap-2 py-2"
              :style="{ color: 'var(--color-text-muted)' }"
            >
              <AppIcon icon="svg-spinners:ring-resize" :size="16" color="var(--color-primary)" />
              <span class="text-xs">Cargando períodos...</span>
            </div>
          </div>
        </div>

        <!-- Datos del pago -->
        <div class="flex items-center gap-2 mb-3">
          <AppIcon icon="lucide:banknote" :size="15" color="var(--color-primary)" />
          <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Datos del pago</p>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <FormInput v-bind="paidDateBinds" type="date" label="Fecha de pago" :error="paymentErrors.paidDate" required />
          <FormInput v-bind="paidAmountBinds" type="number" label="Monto pagado" :error="paymentErrors.paidAmount" required />
        </div>
        <FormSelect v-bind="paymentMethodBinds" :options="paymentMethodOptions" label="Método de pago" :error="paymentErrors.paymentMethod" required class="mb-4" />
        <FormInput
          v-bind="referenceNumberBinds"
          type="text"
          label="Referencia / Operación"
          placeholder="Ej: 001234567890"
          :error="paymentErrors.referenceNumber"
          class="mb-4"
        />
        <FormTextarea v-bind="notesBinds" label="Notas" placeholder="Observaciones..." :error="paymentErrors.notes" :rows="2" />

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
          <BaseButton variant="primary" type="submit" form="cobranzas-atrasos-register-payment" :loading="registeringPayment" :disabled="registeringPayment || !selectedPaymentId">
            <AppIcon icon="lucide:circle-check" :size="16" />
            Confirmar Cobro
          </BaseButton>
        </div>
      </template>
    </BaseModal>

  <!-- Modal: Nota de comunicación -->
  <BaseModal v-model="showNoteModal" :closable="true" size="sm" @close="closeNoteModal">
    <template #title>
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style="background: var(--color-primary)1a;">
          <AppIcon icon="lucide:pencil-line" :size="16" style="color: var(--color-primary);" />
        </div>
        <div>
          <p class="text-base font-semibold" style="color: var(--color-text-primary);">Nota de comunicación</p>
          <p v-if="noteItem" class="text-xs" style="color: var(--color-text-muted);">{{ noteItem.tenantName }}</p>
        </div>
      </div>
    </template>

    <form id="cobranzas-atrasos-note-form" class="p-4 space-y-4" @submit.prevent="onNoteSave">
      <!-- Última nota guardada -->
      <div
        v-if="noteItem?.lastCommunicationDate && noteItem?.lastCommunicationNote"
        class="px-3 py-2.5 rounded-lg text-sm space-y-1"
        :style="{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
      >
        <div class="flex items-center gap-1.5">
          <AppIcon icon="lucide:history" :size="13" style="color: var(--color-text-muted);" />
          <span class="text-xs font-medium" style="color: var(--color-text-muted);">
            Última nota — {{ formatDate(noteItem.lastCommunicationDate) }}
          </span>
        </div>
        <p class="text-sm" style="color: var(--color-text-secondary);">{{ noteItem.lastCommunicationNote }}</p>
      </div>

      <FormTextarea
        v-bind="noteFieldBinds"
        label="Nueva nota"
        placeholder="Ej: Llamé al cliente, quedó en pagar el viernes..."
        :error="noteErrors.note"
        :rows="4"
      />
    </form>

    <div class="flex justify-end gap-3 p-4 border-t" style="border-color: var(--color-border);">
      <BaseButton variant="ghost" @click="closeNoteModal">Cancelar</BaseButton>
      <BaseButton
        variant="primary"
        type="submit"
        form="cobranzas-atrasos-note-form"
        :loading="savingNote"
      >
        <AppIcon icon="lucide:save" :size="16" class="mr-1" />
        Guardar nota
      </BaseButton>
    </div>
  </BaseModal>
  </div>
</template>
