<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, FormInput, FormSelect, AppIcon } from '@shared/components'
import { useVentasPipelineStages } from '@ventas/configuracion'
import { useVentasCreateProcess, useVentasFinancingChannels } from '../../application/useVentasSales'
import type {
  SaleFinancingChannel,
  SaleCommissionCalculationType,
  SaleCommissionDeductibleType,
  CreateProcessCommissionInput,
} from '../../domain/sales.types'
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

type PaymentPartDraft = {
  label: string
  percentOfNet: string
  amount: string
  dueDate: string
}

type DeductibleDraft = {
  deductibleType: SaleCommissionDeductibleType
  description: string
  amount: string
}

type CommissionDraft = {
  agentId: string
  calculationType: SaleCommissionCalculationType
  value: string
  paymentParts: PaymentPartDraft[]
  deductibles: DeductibleDraft[]
}

const DEDUCTIBLE_TYPE_OPTIONS = [
  { value: 'TRAVEL', label: 'Pasajes / viáticos' },
  { value: 'TAX', label: 'Impuestos' },
  { value: 'NOTARY', label: 'Notaría' },
  { value: 'REGISTRY', label: 'Registros públicos' },
  { value: 'OTHER', label: 'Otros' },
]

const MAX_PAYMENT_PARTS = 36

function paymentPartLabel(index: number, total: number): string {
  if (total === 1) return 'Pago único'
  return `Parte ${index}`
}

function buildEqualPaymentParts(count: number, existing?: PaymentPartDraft[]): PaymentPartDraft[] {
  const n = Math.max(1, Math.min(MAX_PAYMENT_PARTS, Math.floor(count)))
  const parts: PaymentPartDraft[] = []
  let assignedPct = 0
  for (let i = 0; i < n; i++) {
    const pct =
      i === n - 1
        ? Math.round((100 - assignedPct) * 100) / 100
        : Math.round((100 / n) * 100) / 100
    assignedPct += pct
    const prev = existing?.[i]
    parts.push({
      label: prev?.label?.trim() || paymentPartLabel(i + 1, n),
      percentOfNet: String(pct),
      amount: prev?.amount ?? '',
      dueDate: prev?.dueDate ?? '',
    })
  }
  return parts
}

function newCommissionRow(): CommissionDraft {
  return {
    agentId: '',
    calculationType: 'PERCENT',
    value: '',
    paymentParts: buildEqualPaymentParts(1),
    deductibles: [],
  }
}

const form = ref({
  propertyId: '',
  title: '',
  pipelineStage: 'SEPARATION',
  financingChannelId: '',
  buyers: [''],
})

const commissionRows = ref<CommissionDraft[]>([newCommissionRow()])

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

function resolveDeductiblesTotal(row: CommissionDraft): number {
  return row.deductibles.reduce((s, d) => {
    const n = parseNum(d.amount)
    return s + (n != null && n >= 0 ? n : 0)
  }, 0)
}

function resolveCommissionNet(row: CommissionDraft): number | null {
  const gross = resolveCommissionAmount(row)
  if (gross == null) return null
  return Math.max(0, Math.round((gross - resolveDeductiblesTotal(row)) * 100) / 100)
}

/** Reparte el neto en cada parte según % del neto (última parte absorbe redondeo). */
function resolvePaymentPartAmounts(row: CommissionDraft): number[] {
  const net = resolveCommissionNet(row)
  if (net == null || net <= 0) return row.paymentParts.map(() => 0)

  const parts = row.paymentParts
  const amounts: number[] = []
  let assigned = 0
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!
    const pct = parseNum(part.percentOfNet) ?? 0
    const amt =
      i === parts.length - 1
        ? Math.round((net - assigned) * 100) / 100
        : Math.round(net * (pct / 100) * 100) / 100
    amounts.push(Math.max(0, amt))
    assigned += amounts[i]!
  }
  return amounts
}

function syncPartAmountsFromNet(row: CommissionDraft) {
  const amounts = resolvePaymentPartAmounts(row)
  row.paymentParts.forEach((part, i) => {
    const amt = amounts[i] ?? 0
    part.amount = amt > 0 ? String(amt) : ''
  })
}

function syncAllCommissionPartAmounts() {
  for (const row of commissionRows.value) {
    syncPartAmountsFromNet(row)
  }
}

const commissionsPreview = computed(() =>
  commissionRows.value
    .filter((r) => r.agentId)
    .map((row) => {
      const agent = agentsRes.value?.data.find((a) => a.id === row.agentId)
      const gross = resolveCommissionAmount(row)
      const deductiblesTotal = resolveDeductiblesTotal(row)
      const net = gross != null ? Math.max(0, Math.round((gross - deductiblesTotal) * 100) / 100) : null
      return {
        row,
        agentName: agent?.fullName ?? '—',
        agentType: agent?.type === 'INTERNAL' ? 'Interno' : 'Externo',
        gross,
        deductiblesTotal,
        net,
        invalid:
          parseNum(row.value) == null ||
          (row.calculationType === 'PERCENT' &&
            (parseNum(row.value)! < 0 || parseNum(row.value)! > 100)),
      }
    }),
)

const commissionsTotal = computed(() =>
  commissionsPreview.value.reduce((sum, p) => sum + (p.gross ?? 0), 0),
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
  commissionRows.value.push(newCommissionRow())
}
function removeCommissionRow(idx: number) {
  commissionRows.value.splice(idx, 1)
  if (!commissionRows.value.length) {
    commissionRows.value.push(newCommissionRow())
  }
}

function applyPartsCount(commIdx: number, raw: string | number) {
  const row = commissionRows.value[commIdx]
  if (!row) return
  const n = parseNum(raw)
  if (n == null || n < 1) return
  row.paymentParts = buildEqualPaymentParts(n, row.paymentParts)
  syncPartAmountsFromNet(row)
}

function addPaymentPart(commIdx: number) {
  const row = commissionRows.value[commIdx]
  if (!row) return
  if (row.paymentParts.length >= MAX_PAYMENT_PARTS) return
  row.paymentParts = buildEqualPaymentParts(row.paymentParts.length + 1, row.paymentParts)
  syncPartAmountsFromNet(row)
}

function removePaymentPart(commIdx: number, partIdx: number) {
  const row = commissionRows.value[commIdx]
  if (!row || row.paymentParts.length <= 1) return
  const kept = row.paymentParts.filter((_, i) => i !== partIdx)
  row.paymentParts = buildEqualPaymentParts(kept.length, kept)
  syncPartAmountsFromNet(row)
}

function onPartPercentChange(commIdx: number) {
  const row = commissionRows.value[commIdx]
  if (!row) return
  syncPartAmountsFromNet(row)
}

function paymentPartsPercentSum(row: CommissionDraft): number {
  return row.paymentParts.reduce((s, p) => {
    const n = parseNum(p.percentOfNet)
    return s + (n != null && n >= 0 ? n : 0)
  }, 0)
}

function addDeductible(idx: number) {
  const row = commissionRows.value[idx]
  if (!row) return
  row.deductibles.push({
    deductibleType: 'TRAVEL',
    description: '',
    amount: '',
  })
}

function removeDeductible(commIdx: number, dedIdx: number) {
  const row = commissionRows.value[commIdx]
  if (!row) return
  row.deductibles.splice(dedIdx, 1)
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
    syncAllCommissionPartAmounts()
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

watch(
  [propertySalePrice, commissionRows],
  () => {
    syncAllCommissionPartAmounts()
  },
  { deep: true },
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

function buildCommissionsPayload(): CreateProcessCommissionInput[] | null {
  const seen = new Set<string>()
  const out: CreateProcessCommissionInput[] = []

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

    const deductibles: CreateProcessCommissionInput['deductibles'] = []
    for (const d of row.deductibles) {
      const amt = parseNum(d.amount)
      if (amt == null || amt < 0) {
        commissionFormError.value = 'Revise los montos de los deducibles.'
        return null
      }
      if (amt > 0) {
        deductibles.push({
          deductibleType: d.deductibleType,
          description: d.description.trim() || null,
          amount: amt,
        })
      }
    }

    syncPartAmountsFromNet(row)
    const resolvedAmounts = resolvePaymentPartAmounts(row)
    const paymentParts = row.paymentParts.map((p, i) => {
      const percentOfNet = p.percentOfNet.trim() ? parseNum(p.percentOfNet) : null
      const computedAmt = resolvedAmounts[i] ?? 0
      return {
        label: p.label.trim() || null,
        amount: computedAmt > 0 ? computedAmt : null,
        percentOfNet: percentOfNet != null && percentOfNet >= 0 ? percentOfNet : null,
        dueDate: p.dueDate.trim() || null,
      }
    })

    const pctSum = paymentParts.reduce((s, p) => s + (p.percentOfNet ?? 0), 0)
    const allPercent = paymentParts.every((p) => p.amount == null && p.percentOfNet != null)
    if (allPercent && Math.abs(pctSum - 100) > 0.05) {
      commissionFormError.value = `Las partes de pago deben sumar 100 % (actual: ${Math.round(pctSum * 100) / 100} %).`
      return null
    }

    const base: CreateProcessCommissionInput = {
      agentId: row.agentId,
      calculationType: row.calculationType,
      paymentParts,
      deductibles,
    }

    if (row.calculationType === 'FIXED') {
      if (v < 0) {
        commissionFormError.value = 'El monto fijo debe ser mayor o igual a cero.'
        return null
      }
      out.push({ ...base, fixedAmount: v })
    } else {
      if (v < 0 || v > 100) {
        commissionFormError.value = 'El porcentaje debe estar entre 0 y 100.'
        return null
      }
      out.push({ ...base, percent: v })
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

          <div
            class="md:col-span-12 rounded-lg border px-3 py-3 space-y-3"
            :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }"
          >
            <div class="flex flex-wrap items-end justify-between gap-3">
              <p class="text-sm font-medium w-full sm:w-auto" :style="{ color: 'var(--color-text-primary)' }">
                Plan de pago de comisión
              </p>
              <div class="flex flex-wrap items-end gap-2">
                <div class="w-36">
                  <FormInput
                    :model-value="String(row.paymentParts.length)"
                    label="Nº de partes"
                    type="number"
                    :min="1"
                    :max="MAX_PAYMENT_PARTS"
                    step="1"
                    @update:model-value="(v: string | number) => applyPartsCount(idx, v)"
                  />
                </div>
                <BaseButton
                  type="button"
                  variant="outline"
                  size="sm"
                  :disabled="row.paymentParts.length >= MAX_PAYMENT_PARTS"
                  @click="addPaymentPart(idx)"
                >
                  + Parte
                </BaseButton>
              </div>
            </div>
            <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
              Indique cuántas cuotas tendrá el pago. Los montos se calculan del neto × % de cada parte.
              <template v-if="resolveCommissionNet(row) != null">
                Neto: <strong>S/ {{ resolveCommissionNet(row)!.toLocaleString('es-PE') }}</strong>
              </template>
            </p>
            <p
              v-if="Math.abs(paymentPartsPercentSum(row) - 100) > 0.05"
              class="text-xs"
              :style="{ color: 'var(--color-warning)' }"
            >
              Los porcentajes suman {{ paymentPartsPercentSum(row).toFixed(2) }} % (deben ser 100 %).
            </p>
            <div
              v-for="(part, pIdx) in row.paymentParts"
              :key="`part-${idx}-${pIdx}`"
              class="grid grid-cols-1 md:grid-cols-12 gap-2 items-end"
            >
              <div class="md:col-span-1 text-xs pt-6" :style="{ color: 'var(--color-text-muted)' }">
                {{ pIdx + 1 }}/{{ row.paymentParts.length }}
              </div>
              <div class="md:col-span-3">
                <FormInput v-model="part.label" label="Etiqueta" placeholder="Ej. 1ra cuota" />
              </div>
              <div class="md:col-span-2">
                <FormInput
                  v-model="part.percentOfNet"
                  label="% del neto"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  @update:model-value="onPartPercentChange(idx)"
                />
              </div>
              <div class="md:col-span-2">
                <FormInput
                  :model-value="part.amount"
                  label="Monto (S/)"
                  type="number"
                  disabled
                  :placeholder="
                    resolveCommissionNet(row) != null ? '0' : 'Defina comisión y precio'
                  "
                />
              </div>
              <div class="md:col-span-2">
                <FormInput v-model="part.dueDate" label="Vencimiento" type="date" />
              </div>
              <div class="md:col-span-2 flex justify-end pb-1">
                <BaseButton
                  v-if="row.paymentParts.length > 1"
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="removePaymentPart(idx, pIdx)"
                >
                  Quitar
                </BaseButton>
              </div>
            </div>
          </div>

          <div
            class="md:col-span-12 rounded-lg border px-3 py-3 space-y-3"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">
                Deducibles (pasajes, impuestos, etc.)
              </p>
              <BaseButton type="button" variant="outline" size="sm" @click="addDeductible(idx)">
                + Deducible
              </BaseButton>
            </div>
            <p v-if="!row.deductibles.length" class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
              Sin deducibles. El neto a pagar será igual a la comisión bruta.
            </p>
            <div
              v-for="(ded, dIdx) in row.deductibles"
              :key="`ded-${idx}-${dIdx}`"
              class="grid grid-cols-1 md:grid-cols-12 gap-2 items-end"
            >
              <div class="md:col-span-3">
                <FormSelect
                  v-model="ded.deductibleType"
                  label="Tipo"
                  :options="DEDUCTIBLE_TYPE_OPTIONS"
                />
              </div>
              <div class="md:col-span-4">
                <FormInput v-model="ded.description" label="Descripción" placeholder="Opcional" />
              </div>
              <div class="md:col-span-3">
                <FormInput v-model="ded.amount" label="Monto (S/)" type="number" min="0" step="0.01" />
              </div>
              <div class="md:col-span-2 flex justify-end pb-1">
                <BaseButton type="button" variant="ghost" size="sm" @click="removeDeductible(idx, dIdx)">
                  Quitar
                </BaseButton>
              </div>
            </div>
            <p
              v-if="row.agentId && resolveCommissionNet(row) != null"
              class="text-xs"
              :style="{ color: 'var(--color-text-secondary)' }"
            >
              Neto estimado a pagar:
              <strong>S/ {{ resolveCommissionNet(row)!.toLocaleString('es-PE') }}</strong>
              (bruto S/ {{ (resolveCommissionAmount(row) ?? 0).toLocaleString('es-PE') }}
              − deducibles S/ {{ resolveDeductiblesTotal(row).toLocaleString('es-PE') }})
            </p>
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
              → bruto
              <strong>S/ {{ (p.gross ?? 0).toLocaleString('es-PE') }}</strong>
              <template v-if="p.deductiblesTotal > 0">
                · neto <strong>S/ {{ (p.net ?? 0).toLocaleString('es-PE') }}</strong>
              </template>
              · {{ p.row.paymentParts.length }} parte(s)
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
