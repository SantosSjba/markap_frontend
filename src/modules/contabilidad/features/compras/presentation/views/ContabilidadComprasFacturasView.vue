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
  useContabilidadSuppliers,
  useContabilidadPurchaseInvoices,
  useContabilidadCreatePurchaseInvoice,
  useContabilidadCancelPurchaseInvoice,
} from '../../application/useContabilidadPurchases'
import {
  PURCHASE_DOCUMENT_TYPE_OPTIONS,
  PURCHASE_STATUS_FILTER_OPTIONS,
  PURCHASE_TAX_AFFECTATION,
  PURCHASE_TAX_AFFECTATION_OPTIONS,
  purchaseStatusVariant,
  type ContabilidadPurchaseInvoiceDTO,
} from '../../domain/purchases.types'

const router = useRouter()
const { activePeriod } = useContabilidadActivePeriod()

const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const statusFilter = ref('')

const listParams = computed(() => ({
  periodId: activePeriod.value?.id,
  status: statusFilter.value || undefined,
  search: debouncedSearch.value.trim() || undefined,
}))

const { data, isLoading, refetch } = useContabilidadPurchaseInvoices(listParams)
const rows = computed(() => data.value?.invoices ?? [])

const supplierParams = computed(() => ({ activeOnly: true }))
const { data: suppliersData } = useContabilidadSuppliers(supplierParams)
const supplierOptions = computed(() =>
  (suppliersData.value?.suppliers ?? []).map((s) => ({
    value: s.id,
    label: `${s.ruc} — ${s.businessName}`,
  })),
)

const emptySearch = ref('')
const { data: accountsData } = useContabilidadAccountsTree(emptySearch)
const expenseOptions = computed(() =>
  flattenMovementAccounts(accountsData.value?.tree ?? []).filter(
    (o) => o.label.startsWith('601') || o.label.startsWith('631') || o.label.startsWith('636') || o.label.startsWith('637'),
  ),
)

const { mutate: createInvoice, isPending: saving } = useContabilidadCreatePurchaseInvoice()
const { mutate: cancelInvoice, isPending: cancelling } = useContabilidadCancelPurchaseInvoice()

const modalOpen = ref(false)
const form = ref({
  supplierId: '',
  documentType: 'FACTURA',
  series: '',
  number: '',
  issueDate: '',
  dueDate: '',
  taxAffectation: PURCHASE_TAX_AFFECTATION.TAXABLE,
  expenseAccountId: '',
  taxableBase: '',
  detraccionAmount: '',
  notes: '',
})

watch(activePeriod, (p) => {
  if (!p) return
  const now = new Date()
  form.value.issueDate = `${p.year}-${String(p.month).padStart(2, '0')}-${String(Math.min(now.getDate(), 28)).padStart(2, '0')}`
}, { immediate: true })

watch(expenseOptions, (opts) => {
  if (!form.value.expenseAccountId && opts[0]) form.value.expenseAccountId = opts[0].value
}, { immediate: true })

watch(supplierOptions, (opts) => {
  if (!form.value.supplierId && opts[0]) form.value.supplierId = opts[0].value
}, { immediate: true })

const columns = [
  { key: 'issueDate', label: 'Fecha', sortable: true },
  { key: 'fullNumber', label: 'Comprobante' },
  { key: 'supplierName', label: 'Proveedor' },
  { key: 'totalAmount', label: 'Total', align: 'right' as const },
  { key: 'balanceAmount', label: 'Saldo', align: 'right' as const },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: '', align: 'right' as const },
]

function statusLabel(status: string) {
  return data.value?.statusLabels?.[status] ?? status
}

function docTypeLabel(type: string) {
  return data.value?.documentTypeLabels?.[type] ?? type
}

function openModal() {
  form.value.series = ''
  form.value.number = ''
  form.value.taxableBase = ''
  form.value.detraccionAmount = ''
  form.value.notes = ''
  modalOpen.value = true
}

function submitInvoice() {
  if (!activePeriod.value) return
  if (!form.value.supplierId || !form.value.expenseAccountId || !form.value.taxableBase) {
    void markapAlert.toast.warning('Complete proveedor, cuenta y base imponible')
    return
  }
  createInvoice(
    {
      supplierId: form.value.supplierId,
      periodId: activePeriod.value.id,
      documentType: form.value.documentType,
      series: form.value.series,
      number: form.value.number,
      issueDate: form.value.issueDate,
      dueDate: form.value.dueDate || null,
      taxAffectation: form.value.taxAffectation,
      expenseAccountId: form.value.expenseAccountId,
      taxableBase: form.value.taxableBase,
      detraccionAmount: form.value.detraccionAmount || 0,
      notes: form.value.notes.trim() || null,
    },
    { onSuccess: () => { modalOpen.value = false; void refetch() } },
  )
}

async function onCancel(row: ContabilidadPurchaseInvoiceDTO) {
  const ok = await markapAlert.confirmDanger({
    title: 'Anular factura',
    text: `${row.fullNumber} — solo si no tiene pagos registrados.`,
    confirmText: 'Anular',
  })
  if (!ok) return
  cancelInvoice(row.id, { onSuccess: () => void refetch() })
}

function goJournal(row: ContabilidadPurchaseInvoiceDTO) {
  if (!row.journalEntryId) return
  void router.push({ name: 'contabilidad-asiento-detalle', params: { id: row.journalEntryId } })
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:file-input"
      title="Facturas de compra"
      subtitle="Registro de compras con asiento automático (60x / 4011 / 421)."
    >
      <template #actions>
        <BaseButton variant="primary" :disabled="!activePeriod" @click="openModal">
          <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
          Registrar compra
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
        empty-text="Sin facturas de compra en este periodo."
        row-key="id"
      >
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar por comprobante o proveedor…" />
          </div>
          <div class="w-full sm:w-[200px] min-w-0 shrink-0">
            <FormSelect v-model="statusFilter" :options="PURCHASE_STATUS_FILTER_OPTIONS" />
          </div>
        </template>

        <template #row="{ row }">
          <td class="py-3 px-4 text-sm whitespace-nowrap">
            {{ (row as ContabilidadPurchaseInvoiceDTO).issueDate }}
          </td>
          <td class="py-3 px-4 text-sm">
            <div class="font-mono font-medium">{{ (row as ContabilidadPurchaseInvoiceDTO).fullNumber }}</div>
            <div class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
              {{ docTypeLabel((row as ContabilidadPurchaseInvoiceDTO).documentType) }}
            </div>
          </td>
          <td class="py-3 px-4 text-sm">
            <div>{{ (row as ContabilidadPurchaseInvoiceDTO).supplierName }}</div>
            <div class="text-xs font-mono" :style="{ color: 'var(--color-text-muted)' }">
              {{ (row as ContabilidadPurchaseInvoiceDTO).supplierRuc }}
            </div>
          </td>
          <td class="py-3 px-4 text-sm text-right font-mono">
            {{ formatPen((row as ContabilidadPurchaseInvoiceDTO).totalAmount) }}
          </td>
          <td class="py-3 px-4 text-sm text-right font-mono font-semibold">
            {{ formatPen((row as ContabilidadPurchaseInvoiceDTO).balanceAmount) }}
          </td>
          <td class="py-3 px-4">
            <Badge :variant="purchaseStatusVariant((row as ContabilidadPurchaseInvoiceDTO).status)">
              {{ statusLabel((row as ContabilidadPurchaseInvoiceDTO).status) }}
            </Badge>
          </td>
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <BaseButton
              v-if="(row as ContabilidadPurchaseInvoiceDTO).journalEntryId"
              variant="secondary"
              size="sm"
              class="mr-1"
              @click="goJournal(row as ContabilidadPurchaseInvoiceDTO)"
            >
              Asiento
            </BaseButton>
            <BaseButton
              v-if="(row as ContabilidadPurchaseInvoiceDTO).status === 'PENDING'"
              variant="secondary"
              size="sm"
              :loading="cancelling"
              @click="onCancel(row as ContabilidadPurchaseInvoiceDTO)"
            >
              Anular
            </BaseButton>
          </td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="modalOpen" title="Registrar factura de compra" size="lg">
      <form class="space-y-4" @submit.prevent="submitInvoice">
        <div class="w-full min-w-0">
          <FormSelect v-model="form.supplierId" label="Proveedor" :options="supplierOptions" placeholder="Seleccionar…" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2 w-full">
          <div class="min-w-0">
            <FormSelect v-model="form.documentType" label="Tipo comprobante" :options="PURCHASE_DOCUMENT_TYPE_OPTIONS" />
          </div>
          <div class="min-w-0">
            <FormSelect v-model="form.taxAffectation" label="Afectación IGV" :options="PURCHASE_TAX_AFFECTATION_OPTIONS" />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.series" label="Serie" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.number" label="Número" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.issueDate" label="Fecha emisión" type="date" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.dueDate" label="Fecha vencimiento" type="date" />
          </div>
        </div>
        <div class="w-full min-w-0">
          <FormSelect
            v-model="form.expenseAccountId"
            label="Cuenta de gasto/compra"
            :options="expenseOptions"
            placeholder="Seleccionar cuenta…"
          />
        </div>
        <div class="grid gap-4 sm:grid-cols-2 w-full">
          <div class="min-w-0">
            <FormInput v-model="form.taxableBase" label="Base imponible (S/)" type="number" min="0" step="0.01" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.detraccionAmount" label="Detracción (S/)" type="number" min="0" step="0.01" />
          </div>
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
