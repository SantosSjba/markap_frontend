<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('ventas')

import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Avatar from '@shared/presentation/components/ui/Avatar.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import { formatCurrency, formatShortDate } from '@shared/utils/formatters'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import {
  useVentasPatchSeparation,
  useVentasUploadClosingContract,
  useVentasUploadSeparationReceipt,
  useVentasClosingReadiness,
  useVentasFinancingChannels,
  useVentasProcessDetail,
  useVentasUpdateProcess,
} from '../composables/useVentasSales'
import {
  useVentasMarkCommissionPaid,
} from '../../../ventas-finanzas/presentation/composables/useVentasFinanzas'
import type { SaleProcessCommission, SaleProcessDetail } from '../../domain/sales.types'
import { useVentasPipelineStages } from '../../../ventas-configuracion/presentation/composables/useVentasConfig'
import {
  PAYMENT_TYPE_OPTIONS,
  allowedStageOptions,
  classifyStageMove,
  STAGE_REQUIRED_DOCUMENT,
  processStatusBadgeVariant,
  processStatusLabel,
} from '../../domain/pipeline.constants'
import { DEDUCTIBLE_LABELS } from '../../domain/commission-draft'
import { financingChannelOptions } from '../../domain/financing-channels'
import SaleProcessFollowUpPanel from '../components/SaleProcessFollowUpPanel.vue'
import MarkSaleLostModal from '../components/MarkSaleLostModal.vue'
import ProcessStageStepper from '../components/ProcessStageStepper.vue'
import ProcessStageBadge from '../components/ProcessStageBadge.vue'
import SalePropertySummary from '../components/SalePropertySummary.vue'
import SaleParticipantList from '../components/SaleParticipantList.vue'
import SeparationFormModal from '../components/SeparationFormModal.vue'
import ClosingFormModal from '../components/ClosingFormModal.vue'
import EditCommissionModal from '../components/EditCommissionModal.vue'
import ClosingFinancePanel from '../../../ventas-finanzas/presentation/components/ClosingFinancePanel.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import { useOpenStoredFile } from '@shared/presentation/composables/useOpenStoredFile'
/**
 * Detalle del proceso de venta: avance por etapas, inmueble, participantes, comisiones
 * (cada una en su moneda), cumplimiento para el cierre y seguimiento. La gestión
 * (título, etapa, medio de pago y venta caída) va en el lateral.
 */

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { stageOptions, orderedCodes } = useVentasPipelineStages()
const {
  data: proc,
  isLoading,
  isError: detailQueryError,
  error: detailFetchError,
  refetch: refetchDetail,
} = useVentasProcessDetail(id)
const { data: financingChannels, isLoading: loadingFinancing } = useVentasFinancingChannels()

const detail = computed(() => proc.value as SaleProcessDetail | undefined)
const isActive = computed(() => detail.value?.status === 'ACTIVE')
const isLost = computed(() => detail.value?.status === 'LOST')
const isWon = computed(() => detail.value?.status === 'WON')

const complianceParams = computed(() => ({
  propertyId: detail.value?.property?.id ?? '',
  buyerClientId: detail.value?.buyer?.id ?? '',
}))
const {
  data: closingReadiness,
  isLoading: loadingReadiness,
  isError: readinessQueryError,
  error: readinessFetchError,
  refetch: refetchReadiness,
} = useVentasClosingReadiness(complianceParams)

// ── Gestión del proceso ──
const { mutate: updateProc, isPending: saving } = useVentasUpdateProcess()
const titleEdit = ref('')
const stageEdit = ref('')
const financingEdit = ref('')
watch(
  detail,
  (d) => {
    if (!d) return
    titleEdit.value = d.title ?? ''
    stageEdit.value = d.pipelineStage ?? ''
    financingEdit.value = d.financingChannel?.id ?? ''
  },
  { immediate: true },
)
const stageOptionsForEdit = computed(() =>
  detail.value && isActive.value
    ? allowedStageOptions(detail.value.pipelineStage, stageOptions.value, orderedCodes.value)
    : stageOptions.value,
)
/** Avanzar exige el documento de la etapa; regresar pide motivo */
const stageMove = computed(() =>
  detail.value ? classifyStageMove(detail.value.pipelineStage, stageEdit.value, orderedCodes.value) : 'same',
)
const nextStageDocument = computed(() => (stageMove.value === 'next' ? STAGE_REQUIRED_DOCUMENT[stageEdit.value] : null))
const stageReason = ref('')
const stageReasonError = ref('')
const financingOptions = computed(() => financingChannelOptions(financingChannels.value ?? []))
const hasChanges = computed(() => {
  const d = detail.value
  if (!d) return false
  return (
    titleEdit.value.trim() !== (d.title ?? '') ||
    stageEdit.value !== d.pipelineStage ||
    financingEdit.value !== (d.financingChannel?.id ?? '')
  )
})

function saveProcessFields() {
  if (!isActive.value || !detail.value) return
  const goingBack = stageMove.value === 'backward'
  if (goingBack && stageReason.value.trim().length < 5) {
    stageReasonError.value = 'Indique el motivo para regresar de etapa (mínimo 5 caracteres).'
    return
  }
  stageReasonError.value = ''
  updateProc(
    {
      id: id.value,
      body: {
        title: titleEdit.value.trim() || null,
        pipelineStage: stageEdit.value !== detail.value.pipelineStage ? stageEdit.value : undefined,
        stageChangeReason: goingBack ? stageReason.value.trim() : undefined,
        financingChannelId: financingEdit.value || null,
      },
    },
    { onSuccess: () => (stageReason.value = '') },
  )
}

const markLostOpen = ref(false)
const markingLost = ref(false)
function confirmMarkLost(reason: string) {
  markingLost.value = true
  updateProc(
    { id: id.value, body: { status: 'LOST', lostReason: reason } },
    {
      onSuccess: () => {
        markLostOpen.value = false
        void refetchDetail()
      },
      onSettled: () => {
        markingLost.value = false
      },
    },
  )
}

// ── Participantes ──
const buyersList = computed(() => {
  const d = detail.value
  if (!d) return []
  if (d.buyers?.length) return d.buyers
  return d.buyer ? [{ ...d.buyer, documentNumber: '', isPrimary: true }] : []
})
const ownersList = computed(() => {
  const d = detail.value
  if (!d) return []
  if (d.owners?.length) return d.owners.map((o, i) => ({ ...o, isPrimary: i === 0 }))
  return d.property?.primaryOwner ? [{ ...d.property.primaryOwner, isPrimary: true }] : []
})

// ── Comisiones ──
const { mutate: markCommissionPaid } = useVentasMarkCommissionPaid()
const pendingCommissionAction = ref<string | null>(null)

const commissionsList = computed((): SaleProcessCommission[] => {
  const d = detail.value
  if (!d) return []
  if (d.commissions?.length) return d.commissions
  return d.commission ? [d.commission] : []
})
/** Bruto de comisiones por moneda (no se suman monedas distintas) */
const commissionTotals = computed(() => {
  const totals = new Map<string, number>()
  for (const c of commissionsList.value) {
    if (c.status === 'CANCELLED') continue
    const cur = c.currency ?? 'PEN'
    totals.set(cur, (totals.get(cur) ?? 0) + (c.grossAmount ?? c.amount))
  }
  return [...totals.entries()].map(([currency, amount]) => ({ currency, amount }))
})

function markCommission(commissionId: string) {
  pendingCommissionAction.value = `mark:${commissionId}`
  markCommissionPaid(
    { id: commissionId },
    {
      onSuccess: () => void refetchDetail(),
      onSettled: () => {
        pendingCommissionAction.value = null
      },
    },
  )
}

// Editar % o monto pactado (el % se calcula sobre el precio final, o el del inmueble sin cierre)
const editingCommission = ref<SaleProcessCommission | null>(null)
const commissionBasePrice = computed(
  () => detail.value?.closings?.[0]?.finalPrice ?? detail.value?.property.salePrice ?? null,
)

const COMMISSION_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'error' }> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  PARTIAL: { label: 'Pagada en parte', variant: 'info' },
  PAID: { label: 'Pagada', variant: 'success' },
  CANCELLED: { label: 'Anulada', variant: 'error' },
}
const commissionStatus = (s: string) => COMMISSION_STATUS[s] ?? COMMISSION_STATUS.PENDING!

function commissionCalcLabel(c: SaleProcessCommission): string {
  if (c.calculationType === 'FIXED') return 'Monto fijo'
  return c.percentApplied != null ? `${c.percentApplied} % del precio` : 'Porcentaje'
}

const SEPARATION_STATUS: Record<string, { label: string; variant: 'info' | 'error' | 'success' }> = {
  ACTIVE: { label: 'Activa', variant: 'info' },
  EXPIRED: { label: 'Vencida', variant: 'error' },
  CLOSED: { label: 'Cerrada en venta', variant: 'success' },
}
const hasActiveSeparation = computed(() => (detail.value?.separations ?? []).some((s) => s.status === 'ACTIVE'))
/** Separar solo si el proceso sigue activo, no tiene una vigente y el inmueble está disponible */
const canRegisterSeparation = computed(
  () =>
    isActive.value &&
    canWrite.value &&
    !hasActiveSeparation.value &&
    (detail.value?.property.listingStatus ?? 'AVAILABLE') === 'AVAILABLE',
)
const separationModalOpen = ref(false)
const closingModalOpen = ref(false)
const closing = computed(() => detail.value?.closings?.[0] ?? null)
const propertyCurrency = computed(() => detail.value?.property.saleCurrency ?? 'PEN')
const paymentTypeLabel = (code: string) => PAYMENT_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? code

const { openStoredFile, hasStoredFile } = useOpenStoredFile('ventas')

// Vencer / reactivar separación
const { mutate: patchSeparation, isPending: patchingSeparation } = useVentasPatchSeparation()
const separationStatusTarget = ref<{ id: string; status: 'ACTIVE' | 'EXPIRED' } | null>(null)
function confirmSeparationStatus() {
  const t = separationStatusTarget.value
  if (!t) return
  patchSeparation(
    { id: t.id, body: { status: t.status } },
    {
      onSuccess: () => void refetchDetail(),
      onSettled: () => (separationStatusTarget.value = null),
    },
  )
}

// Subir comprobante de separación o contrato del cierre
const { mutateAsync: uploadReceipt, isPending: uploadingReceipt } = useVentasUploadSeparationReceipt()
const { mutateAsync: uploadContract, isPending: uploadingContract } = useVentasUploadClosingContract()
const uploadTarget = ref<{ kind: 'separation' | 'closing'; id: string } | null>(null)
const uploadFile = ref<File | null>(null)
const uploadError = ref('')
const uploadingFile = computed(() => uploadingReceipt.value || uploadingContract.value)
function openUpload(kind: 'separation' | 'closing', id: string) {
  uploadTarget.value = { kind, id }
  uploadFile.value = null
  uploadError.value = ''
}
async function submitUpload() {
  const t = uploadTarget.value
  if (!t || !uploadFile.value) {
    uploadError.value = 'Seleccione un archivo'
    return
  }
  try {
    if (t.kind === 'separation') await uploadReceipt({ id: t.id, file: uploadFile.value })
    else await uploadContract({ id: t.id, file: uploadFile.value })
    uploadTarget.value = null
    void refetchDetail()
  } catch {
    // aviso en la mutación
  }
}

function goCompliance() {
  const d = detail.value
  if (!d) return
  void router.push({
    name: 'ventas-proceso-cumplimiento',
    params: { id: d.id },
    query: {
      propertyId: d.property.id,
      buyerClientId: d.buyer.id,
      propertyCode: d.property.code,
      buyerName: d.buyer.fullName,
      finalPrice: String(closing.value?.finalPrice ?? d.property.salePrice ?? 0),
      currency: propertyCurrency.value,
    },
  })
}

const goList = () => router.push({ name: 'ventas-procesos' })
</script>

<template>
  <div>
    <PageHeader
      :title="detail?.code ?? 'Proceso de venta'"
      :subtitle="detail?.title || 'Proceso de venta'"
      back
      class="mb-6"
      @back="goList"
    >
      <template v-if="detail" #actions>
        <div class="flex flex-wrap gap-2">
          <BaseButton variant="outline" icon="lucide:columns-3" @click="router.push({ name: 'ventas-procesos-pipeline' })">
            Pipeline
          </BaseButton>
          <BaseButton v-if="isActive && canWrite" variant="danger" icon="lucide:ban" @click="markLostOpen = true">
            Venta caída
          </BaseButton>
        </div>
      </template>
    </PageHeader>

    <LoadingState v-if="isLoading" text="Cargando proceso..." class="py-24" />

    <BaseCard v-else-if="detailQueryError" class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
      <p class="text-sm font-medium max-w-md text-error-500 dark:text-error-400">{{ getApiErrorMessage(detailFetchError) }}</p>
      <BaseButton variant="outline" size="sm" @click="() => refetchDetail()">Reintentar</BaseButton>
    </BaseCard>

    <div v-else-if="detail" class="space-y-6">
      <!-- Venta caída -->
      <div v-if="isLost" class="flex items-start gap-3 rounded-2xl border border-error-200 bg-error-50 p-4 dark:border-error-500/30 dark:bg-error-500/10">
        <AppIcon icon="lucide:ban" :size="20" class="mt-0.5 shrink-0 text-error-500" />
        <div class="text-sm">
          <p class="font-semibold text-error-600 dark:text-error-400">Venta registrada como caída</p>
          <p v-if="detail.lostReason" class="mt-0.5 text-gray-700 dark:text-gray-300">Motivo: {{ detail.lostReason }}</p>
          <p class="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
            Las comisiones pendientes se anularon y la separación vigente quedó vencida. El proceso ya no se puede modificar.
          </p>
        </div>
      </div>

      <!-- Avance + datos clave -->
      <BaseCard class="block space-y-6">
        <ProcessStageStepper :stage="detail.pipelineStage" :status="detail.status" />
        <dl class="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 text-sm md:grid-cols-4 dark:border-gray-800">
          <div>
            <dt class="flex items-center gap-1.5 text-theme-xs text-gray-400 dark:text-gray-500">
              <AppIcon icon="lucide:activity" :size="13" />Estado
            </dt>
            <dd class="mt-1 flex flex-wrap gap-1.5">
              <Badge :variant="processStatusBadgeVariant(detail.status)">{{ processStatusLabel(detail.status) }}</Badge>
              <ProcessStageBadge :stage="detail.pipelineStage" />
            </dd>
          </div>
          <div>
            <dt class="flex items-center gap-1.5 text-theme-xs text-gray-400 dark:text-gray-500">
              <AppIcon icon="lucide:user-check" :size="13" />Asesor principal
            </dt>
            <dd class="mt-1 font-medium text-gray-800 dark:text-white/90">{{ detail.agent?.fullName ?? 'Sin asesor' }}</dd>
          </div>
          <div>
            <dt class="flex items-center gap-1.5 text-theme-xs text-gray-400 dark:text-gray-500">
              <AppIcon icon="lucide:landmark" :size="13" />Banco o medio de pago
            </dt>
            <dd class="mt-1 font-medium text-gray-800 dark:text-white/90">{{ detail.financingChannel?.name ?? 'Sin especificar' }}</dd>
          </div>
          <div>
            <dt class="flex items-center gap-1.5 text-theme-xs text-gray-400 dark:text-gray-500">
              <AppIcon icon="lucide:calendar" :size="13" />{{ detail.closedAt ? 'Cerrado' : 'Iniciado' }}
            </dt>
            <dd class="mt-1 font-medium text-gray-800 dark:text-white/90">
              {{ detail.closedAt ? formatShortDate(detail.closedAt) : detail.createdAt ? formatShortDate(detail.createdAt) : '—' }}
            </dd>
          </div>
        </dl>
      </BaseCard>

      <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <!-- ── Columna principal ── -->
        <div class="space-y-6 xl:col-span-2">
          <FormSectionCard title="Inmueble" subtitle="Datos de la ficha y propietarios" icon="lucide:building-2" show-icon>
            <SalePropertySummary :property="detail.property" />
            <div class="mt-5">
              <p class="mb-3 flex items-center gap-2 text-theme-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                <AppIcon icon="lucide:key-round" :size="14" />Propietarios
              </p>
              <SaleParticipantList
                :people="ownersList"
                empty-text="El inmueble no tiene propietarios registrados (edítalo en Propiedades)."
              />
            </div>
          </FormSectionCard>

          <FormSectionCard title="Compradores" subtitle="Quienes adquieren el inmueble" icon="lucide:users" show-icon>
            <SaleParticipantList :people="buyersList" empty-text="Sin compradores registrados." />
          </FormSectionCard>

          <FormSectionCard
            title="Separación"
            subtitle="Reserva con dinero: el inmueble queda «Separado»"
            icon="lucide:bookmark"
            show-icon
            help="Monto que entrega el comprador para reservar el inmueble: este pasa a «Separado» y deja de ofrecerse como disponible. Si la venta se cae, la separación vence y el inmueble vuelve a estar disponible."
          >
            <template v-if="canRegisterSeparation" #actions>
              <BaseButton variant="outline" size="sm" icon="lucide:plus" @click="separationModalOpen = true">
                Registrar separación
              </BaseButton>
            </template>
            <ul v-if="detail.separations?.length" class="space-y-3">
              <li
                v-for="sep in detail.separations"
                :key="sep.id"
                class="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
              >
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p class="text-base font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ formatCurrency(sep.amount, sep.currency) }}</p>
                    <p class="mt-0.5 flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                      <AppIcon icon="lucide:calendar" :size="13" />
                      Separada el {{ formatShortDate(sep.separationDate) }}<template v-if="sep.expiresAt"> · vence {{ formatShortDate(sep.expiresAt) }}</template>
                    </p>
                    <p v-if="sep.notes" class="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{{ sep.notes }}</p>
                  </div>
                  <Badge :variant="SEPARATION_STATUS[sep.status]?.variant ?? 'neutral'">{{ SEPARATION_STATUS[sep.status]?.label ?? sep.status }}</Badge>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <BaseButton
                    v-if="hasStoredFile({ archivoId: sep.receiptArchivoId, filePath: sep.receiptFilePath })"
                    variant="outline"
                    size="sm"
                    icon="lucide:file-text"
                    @click="openStoredFile({ archivoId: sep.receiptArchivoId, filePath: sep.receiptFilePath })"
                  >
                    Ver comprobante
                  </BaseButton>
                  <BaseButton v-else-if="canWrite" variant="outline" size="sm" icon="lucide:upload" @click="openUpload('separation', sep.id)">
                    Subir comprobante
                  </BaseButton>
                  <BaseButton
                    v-if="canWrite && isActive && sep.status === 'ACTIVE'"
                    variant="ghost"
                    size="sm"
                    icon="lucide:calendar-x"
                    @click="separationStatusTarget = { id: sep.id, status: 'EXPIRED' }"
                  >
                    Marcar vencida
                  </BaseButton>
                  <BaseButton
                    v-if="canWrite && isActive && sep.status === 'EXPIRED' && !hasActiveSeparation"
                    variant="ghost"
                    size="sm"
                    icon="lucide:rotate-ccw"
                    @click="separationStatusTarget = { id: sep.id, status: 'ACTIVE' }"
                  >
                    Reactivar
                  </BaseButton>
                </div>
              </li>
            </ul>
            <p v-else class="text-sm text-gray-400 dark:text-gray-500">
              Aún sin separación. Al registrarla, el inmueble pasa a «Separada» y queda reservado para este proceso.
            </p>
          </FormSectionCard>

          <FormSectionCard
            title="Comisiones de asesores"
            subtitle="Cada comisión en su moneda"
            icon="lucide:percent"
            show-icon
            :help-items="[
              { term: 'Cálculo', text: 'Un % sobre el precio del inmueble o un monto fijo; se guarda en su propia moneda.' },
              { term: 'Neto', text: 'Comisión menos sus descuentos (deducibles): es lo que se le paga al asesor.' },
              { term: 'Pago', text: 'Se marcan como pagadas en Ventas › Comisiones; si la venta se cae, las pendientes se anulan.' },
            ]"
          >
            <template #actions>
              <BaseButton variant="ghost" size="sm" icon="lucide:external-link" @click="router.push({ name: 'ventas-comisiones', query: { q: detail.code } })">
                Ver comisiones
              </BaseButton>
            </template>
            <div v-if="commissionTotals.length" class="mb-4 flex flex-wrap gap-2">
              <span
                v-for="t in commissionTotals"
                :key="t.currency"
                class="rounded-lg bg-gray-50 px-3 py-1.5 text-sm dark:bg-white/3"
              >
                <span class="text-theme-xs text-gray-500 dark:text-gray-400">Total {{ t.currency }}</span>
                <span class="ml-2 font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ formatCurrency(t.amount, t.currency) }}</span>
              </span>
            </div>
            <ul v-if="commissionsList.length" class="space-y-3">
              <li v-for="c in commissionsList" :key="c.id" class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div class="flex items-center gap-3">
                    <Avatar :name="c.agent.fullName" size="md" />
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ c.agent.fullName }}</p>
                      <p class="text-theme-xs text-gray-500 dark:text-gray-400">
                        {{ c.agent.type === 'INTERNAL' ? 'Interno' : 'Externo' }} · {{ commissionCalcLabel(c) }}
                      </p>
                    </div>
                  </div>
                  <Badge :variant="commissionStatus(c.status).variant">{{ commissionStatus(c.status).label }}</Badge>
                </div>

                <div class="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 text-center dark:bg-white/3">
                  <div>
                    <p class="text-theme-xs text-gray-400 dark:text-gray-500">Bruto</p>
                    <p class="text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ formatCurrency(c.grossAmount ?? c.amount, c.currency) }}</p>
                  </div>
                  <div>
                    <p class="text-theme-xs text-gray-400 dark:text-gray-500">Deducibles</p>
                    <p class="text-sm font-semibold tabular-nums text-gray-500 dark:text-gray-400">− {{ formatCurrency(c.deductiblesTotal ?? 0, c.currency) }}</p>
                  </div>
                  <div>
                    <p class="text-theme-xs text-gray-400 dark:text-gray-500">Neto</p>
                    <p class="text-sm font-bold tabular-nums text-brand-500 dark:text-brand-400">{{ formatCurrency(c.netPayable ?? c.amount, c.currency) }}</p>
                  </div>
                </div>

                <ul v-if="c.deductibles?.length" class="mt-3 space-y-1 text-theme-xs text-gray-500 dark:text-gray-400">
                  <li v-for="d in c.deductibles" :key="d.id" class="flex items-center gap-1.5">
                    <AppIcon icon="lucide:receipt" :size="13" />
                    {{ DEDUCTIBLE_LABELS[d.deductibleType] ?? d.deductibleType }}<template v-if="d.description"> · {{ d.description }}</template>:
                    {{ formatCurrency(d.amount, c.currency) }}
                  </li>
                </ul>

                <ul v-if="c.paymentParts?.length" class="mt-3 divide-y divide-gray-100 text-sm dark:divide-gray-800">
                  <li v-for="p in c.paymentParts" :key="p.id" class="flex items-center justify-between gap-2 py-1.5">
                    <span class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <AppIcon
                        :icon="p.status === 'PAID' ? 'lucide:circle-check' : 'lucide:clock'"
                        :size="15"
                        :class="p.status === 'PAID' ? 'text-success-500' : 'text-gray-400'"
                      />
                      {{ p.label || `Cuota ${p.partNumber}` }}
                      <span v-if="p.dueDate" class="text-theme-xs text-gray-400 dark:text-gray-500">· {{ formatShortDate(p.dueDate) }}</span>
                    </span>
                    <span class="tabular-nums text-gray-800 dark:text-white/90">{{ formatCurrency(p.amount, c.currency) }}</span>
                  </li>
                </ul>

                <div v-if="canWrite && !isLost && c.status !== 'CANCELLED'" class="mt-3 flex flex-wrap gap-2">
                  <BaseButton
                    v-if="c.status !== 'PAID'"
                    variant="primary"
                    size="sm"
                    icon="lucide:circle-check"
                    :loading="pendingCommissionAction === `mark:${c.id}`"
                    @click="markCommission(c.id)"
                  >
                    Marcar pagada
                  </BaseButton>
                  <BaseButton variant="outline" size="sm" icon="lucide:pencil" @click="editingCommission = c">
                    Editar comisión
                  </BaseButton>
                </div>
              </li>
            </ul>
            <p v-else class="text-sm text-gray-400 dark:text-gray-500">Sin comisiones registradas para este proceso.</p>
          </FormSectionCard>

          <FormSectionCard
            title="Cierre de la venta"
            subtitle="Checklist legal, contrato y precio final"
            icon="lucide:circle-check"
            show-icon
            help="El cierre registra el precio final y el contrato. Se habilita cuando el checklist legal de Cumplimiento está completo; desde ahí se lleva la cobranza al comprador y los gastos."
          >
            <!-- Venta cerrada -->
            <template v-if="closing">
              <dl class="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Precio final</dt>
                  <dd class="mt-1 font-bold tabular-nums text-brand-500 dark:text-brand-400">{{ formatCurrency(closing.finalPrice, propertyCurrency) }}</dd>
                </div>
                <div>
                  <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Forma de pago</dt>
                  <dd class="mt-1 font-medium text-gray-800 dark:text-white/90">{{ paymentTypeLabel(closing.paymentType) }}</dd>
                </div>
                <div>
                  <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Fecha</dt>
                  <dd class="mt-1 font-medium text-gray-800 dark:text-white/90">{{ formatShortDate(closing.closedAt) }}</dd>
                </div>
                <div>
                  <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Contrato</dt>
                  <dd class="mt-1">
                    <BaseButton
                      v-if="hasStoredFile({ archivoId: closing.contractArchivoId, filePath: closing.contractFilePath })"
                      variant="ghost"
                      size="sm"
                      icon="lucide:file-text"
                      class="-ml-2"
                      @click="openStoredFile({ archivoId: closing.contractArchivoId, filePath: closing.contractFilePath })"
                    >
                      Ver
                    </BaseButton>
                    <BaseButton v-else-if="canWrite" variant="ghost" size="sm" icon="lucide:upload" class="-ml-2" @click="openUpload('closing', closing.id)">
                      Subir
                    </BaseButton>
                  </dd>
                </div>
              </dl>
              <p v-if="closing.notes" class="mt-3 text-sm text-gray-600 dark:text-gray-400">{{ closing.notes }}</p>
              <BaseButton variant="outline" size="sm" icon="lucide:clipboard-check" class="mt-4" @click="goCompliance">
                Ver cumplimiento legal
              </BaseButton>
            </template>

            <!-- Proceso en curso: requisitos y registro -->
            <template v-else-if="isActive">
              <p v-if="loadingReadiness" class="text-sm text-gray-500 dark:text-gray-400">Validando requisitos...</p>
              <div v-else-if="readinessQueryError" class="flex flex-wrap items-center gap-2 text-sm">
                <span class="text-error-500 dark:text-error-400">{{ getApiErrorMessage(readinessFetchError) }}</span>
                <BaseButton variant="outline" size="sm" @click="() => refetchReadiness()">Reintentar</BaseButton>
              </div>
              <template v-else>
                <p
                  class="flex items-center gap-2 text-sm font-medium"
                  :class="closingReadiness?.ok ? 'text-success-600 dark:text-success-500' : 'text-warning-600 dark:text-orange-400'"
                >
                  <AppIcon :icon="closingReadiness?.ok ? 'lucide:circle-check' : 'lucide:triangle-alert'" :size="16" />
                  {{ closingReadiness?.ok ? 'Listo para el cierre' : 'Faltan requisitos para habilitar el cierre' }}
                </p>
                <ul v-if="!closingReadiness?.ok && closingReadiness?.missing?.length" class="mt-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li v-for="m in closingReadiness.missing" :key="m" class="flex items-start gap-2">
                    <AppIcon icon="lucide:circle-dashed" :size="14" class="mt-0.5 shrink-0 text-gray-400" />
                    {{ m }}
                  </li>
                </ul>
              </template>
              <div class="mt-4 flex flex-wrap gap-2">
                <BaseButton variant="outline" size="sm" icon="lucide:clipboard-check" @click="goCompliance">
                  {{ closingReadiness?.ok ? 'Ver cumplimiento legal' : 'Completar cumplimiento' }}
                </BaseButton>
                <BaseButton
                  v-if="canWrite"
                  variant="primary"
                  size="sm"
                  icon="lucide:circle-check"
                  :disabled="!closingReadiness?.ok"
                  @click="closingModalOpen = true"
                >
                  Registrar cierre
                </BaseButton>
              </div>
            </template>
            <p v-else class="text-sm text-gray-400 dark:text-gray-500">El proceso no llegó al cierre.</p>
          </FormSectionCard>

          <FormSectionCard
            v-if="closing"
            title="Cobranza y gastos"
            subtitle="Pagos del comprador, gastos de documentación y rentabilidad de la venta"
            :help-items="[
              { term: 'Cobranza', text: 'Pagos que hace el comprador hasta completar el precio final.' },
              { term: 'Gastos', text: 'Notaría, registros y otros gastos de documentación, en la moneda en que se pagaron.' },
              { term: 'Rentabilidad', text: 'Precio final − comisiones − gastos en la misma moneda; los de otra moneda se muestran aparte.' },
            ]"
            icon="lucide:wallet"
            show-icon
          >
            <ClosingFinancePanel :closing-id="closing.id" :currency="propertyCurrency" :can-write="canWrite" />
          </FormSectionCard>

          <SaleProcessFollowUpPanel :process-id="id" layout="tabs" tabs-variant="underline" />
        </div>

        <!-- ── Lateral: gestión del proceso ── -->
        <aside class="space-y-6 xl:sticky xl:top-24">
          <FormSectionCard
            title="Gestión del proceso"
            :subtitle="isActive ? 'Se avanza una etapa a la vez; para regresar se indica el motivo' : 'El proceso ya no admite cambios'"
            icon="lucide:sliders-horizontal"
            show-icon
          >
            <div class="space-y-4">
              <FormInput v-model="titleEdit" label="Título" placeholder="Ej. Familia Pérez — Torre Vista Mar" :disabled="!isActive" />
              <FormSelect v-model="stageEdit" label="Etapa" :options="stageOptionsForEdit" :disabled="!isActive" />
              <p v-if="nextStageDocument" class="flex items-start gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                <AppIcon icon="lucide:file-check" :size="14" class="mt-0.5 shrink-0" />
                Requiere el {{ nextStageDocument.label }} cargado en Cumplimiento legal.
              </p>
              <FormTextarea
                v-if="stageMove === 'backward'"
                v-model="stageReason"
                label="Motivo para regresar de etapa"
                placeholder="Ej. La notaría observó la minuta y hay que corregirla"
                :rows="3"
                :error="stageReasonError"
                required
              />
              <FormSelect
                v-model="financingEdit"
                label="Banco o medio de pago"
                :options="financingOptions"
                :loading="loadingFinancing"
                :disabled="!isActive"
              />
              <BaseButton
                v-if="isActive && canWrite"
                variant="primary"
                icon="lucide:save"
                block
                :disabled="!hasChanges"
                :loading="saving && !markingLost"
                @click="saveProcessFields"
              >
                Guardar cambios
              </BaseButton>
              <p v-if="isWon" class="flex items-center gap-2 text-theme-xs text-success-600 dark:text-success-500">
                <AppIcon icon="lucide:trophy" :size="14" />Venta cerrada: el detalle está en «Cierre de la venta».
              </p>
            </div>
          </FormSectionCard>

          <FormSectionCard v-if="isActive && canWrite" title="Siguientes pasos" icon="lucide:route" show-icon>
            <div class="space-y-2">
              <BaseButton v-if="canRegisterSeparation" variant="outline" icon="lucide:bookmark" block @click="separationModalOpen = true">
                Registrar separación
              </BaseButton>
              <BaseButton variant="outline" icon="lucide:clipboard-check" block @click="goCompliance">
                Cumplimiento legal
              </BaseButton>
              <BaseButton variant="primary" icon="lucide:circle-check" block :disabled="!closingReadiness?.ok" @click="closingModalOpen = true">
                Registrar cierre
              </BaseButton>
            </div>
          </FormSectionCard>
        </aside>
      </div>

      <MarkSaleLostModal v-model="markLostOpen" :process-code="detail.code" :loading="markingLost" @confirm="confirmMarkLost" />
      <SeparationFormModal v-model:open="separationModalOpen" :preset-process-id="detail.id" @created="() => refetchDetail()" />
      <ClosingFormModal v-model:open="closingModalOpen" :process="detail" @created="() => refetchDetail()" />
      <EditCommissionModal
        :model-value="!!editingCommission"
        :commission="editingCommission"
        :base-price="commissionBasePrice"
        @update:model-value="(v: boolean) => !v && (editingCommission = null)"
        @saved="() => refetchDetail()"
      />

      <!-- Vencer / reactivar separación -->
      <BaseModal
        :model-value="!!separationStatusTarget"
        :title="separationStatusTarget?.status === 'EXPIRED' ? 'Marcar separación como vencida' : 'Reactivar separación'"
        size="sm"
        @update:model-value="(v: boolean) => !v && (separationStatusTarget = null)"
      >
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{
            separationStatusTarget?.status === 'EXPIRED'
              ? 'El inmueble volverá a estar disponible para otros procesos.'
              : 'El inmueble volverá a quedar separado para este proceso, si sigue disponible.'
          }}
        </p>
        <template #footer>
          <div class="flex justify-end gap-3">
            <BaseButton variant="outline" @click="separationStatusTarget = null">Cancelar</BaseButton>
            <BaseButton
              :variant="separationStatusTarget?.status === 'EXPIRED' ? 'danger' : 'primary'"
              :loading="patchingSeparation"
              @click="confirmSeparationStatus"
            >
              {{ separationStatusTarget?.status === 'EXPIRED' ? 'Marcar vencida' : 'Reactivar' }}
            </BaseButton>
          </div>
        </template>
      </BaseModal>

      <!-- Subir comprobante / contrato -->
      <BaseModal
        :model-value="!!uploadTarget"
        :title="uploadTarget?.kind === 'closing' ? 'Subir contrato de compraventa' : 'Subir comprobante de separación'"
        size="md"
        @update:model-value="(v: boolean) => !v && (uploadTarget = null)"
      >
        <FileDropzone
          v-model="uploadFile"
          label="Archivo"
          :multiple="false"
          :error="uploadError"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          @error="(m: string) => (uploadError = m)"
        />
        <template #footer>
          <div class="flex justify-end gap-3">
            <BaseButton variant="outline" @click="uploadTarget = null">Cancelar</BaseButton>
            <BaseButton variant="primary" icon="lucide:upload" :loading="uploadingFile" @click="submitUpload">Subir</BaseButton>
          </div>
        </template>
      </BaseModal>
    </div>
  </div>
</template>
