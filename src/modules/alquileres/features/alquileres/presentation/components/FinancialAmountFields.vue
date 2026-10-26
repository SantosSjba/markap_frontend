<script setup lang="ts">
import { computed } from 'vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { useCurrencyCatalog } from '../../../../presentation/composables/useCurrencyCatalog'
import type { FinancialValueType } from '../../domain/rental.types'
/**
 * FinancialAmountFields — tipo (fijo / %), moneda y valor de un concepto de la distribución.
 * Los porcentajes se calculan en la moneda del contrato; un monto fijo puede ir en otra moneda.
 */

const props = defineProps<{
  contractCurrency: string
  /** Etiqueta del valor fijo, ej. «Comisión» */
  valueLabel: string
  error?: string
}>()

const type = defineModel<FinancialValueType>('type', { required: true })
const value = defineModel<number | string>('value', { required: true })
/** null = moneda del contrato */
const currency = defineModel<string | null>('currency', { required: true })

const { options: currencyOptions, symbol } = useCurrencyCatalog()

const typeOptions = [
  { value: 'FIXED', label: 'Monto fijo' },
  { value: 'PERCENT', label: 'Porcentaje' },
]

const isPercent = computed(() => type.value === 'PERCENT')
const currencyModel = computed({
  get: () => (isPercent.value ? props.contractCurrency : (currency.value ?? props.contractCurrency)),
  set: (code: string) => {
    currency.value = code === props.contractCurrency ? null : code
  },
})
const valueFieldLabel = computed(() =>
  isPercent.value ? `${props.valueLabel} (%)` : `${props.valueLabel} (${symbol(currencyModel.value)})`,
)
</script>

<template>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
    <FormSelect v-model="type" label="Tipo" :options="typeOptions" />
    <FormSelect
      v-model="currencyModel"
      label="Moneda"
      :options="currencyOptions"
      :disabled="isPercent"
    />
    <FormInput
      v-model="value"
      type="number"
      min="0"
      :max="isPercent ? 100 : undefined"
      step="0.01"
      :label="valueFieldLabel"
      placeholder="0"
      :hint="isPercent ? `En ${symbol(contractCurrency)}, moneda del contrato` : undefined"
      :error="error"
    />
  </div>
</template>
