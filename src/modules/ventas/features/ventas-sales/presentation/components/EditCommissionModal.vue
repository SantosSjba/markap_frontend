<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import { formatCurrency } from '@shared/utils/formatters'
import { useVentasUpdateCommission } from '../../../ventas-finanzas/presentation/composables/useVentasFinanzas'

/**
 * Cambia el % o el monto fijo pactado de una comisión. Las cuotas ya pagadas se conservan;
 * el saldo se reparte en las pendientes y el motivo queda en el seguimiento del proceso.
 */
export interface EditableCommission {
  id: string
  amount: number
  currency: string
  calculationType: string
  percentApplied: number | null
  status: string
  deductiblesTotal?: number
  agent: { fullName: string }
  paymentParts?: { amount: number; status: string }[]
}

const props = defineProps<{
  modelValue: boolean
  commission: EditableCommission | null
  /** Precio sobre el que se calcula el %: precio final del cierre o, sin cierre, el del inmueble */
  basePrice: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const TYPE_OPTIONS = [
  { value: 'PERCENT', label: 'Porcentaje del precio' },
  { value: 'FIXED', label: 'Monto fijo' },
]

const calculationType = ref<'PERCENT' | 'FIXED'>('PERCENT')
const percent = ref<number | null>(null)
const fixedAmount = ref<number | null>(null)
const reason = ref('')
const error = ref('')

watch(
  () => [props.modelValue, props.commission] as const,
  ([open, c]) => {
    if (!open || !c) return
    calculationType.value = c.calculationType === 'FIXED' ? 'FIXED' : 'PERCENT'
    percent.value = c.percentApplied
    fixedAmount.value = c.amount
    reason.value = ''
    error.value = ''
  },
  { immediate: true },
)

const round = (n: number) => Math.round(n * 100) / 100
const currency = computed(() => props.commission?.currency ?? 'PEN')
const deductibles = computed(() => props.commission?.deductiblesTotal ?? 0)
const paidSoFar = computed(() =>
  round((props.commission?.paymentParts ?? []).filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)),
)

const newGross = computed(() => {
  if (calculationType.value === 'FIXED') return round(Number(fixedAmount.value) || 0)
  if (props.basePrice == null || props.basePrice <= 0) return null
  return round(props.basePrice * ((Number(percent.value) || 0) / 100))
})
const newNet = computed(() => (newGross.value == null ? null : Math.max(0, round(newGross.value - deductibles.value))))
const balance = computed(() => (newNet.value == null ? null : round(newNet.value - paidSoFar.value)))

const { mutate: updateCommission, isPending } = useVentasUpdateCommission()

function close() {
  emit('update:modelValue', false)
}

function submit() {
  const c = props.commission
  if (!c) return
  if (calculationType.value === 'PERCENT') {
    const p = Number(percent.value)
    if (percent.value == null || Number.isNaN(p) || p < 0 || p > 100) {
      error.value = 'El porcentaje debe estar entre 0 y 100.'
      return
    }
    if (newGross.value == null) {
      error.value = 'El inmueble no tiene precio de venta: use un monto fijo.'
      return
    }
  } else if (fixedAmount.value == null || Number(fixedAmount.value) < 0) {
    error.value = 'Indique un monto fijo válido.'
    return
  }
  if (balance.value != null && balance.value < -0.01) {
    error.value = 'El nuevo neto no puede ser menor a lo ya pagado al asesor.'
    return
  }
  if (reason.value.trim().length < 5) {
    error.value = 'Indique el motivo del cambio (mínimo 5 caracteres).'
    return
  }
  error.value = ''
  updateCommission(
    {
      id: c.id,
      body: {
        calculationType: calculationType.value,
        percent: calculationType.value === 'PERCENT' ? Number(percent.value) : null,
        fixedAmount: calculationType.value === 'FIXED' ? Number(fixedAmount.value) : null,
        reason: reason.value.trim(),
      },
    },
    {
      onSuccess: () => {
        emit('saved')
        close()
      },
    },
  )
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Editar comisión"
    size="md"
    @update:model-value="(v: boolean) => (v ? emit('update:modelValue', true) : close())"
  >
    <div v-if="commission" class="space-y-4 p-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Asesor <strong class="text-gray-800 dark:text-white/90">{{ commission.agent.fullName }}</strong> · moneda
        {{ currency }}.
        <template v-if="paidSoFar > 0">
          Ya se pagaron {{ formatCurrency(paidSoFar, currency) }}; esas cuotas se conservan.
        </template>
      </p>

      <FormSelect v-model="calculationType" label="Cálculo" :options="TYPE_OPTIONS" />
      <FormInput
        v-if="calculationType === 'PERCENT'"
        v-model="percent"
        type="number"
        step="0.01"
        min="0"
        max="100"
        label="Porcentaje pactado (%)"
        :hint="basePrice ? `Sobre ${formatCurrency(basePrice, currency)}` : 'El inmueble no tiene precio de venta'"
      />
      <FormInput v-else v-model="fixedAmount" type="number" step="0.01" min="0" :label="`Monto fijo (${currency})`" />

      <dl class="grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 text-center text-sm dark:bg-white/3">
        <div>
          <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Bruto</dt>
          <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
            {{ newGross == null ? '—' : formatCurrency(newGross, currency) }}
          </dd>
        </div>
        <div>
          <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Neto</dt>
          <dd class="font-semibold tabular-nums text-brand-500 dark:text-brand-400">
            {{ newNet == null ? '—' : formatCurrency(newNet, currency) }}
          </dd>
        </div>
        <div>
          <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Saldo por pagar</dt>
          <dd
            class="font-semibold tabular-nums"
            :class="balance != null && balance < 0 ? 'text-error-500' : 'text-gray-800 dark:text-white/90'"
          >
            {{ balance == null ? '—' : formatCurrency(Math.max(0, balance), currency) }}
          </dd>
        </div>
      </dl>

      <FormTextarea
        v-model="reason"
        label="Motivo del cambio"
        placeholder="Ej. Acuerdo con el propietario: la comisión sube del 2 % al 3 %"
        :rows="3"
        required
      />
      <p v-if="error" class="text-sm text-error-600 dark:text-error-500">{{ error }}</p>

      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="outline" icon="lucide:x" :disabled="isPending" @click="close">Cancelar</BaseButton>
        <BaseButton variant="primary" icon="lucide:save" :loading="isPending" @click="submit">Guardar comisión</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
