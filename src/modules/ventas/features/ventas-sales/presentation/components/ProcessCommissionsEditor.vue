<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { formatCurrency } from '@shared/utils/formatters'
import {
  DEDUCTIBLE_TYPE_OPTIONS,
  MAX_PAYMENT_PARTS,
  buildEqualPaymentParts,
  commissionCurrency,
  commissionGross,
  commissionNet,
  deductiblesTotal,
  newCommissionDraft,
  parseNum,
  paymentPartAmounts,
  paymentPartsPercentSum,
  type CommissionDraft,
} from '../../domain/commission-draft'
import VentasAgenteFormModal from '../../../agentes/presentation/components/VentasAgenteFormModal.vue'
/**
 * ProcessCommissionsEditor — comisiones de asesores de un proceso de venta:
 * % del precio (en la moneda del inmueble) o monto fijo (en la moneda elegida),
 * con deducibles y plan de cuotas sobre el neto. Los cálculos viven en `commission-draft.ts`.
 */

const props = withDefaults(
  defineProps<{
    salePrice: number | null
    /** Moneda del precio del inmueble */
    propertyCurrency: string
    agentOptions: { value: string; label: string }[]
    currencyOptions: { value: string; label: string }[]
    canWrite?: boolean
  }>(),
  { canWrite: true },
)

const rows = defineModel<CommissionDraft[]>({ required: true })

const CALCULATION_OPTIONS = [
  { value: 'PERCENT', label: '% del precio' },
  { value: 'FIXED', label: 'Monto fijo' },
]

/** Asesores ya elegidos en otra fila no se repiten */
function agentOptionsFor(index: number) {
  const taken = new Set(rows.value.filter((r, i) => i !== index && r.agentId).map((r) => r.agentId))
  return props.agentOptions.filter((o) => !taken.has(o.value))
}

const money = (amount: number | null, row: CommissionDraft) =>
  formatCurrency(amount ?? 0, commissionCurrency(row, props.propertyCurrency))

// Mantiene los montos de cada cuota al día con el neto
watch(
  [rows, () => props.salePrice],
  () => {
    for (const row of rows.value) {
      const amounts = paymentPartAmounts(row, props.salePrice)
      row.paymentParts.forEach((part, i) => {
        const amt = amounts[i] ?? 0
        const next = amt > 0 ? String(amt) : ''
        if (part.amount !== next) part.amount = next
      })
    }
  },
  { deep: true, immediate: true },
)

function addRow() {
  rows.value.push(newCommissionDraft(props.propertyCurrency))
}
function removeRow(i: number) {
  rows.value.splice(i, 1)
  if (!rows.value.length) rows.value.push(newCommissionDraft(props.propertyCurrency))
}
function setPartsCount(row: CommissionDraft, raw: string | number) {
  const n = parseNum(raw)
  if (n != null && n >= 1) row.paymentParts = buildEqualPaymentParts(n, row.paymentParts)
}
function removePart(row: CommissionDraft, partIndex: number) {
  if (row.paymentParts.length <= 1) return
  row.paymentParts = buildEqualPaymentParts(
    row.paymentParts.length - 1,
    row.paymentParts.filter((_, i) => i !== partIndex),
  )
}
function addDeductible(row: CommissionDraft) {
  row.deductibles.push({ deductibleType: 'TRAVEL', description: '', amount: '' })
}

// «Nuevo asesor»: se registra en un modal y queda elegido en la fila que lo pidió
const agentModalOpen = ref(false)
const agentModalRow = ref<CommissionDraft | null>(null)
function openNewAgent(row: CommissionDraft) {
  agentModalRow.value = row
  agentModalOpen.value = true
}
function onAgentCreated(agent: { id: string }) {
  if (agentModalRow.value) agentModalRow.value.agentId = agent.id
}

const hasPrice = computed(() => props.salePrice != null && props.salePrice > 0)
</script>

<template>
  <div class="space-y-4">
    <p v-if="!hasPrice" class="flex items-start gap-2 rounded-lg bg-warning-50 px-3 py-2 text-theme-xs text-warning-600 dark:bg-warning-500/15 dark:text-orange-400">
      <AppIcon icon="lucide:triangle-alert" :size="14" class="mt-0.5 shrink-0" />
      El inmueble no tiene precio de venta: las comisiones en % se calcularán al registrar el cierre.
    </p>

    <div
      v-for="(row, idx) in rows"
      :key="idx"
      class="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <p class="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white/90">
          <AppIcon icon="lucide:user-check" :size="16" color="var(--color-primary)" />
          Asesor {{ idx + 1 }}
        </p>
        <BaseButton
          v-if="rows.length > 1"
          type="button"
          variant="ghost"
          size="sm"
          icon="lucide:trash-2"
          class="text-error-500"
          :aria-label="`Quitar asesor ${idx + 1}`"
          @click="removeRow(idx)"
        />
      </div>

      <!-- items-start: las etiquetas quedan al mismo nivel aunque «Moneda» tenga nota debajo.
           Asesor en su propia fila y el resto en tres columnas: la columna del formulario es angosta
           incluso en escritorio (menú + resumen lateral), así que no se usa una sola fila de 12. -->
      <div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-6">
        <div class="flex items-end gap-2 sm:col-span-6">
          <FormSelect
            v-model="row.agentId"
            class="min-w-0 flex-1"
            label="Asesor"
            placeholder="Seleccionar asesor"
            :options="agentOptionsFor(idx)"
          />
          <BaseButton
            v-if="canWrite"
            type="button"
            variant="outline"
            size="lg"
            icon="lucide:user-plus"
            class="shrink-0 px-3!"
            title="Nuevo asesor"
            aria-label="Nuevo asesor"
            @click="openNewAgent(row)"
          />
        </div>
        <FormSelect v-model="row.calculationType" class="sm:col-span-2" label="Cálculo" :options="CALCULATION_OPTIONS" />
        <FormInput
          v-model="row.value"
          class="sm:col-span-2"
          type="number"
          min="0"
          :max="row.calculationType === 'PERCENT' ? 100 : undefined"
          step="0.01"
          :label="row.calculationType === 'PERCENT' ? 'Porcentaje' : 'Monto'"
          :placeholder="row.calculationType === 'PERCENT' ? '3' : '5000'"
        />
        <FormSelect
          v-if="row.calculationType === 'FIXED'"
          v-model="row.currency"
          class="sm:col-span-2"
          label="Moneda"
          :options="currencyOptions"
        />
        <FormInput
          v-else
          class="sm:col-span-2"
          label="Moneda"
          :model-value="propertyCurrency"
          disabled
          hint="La del inmueble"
        />
      </div>

      <!-- Bruto / deducibles / neto -->
      <div
        v-if="row.agentId && commissionGross(row, salePrice) != null"
        class="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 text-center dark:bg-white/3"
      >
        <div>
          <p class="text-theme-xs text-gray-400 dark:text-gray-500">Bruto</p>
          <p class="text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ money(commissionGross(row, salePrice), row) }}</p>
        </div>
        <div>
          <p class="text-theme-xs text-gray-400 dark:text-gray-500">Deducibles</p>
          <p class="text-sm font-semibold tabular-nums text-gray-500 dark:text-gray-400">− {{ money(deductiblesTotal(row), row) }}</p>
        </div>
        <div>
          <p class="text-theme-xs text-gray-400 dark:text-gray-500">Neto a pagar</p>
          <p class="text-sm font-bold tabular-nums text-brand-500 dark:text-brand-400">{{ money(commissionNet(row, salePrice), row) }}</p>
        </div>
      </div>

      <!-- Cuotas -->
      <div class="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <AppIcon icon="lucide:calendar-range" :size="15" color="var(--color-text-muted)" />
            Plan de pago al asesor
          </p>
          <div class="flex items-center gap-2">
            <span class="text-theme-xs whitespace-nowrap text-gray-500 dark:text-gray-400">N.º de cuotas</span>
            <FormInput
              class="w-20"
              aria-label="Número de cuotas"
              type="number"
              :min="1"
              :max="MAX_PAYMENT_PARTS"
              step="1"
              :model-value="String(row.paymentParts.length)"
              @update:model-value="(v: string | number) => setPartsCount(row, v)"
            />
          </div>
        </div>
        <p
          v-if="Math.abs(paymentPartsPercentSum(row) - 100) > 0.05"
          class="mb-2 text-theme-xs text-warning-600 dark:text-orange-400"
        >
          Las cuotas suman {{ paymentPartsPercentSum(row).toFixed(2) }} % (deben sumar 100 %).
        </p>
        <div class="space-y-2">
          <div
            v-for="(part, pIdx) in row.paymentParts"
            :key="pIdx"
            class="grid grid-cols-2 items-end gap-2 sm:grid-cols-6"
          >
            <FormInput v-model="part.label" class="col-span-2 sm:col-span-6" label="Cuota" placeholder="Ej. Al firmar la minuta" />
            <FormInput
              v-model="part.percentOfNet"
              class="sm:col-span-2"
              label="% del neto"
              type="number"
              min="0"
              max="100"
              step="0.01"
            />
            <FormInput
              class="sm:col-span-2"
              label="Monto"
              :model-value="part.amount ? money(Number(part.amount), row) : '—'"
              disabled
            />
            <!-- Fecha + quitar en la misma celda: el botón no queda descolgado en pantallas medianas -->
            <div class="col-span-2 flex items-end gap-2 sm:col-span-2">
              <FormInput v-model="part.dueDate" class="min-w-0 flex-1" label="Fecha estimada" type="date" />
              <BaseButton
                v-if="row.paymentParts.length > 1"
                type="button"
                variant="ghost"
                size="lg"
                icon="lucide:x"
                class="shrink-0 px-3!"
                :aria-label="`Quitar cuota ${pIdx + 1}`"
                @click="removePart(row, pIdx)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Deducibles -->
      <div class="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <AppIcon icon="lucide:receipt" :size="15" color="var(--color-text-muted)" />
            Deducibles
            <Badge v-if="row.deductibles.length" variant="neutral">{{ row.deductibles.length }}</Badge>
          </p>
          <BaseButton type="button" variant="ghost" size="sm" icon="lucide:plus" @click="addDeductible(row)">
            Agregar deducible
          </BaseButton>
        </div>
        <p v-if="!row.deductibles.length" class="text-theme-xs text-gray-400 dark:text-gray-500">
          Sin deducibles: el neto es igual a la comisión bruta.
        </p>
        <div
          v-for="(ded, dIdx) in row.deductibles"
          :key="dIdx"
          class="mt-2 grid grid-cols-2 items-end gap-2 sm:grid-cols-6"
        >
          <FormSelect v-model="ded.deductibleType" class="sm:col-span-2" label="Tipo" :options="DEDUCTIBLE_TYPE_OPTIONS" />
          <FormInput v-model="ded.description" class="sm:col-span-2" label="Descripción" placeholder="Opcional" />
          <div class="col-span-2 flex items-end gap-2 sm:col-span-2">
            <FormInput
              v-model="ded.amount"
              class="min-w-0 flex-1"
              :label="`Monto (${commissionCurrency(row, propertyCurrency)})`"
              type="number"
              min="0"
              step="0.01"
            />
            <BaseButton
              type="button"
              variant="ghost"
              size="lg"
              icon="lucide:x"
              class="shrink-0 px-3!"
              :aria-label="`Quitar deducible ${dIdx + 1}`"
              @click="row.deductibles.splice(dIdx, 1)"
            />
          </div>
        </div>
      </div>
    </div>

    <BaseButton v-if="canWrite" type="button" variant="outline" size="sm" icon="lucide:plus" @click="addRow">
      Agregar asesor
    </BaseButton>

    <VentasAgenteFormModal v-model:open="agentModalOpen" @created="onAgentCreated" />
  </div>
</template>
