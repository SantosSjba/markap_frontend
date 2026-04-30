<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  DataTable,
  BaseButton,
  FormSelect,
  FormCheckbox,
  FileDropzone,
  AppIcon,
  BasePagination,
  Badge,
} from '@shared/components'
import BaseModal from '@shared/components/ui/BaseModal.vue'
import {
  useVentasClosingsList,
  useVentasCreateClosing,
  useVentasClosingReadiness,
  useVentasComplianceChecklist,
  useVentasComplianceDocuments,
  useVentasUpsertComplianceChecklist,
  useVentasUploadComplianceDocument,
  useVentasTaxPreview,
  useVentasCompliancePendingBoard,
  useVentasDispatchComplianceAlerts,
} from '../../application/useVentasSales'
import type { SaleClosingRow } from '../../domain/sales.types'
import { ventasClientsRepository } from '@modules/ventas/features/clientes'
import { ventasPropertiesRepository } from '@modules/ventas/features/propiedades'
import { useVentasAgentsList } from '@modules/ventas/features/agentes'
import { PAYMENT_TYPE_OPTIONS } from '../../domain/pipeline.constants'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

const ITEMS = 10
const listParams = ref({ page: 1, limit: ITEMS })
const listApi = computed(() => listParams.value)
const { data: listResult, isLoading } = useVentasClosingsList(listApi)
const rows = computed(() => listResult.value?.data ?? [])
const total = computed(() => listResult.value?.total ?? 0)

const paginationProps = computed(() => {
  const page = listParams.value.page
  const limit = listParams.value.limit
  const totalPages = Math.max(1, Math.ceil(total.value / limit))
  return {
    currentPage: page,
    totalPages,
    totalItems: total.value,
    pageSize: limit,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  }
})

const columns = [
  { key: 'property', label: 'Inmueble', sortAccessor: (r: unknown) => (r as SaleClosingRow).property.code },
  { key: 'buyer', label: 'Cliente', sortAccessor: (r: unknown) => (r as SaleClosingRow).buyer.fullName },
  { key: 'price', label: 'Precio final', sortAccessor: (r: unknown) => (r as SaleClosingRow).finalPrice },
  { key: 'pay', label: 'Pago', sortAccessor: (r: unknown) => (r as SaleClosingRow).paymentType },
  { key: 'comm', label: 'Comisión', sortAccessor: (r: unknown) => (r as SaleClosingRow).commission?.amount ?? 0 },
  { key: 'act', label: '' },
]

const showNew = ref(false)
const loadingNewModalData = ref(false)
const buyerOptions = ref<{ value: string; label: string }[]>([])
const propertyOptions = ref<{ value: string; label: string }[]>([])
const agentParams = ref({ page: 1, limit: 500, isActive: true })
const { data: agentsRes } = useVentasAgentsList(agentParams)
const agentOptions = computed(() =>
  (agentsRes.value?.data ?? []).map((a) => ({ value: a.id, label: a.fullName })),
)

const form = ref({
  buyerClientId: '',
  propertyId: '',
  agentId: '',
  finalPrice: 0,
  paymentType: 'CASH',
  commissionAmount: 0,
  commissionPercent: null as number | null,
  notes: '',
})

const { mutate: createClosing, isPending } = useVentasCreateClosing()
const boardFilters = ref({
  limit: 20,
  offset: 0,
  sunarpStatus: '',
  onlyOverdue: false,
})
const { data: pendingBoard, isLoading: loadingPendingBoard } =
  useVentasCompliancePendingBoard(boardFilters)
const { mutate: dispatchAlerts, isPending: dispatchingAlerts } =
  useVentasDispatchComplianceAlerts()

async function openModal() {
  loadingNewModalData.value = true
  try {
    const [buyers, props] = await Promise.all([
      ventasClientsRepository.getList({ clientType: 'BUYER', page: 1, limit: 500 }),
      ventasPropertiesRepository.getList({ page: 1, limit: 500 }),
    ])
    buyerOptions.value = buyers.data.map((c) => ({
      value: c.id,
      label: `${c.fullName} (${c.documentNumber})`,
    }))
    propertyOptions.value = props.data.map((p) => ({
      value: p.id,
      label: `${p.code} — ${p.listingStatus ?? ''} — ${p.addressLine}`,
    }))
    showNew.value = true
  } catch (e) {
    void markapAlert.toast.error('No se pudo abrir formulario de cierre', getApiErrorMessage(e))
  } finally {
    loadingNewModalData.value = false
  }
}

function submit() {
  if (!form.value.buyerClientId || !form.value.propertyId || form.value.finalPrice <= 0) return
  if (form.value.commissionAmount < 0) return
  const commissionAgentId = form.value.agentId
  if (!commissionAgentId) return
  createClosing(
    {
      buyerClientId: form.value.buyerClientId,
      propertyId: form.value.propertyId,
      agentId: form.value.agentId || null,
      finalPrice: form.value.finalPrice,
      paymentType: form.value.paymentType,
      notes: form.value.notes || null,
      commissionAgentId,
      commissionAmount: form.value.commissionAmount,
      commissionPercent: form.value.commissionPercent,
    },
    {
      onSuccess: () => {
        showNew.value = false
      },
    },
  )
}

const showCompliance = ref(false)
const selectedClosing = ref<SaleClosingRow | null>(null)

const complianceParams = computed(() => ({
  propertyId: selectedClosing.value?.property.id ?? '',
  buyerClientId: selectedClosing.value?.buyer.id ?? '',
}))

const { data: checklistData, isLoading: loadingChecklist } =
  useVentasComplianceChecklist(complianceParams)
const { data: documentsData, isLoading: loadingDocuments } =
  useVentasComplianceDocuments(complianceParams)
const { data: readinessData, isLoading: loadingReadiness } =
  useVentasClosingReadiness(complianceParams)

const complianceForm = ref({
  titleStudyChecked: false,
  criChecked: false,
  noLiensChecked: false,
  municipalTaxClearanceChecked: false,
  minutaSigned: false,
  publicDeedSigned: false,
  notarialPartSubmitted: false,
  sunarpStatus: 'PENDING',
  sunarpSubmittedAt: '',
  sunarpObservedAt: '',
  sunarpRegisteredAt: '',
  sunarpObservationNotes: '',
  alcabalaApplicable: true,
  alcabalaAmount: 0,
  alcabalaPaidAt: '',
  rent2Applicable: false,
  rent2Amount: 0,
  rent2PaidAt: '',
  bankedPaymentRequired: true,
  bankedPaymentVerified: false,
  paymentMethod: '',
  bankOperationNumber: '',
  bankName: '',
  bankAccountHolder: '',
  fundsSourceDeclared: false,
  beneficialOwnerDeclared: false,
  kycRiskLevel: 'PENDING',
  complianceNotes: '',
})

const acquisitionCost = ref<number>(0)
const taxPreviewParams = computed(() => ({
  salePrice: selectedClosing.value?.finalPrice ?? 0,
  acquisitionCost: acquisitionCost.value || 0,
  alcabalaApplicable: complianceForm.value.alcabalaApplicable,
  rent2Applicable: complianceForm.value.rent2Applicable,
}))
const { data: taxPreview, isLoading: loadingTaxPreview } = useVentasTaxPreview(taxPreviewParams)

watch(checklistData, (v) => {
  if (!v) return
  complianceForm.value = {
    ...complianceForm.value,
    titleStudyChecked: Boolean(v.titleStudyChecked),
    criChecked: Boolean(v.criChecked),
    noLiensChecked: Boolean(v.noLiensChecked),
    municipalTaxClearanceChecked: Boolean(v.municipalTaxClearanceChecked),
    minutaSigned: Boolean(v.minutaSigned),
    publicDeedSigned: Boolean(v.publicDeedSigned),
    notarialPartSubmitted: Boolean(v.notarialPartSubmitted),
    sunarpStatus: String(v.sunarpStatus ?? 'PENDING'),
    sunarpSubmittedAt: String(v.sunarpSubmittedAt ?? '').slice(0, 10),
    sunarpObservedAt: String(v.sunarpObservedAt ?? '').slice(0, 10),
    sunarpRegisteredAt: String(v.sunarpRegisteredAt ?? '').slice(0, 10),
    sunarpObservationNotes: String(v.sunarpObservationNotes ?? ''),
    alcabalaApplicable: v.alcabalaApplicable !== false,
    alcabalaAmount: Number(v.alcabalaAmount ?? 0),
    alcabalaPaidAt: String(v.alcabalaPaidAt ?? '').slice(0, 10),
    rent2Applicable: Boolean(v.rent2Applicable),
    rent2Amount: Number(v.rent2Amount ?? 0),
    rent2PaidAt: String(v.rent2PaidAt ?? '').slice(0, 10),
    bankedPaymentRequired: v.bankedPaymentRequired !== false,
    bankedPaymentVerified: Boolean(v.bankedPaymentVerified),
    paymentMethod: String(v.paymentMethod ?? ''),
    bankOperationNumber: String(v.bankOperationNumber ?? ''),
    bankName: String(v.bankName ?? ''),
    bankAccountHolder: String(v.bankAccountHolder ?? ''),
    fundsSourceDeclared: Boolean(v.fundsSourceDeclared),
    beneficialOwnerDeclared: Boolean(v.beneficialOwnerDeclared),
    kycRiskLevel: String(v.kycRiskLevel ?? 'PENDING'),
    complianceNotes: String(v.complianceNotes ?? ''),
  }
})

const { mutate: saveChecklist, isPending: savingChecklist } = useVentasUpsertComplianceChecklist()
const { mutate: uploadDoc, isPending: uploadingDoc } = useVentasUploadComplianceDocument()

const docType = ref('CRI')
const docFile = ref<File | null>(null)
const docError = ref('')
const docNotes = ref('')

function openCompliance(row: SaleClosingRow) {
  selectedClosing.value = row
  showCompliance.value = true
}

function applyTaxSuggestion() {
  if (!taxPreview.value) return
  complianceForm.value.alcabalaAmount = taxPreview.value.alcabala.amount
  complianceForm.value.rent2Amount = taxPreview.value.rent2.amount
}

function onSaveChecklist() {
  if (!selectedClosing.value) return
  saveChecklist({
    propertyId: selectedClosing.value.property.id,
    buyerClientId: selectedClosing.value.buyer.id,
    ...complianceForm.value,
    sunarpSubmittedAt: complianceForm.value.sunarpSubmittedAt || null,
    sunarpObservedAt: complianceForm.value.sunarpObservedAt || null,
    sunarpRegisteredAt: complianceForm.value.sunarpRegisteredAt || null,
    alcabalaPaidAt: complianceForm.value.alcabalaPaidAt || null,
    rent2PaidAt: complianceForm.value.rent2PaidAt || null,
  })
}

function onUploadDoc() {
  if (!selectedClosing.value || !docFile.value) {
    docError.value = 'Seleccione un archivo'
    return
  }
  docError.value = ''
  uploadDoc(
    {
      propertyId: selectedClosing.value.property.id,
      buyerClientId: selectedClosing.value.buyer.id,
      docType: docType.value,
      file: docFile.value,
      notes: docNotes.value || null,
    },
    {
      onSuccess: () => {
        docFile.value = null
        docNotes.value = ''
      },
    },
  )
}

function runAlerts(dryRun: boolean) {
  dispatchAlerts({ dryRun, maxItems: 50, daysWithoutAlert: 1 })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Cierres</h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Venta final: propiedad en Vendida y comisión registrada (pendiente en Finanzas).
        </p>
      </div>
      <BaseButton
        variant="primary"
        class="flex items-center gap-2"
        :loading="loadingNewModalData"
        @click="openModal"
      >
        <AppIcon icon="lucide:plus" :size="18" />
        Registrar cierre
      </BaseButton>
    </div>

    <div
      class="rounded-xl border p-4 space-y-3"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 class="text-lg font-semibold" :style="{ color: 'var(--color-text-primary)' }">Pendientes legales</h2>
          <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
            Operaciones con faltantes de compliance/SUNARP para seguimiento operativo.
          </p>
        </div>
        <div class="flex gap-2">
          <BaseButton variant="secondary" :loading="dispatchingAlerts" @click="runAlerts(true)">
            Simular alertas
          </BaseButton>
          <BaseButton variant="primary" :loading="dispatchingAlerts" @click="runAlerts(false)">
            Enviar alertas
          </BaseButton>
        </div>
      </div>

      <div class="grid sm:grid-cols-3 gap-2">
        <FormSelect
          v-model="boardFilters.sunarpStatus"
          label="SUNARP"
          :options="[
            { value: '', label: 'Todos' },
            { value: 'PENDING', label: 'Pendiente' },
            { value: 'SUBMITTED', label: 'Presentado' },
            { value: 'OBSERVED', label: 'Observado' },
            { value: 'REGISTERED', label: 'Inscrito' },
          ]"
        />
        <FormCheckbox v-model="boardFilters.onlyOverdue" label="Solo vencidos (nextActionAt)" />
      </div>

      <div v-if="loadingPendingBoard" class="py-8 text-center">
        <AppIcon icon="svg-spinners:ring-resize" :size="28" color="var(--color-primary)" />
      </div>
      <div v-else class="overflow-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-left" :style="{ borderColor: 'var(--color-border)' }">
              <th class="py-2 px-3">Severidad</th>
              <th class="py-2 px-3">Propiedad</th>
              <th class="py-2 px-3">Comprador</th>
              <th class="py-2 px-3">SUNARP</th>
              <th class="py-2 px-3">Pendientes</th>
              <th class="py-2 px-3">Próxima acción</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in pendingBoard?.data ?? []"
              :key="r.checklistId"
              class="border-b"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <td class="py-2 px-3">
                <Badge :variant="r.severity === 'HIGH' ? 'error' : r.severity === 'MEDIUM' ? 'warning' : 'success'">
                  {{ r.severity }}
                </Badge>
              </td>
              <td class="py-2 px-3 font-mono text-xs">{{ r.propertyId }}</td>
              <td class="py-2 px-3 font-mono text-xs">{{ r.buyerClientId }}</td>
              <td class="py-2 px-3">{{ r.sunarpStatus }}</td>
              <td class="py-2 px-3">{{ r.missing.length }}</td>
              <td class="py-2 px-3">
                {{ r.nextActionAt ? new Date(r.nextActionAt).toLocaleDateString('es-PE') : '—' }}
              </td>
            </tr>
            <tr v-if="!(pendingBoard?.data ?? []).length">
              <td colspan="6" class="py-4 px-3 text-center opacity-70">Sin pendientes en filtros actuales.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div v-if="isLoading" class="flex justify-center py-16">
        <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
      </div>
      <DataTable v-else :columns="columns" :data="rows" row-key="id" empty-text="Sin cierres registrados.">
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ (row as SaleClosingRow).property.code }}</td>
          <td class="py-3 px-4">{{ (row as SaleClosingRow).buyer.fullName }}</td>
          <td class="py-3 px-4">
            S/ {{ (row as SaleClosingRow).finalPrice.toLocaleString('es-PE') }}
          </td>
          <td class="py-3 px-4">
            <Badge variant="neutral">{{ (row as SaleClosingRow).paymentType }}</Badge>
          </td>
          <td class="py-3 px-4 text-sm">
            <template v-if="(row as SaleClosingRow).commission">
              S/ {{ (row as SaleClosingRow).commission!.amount.toLocaleString('es-PE') }}
              <span class="text-xs opacity-75">({{ (row as SaleClosingRow).commission!.status }})</span>
            </template>
            <span v-else>—</span>
          </td>
          <td class="py-3 px-4 text-right">
            <BaseButton variant="ghost" size="sm" @click="openCompliance(row as SaleClosingRow)">
              Cumplimiento
            </BaseButton>
          </td>
        </template>
      </DataTable>
      <div class="border-t p-2" :style="{ borderColor: 'var(--color-border)' }">
        <BasePagination
          v-bind="paginationProps"
          :show-page-size="true"
          @update:current-page="(p: number) => (listParams.page = p)"
          @update:page-size="(s: number) => { listParams.limit = s; listParams.page = 1 }"
        />
      </div>
    </div>

    <BaseModal v-model="showNew" title="Registrar cierre de venta" size="lg">
      <div class="p-4 space-y-3">
        <FormSelect v-model="form.buyerClientId" label="Cliente comprador" :options="buyerOptions" required />
        <FormSelect v-model="form.propertyId" label="Inmueble" :options="propertyOptions" required />
        <FormSelect v-model="form.agentId" label="Asesor (comisión)" :options="agentOptions" required />
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium">Precio final (S/)</label>
            <input
              v-model.number="form.finalPrice"
              type="number"
              min="0"
              step="1"
              class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              :style="{ borderColor: 'var(--color-border)' }"
            />
          </div>
          <FormSelect v-model="form.paymentType" label="Tipo de pago" :options="[...PAYMENT_TYPE_OPTIONS]" />
        </div>
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium">Monto comisión (S/)</label>
            <input
              v-model.number="form.commissionAmount"
              type="number"
              min="0"
              step="0.01"
              class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              :style="{ borderColor: 'var(--color-border)' }"
            />
          </div>
          <div>
            <label class="text-sm font-medium">% comisión (opcional)</label>
            <input
              v-model.number="form.commissionPercent"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              :style="{ borderColor: 'var(--color-border)' }"
            />
          </div>
        </div>
        <div>
          <label class="text-sm font-medium">Notas</label>
          <textarea
            v-model="form.notes"
            rows="2"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :style="{ borderColor: 'var(--color-border)' }"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="outline" @click="showNew = false">Cancelar</BaseButton>
          <BaseButton variant="primary" :loading="isPending" @click="submit">Registrar cierre</BaseButton>
        </div>
      </div>
    </BaseModal>

    <BaseModal v-model="showCompliance" title="Cumplimiento legal del cierre" size="xl">
      <div class="p-4 space-y-4">
        <div v-if="selectedClosing" class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          Operación: <strong>{{ selectedClosing.property.code }}</strong> — {{ selectedClosing.buyer.fullName }}
        </div>

        <div
          class="rounded-lg border p-3"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }"
        >
          <p class="font-semibold text-sm">Estado de cierre legal</p>
          <p v-if="loadingReadiness" class="text-sm mt-1">Validando...</p>
          <template v-else>
            <p class="text-sm mt-1" :style="{ color: readinessData?.ok ? 'var(--color-success)' : 'var(--color-warning)' }">
              {{ readinessData?.ok ? 'Listo para cierre.' : 'Pendiente de requisitos.' }}
            </p>
            <ul v-if="!readinessData?.ok && readinessData?.missing?.length" class="list-disc pl-5 text-sm mt-1">
              <li v-for="m in readinessData.missing" :key="m">{{ m }}</li>
            </ul>
          </template>
        </div>

        <div v-if="loadingChecklist" class="py-8 text-center">
          <AppIcon icon="svg-spinners:ring-resize" :size="28" color="var(--color-primary)" />
        </div>
        <div v-else class="space-y-3">
          <div class="grid sm:grid-cols-2 gap-2">
            <FormCheckbox v-model="complianceForm.titleStudyChecked" label="Estudio de títulos" />
            <FormCheckbox v-model="complianceForm.criChecked" label="CRI verificado" />
            <FormCheckbox v-model="complianceForm.noLiensChecked" label="Sin cargas/gravámenes" />
            <FormCheckbox v-model="complianceForm.municipalTaxClearanceChecked" label="Constancia municipal" />
            <FormCheckbox v-model="complianceForm.minutaSigned" label="Minuta firmada" />
            <FormCheckbox v-model="complianceForm.publicDeedSigned" label="Escritura firmada" />
            <FormCheckbox v-model="complianceForm.notarialPartSubmitted" label="Parte notarial presentado" />
            <FormCheckbox v-model="complianceForm.bankedPaymentVerified" label="Bancarización validada" />
            <FormCheckbox v-model="complianceForm.fundsSourceDeclared" label="Origen de fondos declarado" />
            <FormCheckbox v-model="complianceForm.beneficialOwnerDeclared" label="Beneficiario final declarado" />
          </div>

          <div class="grid sm:grid-cols-3 gap-3">
            <FormSelect
              v-model="complianceForm.sunarpStatus"
              label="Estado SUNARP"
              :options="[
                { value: 'PENDING', label: 'Pendiente' },
                { value: 'SUBMITTED', label: 'Presentado' },
                { value: 'OBSERVED', label: 'Observado' },
                { value: 'REGISTERED', label: 'Inscrito' },
              ]"
            />
            <div>
              <label class="text-sm font-medium">Presentado SUNARP</label>
              <input v-model="complianceForm.sunarpSubmittedAt" type="date" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
            <div>
              <label class="text-sm font-medium">Inscrito SUNARP</label>
              <input v-model="complianceForm.sunarpRegisteredAt" type="date" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
          </div>
          <div>
            <label class="text-sm font-medium">Observación SUNARP</label>
            <textarea v-model="complianceForm.sunarpObservationNotes" rows="2" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
          </div>

          <div class="grid sm:grid-cols-3 gap-3">
            <FormCheckbox v-model="complianceForm.alcabalaApplicable" label="Alcabala aplicable" />
            <FormCheckbox v-model="complianceForm.rent2Applicable" label="Renta 2da aplicable" />
            <div>
              <label class="text-sm font-medium">Costo adquisición (S/)</label>
              <input v-model.number="acquisitionCost" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
          </div>
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">Alcabala (S/)</label>
              <input v-model.number="complianceForm.alcabalaAmount" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
            <div>
              <label class="text-sm font-medium">Renta 2da (S/)</label>
              <input v-model.number="complianceForm.rent2Amount" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <BaseButton variant="secondary" :disabled="loadingTaxPreview" @click="applyTaxSuggestion">
              Aplicar estimado tributario
            </BaseButton>
            <span v-if="taxPreview" class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
              Alcabala: S/ {{ taxPreview.alcabala.amount.toLocaleString('es-PE') }} · Renta 2da: S/ {{ taxPreview.rent2.amount.toLocaleString('es-PE') }}
            </span>
          </div>

          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">Método de pago</label>
              <input v-model="complianceForm.paymentMethod" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
            <div>
              <label class="text-sm font-medium">N° operación bancaria</label>
              <input v-model="complianceForm.bankOperationNumber" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">Banco</label>
              <input v-model="complianceForm.bankName" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
            <div>
              <label class="text-sm font-medium">Titular cuenta</label>
              <input v-model="complianceForm.bankAccountHolder" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-3">
            <FormSelect
              v-model="complianceForm.kycRiskLevel"
              label="Riesgo KYC"
              :options="[
                { value: 'PENDING', label: 'Pendiente' },
                { value: 'LOW', label: 'Bajo' },
                { value: 'MEDIUM', label: 'Medio' },
                { value: 'HIGH', label: 'Alto' },
              ]"
            />
            <div>
              <label class="text-sm font-medium">Notas compliance</label>
              <textarea v-model="complianceForm.complianceNotes" rows="2" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
          </div>
        </div>

        <div
          class="rounded-lg border p-3 space-y-2"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <p class="font-semibold text-sm">Documentos de cumplimiento</p>
          <div class="grid sm:grid-cols-3 gap-2">
            <FormSelect
              v-model="docType"
              label="Tipo documento"
              :options="[
                { value: 'CRI', label: 'CRI' },
                { value: 'MINUTA', label: 'Minuta' },
                { value: 'ESCRITURA_PUBLICA', label: 'Escritura pública' },
                { value: 'ALCABALA', label: 'Pago alcabala' },
                { value: 'RENTA2', label: 'Pago renta 2da' },
                { value: 'KYC', label: 'KYC/LAFT' },
                { value: 'OTRO', label: 'Otro' },
              ]"
            />
            <div class="sm:col-span-2">
              <label class="text-sm font-medium">Notas documento</label>
              <input v-model="docNotes" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
          </div>
          <FileDropzone
            v-model="docFile"
            label="Archivo"
            :multiple="false"
            :error="docError"
            @error="(m: string) => (docError = m)"
          />
          <div class="flex justify-end">
            <BaseButton variant="secondary" :loading="uploadingDoc" @click="onUploadDoc">Subir documento</BaseButton>
          </div>

          <div v-if="loadingDocuments" class="text-sm opacity-70">Cargando documentos...</div>
          <ul v-else class="space-y-1 text-sm">
            <li v-for="d in documentsData ?? []" :key="d.id" class="flex items-center justify-between gap-2">
              <span>{{ d.docType }} · {{ d.filePath }}</span>
            </li>
            <li v-if="!(documentsData ?? []).length" class="opacity-70">Sin documentos cargados.</li>
          </ul>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="outline" @click="showCompliance = false">Cerrar</BaseButton>
          <BaseButton variant="primary" :loading="savingChecklist" @click="onSaveChecklist">
            Guardar checklist
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
