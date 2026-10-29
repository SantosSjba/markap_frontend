<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, filterActions } = useApplicationAccess('alquileres')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseAlert from '@shared/presentation/components/ui/BaseAlert.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { RadioGroup, RadioGroupItem } from '@shared/presentation/ui/radio-group'
import { paymentsRepositoryKey } from '../../application/ports/payments.port'
import { useService } from '@shared/presentation/di/services'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as yup from 'yup'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Avatar from '@shared/presentation/components/ui/Avatar.vue'
import ExcelIcon from '@shared/presentation/components/ui/ExcelIcon.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import {
  useOverduePayments,
  useRegisterPayment,
  usePendingPayments,
  useSaveCommunicationNote,
} from '../composables/usePayments'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatCurrency as formatMoneyAmount, formatShortDate, toCalendarDateString } from '@shared/utils/formatters'
import type {
  ListOverdueParams,
  ListPendingParams,
  OverduePaymentItem,
  PaymentCurrencyAmount,
  PaymentMethod,
} from '../../domain/payment.types'
const paymentsRepository = useService(paymentsRepositoryKey)

const router = useRouter()

const search = ref('')
const debouncedSearch = useDebouncedRef(search)

const currentPage = ref(1)
const pageSize = ref(10)
const overdueParams = computed<ListOverdueParams>(() => ({
  search: debouncedSearch.value.trim() || undefined,
  page: currentPage.value,
  limit: pageSize.value,
}))
// Una búsqueda nueva vuelve a la primera página
watch(debouncedSearch, () => {
  currentPage.value = 1
})

const {
  data: overdueResult,
  isFetching,
  isError: overdueIsError,
  error: overdueFetchError,
  refetch: refetchOverdue,
} = useOverduePayments(overdueParams)

const overdueList = computed(() => overdueResult.value?.data ?? [])
const totalItems = computed(() => overdueResult.value?.total ?? 0)
// KPIs de todos los contratos con atraso (no solo la página)
const summary = computed(() => overdueResult.value?.summary)
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

// Modal de cobro rápido
const showModal = ref(false)
const selectedOverdue = ref<OverduePaymentItem | null>(null)
const selectedPaymentId = ref<string | null>(null)

function onSelectPending(paymentId: string) {
  selectedPaymentId.value = paymentId
  const pending = selectedRentalPendingList.value.find((p) => p.paymentId === paymentId)
  if (pending) setPaymentField('paidAmount', pending.amount)
}
const modalError = ref('')

// Cuotas del contrato elegido (por contrato, no por nombre de inquilino)
const pendingParams = computed<ListPendingParams>(() => ({
  rentalId: selectedOverdue.value?.rentalId,
  status: 'ALL',
  page: 1,
  limit: 100,
}))

const {
  data: tenantPendingPayments,
  isLoading: tenantPendLoading,
  isError: tenantPendError,
  error: tenantPendFetchError,
  refetch: refetchTenantPend,
} = usePendingPayments(pendingParams, () => showModal.value && !!selectedOverdue.value)

const selectedRentalPendingList = computed(
  () => tenantPendingPayments.value?.data.filter((p) => p.daysOverdue > 0) ?? [],
)
const selectedPending = computed(() =>
  selectedRentalPendingList.value.find((p) => p.paymentId === selectedPaymentId.value),
)

const paymentSchema = yup.object({
  paidDate: yup
    .string()
    .required('La fecha de pago es requerida')
    .test('not-future', 'La fecha de pago no puede ser futura', (v) => !v || v <= toCalendarDateString()),
  paidAmount: yup
    .number()
    .transform((_v, originalValue) => {
      if (originalValue === '' || originalValue === null || originalValue === undefined) return NaN
      const n = Number(originalValue)
      return Number.isNaN(n) ? NaN : n
    })
    .min(0.01, 'El monto debe ser mayor a 0')
    .test('max-balance', 'El monto no puede superar el saldo de la cuota', (v) =>
      v == null || !selectedPending.value || v <= selectedPending.value.amount,
    )
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
  setFieldValue: setPaymentField,
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
      paidDate: toCalendarDateString(),
      paidAmount: 0,
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

function getOverdueLevelBadge(level: string): {
  variant: 'error' | 'warning' | 'info'
  label: string
} {
  switch (level) {
    case 'critical':
      return { variant: 'error', label: 'Crítico' }
    case 'high':
      return { variant: 'warning', label: 'Alto' }
    default:
      return { variant: 'info', label: 'Moderado' }
  }
}

function getBorderClass(level: string) {
  switch (level) {
    case 'critical':
      return 'border-l-error-500'
    case 'high':
      return 'border-l-warning-500'
    default:
      return 'border-l-blue-light-500'
  }
}

function formatCurrency(amount: number, currency = 'PEN') {
  return formatMoneyAmount(amount, currency)
}

/** Soles y dólares por separado («S/ 1,200.00 · $ 300.00») */
function formatAmounts(rows: PaymentCurrencyAmount[] | undefined) {
  return rows?.length ? rows.map((r) => formatCurrency(r.amount, r.currency)).join(' · ') : formatCurrency(0)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return formatShortDate(dateStr)
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
  const { data } = await paymentsRepository.listOverdue({
    search: debouncedSearch.value.trim() || undefined,
    page: 1,
    limit: 10000,
  })
  const now = toCalendarDateString()
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
    <PageHeader
      title="Clientes con Atraso"
      subtitle="Seguimiento de pagos pendientes"
      :help-items="[
        { icon: 'lucide:calendar-x', term: 'Días de atraso', text: 'Se cuentan desde la fecha de vencimiento de la cuota más antigua sin pagar.' },
        { icon: 'lucide:siren', term: 'Gravedad', text: 'Moderado hasta 14 días, alto de 15 a 30 y crítico con más de 30 días de atraso.' },
        { icon: 'lucide:list-checks', term: 'Período a regularizar', text: 'Cuotas vencidas del cliente que debe ponerse al día.' },
      ]"
      back
      @back="router.push({ name: 'alquileres-cobranzas' })"
    >
      <template #actions>
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
      </template>
    </PageHeader>

    <!-- KPIs -->
    <div v-if="!overdueIsError" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatsCard compact title="Con atraso" :value="String(totalItems)" :loading="isFetching && !overdueResult">
        <template #icon><AppIcon icon="lucide:triangle-alert" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Total adeudado" :value="formatAmounts(summary?.owedByCurrency)" :loading="isFetching && !overdueResult">
        <template #icon><AppIcon icon="lucide:circle-dollar-sign" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Estado crítico" :value="String(summary?.criticalCount ?? 0)" subtitle="+30 días" :loading="isFetching && !overdueResult">
        <template #icon><AppIcon icon="lucide:clock-alert" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Con nota de contacto" :value="String(summary?.withCommunicationCount ?? 0)" :loading="isFetching && !overdueResult">
        <template #icon><AppIcon icon="lucide:message-circle" :size="20" /></template>
      </StatsCard>
    </div>

    <!-- Búsqueda -->
    <div>
      <SearchInput v-model="search" placeholder="Buscar por código, inquilino, propiedad o propietario..." />
    </div>

    <template v-if="overdueIsError">
      <BaseCard class="flex flex-col items-center justify-center py-20 gap-3 px-4 text-center">
        <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
        <p class="text-sm font-medium max-w-md text-error-500 dark:text-error-400">{{ getApiErrorMessage(overdueFetchError) }}</p>
        <BaseButton variant="outline" size="sm" @click="() => refetchOverdue()">Reintentar</BaseButton>
      </BaseCard>
    </template>

    <div v-else-if="isFetching" class="flex flex-col gap-4">
      <div
        v-for="n in 5"
        :key="n"
        class="h-28 rounded-xl border animate-pulse border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-white/5"
      />
    </div>

    <!-- Empty -->
    <template v-else-if="!overdueList?.length">
      <BaseCard class="flex flex-col items-center justify-center py-20 gap-3">
        <AppIcon icon="lucide:circle-check-big" :size="48" color="var(--color-text-muted)" />
        <p class="text-sm text-gray-400 dark:text-gray-500">No hay clientes con pagos en atraso</p>
      </BaseCard>
    </template>

    <!-- Cards de atraso -->
    <div v-else class="flex flex-col gap-4">
      <div
        v-for="item in overdueList"
        :key="item.rentalId"
        class="rounded-2xl border border-l-4 border-gray-200 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-dark"
        :class="getBorderClass(item.overdueLevel)"
      >
        <!-- Row 1: nombre + nivel + monto + acciones -->
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div class="flex items-center gap-3">
            <Avatar :name="item.tenantName" />
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ item.tenantName }}</p>
                <Badge :variant="getOverdueLevelBadge(item.overdueLevel).variant" :label="getOverdueLevelBadge(item.overdueLevel).label" />
              </div>
              <div class="flex items-center gap-1 mt-0.5">
                <AppIcon icon="lucide:map-pin" :size="14" color="var(--color-text-muted)" />
                <span class="text-xs text-gray-400 dark:text-gray-500">{{ item.propertyAddress }}</span>
              </div>
              <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">Propietario: {{ item.ownerName }}</p>
            </div>
          </div>

          <!-- Monto + acciones -->
          <div class="flex items-start sm:items-center gap-3">
            <div class="text-right">
              <p class="text-lg font-bold text-error-500 dark:text-error-400">{{ formatCurrency(item.totalOwed, item.currency) }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500">{{ item.monthsOverdue }} {{ item.monthsOverdue === 1 ? 'mes' : 'meses' }}</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <BaseButton v-if="item.tenantPhone" :href="`tel:${item.tenantPhone}`" target="_blank" variant="secondary" size="sm" icon="lucide:phone">Llamar</BaseButton>
              <BaseButton v-else disabled variant="secondary" size="sm" icon="lucide:phone" title="Sin teléfono registrado">Llamar</BaseButton>

              <BaseButton v-if="item.tenantEmail" :href="`mailto:${item.tenantEmail}`" target="_blank" variant="secondary" size="sm" icon="lucide:mail">Email</BaseButton>
              <BaseButton v-else disabled variant="secondary" size="sm" icon="lucide:mail" title="Sin email registrado">Email</BaseButton>

              <BaseButton @click="openNoteModal(item)" variant="secondary" size="sm" icon="lucide:pencil-line">{{ item.lastCommunicationDate ? 'Ver nota' : 'Nota' }}</BaseButton>
              <div class="flex items-center gap-1">
                <BaseButton v-if="canWrite" @click="openModal(item)" size="sm" icon="lucide:circle-dollar-sign" class="flex-1">Cobrar</BaseButton>
                <ActionsDropdown :items="filterActions(getOverdueActions(item))" />
              </div>
            </div>
          </div>
        </div>

        <!-- Row 2: datos adicionales -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div>
            <p class="text-xs text-gray-400 dark:text-gray-500">DNI</p>
            <p class="text-sm font-medium mt-0.5 text-gray-800 dark:text-white/90">{{ item.tenantDocument ?? '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 dark:text-gray-500">Días de atraso</p>
            <p class="text-sm font-medium mt-0.5 text-error-500 dark:text-error-400">{{ item.maxDaysOverdue }} días</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 dark:text-gray-500">Último pago</p>
            <p class="text-sm font-medium mt-0.5 text-gray-800 dark:text-white/90">{{ formatDate(item.lastPaymentDate) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 dark:text-gray-500">Última comunicación</p>
            <p class="text-sm font-medium mt-0.5 text-gray-800 dark:text-white/90">{{ formatDate(item.lastCommunicationDate) }}</p>
          </div>
        </div>
      </div>
    </div>

    <BaseCard v-if="!overdueIsError && totalItems > 0" padding="none" class="block overflow-hidden">
      <BasePagination
        v-bind="paginationProps"
        :show-page-size="true"
        :page-size-options="[5, 10, 20, 50]"
        @update:current-page="currentPage = $event"
        @update:page-size="onPageSizeChange"
      />
    </BaseCard>

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
          class="mb-5 flex items-center gap-4 rounded-xl border border-l-4 border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800"
          :class="getBorderClass(selectedOverdue.overdueLevel)"
        >
          <Avatar :name="selectedOverdue.tenantName" size="lg" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-semibold text-gray-800 dark:text-white/90">
                {{ selectedOverdue.tenantName }}
              </p>
              <Badge :variant="getOverdueLevelBadge(selectedOverdue.overdueLevel).variant" :label="getOverdueLevelBadge(selectedOverdue.overdueLevel).label" />
            </div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <AppIcon icon="lucide:map-pin" :size="12" color="var(--color-text-muted)" />
              <p class="text-xs truncate text-gray-400 dark:text-gray-500">{{ selectedOverdue.propertyAddress }}</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <p class="text-xs font-medium mb-0.5 text-gray-400 dark:text-gray-500">Total adeudado</p>
            <p class="text-lg font-bold text-error-500 dark:text-error-400">
              {{ formatCurrency(selectedOverdue.totalOwed, selectedOverdue.currency) }}
            </p>
          </div>
        </div>

        <!-- Seleccionar período a pagar -->
        <div class="flex items-center gap-2 mb-3">
          <AppIcon icon="lucide:calendar-clock" :size="15" color="var(--color-primary)" />
          <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Período a regularizar</p>
        </div>
        <div
          class="p-3 rounded-xl mb-5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
        >
          <div class="flex flex-col gap-2">
            <template v-if="tenantPendError">
              <div class="flex flex-col items-center gap-2 py-4 text-center px-2">
                <p class="text-xs text-error-500 dark:text-error-400">{{ getApiErrorMessage(tenantPendFetchError) }}</p>
                <BaseButton variant="outline" size="sm" @click="() => refetchTenantPend()">Reintentar</BaseButton>
              </div>
            </template>
            <template v-else-if="tenantPendLoading">
              <LoadingState variant="inline" text="Cargando períodos..." />
            </template>
            <template v-else>
            <RadioGroup
              :model-value="selectedPaymentId ?? undefined"
              class="flex flex-col gap-2"
              @update:model-value="onSelectPending(String($event))"
            >
              <label
                v-for="pending in selectedRentalPendingList"
                :key="pending.paymentId"
                class="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-3 transition-colors hover:bg-gray-50 has-data-checked:border-brand-500 has-data-checked:bg-brand-500/8 dark:hover:bg-white/3"
              >
                <RadioGroupItem :value="pending.paymentId" />
                <div class="min-w-0 flex-1">
                  <span class="text-sm font-medium text-gray-800 dark:text-white/90">
                    {{ pending.periodLabel }}
                  </span>
                  <span class="mx-2 text-sm text-gray-400 dark:text-gray-500">—</span>
                  <span class="text-sm font-bold text-gray-800 dark:text-white/90">
                    {{ formatCurrency(pending.amount, pending.currency) }}
                  </span>
                </div>
                <Badge variant="error" :label="`${pending.daysOverdue}d`" />
              </label>
            </RadioGroup>
            <div
              v-if="!selectedRentalPendingList.length"
              class="py-2 text-xs text-center text-gray-400 dark:text-gray-500"
            >
              No hay períodos pendientes para este contrato.
            </div>
            </template>
          </div>
        </div>

        <!-- Datos del pago -->
        <div class="flex items-center gap-2 mb-3">
          <AppIcon icon="lucide:banknote" :size="15" color="var(--color-primary)" />
          <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Datos del pago</p>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <FormInput v-bind="paidDateBinds" type="date" label="Fecha de pago" :max="toCalendarDateString()" :error="paymentErrors.paidDate" required />
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
        <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-brand-500/10">
          <AppIcon class="text-brand-500 dark:text-brand-400" icon="lucide:pencil-line" :size="16" />
        </div>
        <div>
          <p class="text-base font-semibold text-gray-800 dark:text-white/90">Nota de comunicación</p>
          <p v-if="noteItem" class="text-xs text-gray-400 dark:text-gray-500">{{ noteItem.tenantName }}</p>
        </div>
      </div>
    </template>

    <form id="cobranzas-atrasos-note-form" class="p-4 space-y-4" @submit.prevent="onNoteSave">
      <!-- Última nota guardada -->
      <div
        v-if="noteItem?.lastCommunicationDate && noteItem?.lastCommunicationNote"
        class="px-3 py-2.5 rounded-lg text-sm space-y-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
      >
        <div class="flex items-center gap-1.5">
          <AppIcon class="text-gray-400 dark:text-gray-500" icon="lucide:history" :size="13" />
          <span class="text-xs font-medium text-gray-400 dark:text-gray-500">
            Última nota — {{ formatDate(noteItem.lastCommunicationDate) }}
          </span>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ noteItem.lastCommunicationNote }}</p>
      </div>

      <FormTextarea
        v-bind="noteFieldBinds"
        label="Nueva nota"
        placeholder="Ej: Llamé al cliente, quedó en pagar el viernes..."
        :error="noteErrors.note"
        :rows="4"
      />
    </form>

    <div class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
      <BaseButton variant="ghost" @click="closeNoteModal">Cancelar</BaseButton>
      <BaseButton v-if="canWrite"
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
