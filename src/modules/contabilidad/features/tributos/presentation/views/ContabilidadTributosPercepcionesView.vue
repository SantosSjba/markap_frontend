<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  AppIcon,
  BaseModal,
  DataTable,
  FormInput,
  FormSelect,
  FormTextarea,
  PageHeader,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import {
  useContabilidadCashBoxes,
  useContabilidadBankAccounts,
} from '@modules/contabilidad/features/tesoreria/application/useContabilidadTreasury'
import { useContabilidadCustomers, useContabilidadSalesInvoices } from '@modules/contabilidad/features/ventas-contables/application/useContabilidadSales'
import {
  useContabilidadPerceptions,
  useContabilidadCreatePerception,
} from '../../application/useContabilidadTaxes'
import { PERCEPTION_TYPE, type ContabilidadPerceptionDTO } from '../../domain/taxes.types'

const router = useRouter()
const { activePeriod } = useContabilidadActivePeriod()

const listParams = computed(() => ({ periodId: activePeriod.value?.id }))
const { data, isLoading, refetch } = useContabilidadPerceptions(listParams)
const rows = computed(() => data.value?.perceptions ?? [])
const defaultRate = computed(() => data.value?.defaultRate ?? 2)

const customerParams = computed(() => ({ activeOnly: true }))
const { data: customersData } = useContabilidadCustomers(customerParams)
const customerOptions = computed(() =>
  (customersData.value?.customers ?? []).map((c) => ({
    value: c.id,
    label: `${c.ruc} — ${c.businessName}`,
    ruc: c.ruc,
    name: c.businessName,
  })),
)

const invoiceParams = computed(() => ({ periodId: activePeriod.value?.id }))
const { data: invoicesData } = useContabilidadSalesInvoices(invoiceParams)
const invoiceOptions = computed(() =>
  (invoicesData.value?.invoices ?? []).map((inv) => ({
    value: inv.id,
    label: `${inv.fullNumber} — ${formatPen(inv.totalAmount)}`,
    customerId: inv.customerId,
    taxableBase: inv.taxableBase,
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

const { mutate: createPerception, isPending: saving } = useContabilidadCreatePerception()

const modalOpen = ref(false)
const form = ref({
  customerId: '',
  salesInvoiceId: '',
  issueDate: '',
  taxableBase: '',
  ratePercent: '',
  amount: '',
  sourceType: 'BANK' as 'CASH' | 'BANK',
  cashBoxId: '',
  bankAccountId: '',
  description: '',
})

watch(activePeriod, (p) => {
  if (!p) return
  const now = new Date()
  form.value.issueDate = `${p.year}-${String(p.month).padStart(2, '0')}-${String(Math.min(now.getDate(), 28)).padStart(2, '0')}`
}, { immediate: true })

watch(defaultRate, (r) => {
  if (!form.value.ratePercent) form.value.ratePercent = String(r)
}, { immediate: true })

watch(
  () => form.value.salesInvoiceId,
  (id) => {
    const inv = invoiceOptions.value.find((i) => i.value === id)
    if (inv) {
      form.value.customerId = inv.customerId
      form.value.taxableBase = inv.taxableBase
      form.value.description = `Percepción ${inv.label.split(' — ')[0]}`
    }
  },
)

watch(customerOptions, (opts) => {
  if (!form.value.customerId && opts[0]) form.value.customerId = opts[0].value
}, { immediate: true })
watch(cashOptions, (opts) => {
  if (!form.value.cashBoxId && opts[0]) form.value.cashBoxId = opts[0].value
}, { immediate: true })
watch(bankOptions, (opts) => {
  if (!form.value.bankAccountId && opts[0]) form.value.bankAccountId = opts[0].value
}, { immediate: true })

const columns = [
  { key: 'issueDate', label: 'Fecha', sortable: true },
  { key: 'customerName', label: 'Cliente' },
  { key: 'invoiceFullNumber', label: 'Comprobante' },
  { key: 'amount', label: 'Importe', align: 'right' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

function openModal() {
  form.value.taxableBase = ''
  form.value.amount = ''
  form.value.salesInvoiceId = ''
  form.value.description = ''
  modalOpen.value = true
}

function submit() {
  if (!activePeriod.value) return
  const customer = customerOptions.value.find((c) => c.value === form.value.customerId)
  if (!customer || !form.value.taxableBase || !form.value.description.trim()) {
    void markapAlert.toast.warning('Complete cliente, base y glosa')
    return
  }
  createPerception(
    {
      periodId: activePeriod.value.id,
      perceptionType: PERCEPTION_TYPE.IGV,
      customerRuc: customer.ruc,
      customerName: customer.name,
      salesInvoiceId: form.value.salesInvoiceId || null,
      issueDate: form.value.issueDate,
      taxableBase: form.value.taxableBase,
      ratePercent: form.value.ratePercent || undefined,
      amount: form.value.amount || undefined,
      sourceType: form.value.sourceType,
      cashBoxId: form.value.sourceType === 'CASH' ? form.value.cashBoxId : null,
      bankAccountId: form.value.sourceType === 'BANK' ? form.value.bankAccountId : null,
      description: form.value.description.trim(),
    },
    { onSuccess: () => { modalOpen.value = false; void refetch() } },
  )
}

function goJournal(row: ContabilidadPerceptionDTO) {
  if (!row.journalEntryId) return
  void router.push({ name: 'contabilidad-asiento-detalle', params: { id: row.journalEntryId } })
}
</script>

<template>
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
    <PageHeader
      icon="lucide:shield-plus"
      title="Percepciones"
      subtitle="Percepciones IGV cobradas a clientes (ingreso tesorería / 4011)."
    >
      <template #actions>
        <BaseButton variant="primary" :disabled="!activePeriod" @click="openModal">
          <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
          Registrar percepción
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
        empty-text="Sin percepciones en este periodo."
        row-key="id"
      >
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadPerceptionDTO).issueDate }}</td>
          <td class="py-3 px-4 text-sm">
            <div>{{ (row as ContabilidadPerceptionDTO).customerName }}</div>
            <div class="text-xs font-mono" :style="{ color: 'var(--color-text-muted)' }">
              {{ (row as ContabilidadPerceptionDTO).customerRuc }}
            </div>
          </td>
          <td class="py-3 px-4 font-mono text-sm">
            {{ (row as ContabilidadPerceptionDTO).invoiceFullNumber ?? '—' }}
          </td>
          <td class="py-3 px-4 text-sm text-right font-mono font-semibold">
            {{ formatPen((row as ContabilidadPerceptionDTO).amount) }}
          </td>
          <td class="py-3 px-4 text-right">
            <BaseButton
              v-if="(row as ContabilidadPerceptionDTO).journalEntryId"
              variant="secondary"
              size="sm"
              @click="goJournal(row as ContabilidadPerceptionDTO)"
            >
              Asiento
            </BaseButton>
          </td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="modalOpen" title="Registrar percepción IGV" size="lg">
      <form class="space-y-4" @submit.prevent="submit">
        <div class="w-full min-w-0">
          <FormSelect
            v-model="form.salesInvoiceId"
            label="Comprobante venta (opcional)"
            :options="[{ value: '', label: 'Sin vincular' }, ...invoiceOptions]"
          />
        </div>
        <div class="w-full min-w-0">
          <FormSelect v-model="form.customerId" label="Cliente" :options="customerOptions" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2 w-full">
          <div class="min-w-0">
            <FormInput v-model="form.issueDate" label="Fecha" type="date" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.taxableBase" label="Base imponible (S/)" type="number" min="0" step="0.01" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.ratePercent" label="Tasa %" type="number" min="0" step="0.01" />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.amount" label="Importe percepción (S/)" type="number" min="0" step="0.01" />
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 w-full">
          <div class="min-w-0">
            <FormSelect v-model="form.sourceType" label="Medio de cobro" :options="sourceTypeOptions" />
          </div>
        </div>
        <div v-if="form.sourceType === 'CASH'" class="w-full min-w-0">
          <FormSelect v-model="form.cashBoxId" label="Caja" :options="cashOptions" />
        </div>
        <div v-else class="w-full min-w-0">
          <FormSelect v-model="form.bankAccountId" label="Cuenta bancaria" :options="bankOptions" />
        </div>
        <div class="w-full min-w-0">
          <FormTextarea v-model="form.description" label="Glosa" :rows="2" required />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="saving">Registrar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
