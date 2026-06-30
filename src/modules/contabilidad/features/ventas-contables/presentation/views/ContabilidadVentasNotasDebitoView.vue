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
  SearchInput,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useDebouncedRef } from '@/shared/composables/useDebouncedRef'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import {
  useContabilidadCustomers,
  useContabilidadSalesInvoices,
  useContabilidadSalesDebitNotes,
  useContabilidadCreateSalesDebitNote,
} from '../../application/useContabilidadSales'
import type { ContabilidadSalesDebitNoteDTO } from '../../domain/sales.types'

const router = useRouter()
const { activePeriod } = useContabilidadActivePeriod()

const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const listParams = computed(() => ({
  periodId: activePeriod.value?.id,
  search: debouncedSearch.value.trim() || undefined,
}))

const { data, isLoading, refetch } = useContabilidadSalesDebitNotes(listParams)
const rows = computed(() => data.value?.debitNotes ?? [])

const customerParams = computed(() => ({ activeOnly: true }))
const { data: customersData } = useContabilidadCustomers(customerParams)
const customerOptions = computed(() =>
  (customersData.value?.customers ?? []).map((c) => ({ value: c.id, label: `${c.ruc} — ${c.businessName}` })),
)

const { mutate: createDebitNote, isPending: saving } = useContabilidadCreateSalesDebitNote()

const modalOpen = ref(false)
const form = ref({
  customerId: '',
  invoiceId: '',
  series: '',
  number: '',
  issueDate: '',
  taxableBase: '',
  reason: '',
})

const invoiceParams = computed(() => ({ periodId: activePeriod.value?.id }))
const { data: invoicesData } = useContabilidadSalesInvoices(invoiceParams)
const invoiceOptions = computed(() => {
  const customerId = form.value.customerId
  return (invoicesData.value?.invoices ?? [])
    .filter((inv) => !customerId || inv.customerId === customerId)
    .map((inv) => ({ value: inv.id, label: `${inv.fullNumber} — ${formatPen(inv.totalAmount)}` }))
})

watch(activePeriod, (p) => {
  if (!p) return
  const now = new Date()
  form.value.issueDate = `${p.year}-${String(p.month).padStart(2, '0')}-${String(Math.min(now.getDate(), 28)).padStart(2, '0')}`
}, { immediate: true })

watch(customerOptions, (opts) => {
  if (!form.value.customerId && opts[0]) form.value.customerId = opts[0].value
}, { immediate: true })

const columns = [
  { key: 'issueDate', label: 'Fecha', sortable: true },
  { key: 'fullNumber', label: 'ND' },
  { key: 'customerName', label: 'Cliente' },
  { key: 'invoiceFullNumber', label: 'Comprobante ref.' },
  { key: 'totalAmount', label: 'Total', align: 'right' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

function openModal() {
  form.value.series = ''
  form.value.number = ''
  form.value.taxableBase = ''
  form.value.reason = ''
  form.value.invoiceId = ''
  modalOpen.value = true
}

function submit() {
  if (!activePeriod.value || !form.value.customerId || !form.value.taxableBase) {
    void markapAlert.toast.warning('Complete cliente y base imponible')
    return
  }
  createDebitNote(
    {
      customerId: form.value.customerId,
      invoiceId: form.value.invoiceId || null,
      periodId: activePeriod.value.id,
      series: form.value.series,
      number: form.value.number,
      issueDate: form.value.issueDate,
      taxableBase: form.value.taxableBase,
      reason: form.value.reason.trim() || null,
    },
    { onSuccess: () => { modalOpen.value = false; void refetch() } },
  )
}

function goJournal(row: ContabilidadSalesDebitNoteDTO) {
  if (!row.journalEntryId) return
  void router.push({ name: 'contabilidad-asiento-detalle', params: { id: row.journalEntryId } })
}
</script>

<template>
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
    <PageHeader
      icon="lucide:file-plus-2"
      title="Notas de débito de venta"
      subtitle="Incrementan CxC e ingreso vinculado a comprobantes de cliente."
    >
      <template #actions>
        <BaseButton variant="primary" :disabled="!activePeriod" @click="openModal">
          <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
          Registrar ND
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
        empty-text="Sin notas de débito en este periodo."
        row-key="id"
      >
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar por ND o cliente…" />
          </div>
        </template>

        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadSalesDebitNoteDTO).issueDate }}</td>
          <td class="py-3 px-4 font-mono text-sm">{{ (row as ContabilidadSalesDebitNoteDTO).fullNumber }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadSalesDebitNoteDTO).customerName }}</td>
          <td class="py-3 px-4 text-sm font-mono">
            {{ (row as ContabilidadSalesDebitNoteDTO).invoiceFullNumber ?? '—' }}
          </td>
          <td class="py-3 px-4 text-sm text-right font-mono">
            {{ formatPen((row as ContabilidadSalesDebitNoteDTO).totalAmount) }}
          </td>
          <td class="py-3 px-4 text-right">
            <BaseButton
              v-if="(row as ContabilidadSalesDebitNoteDTO).journalEntryId"
              variant="secondary"
              size="sm"
              @click="goJournal(row as ContabilidadSalesDebitNoteDTO)"
            >
              Asiento
            </BaseButton>
          </td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="modalOpen" title="Registrar nota de débito" size="md">
      <form class="space-y-4" @submit.prevent="submit">
        <div class="w-full min-w-0">
          <FormSelect v-model="form.customerId" label="Cliente" :options="customerOptions" />
        </div>
        <div class="w-full min-w-0">
          <FormSelect
            v-model="form.invoiceId"
            label="Comprobante relacionado (opcional)"
            :options="[{ value: '', label: 'Sin vincular' }, ...invoiceOptions]"
          />
        </div>
        <div class="grid gap-4 sm:grid-cols-2 w-full">
          <div class="min-w-0">
            <FormInput v-model="form.series" label="Serie" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.number" label="Número" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.issueDate" label="Fecha" type="date" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.taxableBase" label="Base imponible (S/)" type="number" min="0" step="0.01" required />
          </div>
        </div>
        <div class="w-full min-w-0">
          <FormTextarea v-model="form.reason" label="Motivo" :rows="2" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="saving">Registrar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
