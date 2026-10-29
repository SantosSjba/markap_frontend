<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import { formatCurrency, formatShortDate, toCalendarDateString } from '@shared/utils/formatters'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import {
  BUYER_PAYMENT_KIND_OPTIONS,
  DOC_COST_TYPE_OPTIONS,
  buyerPaymentKindLabel,
  buyerPaymentStatus,
  docCostTypeLabel,
} from '../../domain/closing-finance-display'
import {
  useVentasBuyerPaymentsList,
  useVentasClosingProfitability,
  useVentasCreateBuyerPayment,
  useVentasCreateDocumentationCost,
  useVentasDocumentationCostsList,
  useVentasMarkBuyerPaymentPaid,
} from '../composables/useVentasFinanzas'
import { useCurrencyCatalog } from '@shared/presentation/composables/useCurrencyCatalog'

/**
 * Cobranza y gastos de un cierre, en la moneda de la venta: cronograma de pagos del comprador
 * (inicial y cuotas, con la separación a cuenta), gastos de documentación y rentabilidad estimada.
 * Alimenta el «Flujo financiero» de Reportes.
 */
const props = defineProps<{
  closingId: string
  currency: string
  canWrite: boolean
}>()

const closingId = computed(() => props.closingId)
const money = (n: number) => formatCurrency(n, props.currency)
const { options: currencyOptions, label: currencyLabel } = useCurrencyCatalog()

const { data: profit, isError: profitError, error: profitFetchError, refetch: refetchProfit } =
  useVentasClosingProfitability(closingId)
const paymentsParams = computed(() => ({ page: 1, limit: 100, saleClosingId: props.closingId }))
const { data: paymentsResult, isLoading: loadingPayments } = useVentasBuyerPaymentsList(paymentsParams)
const costsParams = computed(() => ({ page: 1, limit: 100, saleClosingId: props.closingId }))
const { data: costsResult, isLoading: loadingCosts } = useVentasDocumentationCostsList(costsParams)

const payments = computed(() =>
  [...(paymentsResult.value?.data ?? [])].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
)
/** «Cuota 2», «Cuota 3»…: la numeración cuenta solo las cuotas, no la inicial */
const paymentLabel = (id: string, kind: string) => {
  if (kind !== 'INSTALLMENT') return buyerPaymentKindLabel(kind)
  const n = payments.value.filter((p) => p.kind === 'INSTALLMENT').findIndex((p) => p.id === id) + 1
  return `${buyerPaymentKindLabel(kind)} ${n}`
}
const costs = computed(() => costsResult.value?.data ?? [])
/** Gastos por moneda: cada gasto se registra en la moneda en que se pagó y no se mezclan */
const costTotals = computed(() => {
  const totals = new Map<string, number>()
  for (const c of costs.value) totals.set(c.currency, (totals.get(c.currency) ?? 0) + c.amount)
  return [...totals.entries()]
    .sort(([a], [b]) => (a === props.currency ? -1 : b === props.currency ? 1 : a.localeCompare(b)))
    .map(([currency, amount]) => ({ currency, amount }))
})
const balance = computed(() => profit.value?.balanceToSchedule ?? 0)
const collectedPercent = computed(() => {
  const p = profit.value
  if (!p || p.finalPrice <= 0) return 0
  return Math.min(100, Math.round(((p.separationAmount + p.buyerPaymentsPaid) / p.finalPrice) * 100))
})

// ── Registrar pago del comprador ──
const { mutate: createPayment, isPending: creatingPayment } = useVentasCreateBuyerPayment()
const paymentOpen = ref(false)
const paymentForm = ref({ kind: 'DOWN_PAYMENT', amount: null as number | null, dueDate: '', notes: '' })
const paymentError = ref('')
function openPayment() {
  paymentForm.value = {
    kind: payments.value.length ? 'INSTALLMENT' : 'DOWN_PAYMENT',
    amount: balance.value > 0 ? balance.value : null,
    dueDate: toCalendarDateString(),
    notes: '',
  }
  paymentError.value = ''
  paymentOpen.value = true
}
function submitPayment() {
  const f = paymentForm.value
  const amount = Number(f.amount)
  if (!f.amount || amount <= 0) return void (paymentError.value = 'Indique un monto mayor que cero.')
  if (amount > balance.value + 0.01)
    return void (paymentError.value = `Supera el saldo por programar (${money(balance.value)}).`)
  if (!f.dueDate) return void (paymentError.value = 'Indique la fecha de vencimiento.')
  paymentError.value = ''
  createPayment(
    {
      saleClosingId: props.closingId,
      kind: f.kind,
      amount,
      currency: props.currency,
      dueDate: f.dueDate,
      notes: f.notes.trim() || null,
    },
    { onSuccess: () => (paymentOpen.value = false) },
  )
}

// ── Marcar pago cobrado ──
const { mutate: markPaid, isPending: markingPaid } = useVentasMarkBuyerPaymentPaid()
const paidTarget = ref<{ id: string; label: string; amount: number } | null>(null)
const paidDate = ref(toCalendarDateString())
function startMarkPaid(id: string, label: string, amount: number) {
  paidTarget.value = { id, label, amount }
  paidDate.value = toCalendarDateString()
}
function confirmMarkPaid() {
  const t = paidTarget.value
  if (!t) return
  markPaid({ id: t.id, paidAt: paidDate.value || null }, { onSuccess: () => (paidTarget.value = null) })
}

// ── Registrar gasto de documentación ──
const { mutate: createCost, isPending: creatingCost } = useVentasCreateDocumentationCost()
const costOpen = ref(false)
const costForm = ref({
  costType: 'NOTARY',
  currency: props.currency,
  amount: null as number | null,
  expenseDate: '',
  description: '',
})
const costError = ref('')
function openCost() {
  costForm.value = {
    costType: 'NOTARY',
    currency: props.currency,
    amount: null,
    expenseDate: toCalendarDateString(),
    description: '',
  }
  costError.value = ''
  costOpen.value = true
}
function submitCost() {
  const f = costForm.value
  const amount = Number(f.amount)
  if (!f.amount || amount <= 0) return void (costError.value = 'Indique un monto mayor que cero.')
  if (!f.currency) return void (costError.value = 'Seleccione la moneda del gasto.')
  costError.value = ''
  createCost(
    {
      saleClosingId: props.closingId,
      costType: f.costType,
      amount,
      currency: f.currency,
      expenseDate: f.expenseDate || null,
      description: f.description.trim() || null,
    },
    { onSuccess: () => (costOpen.value = false) },
  )
}
</script>

<template>
  <div class="space-y-6">
    <!-- Resumen de cobranza y rentabilidad -->
    <div v-if="profitError" class="flex flex-wrap items-center gap-2 text-sm">
      <span class="text-error-500 dark:text-error-400">{{ getApiErrorMessage(profitFetchError) }}</span>
      <BaseButton variant="outline" size="sm" @click="() => refetchProfit()">Reintentar</BaseButton>
    </div>
    <template v-else-if="profit">
      <dl class="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div class="rounded-lg bg-gray-50 p-3 dark:bg-white/3">
          <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Precio final</dt>
          <dd class="mt-1 font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ money(profit.finalPrice) }}</dd>
        </div>
        <div class="rounded-lg bg-gray-50 p-3 dark:bg-white/3">
          <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Separación a cuenta</dt>
          <dd class="mt-1 font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ money(profit.separationAmount) }}</dd>
        </div>
        <div class="rounded-lg bg-gray-50 p-3 dark:bg-white/3">
          <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Cobrado al comprador</dt>
          <dd class="mt-1 font-semibold tabular-nums text-success-600 dark:text-success-500">
            {{ money(profit.buyerPaymentsPaid) }}
          </dd>
          <dd class="text-theme-xs text-gray-400 dark:text-gray-500">de {{ money(profit.buyerPaymentsScheduled) }} programado</dd>
        </div>
        <div class="rounded-lg bg-gray-50 p-3 dark:bg-white/3">
          <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Saldo por programar</dt>
          <dd
            class="mt-1 font-semibold tabular-nums"
            :class="profit.balanceToSchedule > 0 ? 'text-warning-600 dark:text-orange-400' : 'text-gray-800 dark:text-white/90'"
          >
            {{ money(profit.balanceToSchedule) }}
          </dd>
        </div>
      </dl>
      <div>
        <div class="mb-1 flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
          <span>Precio cubierto (separación + cobrado)</span>
          <span class="tabular-nums">{{ collectedPercent }} %</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div class="h-full rounded-full bg-success-500" :style="{ width: `${collectedPercent}%` }" />
        </div>
      </div>
    </template>

    <!-- Pagos del comprador -->
    <section>
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p class="flex items-center gap-2 text-theme-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
          <AppIcon icon="lucide:wallet" :size="14" />Pagos del comprador
        </p>
        <BaseButton v-if="canWrite && balance > 0" variant="outline" size="sm" icon="lucide:plus" @click="openPayment">
          Programar pago
        </BaseButton>
      </div>
      <p v-if="loadingPayments" class="text-sm text-gray-500 dark:text-gray-400">Cargando pagos...</p>
      <ul v-else-if="payments.length" class="divide-y divide-gray-100 text-sm dark:divide-gray-800">
        <li v-for="p in payments" :key="p.id" class="flex flex-wrap items-center justify-between gap-2 py-2.5">
          <div class="min-w-0">
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ paymentLabel(p.id, p.kind) }}
            </p>
            <p class="text-theme-xs text-gray-500 dark:text-gray-400">
              Vence {{ formatShortDate(p.dueDate) }}<template v-if="p.paidAt"> · cobrado {{ formatShortDate(p.paidAt) }}</template>
              <template v-if="p.notes"> · {{ p.notes }}</template>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="tabular-nums font-semibold text-gray-800 dark:text-white/90">{{ formatCurrency(p.amount, p.currency) }}</span>
            <Badge :variant="buyerPaymentStatus(p.displayStatus).variant">{{ buyerPaymentStatus(p.displayStatus).label }}</Badge>
            <BaseButton
              v-if="canWrite && p.status !== 'PAID'"
              variant="ghost"
              size="sm"
              icon="lucide:circle-check"
              @click="startMarkPaid(p.id, paymentLabel(p.id, p.kind), p.amount)"
            >
              Cobrado
            </BaseButton>
          </div>
        </li>
      </ul>
      <p v-else class="text-sm text-gray-400 dark:text-gray-500">
        Sin pagos programados. Registre la inicial y las cuotas para seguir la cobranza.
      </p>
    </section>

    <!-- Gastos de documentación -->
    <section>
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p class="flex items-center gap-2 text-theme-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
          <AppIcon icon="lucide:receipt" :size="14" />Gastos de documentación
        </p>
        <BaseButton v-if="canWrite" variant="outline" size="sm" icon="lucide:plus" @click="openCost">Registrar gasto</BaseButton>
      </div>
      <p v-if="loadingCosts" class="text-sm text-gray-500 dark:text-gray-400">Cargando gastos...</p>
      <ul v-else-if="costs.length" class="divide-y divide-gray-100 text-sm dark:divide-gray-800">
        <li v-for="c in costs" :key="c.id" class="flex flex-wrap items-center justify-between gap-2 py-2.5">
          <div class="min-w-0">
            <p class="font-medium text-gray-800 dark:text-white/90">{{ docCostTypeLabel(c.costType) }}</p>
            <p class="text-theme-xs text-gray-500 dark:text-gray-400">
              {{ formatShortDate(c.expenseDate) }}<template v-if="c.description"> · {{ c.description }}</template>
            </p>
          </div>
          <span class="tabular-nums font-semibold text-gray-800 dark:text-white/90">{{ formatCurrency(c.amount, c.currency) }}</span>
        </li>
      </ul>
      <p v-else class="text-sm text-gray-400 dark:text-gray-500">Sin gastos registrados (notaría, registros públicos, otros).</p>
      <div v-if="costTotals.length" class="mt-2 flex flex-wrap justify-end gap-2">
        <span v-for="t in costTotals" :key="t.currency" class="rounded-lg bg-gray-50 px-3 py-1.5 text-sm dark:bg-white/3">
          <span class="text-theme-xs text-gray-500 dark:text-gray-400">Total {{ t.currency }}</span>
          <span class="ml-2 font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ formatCurrency(t.amount, t.currency) }}</span>
        </span>
      </div>
    </section>

    <!-- Rentabilidad estimada -->
    <section v-if="profit" class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <p class="mb-3 flex items-center gap-2 text-theme-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
        <AppIcon icon="lucide:calculator" :size="14" />Rentabilidad estimada
      </p>
      <dl class="space-y-1.5 text-sm">
        <div class="flex justify-between">
          <dt class="text-gray-500 dark:text-gray-400">Precio final</dt>
          <dd class="tabular-nums text-gray-800 dark:text-white/90">{{ money(profit.finalPrice) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-gray-500 dark:text-gray-400">Comisiones de asesores (neto)</dt>
          <dd class="tabular-nums text-gray-800 dark:text-white/90">− {{ money(profit.commissionAmount) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-gray-500 dark:text-gray-400">Gastos de documentación</dt>
          <dd class="tabular-nums text-gray-800 dark:text-white/90">− {{ money(profit.documentationCostsTotal) }}</dd>
        </div>
        <div class="flex justify-between border-t border-gray-100 pt-2 font-semibold dark:border-gray-800">
          <dt class="text-gray-800 dark:text-white/90">Neto estimado</dt>
          <dd class="tabular-nums text-brand-500 dark:text-brand-400">{{ money(profit.netEstimated) }}</dd>
        </div>
      </dl>
      <p v-for="o in profit.otherCurrencies ?? []" :key="o.currency" class="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
        En {{ o.currency }}, aparte (no se resta del neto):
        <template v-if="o.commissions">comisiones {{ formatCurrency(o.commissions, o.currency) }}</template>
        <template v-if="o.commissions && o.documentationCosts"> · </template>
        <template v-if="o.documentationCosts">gastos {{ formatCurrency(o.documentationCosts, o.currency) }}</template>
      </p>
    </section>

    <!-- Programar pago -->
    <BaseModal v-model="paymentOpen" title="Programar pago del comprador" size="md">
      <div class="space-y-4 p-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Saldo por programar: <strong>{{ money(balance) }}</strong>.
        </p>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect v-model="paymentForm.kind" label="Tipo" :options="BUYER_PAYMENT_KIND_OPTIONS" />
          <FormInput
            :model-value="currencyLabel(currency)"
            label="Moneda"
            hint="La de la venta: la inicial y las cuotas forman parte del precio"
            disabled
          />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput v-model="paymentForm.amount" type="number" step="0.01" min="0" :label="`Monto (${currency})`" required />
          <FormInput v-model="paymentForm.dueDate" type="date" label="Vence el" required />
        </div>
        <FormTextarea v-model="paymentForm.notes" label="Notas" placeholder="Ej. Desembolso del banco, transferencia..." :rows="2" />
        <p v-if="paymentError" class="text-sm text-error-600 dark:text-error-500">{{ paymentError }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="outline" :disabled="creatingPayment" @click="paymentOpen = false">Cancelar</BaseButton>
          <BaseButton variant="primary" icon="lucide:save" :loading="creatingPayment" @click="submitPayment">Guardar pago</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Marcar cobrado -->
    <BaseModal
      :model-value="!!paidTarget"
      title="Registrar cobro"
      size="sm"
      @update:model-value="(v: boolean) => !v && (paidTarget = null)"
    >
      <div class="space-y-4 p-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{ paidTarget?.label }} por <strong>{{ paidTarget ? money(paidTarget.amount) : '' }}</strong>.
        </p>
        <FormInput v-model="paidDate" type="date" label="Fecha de cobro" />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="outline" :disabled="markingPaid" @click="paidTarget = null">Cancelar</BaseButton>
          <BaseButton variant="primary" icon="lucide:circle-check" :loading="markingPaid" @click="confirmMarkPaid">
            Confirmar cobro
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Registrar gasto -->
    <BaseModal v-model="costOpen" title="Registrar gasto de documentación" size="md">
      <div class="space-y-4 p-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Registre el gasto en la moneda en que se pagó. Los gastos en {{ currency }} se restan de la rentabilidad; los de
          otra moneda se muestran aparte.
        </p>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect v-model="costForm.costType" label="Tipo" :options="DOC_COST_TYPE_OPTIONS" />
          <FormSelect v-model="costForm.currency" label="Moneda" :options="currencyOptions" required />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput v-model="costForm.amount" type="number" step="0.01" min="0" :label="`Monto (${costForm.currency})`" required />
          <FormInput v-model="costForm.expenseDate" type="date" label="Fecha del gasto" />
        </div>
        <FormTextarea v-model="costForm.description" label="Detalle" placeholder="Ej. Escritura en Notaría Pérez" :rows="2" />
        <p v-if="costError" class="text-sm text-error-600 dark:text-error-500">{{ costError }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="outline" :disabled="creatingCost" @click="costOpen = false">Cancelar</BaseButton>
          <BaseButton variant="primary" icon="lucide:save" :loading="creatingCost" @click="submitCost">Guardar gasto</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
