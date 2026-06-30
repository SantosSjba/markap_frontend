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
import {
  useContabilidadSalesInvoices,
  useContabilidadSalesCollections,
  useContabilidadCreateSalesCollection,
} from '../../application/useContabilidadSales'
import { SALES_STATUS } from '../../domain/sales.types'
import type { ContabilidadSalesCollectionDTO } from '../../domain/sales.types'

const router = useRouter()
const { activePeriod } = useContabilidadActivePeriod()

const listParams = computed(() => ({ periodId: activePeriod.value?.id }))
const { data, isLoading, refetch } = useContabilidadSalesCollections(listParams)
const rows = computed(() => data.value?.collections ?? [])

const invoiceParams = computed(() => ({ periodId: activePeriod.value?.id }))
const { data: invoicesData } = useContabilidadSalesInvoices(invoiceParams)
const pendingInvoices = computed(() =>
  (invoicesData.value?.invoices ?? []).filter(
    (inv) => inv.status === SALES_STATUS.PENDING || inv.status === SALES_STATUS.PARTIAL,
  ),
)
const invoiceOptions = computed(() =>
  pendingInvoices.value.map((inv) => ({
    value: inv.id,
    label: `${inv.fullNumber} — saldo ${formatPen(inv.balanceAmount)}`,
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

const { mutate: createCollection, isPending: saving } = useContabilidadCreateSalesCollection()

const modalOpen = ref(false)
const form = ref({
  invoiceId: '',
  sourceType: 'BANK' as 'CASH' | 'BANK',
  cashBoxId: '',
  bankAccountId: '',
  amount: '',
  collectionDate: '',
  description: '',
})

watch(activePeriod, (p) => {
  if (!p) return
  const now = new Date()
  form.value.collectionDate = `${p.year}-${String(p.month).padStart(2, '0')}-${String(Math.min(now.getDate(), 28)).padStart(2, '0')}`
}, { immediate: true })

watch(invoiceOptions, (opts) => {
  if (!form.value.invoiceId && opts[0]) form.value.invoiceId = opts[0].value
}, { immediate: true })

watch(cashOptions, (opts) => {
  if (!form.value.cashBoxId && opts[0]) form.value.cashBoxId = opts[0].value
}, { immediate: true })
watch(bankOptions, (opts) => {
  if (!form.value.bankAccountId && opts[0]) form.value.bankAccountId = opts[0].value
}, { immediate: true })

watch(
  () => form.value.invoiceId,
  (id) => {
    const inv = pendingInvoices.value.find((i) => i.id === id)
    if (inv) {
      form.value.amount = inv.balanceAmount
      form.value.description = `Cobro ${inv.fullNumber}`
    }
  },
)

const columns = [
  { key: 'collectionDate', label: 'Fecha', sortable: true },
  { key: 'invoiceFullNumber', label: 'Comprobante' },
  { key: 'customerName', label: 'Cliente' },
  { key: 'amount', label: 'Importe', align: 'right' as const },
  { key: 'sourceType', label: 'Medio' },
  { key: 'actions', label: '', align: 'right' as const },
]

function openModal() {
  modalOpen.value = true
}

function submit() {
  if (!activePeriod.value || !form.value.invoiceId || !form.value.amount) {
    void markapAlert.toast.warning('Complete comprobante e importe')
    return
  }
  createCollection(
    {
      invoiceId: form.value.invoiceId,
      periodId: activePeriod.value.id,
      amount: form.value.amount,
      collectionDate: form.value.collectionDate,
      description: form.value.description.trim(),
      sourceType: form.value.sourceType,
      cashBoxId: form.value.sourceType === 'CASH' ? form.value.cashBoxId : null,
      bankAccountId: form.value.sourceType === 'BANK' ? form.value.bankAccountId : null,
    },
    { onSuccess: () => { modalOpen.value = false; void refetch() } },
  )
}

function goJournal(row: ContabilidadSalesCollectionDTO) {
  if (!row.journalEntryId) return
  void router.push({ name: 'contabilidad-asiento-detalle', params: { id: row.journalEntryId } })
}
</script>

<template>
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
    <PageHeader
      icon="lucide:hand-coins"
      title="Cobros a clientes"
      subtitle="Ingresos de tesorería que cancelan CxC (Dr 10xx / Cr 1041)."
    >
      <template #actions>
        <BaseButton variant="primary" :disabled="!activePeriod || !pendingInvoices.length" @click="openModal">
          <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
          Registrar cobro
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
        empty-text="Sin cobros en este periodo."
        row-key="id"
      >
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadSalesCollectionDTO).collectionDate }}</td>
          <td class="py-3 px-4 font-mono text-sm">{{ (row as ContabilidadSalesCollectionDTO).invoiceFullNumber }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadSalesCollectionDTO).customerName }}</td>
          <td class="py-3 px-4 text-sm text-right font-mono font-semibold">
            {{ formatPen((row as ContabilidadSalesCollectionDTO).amount) }}
          </td>
          <td class="py-3 px-4 text-sm">
            {{ (row as ContabilidadSalesCollectionDTO).sourceType === 'CASH'
              ? `Caja ${(row as ContabilidadSalesCollectionDTO).cashBoxCode ?? ''}`
              : `Banco ${(row as ContabilidadSalesCollectionDTO).bankCode ?? ''}` }}
          </td>
          <td class="py-3 px-4 text-right">
            <BaseButton
              v-if="(row as ContabilidadSalesCollectionDTO).journalEntryId"
              variant="secondary"
              size="sm"
              @click="goJournal(row as ContabilidadSalesCollectionDTO)"
            >
              Asiento
            </BaseButton>
          </td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="modalOpen" title="Registrar cobro de cliente" size="md">
      <form class="space-y-4" @submit.prevent="submit">
        <div class="w-full min-w-0">
          <FormSelect v-model="form.invoiceId" label="Comprobante pendiente" :options="invoiceOptions" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2 w-full">
          <div class="min-w-0">
            <FormSelect v-model="form.sourceType" label="Medio de cobro" :options="sourceTypeOptions" />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.collectionDate" label="Fecha" type="date" required />
          </div>
        </div>
        <div v-if="form.sourceType === 'CASH'" class="w-full min-w-0">
          <FormSelect v-model="form.cashBoxId" label="Caja" :options="cashOptions" />
        </div>
        <div v-else class="w-full min-w-0">
          <FormSelect v-model="form.bankAccountId" label="Cuenta bancaria" :options="bankOptions" />
        </div>
        <div class="w-full min-w-0">
          <FormInput v-model="form.amount" label="Importe (S/)" type="number" min="0" step="0.01" required />
        </div>
        <div class="w-full min-w-0">
          <FormTextarea v-model="form.description" label="Glosa" :rows="2" required />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="saving">Registrar cobro</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
