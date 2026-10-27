<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import Avatar from '@shared/presentation/components/ui/Avatar.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
import { formatCurrency, formatShortDate, toCalendarDateString } from '@shared/utils/formatters'
import { DEDUCTIBLE_LABELS } from '../../../ventas-sales/domain/commission-draft'
import {
  COMMISSION_STATUS,
  agentTypeLabel,
  canPayCommission,
  commissionBaseCurrency,
  commissionBasePrice,
  commissionBuyerName,
  commissionCalculationLabel,
  commissionGross,
  commissionNet,
  commissionPaidAmount,
  commissionPendingAmount,
} from '../../domain/commission-display'
import type { CommissionRow } from '../../domain/finanzas.types'
import EditCommissionModal from '../../../ventas-sales/presentation/components/EditCommissionModal.vue'
import {
  useVentasMarkCommissionPaid,
  useVentasMarkCommissionPaymentPartPaid,
} from '../composables/useVentasFinanzas'
/**
 * CommissionDetailModal — detalle de una comisión de venta: proceso, base del cálculo, bruto,
 * deducibles y neto (siempre en la moneda de la comisión), cuotas y registro de pagos con fecha.
 */

const props = defineProps<{ commission: CommissionRow | null }>()
const open = defineModel<boolean>('open', { required: true })

const router = useRouter()
const { canWrite } = useApplicationAccess('ventas')

const c = computed(() => props.commission)
const currency = computed(() => c.value?.currency ?? 'PEN')
const money = (n: number) => formatCurrency(n, currency.value)
const basePrice = computed(() => (c.value ? commissionBasePrice(c.value) : null))
const baseCurrency = computed(() => (c.value ? commissionBaseCurrency(c.value) : 'PEN'))
const paid = computed(() => (c.value ? commissionPaidAmount(c.value) : 0))
const pending = computed(() => (c.value ? commissionPendingAmount(c.value) : 0))
const net = computed(() => (c.value ? commissionNet(c.value) : 0))
const progress = computed(() => (net.value > 0 ? Math.round((paid.value / net.value) * 100) : 0))
const payable = computed(() => !!c.value && canWrite.value && canPayCommission(c.value))

// Registro de pago: total pendiente o una cuota, con fecha
type PayTarget = { kind: 'all' } | { kind: 'part'; id: string; label: string; amount: number }
const payTarget = ref<PayTarget | null>(null)
const payDate = ref(toCalendarDateString())
watch(open, (v) => {
  if (v) payTarget.value = null
})
function startPay(target: PayTarget) {
  payTarget.value = target
  payDate.value = toCalendarDateString()
}
const payAmount = computed(() => {
  const t = payTarget.value
  if (!t) return 0
  return t.kind === 'part' ? t.amount : pending.value
})

// Editar % o monto pactado: se cierra el detalle al guardar para mostrar los datos recalculados
const editOpen = ref(false)
const editable = computed(
  () => !!c.value && canWrite.value && c.value.status !== 'CANCELLED' && c.value.saleProcess?.status !== 'LOST',
)

const { mutate: markPaid, isPending: payingAll } = useVentasMarkCommissionPaid()
const { mutate: markPartPaid, isPending: payingPart } = useVentasMarkCommissionPaymentPartPaid()

function confirmPay() {
  const t = payTarget.value
  if (!t || !c.value) return
  const paidAt = payDate.value || null
  const done = { onSuccess: () => (payTarget.value = null) }
  if (t.kind === 'part') markPartPaid({ partId: t.id, paidAt }, done)
  else markPaid({ id: c.value.id, paidAt }, done)
}

function goProcess() {
  const id = c.value?.saleProcess?.id
  if (!id) return
  open.value = false
  void router.push({ name: 'ventas-proceso-detalle', params: { id } })
}
</script>

<template>
  <BaseModal v-model="open" title="Detalle de comisión" size="lg">
    <div v-if="c" class="space-y-5">
      <!-- Asesor y estado -->
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <Avatar :name="c.agent.fullName" />
          <div>
            <p class="font-semibold text-gray-800 dark:text-white/90">{{ c.agent.fullName }}</p>
            <p class="text-theme-xs text-gray-500 dark:text-gray-400">
              {{ agentTypeLabel(c.agent.type) }} · {{ commissionCalculationLabel(c) }}
            </p>
          </div>
        </div>
        <Badge :variant="COMMISSION_STATUS[c.status]?.variant ?? 'neutral'">
          {{ COMMISSION_STATUS[c.status]?.label ?? c.status }}
        </Badge>
      </div>

      <!-- Operación -->
      <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-white/3">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0 space-y-1">
            <p v-if="c.saleProcess" class="flex items-center gap-2 font-medium text-gray-800 dark:text-white/90">
              <AppIcon icon="lucide:handshake" :size="16" color="var(--color-primary)" />
              {{ c.saleProcess.code }}<span v-if="c.saleProcess.title" class="font-normal text-gray-500 dark:text-gray-400"> · {{ c.saleProcess.title }}</span>
            </p>
            <p class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <AppIcon icon="lucide:building-2" :size="16" color="var(--color-text-muted)" />
              {{ c.saleProcess?.property.code ?? c.closing?.property.code }} ·
              {{ c.saleProcess?.property.addressLine ?? c.closing?.property.addressLine }}
            </p>
            <p class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <AppIcon icon="lucide:user" :size="16" color="var(--color-text-muted)" />
              {{ commissionBuyerName(c) }} <span class="text-theme-xs text-gray-400">comprador</span>
            </p>
          </div>
          <BaseButton v-if="c.saleProcess" variant="ghost" size="sm" icon="lucide:external-link" @click="goProcess">
            Ver proceso
          </BaseButton>
        </div>
        <p class="mt-3 flex items-center gap-2 border-t border-gray-200 pt-3 text-theme-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <AppIcon icon="lucide:scale" :size="14" />
          <template v-if="basePrice != null">
            {{ c.closing ? 'Precio final' : 'Precio de lista' }}: {{ formatCurrency(basePrice, baseCurrency) }}
          </template>
          <template v-else>Sin precio base</template>
          <template v-if="c.closing"> · cerrada el {{ formatShortDate(c.closing.closedAt) }}</template>
        </p>
      </div>

      <!-- Importes -->
      <dl class="grid grid-cols-3 gap-3 text-sm">
        <div class="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Bruto</dt>
          <dd class="mt-1 font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ money(commissionGross(c)) }}</dd>
        </div>
        <div class="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Deducibles</dt>
          <dd class="mt-1 font-semibold tabular-nums text-gray-800 dark:text-white/90">− {{ money(c.deductiblesTotal ?? 0) }}</dd>
        </div>
        <div class="rounded-xl border border-brand-200 bg-brand-50 p-3 dark:border-brand-500/30 dark:bg-brand-500/10">
          <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Neto a pagar</dt>
          <dd class="mt-1 font-bold tabular-nums text-brand-600 dark:text-brand-400">{{ money(net) }}</dd>
        </div>
      </dl>
      <ul v-if="c.deductibles?.length" class="space-y-1 text-theme-xs text-gray-500 dark:text-gray-400">
        <li v-for="d in c.deductibles" :key="d.id" class="flex justify-between gap-2">
          <span>{{ DEDUCTIBLE_LABELS[d.deductibleType] ?? d.deductibleType }}<template v-if="d.description"> · {{ d.description }}</template></span>
          <span class="tabular-nums">− {{ money(d.amount) }}</span>
        </li>
      </ul>

      <!-- Avance de pago -->
      <div v-if="c.status !== 'CANCELLED'">
        <div class="mb-1.5 flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
          <span>Pagado {{ money(paid) }}</span>
          <span>Pendiente {{ money(pending) }}</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div class="h-full rounded-full bg-success-500 transition-all" :style="{ width: `${progress}%` }" />
        </div>
      </div>
      <p v-else class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <AppIcon icon="lucide:ban" :size="16" />Comisión anulada: la venta se registró como caída.
      </p>

      <!-- Cuotas -->
      <div v-if="c.paymentParts?.length">
        <p class="mb-2 text-sm font-medium text-gray-800 dark:text-white/90">Plan de pago</p>
        <ul class="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          <li v-for="part in c.paymentParts" :key="part.id" class="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <AppIcon
              :icon="part.status === 'PAID' ? 'lucide:circle-check' : 'lucide:clock'"
              :size="16"
              :class="part.status === 'PAID' ? 'text-success-500' : 'text-gray-400'"
            />
            <div class="min-w-0 flex-1">
              <p class="text-gray-800 dark:text-white/90">{{ part.label || `Cuota ${part.partNumber}` }}</p>
              <p class="text-theme-xs text-gray-400 dark:text-gray-500">
                <template v-if="part.status === 'PAID'">Pagada {{ part.paidAt ? `el ${formatShortDate(part.paidAt)}` : '' }}</template>
                <template v-else-if="part.dueDate">Vence {{ formatShortDate(part.dueDate) }}</template>
                <template v-else>Pendiente</template>
              </p>
            </div>
            <span class="font-medium tabular-nums text-gray-800 dark:text-white/90">{{ money(part.amount) }}</span>
            <BaseButton
              v-if="payable && part.status !== 'PAID'"
              variant="outline"
              size="sm"
              @click="startPay({ kind: 'part', id: part.id, label: part.label || `Cuota ${part.partNumber}`, amount: part.amount })"
            >
              Pagar
            </BaseButton>
          </li>
        </ul>
      </div>
      <p v-else-if="c.status === 'PAID' && c.paidAt" class="flex items-center gap-2 text-sm text-success-600 dark:text-success-500">
        <AppIcon icon="lucide:circle-check" :size="16" />Pagada el {{ formatShortDate(c.paidAt) }}
      </p>

      <!-- Confirmación de pago -->
      <div
        v-if="payTarget"
        class="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10"
      >
        <p class="text-sm font-medium text-gray-800 dark:text-white/90">
          {{ payTarget.kind === 'part' ? `Registrar pago de ${payTarget.label}` : 'Registrar pago de todo lo pendiente' }}:
          <span class="tabular-nums">{{ money(payAmount) }}</span>
        </p>
        <div class="mt-3 flex flex-wrap items-end gap-3">
          <FormInput v-model="payDate" type="date" label="Fecha de pago" class="w-full sm:w-48" />
          <div class="flex gap-2">
            <BaseButton variant="outline" size="sm" @click="payTarget = null">Cancelar</BaseButton>
            <BaseButton variant="primary" size="sm" icon="lucide:circle-check" :loading="payingAll || payingPart" @click="confirmPay">
              Confirmar pago
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-3">
        <BaseButton variant="outline" @click="open = false">Cerrar</BaseButton>
        <BaseButton v-if="editable && !payTarget" variant="outline" icon="lucide:pencil" @click="editOpen = true">
          Editar comisión
        </BaseButton>
        <BaseButton
          v-if="payable && pending > 0 && !payTarget"
          variant="primary"
          icon="lucide:wallet"
          @click="startPay({ kind: 'all' })"
        >
          Pagar pendiente ({{ money(pending) }})
        </BaseButton>
      </div>
    </template>
  </BaseModal>
  <EditCommissionModal
    v-model="editOpen"
    :commission="c ? { ...c, calculationType: c.calculationType ?? 'PERCENT' } : null"
    :base-price="basePrice"
    @saved="open = false"
  />
</template>
