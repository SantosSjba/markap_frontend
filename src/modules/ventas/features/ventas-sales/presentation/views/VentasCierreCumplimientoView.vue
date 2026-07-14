<script setup lang="ts">
import { toCalendarDateString } from '@/shared/utils/formatters'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BaseButton,
  FormSelect,
  FormCheckbox,
  FileDropzone,
  AppIcon,
  PageHeader,
  FormSectionCard,
} from '@shared/components'
import {
  useVentasClosingReadiness,
  useVentasComplianceChecklist,
  useVentasComplianceDocuments,
  useVentasUpsertComplianceChecklist,
  useVentasUploadComplianceDocument,
  useVentasTaxPreview,
} from '../../application/useVentasSales'
import type { SaleComplianceChecklist } from '../../domain/sales.types'
import { resolveFileDownloadUrl } from '@shared/utils/archivo-url'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

const route = useRoute()
const router = useRouter()

const closingId = computed(() => String(route.params.closingId ?? ''))
const propertyId = computed(() => String(route.query.propertyId ?? ''))
const buyerClientId = computed(() => String(route.query.buyerClientId ?? ''))
const propertyCode = computed(() => String(route.query.propertyCode ?? ''))
const buyerName = computed(() => String(route.query.buyerName ?? ''))
const finalPrice = computed(() => Number(route.query.finalPrice ?? 0))

const hasRequiredQuery = computed(() => !!propertyId.value && !!buyerClientId.value)

const complianceParams = computed(() => ({
  propertyId: propertyId.value,
  buyerClientId: buyerClientId.value,
}))

const {
  data: checklistData,
  isLoading: loadingChecklist,
  isError: checklistQueryError,
  error: checklistFetchError,
  refetch: refetchChecklist,
} = useVentasComplianceChecklist(complianceParams)
const {
  data: documentsData,
  isLoading: loadingDocuments,
  isError: documentsQueryError,
  error: documentsFetchError,
  refetch: refetchDocuments,
} = useVentasComplianceDocuments(complianceParams)
const {
  data: readinessData,
  isLoading: loadingReadiness,
  isError: readinessQueryError,
  error: readinessFetchError,
  refetch: refetchReadiness,
} = useVentasClosingReadiness(complianceParams)

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
  salePrice: finalPrice.value || 0,
  acquisitionCost: acquisitionCost.value || 0,
  alcabalaApplicable: complianceForm.value.alcabalaApplicable,
  rent2Applicable: complianceForm.value.rent2Applicable,
}))
const {
  data: taxPreview,
  isLoading: loadingTaxPreview,
  isError: taxPreviewQueryError,
  error: taxPreviewFetchError,
  refetch: refetchTaxPreview,
} = useVentasTaxPreview(taxPreviewParams)

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
    sunarpSubmittedAt: v.sunarpSubmittedAt ? toCalendarDateString(v.sunarpSubmittedAt) : '',
    sunarpObservedAt: v.sunarpObservedAt ? toCalendarDateString(v.sunarpObservedAt) : '',
    sunarpRegisteredAt: v.sunarpRegisteredAt ? toCalendarDateString(v.sunarpRegisteredAt) : '',
    sunarpObservationNotes: String(v.sunarpObservationNotes ?? ''),
    alcabalaApplicable: v.alcabalaApplicable !== false,
    alcabalaAmount: Number(v.alcabalaAmount ?? 0),
    alcabalaPaidAt: v.alcabalaPaidAt ? toCalendarDateString(v.alcabalaPaidAt) : '',
    rent2Applicable: Boolean(v.rent2Applicable),
    rent2Amount: Number(v.rent2Amount ?? 0),
    rent2PaidAt: v.rent2PaidAt ? toCalendarDateString(v.rent2PaidAt) : '',
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

const operationLabel = computed(() => {
  const parts: string[] = []
  if (propertyCode.value) parts.push(propertyCode.value)
  if (buyerName.value) parts.push(buyerName.value)
  if (finalPrice.value > 0) parts.push(`S/ ${finalPrice.value.toLocaleString('es-PE')}`)
  return parts.length ? parts.join(' — ') : closingId.value || 'Cierre de venta'
})

function goBack() {
  router.push({ name: 'ventas-cierres' })
}

function applyTaxSuggestion() {
  if (!taxPreview.value) return
  complianceForm.value.alcabalaAmount = taxPreview.value.alcabala.amount
  complianceForm.value.rent2Amount = taxPreview.value.rent2.amount
}

function onSaveChecklist() {
  if (!hasRequiredQuery.value) return
  const f = complianceForm.value
  const payload: SaleComplianceChecklist = {
    ...f,
    propertyId: propertyId.value,
    buyerClientId: buyerClientId.value,
    sunarpStatus: f.sunarpStatus as NonNullable<SaleComplianceChecklist['sunarpStatus']>,
    kycRiskLevel: f.kycRiskLevel as NonNullable<SaleComplianceChecklist['kycRiskLevel']>,
    sunarpSubmittedAt: f.sunarpSubmittedAt || null,
    sunarpObservedAt: f.sunarpObservedAt || null,
    sunarpRegisteredAt: f.sunarpRegisteredAt || null,
    alcabalaPaidAt: f.alcabalaPaidAt || null,
    rent2PaidAt: f.rent2PaidAt || null,
  }
  saveChecklist(payload)
}

function onUploadDoc() {
  if (!hasRequiredQuery.value || !docFile.value) {
    docError.value = 'Seleccione un archivo'
    return
  }
  docError.value = ''
  uploadDoc(
    {
      propertyId: propertyId.value,
      buyerClientId: buyerClientId.value,
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
</script>

<template>
  <div class="space-y-6 pb-24">
    <div class="flex items-start gap-3">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)] shrink-0 mt-1"
        aria-label="Volver a cierres"
        @click="goBack"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <PageHeader
        class="flex-1 min-w-0"
        title="Cumplimiento legal del cierre"
        :subtitle="operationLabel"
        icon="lucide:clipboard-check"
      />
    </div>

    <div
      v-if="!hasRequiredQuery"
      class="rounded-xl border px-4 py-8 text-center space-y-3"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <p class="text-sm" style="color: var(--color-error)">
        Faltan datos de la operación (inmueble o comprador). Abra el cumplimiento desde la lista de cierres.
      </p>
      <BaseButton variant="outline" icon="lucide:arrow-left" @click="goBack">Volver a cierres</BaseButton>
    </div>

    <template v-else>
      <FormSectionCard
        title="Estado de cierre legal"
        subtitle="Requisitos para habilitar el cierre"
        icon="lucide:scale"
        dense
      >
        <p v-if="loadingReadiness" class="text-sm">Validando...</p>
        <div v-else-if="readinessQueryError" class="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
          <span style="color: var(--color-error)">{{ getApiErrorMessage(readinessFetchError) }}</span>
          <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" class="self-start sm:ml-auto shrink-0" @click="() => refetchReadiness()">
            Reintentar
          </BaseButton>
        </div>
        <template v-else>
          <p class="text-sm" :style="{ color: readinessData?.ok ? 'var(--color-success)' : 'var(--color-warning)' }">
            {{ readinessData?.ok ? 'Listo para cierre.' : 'Pendiente de requisitos.' }}
          </p>
          <ul v-if="!readinessData?.ok && readinessData?.missing?.length" class="list-disc pl-5 text-sm mt-2">
            <li v-for="m in readinessData.missing" :key="m">{{ m }}</li>
          </ul>
        </template>
      </FormSectionCard>

      <div v-if="loadingChecklist" class="flex justify-center py-16">
        <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
      </div>
      <div
        v-else-if="checklistQueryError"
        class="flex flex-col items-center justify-center gap-3 py-16 rounded-xl border px-4 text-center"
        :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
      >
        <p class="text-sm font-medium" style="color: var(--color-error)">{{ getApiErrorMessage(checklistFetchError) }}</p>
        <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchChecklist()">Reintentar checklist</BaseButton>
      </div>

      <template v-else>
        <FormSectionCard title="Checklist legal" icon="lucide:list-checks" dense>
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
        </FormSectionCard>

        <FormSectionCard title="SUNARP" icon="lucide:landmark" dense>
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
          <div class="mt-3">
            <label class="text-sm font-medium">Observación SUNARP</label>
            <textarea v-model="complianceForm.sunarpObservationNotes" rows="2" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
          </div>
        </FormSectionCard>

        <FormSectionCard title="Tributos" icon="lucide:receipt" dense>
          <div class="grid sm:grid-cols-3 gap-3">
            <FormCheckbox v-model="complianceForm.alcabalaApplicable" label="Alcabala aplicable" />
            <FormCheckbox v-model="complianceForm.rent2Applicable" label="Renta 2da aplicable" />
            <div>
              <label class="text-sm font-medium">Costo adquisición (S/)</label>
              <input v-model.number="acquisitionCost" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
          </div>
          <div class="grid sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label class="text-sm font-medium">Alcabala (S/)</label>
              <input v-model.number="complianceForm.alcabalaAmount" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
            <div>
              <label class="text-sm font-medium">Renta 2da (S/)</label>
              <input v-model.number="complianceForm.rent2Amount" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 mt-3">
            <BaseButton variant="secondary" icon="lucide:sparkles" :disabled="loadingTaxPreview" @click="applyTaxSuggestion">
              Aplicar estimado tributario
            </BaseButton>
            <span v-if="taxPreview" class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
              Alcabala: S/ {{ taxPreview.alcabala.amount.toLocaleString('es-PE') }} · Renta 2da: S/ {{ taxPreview.rent2.amount.toLocaleString('es-PE') }}
            </span>
          </div>
          <div v-if="taxPreviewQueryError" class="flex flex-wrap items-center gap-2 text-xs mt-2">
            <span style="color: var(--color-error)">{{ getApiErrorMessage(taxPreviewFetchError) }}</span>
            <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchTaxPreview()">Reintentar estimado</BaseButton>
          </div>
        </FormSectionCard>

        <FormSectionCard title="Pago y KYC" icon="lucide:shield-check" dense>
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">Método de pago</label>
              <input v-model="complianceForm.paymentMethod" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
            <div>
              <label class="text-sm font-medium">N° operación bancaria</label>
              <input v-model="complianceForm.bankOperationNumber" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
            <div>
              <label class="text-sm font-medium">Banco</label>
              <input v-model="complianceForm.bankName" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
            <div>
              <label class="text-sm font-medium">Titular cuenta</label>
              <input v-model="complianceForm.bankAccountHolder" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" :style="{ borderColor: 'var(--color-border)' }" />
            </div>
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
        </FormSectionCard>

        <FormSectionCard title="Documentos de cumplimiento" icon="lucide:file-up" dense>
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
            class="mt-3"
            :multiple="false"
            :error="docError"
            @error="(m: string) => (docError = m)"
          />
          <div class="flex justify-end mt-3">
            <BaseButton variant="secondary" icon="lucide:upload" :loading="uploadingDoc" @click="onUploadDoc">
              Subir documento
            </BaseButton>
          </div>

          <div v-if="loadingDocuments" class="text-sm opacity-70 mt-4">Cargando documentos...</div>
          <div v-else-if="documentsQueryError" class="flex flex-col sm:flex-row sm:items-center gap-2 text-sm py-4">
            <span style="color: var(--color-error)">{{ getApiErrorMessage(documentsFetchError) }}</span>
            <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" class="self-start shrink-0" @click="() => refetchDocuments()">
              Reintentar lista
            </BaseButton>
          </div>
          <ul v-else class="space-y-1 text-sm mt-4">
            <li v-for="d in documentsData ?? []" :key="d.id" class="flex items-center justify-between gap-2">
              <span>{{ d.docType }}</span>
              <a
                v-if="resolveFileDownloadUrl(d) !== '#'"
                :href="resolveFileDownloadUrl(d)"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm shrink-0"
                :style="{ color: 'var(--color-primary)' }"
              >
                Ver archivo
              </a>
            </li>
            <li v-if="!(documentsData ?? []).length" class="opacity-70">Sin documentos cargados.</li>
          </ul>
        </FormSectionCard>
      </template>

      <div
        class="fixed bottom-0 left-0 right-0 z-20 border-t px-4 py-3 flex justify-end gap-2"
        :style="{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        }"
      >
        <BaseButton variant="outline" icon="lucide:arrow-left" @click="goBack">Volver</BaseButton>
        <BaseButton variant="primary" icon="lucide:clipboard-check" :loading="savingChecklist" @click="onSaveChecklist">
          Guardar checklist
        </BaseButton>
      </div>
    </template>
  </div>
</template>
