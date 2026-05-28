<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, FormInput, FormSelect, AppIcon } from '@shared/components'
import { useVentasPipelineStages } from '@ventas/configuracion'
import { useVentasCreateProcess, useVentasFinancingChannels } from '../../application/useVentasSales'
import type { SaleFinancingChannel, SaleCommissionCalculationType } from '../../domain/sales.types'
import { ventasClientsRepository } from '@modules/ventas/features/clientes'
import { ventasPropertiesRepository } from '@modules/ventas/features/propiedades'
import { useVentasAgentsList } from '@modules/ventas/features/agentes'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

const router = useRouter()
const loading = ref(false)
const loadError = ref('')
const commissionFormError = ref('')

const { stageOptions } = useVentasPipelineStages()
const agentParams = ref({ page: 1, limit: 500, isActive: true })
const { data: agentsRes } = useVentasAgentsList(agentParams)

const agentSelectOptions = computed(() =>
  (agentsRes.value?.data ?? []).map((a) => ({
    value: a.id,
    label: `${a.fullName} (${a.type === 'INTERNAL' ? 'Interno' : 'Externo'})`,
  })),
)

const calculationTypeOptions = [
  { value: 'PERCENT', label: '% del precio de venta' },
  { value: 'FIXED', label: 'Monto fijo (S/)' },
]

const buyerOptions = ref<{ value: string; label: string }[]>([])
const propertyOptions = ref<{ value: string; label: string }[]>([])
const propertyOwners = ref<{ id: string; fullName: string; documentNumber: string; isPrimary: boolean }[]>([])
const propertySalePrice = ref<number | null>(null)
const loadingPropertyOwners = ref(false)

type CommissionDraft = {
  agentId: string
  calculationType: SaleCommissionCalculationType
  value: string
}

const form = ref({
  propertyId: '',
  title: '',
  pipelineStage: 'SEPARATION',
  financingChannelId: '',
  buyers: [''],
})

const commissionRows = ref<CommissionDraft[]>([
  { agentId: '', calculationType: 'PERCENT', value: '' },
])

const { mutate: createProcess, isPending } = useVentasCreateProcess()
const { data: financingChannels, isLoading: loadingFinancing } = useVentasFinancingChannels()

const FINANCING_CATEGORY_LABEL: Record<string, string> = {
  BANK: 'Bancos',
  PAYMENT_METHOD: 'Medios de pago',
  OWN_FUNDS: 'Fondos propios',
  OTHER: 'Otros',
}

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

function parseNum(raw: string | number): number | null {
  if (raw === '' || raw == null) return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function resolveCommissionAmount(row: CommissionDraft): number | null {
  const v = parseNum(row.value)
  if (v == null) return null
  if (row.calculationType === 'FIXED') return v >= 0 ? Math.round(v * 100) / 100 : null
  if (v < 0 || v > 100) return null
  const price = propertySalePrice.value
  if (price == null || price <= 0) return 0
  return Math.round(price * (v / 100) * 100) / 100
}

const commissionsPreview = computed(() =>
  commissionRows.value
    .filter((r) => r.agentId)
    .map((row) => {
      const agent = agentsRes.value?.data.find((a) => a.id === row.agentId)
      const amount = resolveCommissionAmount(row)
      return {
        row,
        agentName: agent?.fullName ?? '—',
        agentType: agent?.type === 'INTERNAL' ? 'Interno' : 'Externo',
        amount,
        invalid:
          parseNum(row.value) == null ||
          (row.calculationType === 'PERCENT' &&
            (parseNum(row.value)! < 0 || parseNum(row.value)! > 100)),
      }
    }),
)

const commissionsTotal = computed(() =>
  commissionsPreview.value.reduce((sum, p) => sum + (p.amount ?? 0), 0),
)

function ensureOneEmpty(items: string[]) {
  const cleaned = items.filter((x) => !!x)
  return cleaned.length ? cleaned : ['']
}

function addBuyer() {
  form.value.buyers.push('')
}
function removeBuyer(idx: number) {
  form.value.buyers.splice(idx, 1)
  form.value.buyers = ensureOneEmpty(form.value.buyers)
}

function addCommissionRow() {
  commissionRows.value.push({ agentId: '', calculationType: 'PERCENT', value: '' })
}
function removeCommissionRow(idx: number) {
  commissionRows.value.splice(idx, 1)
  if (!commissionRows.value.length) {
    commissionRows.value.push({ agentId: '', calculationType: 'PERCENT', value: '' })
  }
}

async function loadPropertyOwners(propertyId: string) {
  if (!propertyId) {
    propertyOwners.value = []
    propertySalePrice.value = null
    return
  }
  loadingPropertyOwners.value = true
  try {
    const p = await ventasPropertiesRepository.getById(propertyId)
    propertySalePrice.value = p.salePrice ?? null
    propertyOwners.value = (p.owners ?? []).map((o) => ({
      id: o.id,
      fullName: o.fullName,
      documentNumber: o.documentNumber,
      isPrimary: o.isPrimary,
    }))
  } catch {
    propertyOwners.value = []
    propertySalePrice.value = null
  } finally {
    loadingPropertyOwners.value = false
  }
}

watch(
  () => form.value.propertyId,
  (id) => {
    void loadPropertyOwners(id)
  },
)

async function loadCatalogs() {
  loadError.value = ''
  loading.value = true
  try {
    const [buyers, props] = await Promise.all([
      ventasClientsRepository.getList({ clientType: 'BUYER', page: 1, limit: 1000 }),
      ventasPropertiesRepository.getList({ page: 1, limit: 1000, listingStatus: 'AVAILABLE' }),
    ])
    buyerOptions.value = buyers.data.map((c) => ({
      value: c.id,
      label: `${c.fullName} (${c.documentNumber})`,
    }))
    propertyOptions.value = props.data.map((p) => ({
      value: p.id,
      label: `${p.code} — ${p.addressLine}`,
    }))
  } catch (e) {
    loadError.value = getApiErrorMessage(e)
  } finally {
    loading.value = false
  }
}

void loadCatalogs()

function buildCommissionsPayload() {
  const seen = new Set<string>()
  const out: {
    agentId: string
    calculationType: 'PERCENT' | 'FIXED'
    percent?: number | null
    fixedAmount?: number | null
  }[] = []

  for (const row of commissionRows.value) {
    if (!row.agentId) continue
    if (seen.has(row.agentId)) {
      commissionFormError.value = 'No repita el mismo asesor en las comisiones.'
      return null
    }
    seen.add(row.agentId)

    const v = parseNum(row.value)
    if (v == null) {
      commissionFormError.value = 'Complete el valor de cada comisión.'
      return null
    }

    if (row.calculationType === 'FIXED') {
      if (v < 0) {
        commissionFormError.value = 'El monto fijo debe ser mayor o igual a cero.'
        return null
      }
      out.push({ agentId: row.agentId, calculationType: 'FIXED', fixedAmount: v })
    } else {
      if (v < 0 || v > 100) {
        commissionFormError.value = 'El porcentaje debe estar entre 0 y 100.'
        return null
      }
      out.push({ agentId: row.agentId, calculationType: 'PERCENT', percent: v })
    }
  }
  return out
}

function submit() {
  commissionFormError.value = ''
  const buyerIds = Array.from(new Set(form.value.buyers.filter(Boolean)))
  const primaryBuyerId = buyerIds[0]
  if (!form.value.propertyId || !primaryBuyerId) return

  const commissions = buildCommissionsPayload()
  if (commissions === null) return

  createProcess(
    {
      propertyId: form.value.propertyId,
      buyerClientId: primaryBuyerId,
      buyerClientIds: buyerIds,
      agentId: commissions[0]?.agentId ?? null,
      title: form.value.title || null,
      pipelineStage: form.value.pipelineStage,
      financingChannelId: form.value.financingChannelId || null,
      commissions,
    },
    {
      onSuccess: () => router.push('/ventas/procesos'),
    },
  )
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
          Nuevo proceso de venta
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Configure aquí compradores, comisiones (varios asesores, % o monto fijo) y medio de pago.
        </p>
      </div>
    </div>

    <div
      v-if="loadError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-warning-light)' }"
    >
      <span class="max-w-xl" style="color: var(--color-error)">{{ loadError }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" :loading="loading" @click="loadCatalogs">
        Reintentar
      </BaseButton>
    </div>

    <div
      class="p-5 rounded-xl border space-y-5"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSelect
          v-model="form.propertyId"
          label="Inmueble (disponible)"
          :options="propertyOptions"
          :loading="loading"
          required
        />
        <FormSelect v-model="form.pipelineStage" label="Etapa inicial" :options="stageOptions" />
        <FormInput
          v-model="form.title"
          label="Título (opcional)"
          placeholder="Ej. Familia Pérez — Torre Vista Mar"
        />
        <FormSelect
          v-model="form.financingChannelId"
          label="Banco o medio de pago del proceso"
          :options="financingOptions"
          :loading="loadingFinancing"
        />
      </div>

      <section class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
            Comisiones de asesores
          </h2>
          <BaseButton type="button" variant="outline" size="sm" @click="addCommissionRow">
            + Agregar asesor
          </BaseButton>
        </div>
        <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
          Asesores internos o externos. Puede usar porcentaje sobre el precio del inmueble o un monto fijo en soles.
        </p>

        <div
          v-for="(row, idx) in commissionRows"
          :key="`comm-${idx}`"
          class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end rounded-lg border p-3"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <div class="md:col-span-5">
            <FormSelect
              v-model="row.agentId"
              label="Asesor"
              :options="agentSelectOptions"
              placeholder="Seleccionar…"
            />
          </div>
          <div class="md:col-span-3">
            <FormSelect
              v-model="row.calculationType"
              label="Tipo"
              :options="calculationTypeOptions"
            />
          </div>
          <div class="md:col-span-3">
            <FormInput
              v-model="row.value"
              :label="row.calculationType === 'FIXED' ? 'Monto (S/)' : 'Porcentaje (%)'"
              type="number"
              :step="row.calculationType === 'FIXED' ? '0.01' : '0.01'"
              :min="0"
              :max="row.calculationType === 'PERCENT' ? 100 : undefined"
              placeholder="Ej. 3.5"
            />
          </div>
          <div class="md:col-span-1 flex justify-end pb-1">
            <BaseButton
              v-if="commissionRows.length > 1"
              type="button"
              variant="ghost"
              size="sm"
              @click="removeCommissionRow(idx)"
            >
              Quitar
            </BaseButton>
          </div>
        </div>

        <p v-if="commissionFormError" class="text-sm" :style="{ color: 'var(--color-error)' }">
          {{ commissionFormError }}
        </p>

        <div
          v-if="commissionsPreview.length"
          class="rounded-lg border px-4 py-3 space-y-2 text-sm"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }"
        >
          <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">Vista previa</p>
          <ul class="space-y-1">
            <li
              v-for="(p, i) in commissionsPreview"
              :key="i"
              :style="{ color: p.invalid ? 'var(--color-error)' : 'var(--color-text-secondary)' }"
            >
              {{ p.agentName }} ({{ p.agentType }}) —
              <template v-if="p.row.calculationType === 'PERCENT'">{{ p.row.value }}%</template>
              <template v-else>S/ {{ p.row.value }} fijo</template>
              →
              <strong>S/ {{ (p.amount ?? 0).toLocaleString('es-PE') }}</strong>
            </li>
          </ul>
          <p v-if="propertySalePrice != null && propertySalePrice > 0" class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
            Precio inmueble: S/ {{ propertySalePrice.toLocaleString('es-PE') }} · Total comisiones:
            <strong>S/ {{ commissionsTotal.toLocaleString('es-PE') }}</strong>
          </p>
          <p v-else class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
            Sin precio en el inmueble: los montos en % se calcularán cuando haya precio o al cierre.
          </p>
        </div>
      </section>

      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
            Compradores
          </h2>
          <BaseButton type="button" variant="outline" size="sm" @click="addBuyer">
            + Agregar comprador
          </BaseButton>
        </div>
        <div v-for="(_, idx) in form.buyers" :key="`buyer-${idx}`" class="flex gap-2 items-end">
          <div class="flex-1">
            <FormSelect
              v-model="form.buyers[idx]"
              :label="`Comprador ${idx + 1}`"
              :options="buyerOptions"
              :loading="loading"
              required
            />
          </div>
          <BaseButton
            v-if="form.buyers.length > 1"
            type="button"
            variant="ghost"
            size="sm"
            @click="removeBuyer(idx)"
          >
            Quitar
          </BaseButton>
        </div>
      </section>

      <section
        v-if="form.propertyId"
        class="space-y-2 rounded-lg border px-4 py-3"
        :style="{ borderColor: 'var(--color-border)' }"
      >
        <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
          Propietarios del inmueble
        </h2>
        <p v-if="loadingPropertyOwners" class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
          Cargando propietarios…
        </p>
        <ul v-else-if="propertyOwners.length" class="space-y-1 text-sm">
          <li
            v-for="o in propertyOwners"
            :key="o.id"
            :style="{ color: 'var(--color-text-primary)' }"
          >
            {{ o.fullName }}
            <span v-if="o.documentNumber"> ({{ o.documentNumber }})</span>
            <span
              v-if="o.isPrimary"
              class="ml-1 text-xs"
              :style="{ color: 'var(--color-text-muted)' }"
            >— principal</span>
          </li>
        </ul>
        <p v-else class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
          Sin propietarios registrados en la ficha del inmueble.
        </p>
      </section>

      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="outline" @click="router.push('/ventas/procesos')">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="isPending" @click="submit">Crear proceso</BaseButton>
      </div>
    </div>
  </div>
</template>
