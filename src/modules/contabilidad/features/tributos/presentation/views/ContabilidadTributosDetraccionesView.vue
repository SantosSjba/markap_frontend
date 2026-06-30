<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  AppIcon,
  BaseModal,
  Badge,
  DataTable,
  FormInput,
  FormSelect,
  PageHeader,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import {
  useContabilidadCashBoxes,
  useContabilidadBankAccounts,
} from '@modules/contabilidad/features/tesoreria/application/useContabilidadTreasury'
import { useContabilidadSuppliers, useContabilidadPurchaseInvoices } from '@modules/contabilidad/features/compras/application/useContabilidadPurchases'
import {
  useContabilidadDetraccionRates,
  useContabilidadDetracciones,
  useContabilidadCreateDetraccion,
  useContabilidadPayDetraccion,
} from '../../application/useContabilidadTaxes'
import {
  DETRACTION_STATUS,
  DETRACTION_STATUS_FILTER_OPTIONS,
  detraccionStatusVariant,
  type ContabilidadDetraccionDTO,
} from '../../domain/taxes.types'

const router = useRouter()
const { activePeriod } = useContabilidadActivePeriod()

const statusFilter = ref('')
const listParams = computed(() => ({
  periodId: activePeriod.value?.id,
  status: statusFilter.value || undefined,
}))

const { data, isLoading, refetch } = useContabilidadDetracciones(listParams)
const rows = computed(() => data.value?.detracciones ?? [])

const { data: ratesData } = useContabilidadDetraccionRates()
const rateOptions = computed(() =>
  (ratesData.value?.rates ?? []).map((r) => ({
    value: r.id,
    label: `${r.sunatCode} — ${r.description} (${r.ratePercent}%)`,
    ratePercent: r.ratePercent,
  })),
)

const supplierParams = computed(() => ({ activeOnly: true }))
const { data: suppliersData } = useContabilidadSuppliers(supplierParams)
const supplierOptions = computed(() =>
  (suppliersData.value?.suppliers ?? []).map((s) => ({
    value: s.id,
    label: `${s.ruc} — ${s.businessName}`,
    ruc: s.ruc,
    name: s.businessName,
  })),
)

const invoiceParams = computed(() => ({ periodId: activePeriod.value?.id }))
const { data: invoicesData } = useContabilidadPurchaseInvoices(invoiceParams)
const invoiceOptions = computed(() =>
  (invoicesData.value?.invoices ?? []).map((inv) => ({
    value: inv.id,
    label: `${inv.fullNumber} — ${formatPen(inv.totalAmount)}`,
    supplierId: inv.supplierId,
    detraccionAmount: inv.detraccionAmount,
  })),
)

const { data: cashData } = useContabilidadCashBoxes()
const { data: bankData } = useContabilidadBankAccounts()
const cashOptions = computed(() =>
  (cashData.value?.cashBoxes ?? []).filter((c) => c.isActive).map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })),
)
const bankOptions = computed(() =>
  (bankData.value?.bankAccounts ?? []).filter((b) => b.isActive).map((b) => ({ value: b.id, label: `${b.code} — ${b.bankName}` })),
)

const sourceTypeOptions = [
  { value: 'CASH', label: 'Caja' },
  { value: 'BANK', label: 'Banco' },
]

const { mutate: createDetraccion, isPending: saving } = useContabilidadCreateDetraccion()
const { mutate: payDetraccion, isPending: paying } = useContabilidadPayDetraccion()

const createModalOpen = ref(false)
const payModalOpen = ref(false)
const payingRow = ref<ContabilidadDetraccionDTO | null>(null)

const form = ref({
  supplierId: '',
  purchaseInvoiceId: '',
  rateId: '',
  certificateNumber: '',
  operationDate: '',
  baseAmount: '',
  ratePercent: '',
  amount: '',
})

const payForm = ref({
  sourceType: 'BANK' as 'CASH' | 'BANK',
  cashBoxId: '',
  bankAccountId: '',
  paymentDate: '',
  description: '',
})

watch(activePeriod, (p) => {
  if (!p) return
  const now = new Date()
  form.value.operationDate = `${p.year}-${String(p.month).padStart(2, '0')}-${String(Math.min(now.getDate(), 28)).padStart(2, '0')}`
  payForm.value.paymentDate = form.value.operationDate
}, { immediate: true })

watch(
  () => form.value.rateId,
  (id) => {
    const rate = rateOptions.value.find((r) => r.value === id)
    if (rate) form.value.ratePercent = rate.ratePercent
  },
)

watch(
  () => form.value.supplierId,
  (id) => {
    const s = supplierOptions.value.find((o) => o.value === id)
    if (s) {
      // supplier prefilled via invoice or manual
    }
  },
)

watch(
  () => form.value.purchaseInvoiceId,
  (id) => {
    const inv = invoiceOptions.value.find((i) => i.value === id)
    if (inv) {
      const sup = supplierOptions.value.find((s) => s.value === inv.supplierId)
      if (sup) form.value.supplierId = sup.value
      if (Number(inv.detraccionAmount) > 0) form.value.amount = inv.detraccionAmount
    }
  },
)

watch(cashOptions, (opts) => {
  if (!payForm.value.cashBoxId && opts[0]) payForm.value.cashBoxId = opts[0].value
}, { immediate: true })
watch(bankOptions, (opts) => {
  if (!payForm.value.bankAccountId && opts[0]) payForm.value.bankAccountId = opts[0].value
}, { immediate: true })

const columns = [
  { key: 'operationDate', label: 'Fecha', sortable: true },
  { key: 'certificateNumber', label: 'Constancia' },
  { key: 'supplierName', label: 'Proveedor' },
  { key: 'amount', label: 'Importe', align: 'right' as const },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: '', align: 'right' as const },
]

function statusLabel(status: string) {
  return data.value?.statusLabels?.[status] ?? status
}

function openCreate() {
  form.value.certificateNumber = ''
  form.value.baseAmount = ''
  form.value.amount = ''
  form.value.purchaseInvoiceId = ''
  createModalOpen.value = true
}

function submitCreate() {
  if (!activePeriod.value) return
  const supplier = supplierOptions.value.find((s) => s.value === form.value.supplierId)
  if (!supplier || !form.value.certificateNumber || !form.value.baseAmount) {
    void markapAlert.toast.warning('Complete proveedor, constancia y base')
    return
  }
  createDetraccion(
    {
      periodId: activePeriod.value.id,
      purchaseInvoiceId: form.value.purchaseInvoiceId || null,
      rateId: form.value.rateId || null,
      supplierRuc: supplier.ruc,
      supplierName: supplier.name,
      certificateNumber: form.value.certificateNumber,
      operationDate: form.value.operationDate,
      baseAmount: form.value.baseAmount,
      ratePercent: form.value.ratePercent || undefined,
      amount: form.value.amount || undefined,
    },
    { onSuccess: () => { createModalOpen.value = false; void refetch() } },
  )
}

function openPay(row: ContabilidadDetraccionDTO) {
  payingRow.value = row
  payForm.value.description = `Pago SPOT ${row.certificateNumber}`
  payModalOpen.value = true
}

function submitPay() {
  if (!payingRow.value) return
  payDetraccion(
    {
      id: payingRow.value.id,
      body: {
        paymentDate: payForm.value.paymentDate,
        description: payForm.value.description.trim(),
        sourceType: payForm.value.sourceType,
        cashBoxId: payForm.value.sourceType === 'CASH' ? payForm.value.cashBoxId : null,
        bankAccountId: payForm.value.sourceType === 'BANK' ? payForm.value.bankAccountId : null,
      },
    },
    { onSuccess: () => { payModalOpen.value = false; void refetch() } },
  )
}

function goJournal(row: ContabilidadDetraccionDTO) {
  if (!row.journalEntryId) return
  void router.push({ name: 'contabilidad-asiento-detalle', params: { id: row.journalEntryId } })
}
</script>

<template>
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
    <PageHeader
      icon="lucide:landmark"
      title="Detracciones SPOT"
      subtitle="Registro y pago de detracciones (cuenta 4018). Tasas SUNAT configurables."
    >
      <template #actions>
        <BaseButton variant="primary" :disabled="!activePeriod" @click="openCreate">
          <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
          Registrar detracción
        </BaseButton>
      </template>
    </PageHeader>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <DataTable
        :columns="columns"
        :data="rows"
        :loading="isLoading"
        empty-text="Sin detracciones en este periodo."
        row-key="id"
      >
        <template #toolbar>
          <div class="w-full sm:w-[200px] min-w-0 shrink-0 ml-auto">
            <FormSelect v-model="statusFilter" :options="DETRACTION_STATUS_FILTER_OPTIONS" />
          </div>
        </template>

        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadDetraccionDTO).operationDate }}</td>
          <td class="py-3 px-4 font-mono text-sm">{{ (row as ContabilidadDetraccionDTO).certificateNumber }}</td>
          <td class="py-3 px-4 text-sm">
            <div>{{ (row as ContabilidadDetraccionDTO).supplierName }}</div>
            <div class="text-xs font-mono" :style="{ color: 'var(--color-text-muted)' }">
              {{ (row as ContabilidadDetraccionDTO).supplierRuc }}
            </div>
          </td>
          <td class="py-3 px-4 text-sm text-right font-mono font-semibold">
            {{ formatPen((row as ContabilidadDetraccionDTO).amount) }}
          </td>
          <td class="py-3 px-4">
            <Badge :variant="detraccionStatusVariant((row as ContabilidadDetraccionDTO).status)">
              {{ statusLabel((row as ContabilidadDetraccionDTO).status) }}
            </Badge>
          </td>
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <BaseButton
              v-if="(row as ContabilidadDetraccionDTO).journalEntryId"
              variant="secondary"
              size="sm"
              class="mr-1"
              @click="goJournal(row as ContabilidadDetraccionDTO)"
            >
              Asiento
            </BaseButton>
            <BaseButton
              v-if="(row as ContabilidadDetraccionDTO).status === DETRACTION_STATUS.PENDING"
              variant="primary"
              size="sm"
              :loading="paying"
              @click="openPay(row as ContabilidadDetraccionDTO)"
            >
              Pagar SPOT
            </BaseButton>
          </td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="createModalOpen" title="Registrar detracción SPOT" size="lg">
      <form class="space-y-4" @submit.prevent="submitCreate">
        <div class="w-full min-w-0">
          <FormSelect
            v-model="form.purchaseInvoiceId"
            label="Factura compra (opcional)"
            :options="[{ value: '', label: 'Sin vincular' }, ...invoiceOptions]"
          />
        </div>
        <div class="w-full min-w-0">
          <FormSelect v-model="form.supplierId" label="Proveedor" :options="supplierOptions" />
        </div>
        <div class="w-full min-w-0">
          <FormSelect v-model="form.rateId" label="Bien/servicio SUNAT" :options="rateOptions" placeholder="Seleccionar tasa…" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2 w-full">
          <div class="min-w-0">
            <FormInput v-model="form.certificateNumber" label="N° constancia" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.operationDate" label="Fecha operación" type="date" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.baseAmount" label="Base (S/)" type="number" min="0" step="0.01" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.ratePercent" label="Tasa %" type="number" min="0" step="0.01" />
          </div>
          <div class="min-w-0 sm:col-span-2">
            <FormInput v-model="form.amount" label="Importe detracción (S/)" type="number" min="0" step="0.01" />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="createModalOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="saving">Registrar</BaseButton>
        </div>
      </form>
    </BaseModal>

    <BaseModal v-model="payModalOpen" title="Pagar detracción SPOT" size="md">
      <form class="space-y-4" @submit.prevent="submitPay">
        <p v-if="payingRow" class="text-sm font-mono">
          {{ payingRow.certificateNumber }} — {{ formatPen(payingRow.amount) }}
        </p>
        <div class="grid gap-4 sm:grid-cols-2 w-full">
          <div class="min-w-0">
            <FormSelect v-model="payForm.sourceType" label="Medio de pago" :options="sourceTypeOptions" />
          </div>
          <div class="min-w-0">
            <FormInput v-model="payForm.paymentDate" label="Fecha pago" type="date" required />
          </div>
        </div>
        <div v-if="payForm.sourceType === 'CASH'" class="w-full min-w-0">
          <FormSelect v-model="payForm.cashBoxId" label="Caja" :options="cashOptions" />
        </div>
        <div v-else class="w-full min-w-0">
          <FormSelect v-model="payForm.bankAccountId" label="Cuenta bancaria" :options="bankOptions" />
        </div>
        <div class="w-full min-w-0">
          <FormInput v-model="payForm.description" label="Glosa" required />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="payModalOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="paying">Registrar pago</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
