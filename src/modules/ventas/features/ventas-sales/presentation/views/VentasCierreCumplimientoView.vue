<script setup lang="ts">
import { COMPLIANCE_DOCUMENT_OPTIONS, complianceDocumentLabel } from '../../domain/pipeline.constants'
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('ventas')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { useService } from '@shared/presentation/di/services'
import { FILE_ACCESS } from '@shared/application/ports/file-access.port'
import { formatCurrency, toCalendarDateString } from '@shared/utils/formatters'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import {
  useVentasClosingReadiness,
  useVentasComplianceChecklist,
  useVentasComplianceDocuments,
  useVentasUpsertComplianceChecklist,
  useVentasUploadComplianceDocument,
  useVentasUploadPaymentEvidence,
  useVentasTaxPreview,
} from '../composables/useVentasSales'
import type { SaleComplianceChecklist } from '../../domain/sales.types'
import { resolveFileDownloadUrl } from '@shared/utils/archivo-url'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
const fileAccess = useService(FILE_ACCESS)

const route = useRoute()
const router = useRouter()

const closingId = computed(() => String(route.params.closingId ?? ''))
/** Abierto desde la ficha del proceso (`/procesos/:id/cumplimiento`) */
const processId = computed(() => String(route.params.id ?? ''))
const currency = computed(() => String(route.query.currency ?? 'PEN'))
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
  paymentEvidenceMeta.value = {
    path: v.paymentEvidencePath ?? null,
    archivoId: v.paymentEvidenceArchivoId ?? null,
    downloadUrl: v.paymentEvidenceDownloadUrl ?? null,
  }
})

const { mutate: saveChecklist, isPending: savingChecklist } = useVentasUpsertComplianceChecklist()
const { mutate: uploadDoc, isPending: uploadingDoc } = useVentasUploadComplianceDocument()
const { mutate: uploadPaymentEvidence, isPending: uploadingPaymentEvidence } =
  useVentasUploadPaymentEvidence()

const paymentEvidenceFile = ref<File | null>(null)
const paymentEvidenceError = ref('')
const paymentEvidenceMeta = ref<{
  path: string | null
  archivoId: string | null
  downloadUrl: string | null
}>({ path: null, archivoId: null, downloadUrl: null })

const docType = ref('CRI')
const docFile = ref<File | null>(null)
const docError = ref('')
const docNotes = ref('')

const operationLabel = computed(() => {
  const parts: string[] = []
  if (propertyCode.value) parts.push(propertyCode.value)
  if (buyerName.value) parts.push(buyerName.value)
  if (finalPrice.value > 0) parts.push(formatCurrency(finalPrice.value, currency.value))
  return parts.length ? parts.join(' — ') : closingId.value || 'Cierre de venta'
})

function goBack() {
  if (processId.value) router.push({ name: 'ventas-proceso-detalle', params: { id: processId.value } })
  else router.push({ name: 'ventas-procesos' })
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

function onUploadPaymentEvidence() {
  if (!hasRequiredQuery.value || !paymentEvidenceFile.value) {
    paymentEvidenceError.value = 'Seleccione un archivo'
    return
  }
  paymentEvidenceError.value = ''
  uploadPaymentEvidence(
    {
      propertyId: propertyId.value,
      buyerClientId: buyerClientId.value,
      file: paymentEvidenceFile.value,
    },
    {
      onSuccess: (res) => {
        paymentEvidenceFile.value = null
        paymentEvidenceMeta.value = {
          path: res.paymentEvidencePath ?? null,
          archivoId: res.paymentEvidenceArchivoId ?? null,
          downloadUrl: res.paymentEvidenceDownloadUrl ?? null,
        }
        void refetchChecklist()
      },
    },
  )
}

async function openPaymentEvidence() {
  try {
    if (paymentEvidenceMeta.value.downloadUrl) {
      window.open(paymentEvidenceMeta.value.downloadUrl, '_blank', 'noopener,noreferrer')
      return
    }
    if (paymentEvidenceMeta.value.archivoId) {
      const data = await fileAccess.getDownloadUrl(
        encodeURIComponent(paymentEvidenceMeta.value.archivoId),
        { applicationSlug: 'ventas' },
      )
      if (data?.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer')
        return
      }
    }
    const legacy = resolveFileDownloadUrl({
      filePath: paymentEvidenceMeta.value.path ?? undefined,
    })
    if (legacy !== '#') {
      window.open(legacy, '_blank', 'noopener,noreferrer')
      return
    }
    void markapAlert.toast.error('No hay evidencia de pago disponible')
  } catch (e) {
    void markapAlert.toast.error('No se pudo abrir el archivo', getApiErrorMessage(e))
  }
}

const hasPaymentEvidence = computed(
  () =>
    !!(
      paymentEvidenceMeta.value.archivoId ||
      paymentEvidenceMeta.value.path ||
      paymentEvidenceMeta.value.downloadUrl
    ),
)
</script>

<template>
  <div class="space-y-6 pb-24">
    <div class="flex items-start gap-3">
      <IconButton @click="goBack" icon="lucide:arrow-left" label="Volver al proceso" />
      <PageHeader
        class="flex-1 min-w-0"
        title="Cumplimiento legal del cierre"
        :subtitle="operationLabel"
        icon="lucide:clipboard-check"
      />
    </div>

    <BaseCard v-if="!hasRequiredQuery" class="block px-4 py-8 text-center space-y-3">
      <p class="text-sm text-error-500 dark:text-error-400">
        Faltan datos de la operación (inmueble o comprador). Abra el cumplimiento desde la lista de cierres.
      </p>
      <BaseButton variant="outline" icon="lucide:arrow-left" @click="goBack">Volver al proceso</BaseButton>
    </BaseCard>

    <template v-else>
      <FormSectionCard
        title="Estado de cierre legal"
        subtitle="Requisitos para habilitar el cierre"
        icon="lucide:scale"
        dense
      >
        <p v-if="loadingReadiness" class="text-sm">Validando...</p>
        <div v-else-if="readinessQueryError" class="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
          <span class="text-error-500 dark:text-error-400">{{ getApiErrorMessage(readinessFetchError) }}</span>
          <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" class="self-start sm:ml-auto shrink-0" @click="() => refetchReadiness()">
            Reintentar
          </BaseButton>
        </div>
        <template v-else>
          <p :class="(readinessData?.ok) ? 'text-success-600 dark:text-success-500' : 'text-warning-600 dark:text-orange-400'" class="text-sm">
            {{ readinessData?.ok ? 'Listo para cierre.' : 'Pendiente de requisitos.' }}
          </p>
          <ul v-if="!readinessData?.ok && readinessData?.missing?.length" class="list-disc pl-5 text-sm mt-2">
            <li v-for="m in readinessData.missing" :key="m">{{ m }}</li>
          </ul>
        </template>
      </FormSectionCard>

      <LoadingState v-if="loadingChecklist" />
      <BaseCard v-else-if="checklistQueryError" class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
        <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(checklistFetchError) }}</p>
        <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchChecklist()">Reintentar checklist</BaseButton>
      </BaseCard>

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
            <FormInput v-model="complianceForm.sunarpSubmittedAt" type="date" label="Presentado SUNARP" />
            <FormInput v-model="complianceForm.sunarpRegisteredAt" type="date" label="Inscrito SUNARP" />
          </div>
          <FormTextarea class="mt-3" v-model="complianceForm.sunarpObservationNotes" :rows="2" label="Observación SUNARP" />
        </FormSectionCard>

        <FormSectionCard title="Tributos" icon="lucide:receipt" dense>
          <div class="grid sm:grid-cols-3 gap-3">
            <FormCheckbox v-model="complianceForm.alcabalaApplicable" label="Alcabala aplicable" />
            <FormCheckbox v-model="complianceForm.rent2Applicable" label="Renta 2da aplicable" />
            <FormInput v-model="acquisitionCost" type="number" min="0" step="0.01" label="Costo adquisición (S/)" />
          </div>
          <div class="grid sm:grid-cols-2 gap-3 mt-3">
            <FormInput v-model="complianceForm.alcabalaAmount" type="number" min="0" step="0.01" label="Alcabala (S/)" />
            <FormInput v-model="complianceForm.rent2Amount" type="number" min="0" step="0.01" label="Renta 2da (S/)" />
          </div>
          <div class="flex flex-wrap items-center gap-2 mt-3">
            <BaseButton variant="secondary" icon="lucide:sparkles" :disabled="loadingTaxPreview" @click="applyTaxSuggestion">
              Aplicar estimado tributario
            </BaseButton>
            <span v-if="taxPreview" class="text-xs text-gray-500 dark:text-gray-400">
              Alcabala: S/ {{ taxPreview.alcabala.amount.toLocaleString('es-PE') }} · Renta 2da: S/ {{ taxPreview.rent2.amount.toLocaleString('es-PE') }}
            </span>
          </div>
          <div v-if="taxPreviewQueryError" class="flex flex-wrap items-center gap-2 text-xs mt-2">
            <span class="text-error-500 dark:text-error-400">{{ getApiErrorMessage(taxPreviewFetchError) }}</span>
            <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchTaxPreview()">Reintentar estimado</BaseButton>
          </div>
        </FormSectionCard>

        <FormSectionCard title="Pago y KYC" icon="lucide:shield-check" dense>
          <div class="grid sm:grid-cols-2 gap-3">
            <FormInput v-model="complianceForm.paymentMethod" label="Método de pago" />
            <FormInput v-model="complianceForm.bankOperationNumber" label="N° operación bancaria" />
            <FormInput v-model="complianceForm.bankName" label="Banco" />
            <FormInput v-model="complianceForm.bankAccountHolder" label="Titular cuenta" />
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
            <FormTextarea v-model="complianceForm.complianceNotes" :rows="2" label="Notas compliance" />
          </div>
          <div class="mt-4 space-y-2">
            <p class="text-sm font-medium">Evidencia de pago</p>
            <FileDropzone
              v-model="paymentEvidenceFile"
              label="Comprobante / voucher"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              :max-size="25 * 1024 * 1024"
              :multiple="false"
              :error="paymentEvidenceError"
              @error="(m: string) => (paymentEvidenceError = m)"
            />
            <div class="flex flex-wrap items-center gap-2">
              <BaseButton
                variant="secondary"
                icon="lucide:upload"
                :loading="uploadingPaymentEvidence"
                @click="onUploadPaymentEvidence"
              >
                Subir evidencia
              </BaseButton>
              <BaseButton
                v-if="hasPaymentEvidence"
                variant="outline"
                icon="lucide:external-link"
                @click="openPaymentEvidence"
              >
                Ver
              </BaseButton>
            </div>
          </div>
        </FormSectionCard>

        <FormSectionCard title="Documentos de cumplimiento" icon="lucide:file-up" dense>
          <div class="grid sm:grid-cols-3 gap-2">
            <FormSelect
              v-model="docType"
              label="Tipo documento"
              :options="COMPLIANCE_DOCUMENT_OPTIONS"
            />
            <FormInput class="sm:col-span-2" v-model="docNotes" label="Notas documento" />
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
            <span class="text-error-500 dark:text-error-400">{{ getApiErrorMessage(documentsFetchError) }}</span>
            <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" class="self-start shrink-0" @click="() => refetchDocuments()">
              Reintentar lista
            </BaseButton>
          </div>
          <ul v-else class="space-y-1 text-sm mt-4">
            <li v-for="d in documentsData ?? []" :key="d.id" class="flex items-center justify-between gap-2">
              <span>{{ complianceDocumentLabel(d.docType) }}</span>
              <a
                v-if="resolveFileDownloadUrl(d) !== '#'"
                :href="resolveFileDownloadUrl(d)"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm shrink-0 text-brand-500 dark:text-brand-400"
              >
                Ver archivo
              </a>
            </li>
            <li v-if="!(documentsData ?? []).length" class="opacity-70">Sin documentos cargados.</li>
          </ul>
        </FormSectionCard>
      </template>

      <div
        class="fixed bottom-0 left-0 right-0 z-20 border-t px-4 py-3 flex justify-end gap-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark"
      >
        <BaseButton variant="outline" icon="lucide:arrow-left" @click="goBack">Volver</BaseButton>
        <BaseButton v-if="canWrite" variant="primary" icon="lucide:clipboard-check" :loading="savingChecklist" @click="onSaveChecklist">
          Guardar checklist
        </BaseButton>
      </div>
    </template>
  </div>
</template>
