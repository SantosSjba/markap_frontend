<script setup lang="ts">
import { computed, toRef, watch } from 'vue'
import * as yup from 'yup'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { useCurrencyCatalog } from '@shared/presentation/composables/useCurrencyCatalog'
import { formatMoney } from '@shared/utils/money'
import { toCalendarDateString } from '@shared/utils/formatters'
import type { InteriorProjectPaymentDto } from '../../../proyectos/domain/project.types'
import {
  useCreateFinancePayment,
  useUpdateFinancePayment,
} from '../../../finanzas/presentation/composables/useInteriorFinance'
import { convertToBudgetCurrency } from '../../domain/currency-conversion'
import { PAYMENT_TYPE_OPTIONS } from '../labels'
/**
 * Cobro al cliente (alta y edición): fecha, concepto, tipo, monto en su moneda y, si la moneda
 * no es la del presupuesto, el tipo de cambio del día para convertirlo en la liquidación.
 */

const props = defineProps<{
  projectId: string
  payment: InteriorProjectPaymentDto | null
  budgetCurrency: string
  budgetExchangeRate: number | null
}>()
const open = defineModel<boolean>('open', { required: true })

const { options: currencyOptions } = useCurrencyCatalog()
const createPay = useCreateFinancePayment(toRef(props, 'projectId'))
const updatePay = useUpdateFinancePayment(toRef(props, 'projectId'))

const STATUS_OPTIONS = [
  { value: 'PAID', label: 'Cobrado' },
  { value: 'PENDING', label: 'Programado' },
  { value: 'CANCELLED', label: 'Anulado' },
]

const optionalRate = yup
  .number()
  .transform((v, raw) => (raw === '' || raw == null || Number.isNaN(v) ? undefined : v))
  .positive('Debe ser mayor que cero')
  .nullable()

const schema = yup.object({
  paidAt: yup.string().required('Indique la fecha'),
  concept: yup.string().trim().required('Indique el concepto').max(300),
  paymentType: yup.string().required(),
  amount: yup.number().typeError('Ingrese el monto').positive('Debe ser mayor que cero').required('Ingrese el monto'),
  currency: yup.string().required(),
  exchangeRate: optionalRate,
  status: yup.string().required(),
})

const { handleSubmit, errors, values, resetForm, defineComponentBinds } = useForm({
  validationSchema: toTypedSchema(schema),
})
const b = defineComponentBinds
const paidAtB = b('paidAt')
const conceptB = b('concept')
const typeB = b('paymentType')
const amountB = b('amount')
const currencyB = b('currency')
const rateB = b('exchangeRate')
const statusB = b('status')

const today = () => toCalendarDateString()
watch(open, (o) => {
  if (!o) return
  const p = props.payment
  resetForm({
    values: {
      paidAt: p ? p.paidAt.slice(0, 10) : today(),
      concept: p?.concept ?? '',
      paymentType: p?.paymentType ?? 'ABONO',
      amount: p?.amount ?? (undefined as unknown as number),
      currency: p?.currency ?? props.budgetCurrency,
      exchangeRate: p?.exchangeRate ?? undefined,
      status: p?.status ?? 'PAID',
    },
  })
})

const otherCurrency = computed(() => !!values.currency && values.currency !== props.budgetCurrency)
const equivalent = computed(() => {
  if (!otherCurrency.value || !values.amount) return null
  const value = convertToBudgetCurrency(
    Number(values.amount),
    values.currency!,
    props.budgetCurrency,
    values.exchangeRate ?? props.budgetExchangeRate,
  )
  return value === null ? null : formatMoney(value, props.budgetCurrency)
})
const saving = computed(() => createPay.isPending.value || updatePay.isPending.value)

const onSubmit = handleSubmit(async (v) => {
  const payload = {
    // Mediodía en Lima: la fecha no se corre al guardar en UTC
    paidAt: new Date(`${v.paidAt}T12:00:00-05:00`).toISOString(),
    concept: v.concept.trim(),
    paymentType: v.paymentType,
    amount: Number(v.amount),
    currency: v.currency,
    exchangeRate: v.currency !== props.budgetCurrency ? (v.exchangeRate ?? null) : null,
    status: v.status,
  }
  try {
    if (props.payment) await updatePay.mutateAsync({ paymentId: props.payment.id, payload })
    else await createPay.mutateAsync(payload)
    open.value = false
  } catch {
    void 0
  }
})
</script>

<template>
  <BaseModal v-model="open" :title="payment ? 'Editar cobro' : 'Registrar cobro del cliente'" size="md">
    <form id="client-payment-form" class="grid grid-cols-1 gap-4 p-1 sm:grid-cols-2" novalidate @submit.prevent="onSubmit">
      <FormInput v-bind="conceptB" class="sm:col-span-2" label="Concepto" placeholder="Ej. Adelanto 50% — transferencia BCP" :error="errors.concept" required />
      <FormInput v-bind="paidAtB" type="date" label="Fecha" :error="errors.paidAt" required />
      <FormSelect v-bind="typeB" label="Tipo" :options="PAYMENT_TYPE_OPTIONS" />
      <FormInput v-bind="amountB" type="number" inputmode="decimal" label="Monto" :error="errors.amount" required />
      <FormSelect v-bind="currencyB" label="Moneda" :options="currencyOptions" />
      <FormInput
        v-if="otherCurrency"
        v-bind="rateB"
        type="number"
        inputmode="decimal"
        label="Tipo de cambio del día"
        :placeholder="budgetExchangeRate ? String(budgetExchangeRate) : '3.75'"
        :hint="equivalent ? `Equivale a ${equivalent}` : 'Sin tipo de cambio no se descuenta del saldo'"
        :error="errors.exchangeRate"
      />
      <FormSelect v-bind="statusB" label="Estado" :options="STATUS_OPTIONS" />
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton variant="outline" type="button" @click="open = false">Cancelar</BaseButton>
        <BaseButton variant="primary" type="submit" form="client-payment-form" icon="lucide:save" :loading="saving">Guardar</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
