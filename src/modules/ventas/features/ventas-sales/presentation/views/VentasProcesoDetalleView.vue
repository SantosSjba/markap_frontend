<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import {
  useVentasClosingReadiness,
  useVentasFinancingChannels,
  useVentasProcessDetail,
  useVentasUpdateProcess,
} from '../composables/useVentasSales'
import {
  useVentasMarkCommissionPaid,
  useVentasRecalculateCommission,
} from '../../../ventas-finanzas/presentation/composables/useVentasFinanzas'
import type {
  SaleFinancingChannel,
  SaleProcessCommission,
  SaleProcessDetail,
} from '../../domain/sales.types'
import { useVentasPipelineStages } from '../../../ventas-configuracion/presentation/composables/useVentasConfig'
import { processStatusLabel, allowedForwardStageOptions } from '../../domain/pipeline.constants'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import SaleProcessFollowUpPanel from '../components/SaleProcessFollowUpPanel.vue'
import MarkSaleLostModal from '../components/MarkSaleLostModal.vue'
const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const {
  stageOptions,
  orderedCodes,
  labelFor: pipelineStageLabel,
  query: pipelineConfigQuery,
} = useVentasPipelineStages()

const {
  data: proc,
  isLoading,
  isError: detailQueryError,
  error: detailFetchError,
  refetch: refetchDetail,
} = useVentasProcessDetail(id)
const { data: financingChannels, isLoading: loadingFinancing } = useVentasFinancingChannels()

const complianceParams = computed(() => ({
  propertyId: (proc.value as SaleProcessDetail | undefined)?.property?.id ?? '',
  buyerClientId: (proc.value as SaleProcessDetail | undefined)?.buyer?.id ?? '',
}))
const {
  data: closingReadiness,
  isLoading: loadingReadiness,
  isError: readinessQueryError,
  error: readinessFetchError,
  refetch: refetchReadiness,
} = useVentasClosingReadiness(complianceParams)

const { mutate: updateProc, isPending: saving } = useVentasUpdateProcess()
const markingLost = ref(false)
const { mutate: markCommissionPaid } = useVentasMarkCommissionPaid()
const { mutate: recalcCommission } = useVentasRecalculateCommission()
const pendingCommissionAction = ref<string | null>(null)

function isCommissionDetailActionPending(key: string): boolean {
  return pendingCommissionAction.value === key
}

function onRecalcCommissionInDetail(commissionId: string) {
  const key = `recalc:${commissionId}`
  pendingCommissionAction.value = key
  recalcCommission(commissionId, {
    onSuccess: () => refetchDetail(),
    onSettled: () => {
      pendingCommissionAction.value = null
    },
  })
}

function onMarkCommissionPaidInDetail(commissionId: string) {
  const key = `mark:${commissionId}`
  pendingCommissionAction.value = key
  markCommissionPaid(commissionId, {
    onSuccess: () => refetchDetail(),
    onSettled: () => {
      pendingCommissionAction.value = null
    },
  })
}

const stageEdit = ref('')
const financingEdit = ref('')
const markLostOpen = ref(false)

const detail = computed(() => proc.value as SaleProcessDetail | undefined)
const isProcessLost = computed(() => detail.value?.status === 'LOST')
const isProcessActive = computed(() => detail.value?.status === 'ACTIVE')

const stageOptionsForEdit = computed(() => {
  const d = detail.value
  if (!d || d.status !== 'ACTIVE') return stageOptions.value
  return allowedForwardStageOptions(d.pipelineStage, stageOptions.value, orderedCodes.value)
})

const FINANCING_CATEGORY_LABEL: Record<string, string> = {
  BANK: 'Bancos',
  PAYMENT_METHOD: 'Medios de pago',
  OWN_FUNDS: 'Fondos propios',
  OTHER: 'Otros',
}

const LISTING_STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Separada',
  SOLD: 'Vendida',
}

const SALE_CURRENCY_SYMBOL: Record<string, string> = {
  PEN: 'S/',
  USD: 'US$',
  EUR: '€',
}

watch(
  proc,
  (p) => {
    const row = p as SaleProcessDetail | undefined
    if (row) {
      stageEdit.value = row.pipelineStage ?? ''
      financingEdit.value = row.financingChannel?.id ?? ''
    }
  },
  { immediate: true },
)

const financingOptions = computed(() => {
  const rows = financingChannels.value ?? []
  const order = ['BANK', 'PAYMENT_METHOD', 'OWN_FUNDS', 'OTHER']
  const grouped = order.flatMap((cat) => {
    const items = rows.filter((r: SaleFinancingChannel) => r.category === cat)
    return items.map((r) => ({
      value: r.id,
      label: `${FINANCING_CATEGORY_LABEL[cat] ?? cat}: ${r.name}`,
    }))
  })
  return [{ value: '', label: 'Sin especificar' }, ...grouped]
})

const buyersList = computed(() => {
  const d = detail.value
  if (!d) return []
  if (d.buyers?.length) return d.buyers
  if (d.buyer) return [{ ...d.buyer, documentNumber: '', isPrimary: true }]
  return []
})

const ownersList = computed(() => {
  const d = detail.value
  if (!d) return []
  if (d.owners?.length) return d.owners
  if (d.property?.primaryOwner) return [d.property.primaryOwner]
  return []
})

const primaryOwner = computed(() => ownersList.value[0] ?? null)

const commissionsList = computed((): SaleProcessCommission[] => {
  const d = detail.value
  if (!d) return []
  if (d.commissions?.length) return d.commissions
  if (d.commission) return [d.commission]
  return []
})

function formatSalePrice(price: number | null | undefined, currency?: string | null): string {
  if (price == null) return '—'
  const sym = (currency && SALE_CURRENCY_SYMBOL[currency]) || currency || 'S/'
  return `${sym} ${price.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function listingLabel(status: string | null | undefined): string {
  if (!status) return '—'
  return LISTING_STATUS_LABEL[status] ?? status
}

function saveProcessFields() {
  if (isProcessLost.value) return
  updateProc({
    id: id.value,
    body: {
      pipelineStage: isProcessActive.value ? stageEdit.value || undefined : undefined,
      financingChannelId: financingEdit.value || null,
    },
  })
}

function confirmMarkLost(reason: string) {
  markingLost.value = true
  updateProc(
    {
      id: id.value,
      body: { status: 'LOST', lostReason: reason },
    },
    {
      onSuccess: () => {
        markLostOpen.value = false
        refetchDetail()
      },
      onSettled: () => {
        markingLost.value = false
      },
    },
  )
}

function canManageCommission(c: SaleProcessCommission): boolean {
  if (isProcessLost.value) return false
  if (c.status === 'CANCELLED') return false
  return true
}

function commissionStatusLabel(status: string): string {
  if (status === 'PAID') return 'Pagada'
  if (status === 'PARTIAL') return 'Parcial'
  if (status === 'CANCELLED') return 'Anulada'
  return 'Pendiente'
}

const DEDUCTIBLE_LABELS: Record<string, string> = {
  TRAVEL: 'Pasajes',
  TAX: 'Impuestos',
  NOTARY: 'Notaría',
  REGISTRY: 'Registros',
  OTHER: 'Otros',
}

function agentTypeLabel(type?: string): string {
  if (type === 'INTERNAL') return 'Interno'
  if (type === 'EXTERNAL') return 'Externo'
  return '—'
}

function commissionCalcLabel(c: SaleProcessCommission): string {
  if (c.calculationType === 'FIXED') return 'Monto fijo'
  if (c.percentApplied != null) return `${c.percentApplied}%`
  return 'Porcentaje'
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      :title="detail?.code ?? 'Proceso'"
      :subtitle="detail?.title ? detail.title : undefined"
      back
      @back="router.push('/ventas/procesos')"
    />

    <div
      v-if="pipelineConfigQuery.isError.value"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3 border-gray-200 dark:border-gray-800 bg-warning-50 dark:bg-warning-500/15"
    >
      <span class="text-gray-800 dark:text-white/90">
        No se cargó la configuración de etapas; se muestran valores por defecto.
      </span>
      <BaseButton variant="outline" size="sm" icon="lucide:settings" class="ml-auto shrink-0" @click="() => pipelineConfigQuery.refetch()">
        Reintentar configuración
      </BaseButton>
    </div>

    <LoadingState v-if="isLoading" />

    <BaseCard v-else-if="detailQueryError" class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
      <p class="text-sm font-medium max-w-md text-error-500 dark:text-error-400">
        {{ getApiErrorMessage(detailFetchError) }}
      </p>
      <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchDetail()">Reintentar</BaseButton>
    </BaseCard>

    <template v-else-if="detail">
      <div
        v-if="isProcessLost"
        class="rounded-xl border px-4 py-3 text-sm space-y-1 border-error-500 bg-warning-50 dark:bg-warning-500/15"
      >
        <p class="font-semibold flex items-center gap-2 text-error-500 dark:text-error-400">
          <AppIcon icon="lucide:ban" :size="18" />
          Venta registrada como caída
        </p>
        <p class="text-gray-500 dark:text-gray-400" v-if="detail.lostReason">
          Motivo: {{ detail.lostReason }}
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500">
          Las comisiones pendientes fueron anuladas. No se puede modificar la etapa ni retroceder en el pipeline.
        </p>
      </div>

      <FormSectionCard
        dense
        title="Etapa y financiamiento"
        subtitle="Solo avance de etapa en procesos activos; use venta caída si no continúa"
        icon="lucide:git-branch"
      >
        <div class="flex flex-wrap gap-4 items-end">
          <div class="min-w-[200px]">
            <FormSelect
              v-model="stageEdit"
              label="Etapa"
              :options="stageOptionsForEdit"
              :disabled="!isProcessActive"
            />
          </div>
          <div class="min-w-[280px] flex-1">
            <FormSelect
              v-model="financingEdit"
              label="Banco / medio de pago del proceso"
              :options="financingOptions"
              :loading="loadingFinancing"
              :disabled="isProcessLost"
            />
          </div>
          <BaseButton
            v-if="isProcessActive"
            variant="danger"
            icon="lucide:ban"
            @click="markLostOpen = true"
          >
            Venta caída
          </BaseButton>
          <BaseButton
            v-if="!isProcessLost"
            variant="primary"
            icon="lucide:save"
            :loading="saving"
            @click="saveProcessFields"
          >
            Guardar cambios
          </BaseButton>
        </div>
        <p class="text-xs mt-3 text-gray-400 dark:text-gray-500">
          Etapa actual: {{ pipelineStageLabel(detail.pipelineStage) }} · Estado:
          {{ processStatusLabel(detail.status) }}.
          <template v-if="isProcessActive"> Solo puede avanzar de etapa, no retroceder.</template>
        </p>
      </FormSectionCard>

      <MarkSaleLostModal
        v-model="markLostOpen"
        :process-code="detail.code"
        :loading="markingLost"
        @confirm="confirmMarkLost"
      />

      <div class="grid lg:grid-cols-2 gap-4">
        <FormSectionCard
          dense
          title="Inmueble"
          subtitle="Datos del inmueble en el proceso"
          icon="lucide:building-2"
        >
          <dl class="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt class="text-xs text-gray-400 dark:text-gray-500">Código</dt>
              <dd class="font-mono font-medium text-gray-800 dark:text-white/90">
                {{ detail.property?.code }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400 dark:text-gray-500">Estado comercial</dt>
              <dd class="text-gray-800 dark:text-white/90">
                {{ listingLabel(detail.property?.listingStatus) }}
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs text-gray-400 dark:text-gray-500">Dirección</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ detail.property?.addressLine }}</dd>
            </div>
            <div v-if="detail.property?.locationLabel" class="sm:col-span-2">
              <dt class="text-xs text-gray-400 dark:text-gray-500">Ubicación</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ detail.property.locationLabel }}</dd>
            </div>
            <div v-if="detail.property?.projectName">
              <dt class="text-xs text-gray-400 dark:text-gray-500">Proyecto</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ detail.property.projectName }}</dd>
            </div>
            <div v-if="detail.property?.propertyTypeName">
              <dt class="text-xs text-gray-400 dark:text-gray-500">Tipo</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ detail.property.propertyTypeName }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400 dark:text-gray-500">Precio de venta</dt>
              <dd class="font-medium text-gray-800 dark:text-white/90">
                {{ formatSalePrice(detail.property?.salePrice, detail.property?.saleCurrency) }}
              </dd>
            </div>
            <div v-if="primaryOwner" class="sm:col-span-2">
              <dt class="text-xs text-gray-400 dark:text-gray-500">Propietario</dt>
              <dd class="mt-0.5">
                <p class="font-medium flex items-center gap-1.5 text-gray-800 dark:text-white/90">
                  <AppIcon icon="lucide:user-round" :size="14" color="var(--color-primary)" />
                  {{ primaryOwner.fullName }}
                </p>
                <p class="text-xs mt-0.5 text-gray-500 dark:text-gray-400">
                  {{ primaryOwner.documentTypeName ? `${primaryOwner.documentTypeName}: ` : '' }}{{
                    primaryOwner.documentNumber || '—'
                  }}
                </p>
                <p v-if="primaryOwner.primaryPhone" class="text-xs text-gray-500 dark:text-gray-400">
                  Tel: {{ primaryOwner.primaryPhone }}
                </p>
              </dd>
            </div>
            <div v-if="detail.property?.area != null">
              <dt class="text-xs text-gray-400 dark:text-gray-500">Área</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ detail.property.area }} m²</dd>
            </div>
            <div v-if="detail.property?.bedrooms != null">
              <dt class="text-xs text-gray-400 dark:text-gray-500">Dormitorios</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ detail.property.bedrooms }}</dd>
            </div>
            <div v-if="detail.property?.bathrooms != null">
              <dt class="text-xs text-gray-400 dark:text-gray-500">Baños</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ detail.property.bathrooms }}</dd>
            </div>
          </dl>
        </FormSectionCard>

        <FormSectionCard
          dense
          title="Participantes"
          subtitle="Compradores, propietarios y asesor"
          icon="lucide:users"
        >
          <div>
            <p class="text-xs font-medium mb-2 uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Compradores
            </p>
            <ul v-if="buyersList.length" class="space-y-2">
              <li
                v-for="b in buyersList"
                :key="b.id"
                class="rounded-lg border px-3 py-2 text-sm border-gray-200 dark:border-gray-800"
              >
                <p class="font-medium text-gray-800 dark:text-white/90">
                  {{ b.fullName }}
                  <span
                    v-if="b.isPrimary"
                    class="text-xs font-normal ml-1 text-gray-400 dark:text-gray-500"
                  >(principal)</span>
                </p>
                <p class="text-gray-500 dark:text-gray-400">
                  {{ b.documentTypeName ? `${b.documentTypeName}: ` : '' }}{{ b.documentNumber || '—' }}
                </p>
                <p class="text-gray-500 dark:text-gray-400" v-if="b.primaryPhone">
                  Tel: {{ b.primaryPhone }}
                </p>
                <p class="text-gray-500 dark:text-gray-400" v-if="b.primaryEmail">{{ b.primaryEmail }}</p>
              </li>
            </ul>
            <p v-else class="text-sm text-gray-400 dark:text-gray-500">Sin compradores registrados.</p>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <p class="text-xs font-medium mb-2 uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Propietarios
            </p>
            <ul v-if="ownersList.length" class="space-y-2">
              <li
                v-for="o in ownersList"
                :key="o.id"
                class="rounded-lg border px-3 py-2 text-sm border-gray-200 dark:border-gray-800"
              >
                <p class="font-medium text-gray-800 dark:text-white/90">{{ o.fullName }}</p>
                <p class="text-gray-500 dark:text-gray-400">
                  {{ o.documentTypeName ? `${o.documentTypeName}: ` : '' }}{{ o.documentNumber || '—' }}
                </p>
                <p class="text-gray-500 dark:text-gray-400" v-if="o.primaryPhone">Tel: {{ o.primaryPhone }}</p>
              </li>
            </ul>
            <p v-else class="text-sm text-gray-400 dark:text-gray-500">
              Sin propietario registrado en la ficha del inmueble (Venta → Propiedades).
            </p>
          </div>

          <p v-if="detail.agent" class="text-sm pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
            <strong class="text-gray-800 dark:text-white/90">Asesor principal:</strong>
            {{ detail.agent.fullName }}
          </p>
        </FormSectionCard>
      </div>

      <FormSectionCard
        dense
        title="Comisiones"
        subtitle="Configuradas al crear el proceso"
        icon="lucide:percent"
      >
        <template v-if="commissionsList.length" #actions>
          <BaseButton variant="outline" size="sm" icon="lucide:percent" @click="router.push('/ventas/comisiones')">
            Ver listado
          </BaseButton>
        </template>
        <ul v-if="commissionsList.length" class="space-y-3">
          <li
            v-for="c in commissionsList"
            :key="c.id"
            class="rounded-lg border px-3 py-3 space-y-2 text-sm border-gray-200 dark:border-gray-800"
          >
            <div class="flex flex-wrap justify-between gap-2">
              <p class="font-medium text-gray-800 dark:text-white/90">
                {{ c.agent.fullName }}
                <span class="text-xs font-normal ml-1 text-gray-400 dark:text-gray-500">
                  ({{ agentTypeLabel(c.agent.type) }})
                </span>
              </p>
              <span class="text-gray-500 dark:text-gray-400">
                {{ commissionStatusLabel(c.status) }}
              </span>
            </div>
            <p class="text-gray-500 dark:text-gray-400">
              {{ commissionCalcLabel(c) }} · bruto
              <strong>S/ {{ (c.grossAmount ?? c.amount).toLocaleString('es-PE') }}</strong>
              <template v-if="c.deductibles?.length">
                · neto
                <strong>S/ {{ (c.netPayable ?? c.amount).toLocaleString('es-PE') }}</strong>
              </template>
              <span v-if="c.saleClosingId" class="text-xs ml-1">(cierre)</span>
            </p>
            <ul
              v-if="c.deductibles?.length"
              class="text-xs space-y-0.5 text-gray-400 dark:text-gray-500"
            >
              <li v-for="d in c.deductibles" :key="d.id">
                Deducible {{ DEDUCTIBLE_LABELS[d.deductibleType] ?? d.deductibleType }}:
                S/ {{ d.amount.toLocaleString('es-PE') }}
              </li>
            </ul>
            <ul
              v-if="c.paymentParts?.length"
              class="text-xs space-y-1 mt-1 text-gray-500 dark:text-gray-400"
            >
              <li v-for="p in c.paymentParts" :key="p.id">
                {{ p.label || `Parte ${p.partNumber}` }}: S/ {{ p.amount.toLocaleString('es-PE') }}
                — {{ p.status === 'PAID' ? 'pagada' : 'pendiente' }}
              </li>
            </ul>
            <div v-if="c.status !== 'PAID' && canManageCommission(c)" class="flex flex-wrap gap-2">
              <BaseButton
                v-if="c.calculationType !== 'FIXED'"
                variant="outline"
                size="sm"
                icon="lucide:calculator"
                :loading="isCommissionDetailActionPending(`recalc:${c.id}`)"
                @click="onRecalcCommissionInDetail(c.id)"
              >
                Recalcular
              </BaseButton>
              <BaseButton
                variant="primary"
                size="sm"
                icon="lucide:circle-check"
                :loading="isCommissionDetailActionPending(`mark:${c.id}`)"
                @click="onMarkCommissionPaidInDetail(c.id)"
              >
                Marcar pagada
              </BaseButton>
            </div>
            <p
              v-else-if="c.status === 'CANCELLED' || isProcessLost"
              class="text-xs text-gray-400 dark:text-gray-500"
            >
              Comisión sin efecto (venta caída).
            </p>
          </li>
        </ul>
        <p v-else class="text-sm text-gray-400 dark:text-gray-500">
          Sin comisiones. Defínalas al crear el proceso (asesores internos o externos, % o monto fijo).
        </p>
      </FormSectionCard>

      <FormSectionCard
        dense
        title="Cumplimiento para cierre"
        subtitle="Checklist legal, tributario y compliance"
        icon="lucide:clipboard-check"
      >
        <p v-if="loadingReadiness" class="text-sm text-gray-500 dark:text-gray-400">
          Validando checklist legal/tributario/compliance...
        </p>
        <div v-else-if="readinessQueryError" class="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span class="text-error-500 dark:text-error-400">{{ getApiErrorMessage(readinessFetchError) }}</span>
          <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchReadiness()">Reintentar</BaseButton>
        </div>
        <template v-else>
          <p :class="(closingReadiness?.ok) ? 'text-success-600 dark:text-success-500' : 'text-warning-600 dark:text-orange-400'"
            class="text-sm mt-1"
          >
            {{
              closingReadiness?.ok
                ? 'Operación lista para cierre.'
                : 'Faltan validaciones para habilitar el cierre.'
            }}
          </p>
          <ul
            v-if="!closingReadiness?.ok && closingReadiness?.missing?.length"
            class="mt-2 list-disc pl-5 text-sm text-gray-500 dark:text-gray-400"
          >
            <li v-for="m in closingReadiness.missing" :key="m">{{ m }}</li>
          </ul>
        </template>
      </FormSectionCard>

      <SaleProcessFollowUpPanel :process-id="id" layout="grid" />
    </template>
  </div>
</template>
