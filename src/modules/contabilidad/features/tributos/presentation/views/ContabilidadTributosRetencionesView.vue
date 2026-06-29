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
  PageHeader,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import { useContabilidadSuppliers } from '@modules/contabilidad/features/compras/application/useContabilidadPurchases'
import {
  useContabilidadRetentions,
  useContabilidadCreateRetention,
} from '../../application/useContabilidadTaxes'
import {
  RETENTION_TYPE,
  RETENTION_TYPE_OPTIONS,
  type ContabilidadRetentionDTO,
} from '../../domain/taxes.types'

const router = useRouter()
const { activePeriod } = useContabilidadActivePeriod()

const typeFilter = ref('')
const listParams = computed(() => ({
  periodId: activePeriod.value?.id,
  retentionType: typeFilter.value || undefined,
}))

const { data, isLoading, refetch } = useContabilidadRetentions(listParams)
const rows = computed(() => data.value?.retentions ?? [])
const defaultRates = computed(() => data.value?.defaultRates ?? { IGV: 3, RENTA: 1.5 })

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

const { mutate: createRetention, isPending: saving } = useContabilidadCreateRetention()

const modalOpen = ref(false)
const form = ref({
  supplierId: '',
  retentionType: RETENTION_TYPE.IGV,
  documentSeries: '',
  documentNumber: '',
  issueDate: '',
  taxableBase: '',
  ratePercent: '',
  amount: '',
})

watch(activePeriod, (p) => {
  if (!p) return
  const now = new Date()
  form.value.issueDate = `${p.year}-${String(p.month).padStart(2, '0')}-${String(Math.min(now.getDate(), 28)).padStart(2, '0')}`
}, { immediate: true })

watch(
  () => form.value.retentionType,
  (t) => {
    form.value.ratePercent = String(t === RETENTION_TYPE.IGV ? defaultRates.value.IGV : defaultRates.value.RENTA)
  },
  { immediate: true },
)

watch(supplierOptions, (opts) => {
  if (!form.value.supplierId && opts[0]) form.value.supplierId = opts[0].value
}, { immediate: true })

const typeFilterOptions = [
  { value: '', label: 'Todos los tipos' },
  ...RETENTION_TYPE_OPTIONS,
]

const columns = [
  { key: 'issueDate', label: 'Fecha', sortable: true },
  { key: 'retentionType', label: 'Tipo' },
  { key: 'counterpartyName', label: 'Proveedor' },
  { key: 'fullDocument', label: 'Documento' },
  { key: 'amount', label: 'Importe', align: 'right' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

function typeLabel(type: string) {
  return data.value?.retentionTypeLabels?.[type] ?? type
}

function openModal() {
  form.value.documentSeries = ''
  form.value.documentNumber = ''
  form.value.taxableBase = ''
  form.value.amount = ''
  modalOpen.value = true
}

function submit() {
  if (!activePeriod.value) return
  const supplier = supplierOptions.value.find((s) => s.value === form.value.supplierId)
  if (!supplier || !form.value.taxableBase) {
    void markapAlert.toast.warning('Complete proveedor y base imponible')
    return
  }
  createRetention(
    {
      periodId: activePeriod.value.id,
      retentionType: form.value.retentionType,
      counterpartyRuc: supplier.ruc,
      counterpartyName: supplier.name,
      documentType: 'FACTURA',
      documentSeries: form.value.documentSeries || null,
      documentNumber: form.value.documentNumber || null,
      issueDate: form.value.issueDate,
      taxableBase: form.value.taxableBase,
      ratePercent: form.value.ratePercent || undefined,
      amount: form.value.amount || undefined,
    },
    { onSuccess: () => { modalOpen.value = false; void refetch() } },
  )
}

function goJournal(row: ContabilidadRetentionDTO) {
  if (!row.journalEntryId) return
  void router.push({ name: 'contabilidad-asiento-detalle', params: { id: row.journalEntryId } })
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:shield-minus"
      title="Retenciones"
      subtitle="Retenciones IGV y renta a proveedores (cuenta 4017)."
    >
      <template #actions>
        <BaseButton variant="primary" :disabled="!activePeriod" @click="openModal">
          <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
          Registrar retención
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
        empty-text="Sin retenciones en este periodo."
        row-key="id"
      >
        <template #toolbar>
          <div class="w-full sm:w-[220px] min-w-0 shrink-0 ml-auto">
            <FormSelect v-model="typeFilter" :options="typeFilterOptions" />
          </div>
        </template>

        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadRetentionDTO).issueDate }}</td>
          <td class="py-3 px-4 text-sm">{{ typeLabel((row as ContabilidadRetentionDTO).retentionType) }}</td>
          <td class="py-3 px-4 text-sm">
            <div>{{ (row as ContabilidadRetentionDTO).counterpartyName }}</div>
            <div class="text-xs font-mono" :style="{ color: 'var(--color-text-muted)' }">
              {{ (row as ContabilidadRetentionDTO).counterpartyRuc }}
            </div>
          </td>
          <td class="py-3 px-4 font-mono text-sm">{{ (row as ContabilidadRetentionDTO).fullDocument ?? '—' }}</td>
          <td class="py-3 px-4 text-sm text-right font-mono font-semibold">
            {{ formatPen((row as ContabilidadRetentionDTO).amount) }}
          </td>
          <td class="py-3 px-4 text-right">
            <BaseButton
              v-if="(row as ContabilidadRetentionDTO).journalEntryId"
              variant="secondary"
              size="sm"
              @click="goJournal(row as ContabilidadRetentionDTO)"
            >
              Asiento
            </BaseButton>
          </td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="modalOpen" title="Registrar retención" size="md">
      <form class="space-y-4" @submit.prevent="submit">
        <div class="w-full min-w-0">
          <FormSelect v-model="form.supplierId" label="Proveedor" :options="supplierOptions" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2 w-full">
          <div class="min-w-0">
            <FormSelect v-model="form.retentionType" label="Tipo" :options="RETENTION_TYPE_OPTIONS" />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.issueDate" label="Fecha" type="date" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.documentSeries" label="Serie doc." />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.documentNumber" label="Número doc." />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.taxableBase" label="Base imponible (S/)" type="number" min="0" step="0.01" required />
          </div>
          <div class="min-w-0">
            <FormInput v-model="form.ratePercent" label="Tasa %" type="number" min="0" step="0.01" />
          </div>
          <div class="min-w-0 sm:col-span-2">
            <FormInput v-model="form.amount" label="Importe retención (S/)" type="number" min="0" step="0.01" />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="saving">Registrar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
