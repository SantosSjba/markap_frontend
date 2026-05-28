<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, AppIcon, FormSelect, FormSectionCard } from '@shared/components'
import {
  useVentasClosingReadiness,
  useVentasFinancingChannels,
  useVentasProcessDetail,
  useVentasUpdateProcess,
} from '../../application/useVentasSales'
import {
  useVentasMarkCommissionPaid,
  useVentasRecalculateCommission,
} from '@ventas/finanzas'
import type {
  SaleFinancingChannel,
  SaleProcessCommission,
  SaleProcessDetail,
} from '../../domain/sales.types'
import { useVentasPipelineStages } from '@ventas/configuracion'
import {
  processStatusLabel,
  allowedForwardStageOptions,
} from '../../domain/pipeline.constants'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import SaleProcessFollowUpPanel from '../components/SaleProcessFollowUpPanel.vue'
import MarkSaleLostModal from '../components/MarkSaleLostModal.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { stageOptions, orderedCodes, labelFor: pipelineStageLabel, query: pipelineConfigQuery } =
  useVentasPipelineStages()

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
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)]"
        @click="router.push('/ventas/procesos')"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          {{ detail?.code ?? 'Proceso' }}
        </h1>
        <p v-if="detail?.title" class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          {{ detail.title }}
        </p>
      </div>
    </div>

    <div
      v-if="pipelineConfigQuery.isError.value"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-warning-light)' }"
    >
      <span :style="{ color: 'var(--color-text-primary)' }">
        No se cargó la configuración de etapas; se muestran valores por defecto.
      </span>
      <BaseButton variant="outline" size="sm" icon="lucide:settings" class="ml-auto shrink-0" @click="() => pipelineConfigQuery.refetch()">
        Reintentar configuración
      </BaseButton>
    </div>

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div
      v-else-if="detailQueryError"
      class="flex flex-col items-center justify-center gap-3 py-16 rounded-xl border px-4 text-center"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <p class="text-sm font-medium max-w-md" style="color: var(--color-error)">
        {{ getApiErrorMessage(detailFetchError) }}
      </p>
      <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchDetail()">Reintentar</BaseButton>
    </div>

    <template v-else-if="detail">
      <div
        v-if="isProcessLost"
        class="rounded-xl border px-4 py-3 text-sm space-y-1"
        :style="{ borderColor: 'var(--color-error)', backgroundColor: 'var(--color-warning-light)' }"
      >
        <p class="font-semibold flex items-center gap-2" style="color: var(--color-error)">
          <AppIcon icon="lucide:ban" :size="18" />
          Venta registrada como caída
        </p>
        <p v-if="detail.lostReason" :style="{ color: 'var(--color-text-secondary)' }">
          Motivo: {{ detail.lostReason }}
        </p>
        <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
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
        <p class="text-xs mt-3" :style="{ color: 'var(--color-text-muted)' }">
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
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Código</dt>
              <dd class="font-mono font-medium" :style="{ color: 'var(--color-text-primary)' }">
                {{ detail.property?.code }}
              </dd>
            </div>
            <div>
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Estado comercial</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">
                {{ listingLabel(detail.property?.listingStatus) }}
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Dirección</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ detail.property?.addressLine }}</dd>
            </div>
            <div v-if="detail.property?.locationLabel" class="sm:col-span-2">
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Ubicación</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ detail.property.locationLabel }}</dd>
            </div>
            <div v-if="detail.property?.projectName">
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Proyecto</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ detail.property.projectName }}</dd>
            </div>
            <div v-if="detail.property?.propertyTypeName">
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Tipo</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ detail.property.propertyTypeName }}</dd>
            </div>
            <div>
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Precio de venta</dt>
              <dd class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
                {{ formatSalePrice(detail.property?.salePrice, detail.property?.saleCurrency) }}
              </dd>
            </div>
            <div v-if="primaryOwner" class="sm:col-span-2">
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Propietario</dt>
              <dd class="mt-0.5">
                <p class="font-medium flex items-center gap-1.5" :style="{ color: 'var(--color-text-primary)' }">
                  <AppIcon icon="lucide:user-round" :size="14" color="var(--color-primary)" />
                  {{ primaryOwner.fullName }}
                </p>
                <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
                  {{ primaryOwner.documentTypeName ? `${primaryOwner.documentTypeName}: ` : '' }}{{
                    primaryOwner.documentNumber || '—'
                  }}
                </p>
                <p v-if="primaryOwner.primaryPhone" class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                  Tel: {{ primaryOwner.primaryPhone }}
                </p>
              </dd>
            </div>
            <div v-if="detail.property?.area != null">
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Área</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ detail.property.area }} m²</dd>
            </div>
            <div v-if="detail.property?.bedrooms != null">
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Dormitorios</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ detail.property.bedrooms }}</dd>
            </div>
            <div v-if="detail.property?.bathrooms != null">
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Baños</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ detail.property.bathrooms }}</dd>
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
            <p class="text-xs font-medium mb-2 uppercase tracking-wide" :style="{ color: 'var(--color-text-muted)' }">
              Compradores
            </p>
            <ul v-if="buyersList.length" class="space-y-2">
              <li
                v-for="b in buyersList"
                :key="b.id"
                class="rounded-lg border px-3 py-2 text-sm"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
                  {{ b.fullName }}
                  <span
                    v-if="b.isPrimary"
                    class="text-xs font-normal ml-1"
                    :style="{ color: 'var(--color-text-muted)' }"
                  >(principal)</span>
                </p>
                <p :style="{ color: 'var(--color-text-secondary)' }">
                  {{ b.documentTypeName ? `${b.documentTypeName}: ` : '' }}{{ b.documentNumber || '—' }}
                </p>
                <p v-if="b.primaryPhone" :style="{ color: 'var(--color-text-secondary)' }">
                  Tel: {{ b.primaryPhone }}
                </p>
                <p v-if="b.primaryEmail" :style="{ color: 'var(--color-text-secondary)' }">{{ b.primaryEmail }}</p>
              </li>
            </ul>
            <p v-else class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Sin compradores registrados.</p>
          </div>

          <div class="mt-4 pt-4 border-t" :style="{ borderColor: 'var(--color-border)' }">
            <p class="text-xs font-medium mb-2 uppercase tracking-wide" :style="{ color: 'var(--color-text-muted)' }">
              Propietarios
            </p>
            <ul v-if="ownersList.length" class="space-y-2">
              <li
                v-for="o in ownersList"
                :key="o.id"
                class="rounded-lg border px-3 py-2 text-sm"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ o.fullName }}</p>
                <p :style="{ color: 'var(--color-text-secondary)' }">
                  {{ o.documentTypeName ? `${o.documentTypeName}: ` : '' }}{{ o.documentNumber || '—' }}
                </p>
                <p v-if="o.primaryPhone" :style="{ color: 'var(--color-text-secondary)' }">Tel: {{ o.primaryPhone }}</p>
              </li>
            </ul>
            <p v-else class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
              Sin propietario registrado en la ficha del inmueble (Venta → Propiedades).
            </p>
          </div>

          <p v-if="detail.agent" class="text-sm pt-4 mt-4 border-t" :style="{ borderColor: 'var(--color-border)' }">
            <strong :style="{ color: 'var(--color-text-primary)' }">Asesor principal:</strong>
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
            class="rounded-lg border px-3 py-3 space-y-2 text-sm"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <div class="flex flex-wrap justify-between gap-2">
              <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
                {{ c.agent.fullName }}
                <span class="text-xs font-normal ml-1" :style="{ color: 'var(--color-text-muted)' }">
                  ({{ agentTypeLabel(c.agent.type) }})
                </span>
              </p>
              <span :style="{ color: 'var(--color-text-secondary)' }">
                {{ commissionStatusLabel(c.status) }}
              </span>
            </div>
            <p :style="{ color: 'var(--color-text-secondary)' }">
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
              class="text-xs space-y-0.5"
              :style="{ color: 'var(--color-text-muted)' }"
            >
              <li v-for="d in c.deductibles" :key="d.id">
                Deducible {{ DEDUCTIBLE_LABELS[d.deductibleType] ?? d.deductibleType }}:
                S/ {{ d.amount.toLocaleString('es-PE') }}
              </li>
            </ul>
            <ul
              v-if="c.paymentParts?.length"
              class="text-xs space-y-1 mt-1"
              :style="{ color: 'var(--color-text-secondary)' }"
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
              class="text-xs"
              :style="{ color: 'var(--color-text-muted)' }"
            >
              Comisión sin efecto (venta caída).
            </p>
          </li>
        </ul>
        <p v-else class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
          Sin comisiones. Defínalas al crear el proceso (asesores internos o externos, % o monto fijo).
        </p>
      </FormSectionCard>

      <FormSectionCard
        dense
        title="Cumplimiento para cierre"
        subtitle="Checklist legal, tributario y compliance"
        icon="lucide:clipboard-check"
      >
        <p v-if="loadingReadiness" class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          Validando checklist legal/tributario/compliance...
        </p>
        <div v-else-if="readinessQueryError" class="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span style="color: var(--color-error)">{{ getApiErrorMessage(readinessFetchError) }}</span>
          <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchReadiness()">Reintentar</BaseButton>
        </div>
        <template v-else>
          <p
            class="text-sm mt-1"
            :style="{ color: closingReadiness?.ok ? 'var(--color-success)' : 'var(--color-warning)' }"
          >
            {{
              closingReadiness?.ok
                ? 'Operación lista para cierre.'
                : 'Faltan validaciones para habilitar el cierre.'
            }}
          </p>
          <ul
            v-if="!closingReadiness?.ok && closingReadiness?.missing?.length"
            class="mt-2 list-disc pl-5 text-sm"
            :style="{ color: 'var(--color-text-secondary)' }"
          >
            <li v-for="m in closingReadiness.missing" :key="m">{{ m }}</li>
          </ul>
        </template>
      </FormSectionCard>

      <SaleProcessFollowUpPanel :process-id="id" layout="grid" />
    </template>
  </div>
</template>
