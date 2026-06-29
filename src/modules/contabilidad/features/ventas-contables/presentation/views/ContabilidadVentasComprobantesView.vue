<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BaseButton,
  AppIcon,
  BaseModal,
  Badge,
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
import { useContabilidadAccountsTree } from '@modules/contabilidad/features/plan-cuentas/application/useContabilidadAccounts'
import { flattenMovementAccounts, formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import {
  useContabilidadCustomers,
  useContabilidadSalesInvoices,
  useContabilidadCreateSalesInvoice,
  useContabilidadCancelSalesInvoice,
} from '../../application/useContabilidadSales'
import {
  SALES_DOCUMENT_TYPE,
  SALES_STATUS_FILTER_OPTIONS,
  SALES_TAX_AFFECTATION,
  SALES_TAX_AFFECTATION_OPTIONS,
  salesStatusVariant,
  type ContabilidadSalesInvoiceDTO,
} from '../../domain/sales.types'

const route = useRoute()
const router = useRouter()
const { activePeriod } = useContabilidadActivePeriod()

const documentType = computed(() => (route.meta.documentType as string) || SALES_DOCUMENT_TYPE.FACTURA)
const pageTitle = computed(() =>
  documentType.value === SALES_DOCUMENT_TYPE.BOLETA ? 'Boletas de venta' : 'Facturas de venta',
)
const pageSubtitle = computed(() =>
  documentType.value === SALES_DOCUMENT_TYPE.BOLETA
    ? 'Registro de boletas con asiento automático (1041 / 70x / 4011).'
    : 'Registro de facturas con asiento automático (1041 / 70x / 4011).',
)

const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const statusFilter = ref('')

const listParams = computed(() => ({
  periodId: activePeriod.value?.id,
  documentType: documentType.value,
  status: statusFilter.value || undefined,
  search: debouncedSearch.value.trim() || undefined,
}))

const { data, isLoading, refetch } = useContabilidadSalesInvoices(listParams)
const rows = computed(() => data.value?.invoices ?? [])

const customerParams = computed(() => ({ activeOnly: true }))
const { data: customersData } = useContabilidadCustomers(customerParams)
const customerOptions = computed(() =>
  (customersData.value?.customers ?? []).map((c) => ({
    value: c.id,
    label: `${c.ruc} — ${c.businessName}`,
  })),
)

const emptySearch = ref('')
const { data: accountsData } = useContabilidadAccountsTree(emptySearch)
const incomeOptions = computed(() =>
  flattenMovementAccounts(accountsData.value?.tree ?? []).filter(
    (o) => o.label.startsWith('701') || o.label.startsWith('703') || o.label.startsWith('70'),
  ),
)

const { mutate: createInvoice, isPending: saving } = useContabilidadCreateSalesInvoice()
const { mutate: cancelInvoice, isPending: cancelling } = useContabilidadCancelSalesInvoice()

const modalOpen = ref(false)
const form = ref({
  customerId: '',
  series: '',
  number: '',
  issueDate: '',
  dueDate: '',
  taxAffectation: SALES_TAX_AFFECTATION.TAXABLE,
  incomeAccountId: '',
  taxableBase: '',
  notes: '',
})

watch(activePeriod, (p) => {
  if (!p) return
  const now = new Date()
  form.value.issueDate = `${p.year}-${String(p.month).padStart(2, '0')}-${String(Math.min(now.getDate(), 28)).padStart(2, '0')}`
}, { immediate: true })

watch(incomeOptions, (opts) => {
  if (!form.value.incomeAccountId && opts[0]) form.value.incomeAccountId = opts[0].value
}, { immediate: true })

watch(customerOptions, (opts) => {
  if (!form.value.customerId && opts[0]) form.value.customerId = opts[0].value
}, { immediate: true })

const columns = [
  { key: 'issueDate', label: 'Fecha', sortable: true },
  { key: 'fullNumber', label: 'Comprobante' },
  { key: 'customerName', label: 'Cliente' },
  { key: 'totalAmount', label: 'Total', align: 'right' as const },
  { key: 'balanceAmount', label: 'Saldo', align: 'right' as const },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: '', align: 'right' as const },
]

function statusLabel(status: string) {
  return data.value?.statusLabels?.[status] ?? status
}

function openModal() {
  form.value.series = ''
  form.value.number = ''
  form.value.taxableBase = ''
  form.value.notes = ''
  modalOpen.value = true
}

function submitInvoice() {
  if (!activePeriod.value) return
  if (!form.value.customerId || !form.value.incomeAccountId || !form.value.taxableBase) {
    void markapAlert.toast.warning('Complete cliente, cuenta de ingreso y base imponible')
    return
  }
  createInvoice(
    {
      customerId: form.value.customerId,
      periodId: activePeriod.value.id,
      documentType: documentType.value,
      series: form.value.series,
      number: form.value.number,
      issueDate: form.value.issueDate,
      dueDate: form.value.dueDate || null,
      taxAffectation: form.value.taxAffectation,
      incomeAccountId: form.value.incomeAccountId,
      taxableBase: form.value.taxableBase,
      notes: form.value.notes.trim() || null,
    },
    { onSuccess: () => { modalOpen.value = false; void refetch() } },
  )
}

async function onCancel(row: ContabilidadSalesInvoiceDTO) {
  const ok = await markapAlert.confirmDanger({
    title: 'Anular comprobante',
    text: `${row.fullNumber} — solo si no tiene cobros registrados.`,
    confirmText: 'Anular',
  })
  if (!ok) return
  cancelInvoice(row.id, { onSuccess: () => void refetch() })
}

function goJournal(row: ContabilidadSalesInvoiceDTO) {
  if (!row.journalEntryId) return
  void router.push({ name: 'contabilidad-asiento-detalle', params: { id: row.journalEntryId } })
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:file-output"
      :title="pageTitle"
      :subtitle="pageSubtitle"
    >
      <template #actions>
        <BaseButton variant="primary" :disabled="!activePeriod" @click="openModal">
          <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
          Registrar venta
        </BaseButton>
      </template>
    </PageHeader>

    <p v-if="!activePeriod" class="text-sm" :style="{ color: 'var(--color-warning)' }">
      Seleccione un periodo activo en la barra superior.
    </p>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <DataTable
        :columns="columns"
        :data="rows"
        :loading="isLoading"
        :empty-text="`Sin ${documentType === SALES_DOCUMENT_TYPE.BOLETA ? 'boletas' : 'facturas'} en este periodo.`"
        row-key="id"
      >
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar por comprobante o cliente…" />
          </div>
          <div class="w-full sm:w-[200px] min-w-0 shrink-0">
            <FormSelect v-model="statusFilter" :options="SALES_STATUS_FILTER_OPTIONS" />
          </div>
        </template>

        <template #row="{ row }">
          <td class="py-3 px-4 text-sm whitespace-nowrap">
            {{ (row as ContabilidadSalesInvoiceDTO).issueDate }}
          </td>
          <td class="py-3 px-4 text-sm">
            <div class="font-mono font-medium">{{ (row as ContabilidadSalesInvoiceDTO).fullNumber }}</div>
          </td>
          <td class="py-3 px-4 text-sm">
            <div>{{ (row as ContabilidadSalesInvoiceDTO).customerName }}</div>
            <div class="text-xs font-mono" :style="{ color: 'var(--color-text-muted)' }">
              {{ (row as ContabilidadSalesInvoiceDTO).customerRuc }}
            </div>
          </td>
          <td class="py-3 px-4 text-sm text-right font-mono">
            {{ formatPen((row as ContabilidadSalesInvoiceDTO).totalAmount) }}
          </td>
          <td class="py-3 px-4 text-sm text-right font-mono font-semibold">
            {{ formatPen((row as ContabilidadSalesInvoiceDTO).balanceAmount) }}
          </td>
          <td class="py-3 px-4">
            <Badge :variant="salesStatusVariant((row as ContabilidadSalesInvoiceDTO).status)">
              {{ statusLabel((row as ContabilidadSalesInvoiceDTO).status) }}
            </Badge>
          </td>
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <BaseButton
              v-if="(row as ContabilidadSalesInvoiceDTO).journalEntryId"
              variant="secondary"
              size="sm"
              class="mr-1"
              @click="goJournal(row as ContabilidadSalesInvoiceDTO)"
            >
              Asiento
            </BaseButton>
            <BaseButton
              v-if="(row as ContabilidadSalesInvoiceDTO).status === 'PENDING'"
              variant="secondary"
              size="sm"
              :loading="cancelling"
              @click="onCancel(row as ContabilidadSalesInvoiceDTO)"
            >
              Anular
            </BaseButton>
          </td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="modalOpen" :title="`Registrar ${documentType === SALES_DOCUMENT_TYPE.BOLETA ? 'boleta' : 'factura'} de venta`" size="lg">
      <form class="space-y-4" @submit.prevent="submitInvoice">
        <div class="w-full min-w-0">
          <FormSelect v-model="form.customerId" label="Cliente" :options="customerOptions" placeholder="Seleccionar…" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2 w-full">
          <div class="min-w-0">
            <FormSelect v-model="form.taxAffectation" label="Afectación IGV" :options="SALES_TAX_AFFECTATION_OPTIONS" />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.issueDate" label="Fecha emisión" type="date" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.series" label="Serie" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.number" label="Número" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.dueDate" label="Fecha vencimiento" type="date" />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.taxableBase" label="Base imponible (S/)" type="number" min="0" step="0.01" required />
          </div>
        </div>
        <div class="w-full min-w-0">
          <FormSelect
            v-model="form.incomeAccountId"
            label="Cuenta de ingreso"
            :options="incomeOptions"
            placeholder="Seleccionar cuenta…"
          />
        </div>
        <div class="w-full min-w-0">
          <FormTextarea v-model="form.notes" label="Notas" :rows="2" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="saving">Registrar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
