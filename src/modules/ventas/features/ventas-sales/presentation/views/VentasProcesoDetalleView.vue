<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, AppIcon, FormSelect } from '@shared/components'
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
import { PROCESS_STATUS_OPTIONS, processStatusLabel } from '../../domain/pipeline.constants'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import SaleProcessFollowUpPanel from '../components/SaleProcessFollowUpPanel.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { stageOptions, labelFor: pipelineStageLabel, query: pipelineConfigQuery } = useVentasPipelineStages()

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
const { mutate: markCommissionPaid, isPending: markingCommission } = useVentasMarkCommissionPaid()
const { mutate: recalcCommission, isPending: recalcingCommission } = useVentasRecalculateCommission()

const stageEdit = ref('')
const statusEdit = ref('')
const financingEdit = ref('')

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
      statusEdit.value = row.status ?? ''
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

const detail = computed(() => proc.value as SaleProcessDetail | undefined)

const buyersList = computed(() => {
  const d = detail.value
  if (!d) return []
  if (d.buyers?.length) return d.buyers
  if (d.buyer) return [{ ...d.buyer, documentNumber: '', isPrimary: true }]
  return []
})

const ownersList = computed(() => detail.value?.owners ?? [])

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
  updateProc({
    id: id.value,
    body: {
      pipelineStage: stageEdit.value || undefined,
      status: (statusEdit.value as 'ACTIVE' | 'WON' | 'LOST') || undefined,
      financingChannelId: financingEdit.value || null,
    },
  })
}

function commissionStatusLabel(status: string): string {
  if (status === 'PAID') return 'Pagada'
  if (status === 'PARTIAL') return 'Parcial'
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
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" @click="() => pipelineConfigQuery.refetch()">
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
      <BaseButton variant="outline" size="sm" @click="() => refetchDetail()">Reintentar</BaseButton>
    </div>

    <template v-else-if="detail">
      <div
        class="p-4 rounded-xl border space-y-4"
        :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
      >
        <div class="flex flex-wrap gap-4 items-end">
          <div class="min-w-[200px]">
            <FormSelect v-model="stageEdit" label="Etapa" :options="stageOptions" />
          </div>
          <div class="min-w-[180px]">
            <FormSelect v-model="statusEdit" label="Estado" :options="[...PROCESS_STATUS_OPTIONS]" />
          </div>
          <div class="min-w-[280px] flex-1">
            <FormSelect
              v-model="financingEdit"
              label="Banco / medio de pago del proceso"
              :options="financingOptions"
              :loading="loadingFinancing"
            />
          </div>
          <BaseButton variant="primary" :loading="saving" @click="saveProcessFields">Guardar cambios</BaseButton>
        </div>
        <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
          Etapa actual: {{ pipelineStageLabel(detail.pipelineStage) }} · Estado:
          {{ processStatusLabel(detail.status) }}
        </p>
      </div>

      <div class="grid lg:grid-cols-2 gap-4">
        <section
          class="p-4 rounded-xl border space-y-3"
          :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
        >
          <h2 class="text-base font-semibold flex items-center gap-2" :style="{ color: 'var(--color-text-primary)' }">
            <AppIcon icon="lucide:building-2" :size="18" />
            Inmueble
          </h2>
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
        </section>

        <section
          class="p-4 rounded-xl border space-y-4"
          :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
        >
          <div>
            <h2
              class="text-base font-semibold flex items-center gap-2 mb-2"
              :style="{ color: 'var(--color-text-primary)' }"
            >
              <AppIcon icon="lucide:users" :size="18" />
              Compradores
            </h2>
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

          <div>
            <h2
              class="text-base font-semibold flex items-center gap-2 mb-2"
              :style="{ color: 'var(--color-text-primary)' }"
            >
              <AppIcon icon="lucide:user-check" :size="18" />
              Propietarios
            </h2>
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
              Sin propietarios adicionales en la ficha del inmueble.
            </p>
          </div>

          <p v-if="detail.agent" class="text-sm pt-2 border-t" :style="{ borderColor: 'var(--color-border)' }">
            <strong :style="{ color: 'var(--color-text-primary)' }">Asesor principal:</strong>
            {{ detail.agent.fullName }}
          </p>
        </section>
      </div>

      <section
        class="p-4 rounded-xl border space-y-3"
        :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
      >
        <div class="flex items-center justify-between gap-2">
          <h2
            class="text-base font-semibold flex items-center gap-2"
            :style="{ color: 'var(--color-text-primary)' }"
          >
            <AppIcon icon="lucide:percent" :size="18" />
            Comisiones
          </h2>
          <BaseButton
            v-if="commissionsList.length"
            variant="outline"
            size="sm"
            @click="router.push('/ventas/comisiones')"
          >
            Ver listado
          </BaseButton>
        </div>
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
            <div v-if="c.status !== 'PAID'" class="flex flex-wrap gap-2">
              <BaseButton
                v-if="c.calculationType !== 'FIXED'"
                variant="outline"
                size="sm"
                :loading="recalcingCommission"
                @click="recalcCommission(c.id, { onSuccess: () => refetchDetail() })"
              >
                Recalcular
              </BaseButton>
              <BaseButton
                variant="primary"
                size="sm"
                :loading="markingCommission"
                @click="markCommissionPaid(c.id, { onSuccess: () => refetchDetail() })"
              >
                Marcar pagada
              </BaseButton>
            </div>
          </li>
        </ul>
        <p v-else class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
          Sin comisiones. Defínalas al crear el proceso (asesores internos o externos, % o monto fijo).
        </p>
      </section>

      <div
        class="rounded-lg border p-3"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }"
      >
        <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Cumplimiento para cierre</p>
        <p v-if="loadingReadiness" class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Validando checklist legal/tributario/compliance...
        </p>
        <div v-else-if="readinessQueryError" class="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span style="color: var(--color-error)">{{ getApiErrorMessage(readinessFetchError) }}</span>
          <BaseButton variant="outline" size="sm" @click="() => refetchReadiness()">Reintentar</BaseButton>
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
      </div>

      <SaleProcessFollowUpPanel :process-id="id" layout="grid" />
    </template>
  </div>
</template>
