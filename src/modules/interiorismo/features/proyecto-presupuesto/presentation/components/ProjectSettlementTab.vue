<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, filterActions } = useApplicationAccess('interiorismo')

import { computed, ref, toRef } from 'vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseAlert from '@shared/presentation/components/ui/BaseAlert.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import HelpTooltip, { type HelpTooltipItem } from '@shared/presentation/components/ui/HelpTooltip.vue'
import SectionIntro from '@shared/presentation/components/ui/SectionIntro.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { formatShortDate } from '@shared/utils/formatters'
import { formatMoney } from '@shared/utils/money'
import type { InteriorProjectPaymentDto } from '../../../proyectos/domain/project.types'
import { useDeleteFinancePayment } from '../../../finanzas/presentation/composables/useInteriorFinance'
import { convertToBudgetCurrency } from '../../domain/currency-conversion'
import { useProjectBudget, useProjectSettlement } from '../composables/useProjectBudget'
import { PAYMENT_TYPE_LABELS } from '../labels'
import ClientPaymentFormModal from './ClientPaymentFormModal.vue'
/**
 * Liquidación del proyecto en la moneda del presupuesto: cifras clave, cobros del cliente (cada uno
 * en su moneda, con su equivalente) y el resumen de presupuesto, compras y utilidad.
 */

const props = defineProps<{ projectId: string; payments: InteriorProjectPaymentDto[] }>()
const projectIdRef = toRef(props, 'projectId')
const { data: settlement, isLoading, isError } = useProjectSettlement(projectIdRef)
const { data: budget } = useProjectBudget(projectIdRef)

const currency = computed(() => settlement.value?.currency ?? budget.value?.budget.currency ?? 'PEN')
const rate = computed(() => budget.value?.budget.exchangeRate ?? null)
const money = (n: number | null | undefined, c = currency.value) => formatMoney(n, c)

const s = computed(() => settlement.value)
const paidPct = computed(() =>
  s.value?.budgetTotal ? Math.min(100, Math.round((s.value.totalClientPaid / s.value.budgetTotal) * 100)) : 0,
)
const overpaid = computed(() => (s.value?.pendingToCollect ?? 0) < 0)
const topGroups = computed(() => (budget.value?.rows ?? []).filter((r) => r.kind === 'GROUP' && r.depth === 0))
const globalMode = computed(() => budget.value?.budget.marginMode === 'GLOBAL')

// ── Cobros ──
const STATUS = {
  PAID: { label: 'Cobrado', variant: 'success' },
  PENDING: { label: 'Programado', variant: 'warning' },
  CANCELLED: { label: 'Anulado', variant: 'neutral' },
} as const
const statusOf = (p: InteriorProjectPaymentDto) =>
  STATUS[p.status as keyof typeof STATUS] ?? { label: p.status, variant: 'neutral' as const }

const sortedPayments = computed(() => [...props.payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt)))
const paymentCurrency = (p: InteriorProjectPaymentDto) => p.currency || currency.value
function equivalentOf(p: InteriorProjectPaymentDto): string | null {
  if (paymentCurrency(p) === currency.value) return null
  const v = convertToBudgetCurrency(p.amount, paymentCurrency(p), currency.value, p.exchangeRate ?? rate.value)
  return v === null ? 'sin tipo de cambio' : `≈ ${money(v)}`
}

const modalOpen = ref(false)
const editing = ref<InteriorProjectPaymentDto | null>(null)
function openCreate() {
  editing.value = null
  modalOpen.value = true
}
function openEdit(p: InteriorProjectPaymentDto) {
  editing.value = p
  modalOpen.value = true
}
const deletePay = useDeleteFinancePayment(projectIdRef)
async function remove(p: InteriorProjectPaymentDto) {
  const ok = await markapAlert.confirmDanger({ title: 'Eliminar cobro', text: `«${p.concept}» se eliminará.`, confirmText: 'Eliminar' })
  if (ok) await deletePay.mutateAsync(p.id)
}
// ── Ayuda ──
const HELP: HelpTooltipItem[] = [
  { icon: 'lucide:banknote', term: 'Cobros del cliente', text: 'Lo que el cliente paga: a cuenta (adelantos), saldos y pago final. «Programado» aún no se cobró y no descuenta el saldo.' },
  { icon: 'lucide:hourglass', term: 'Por cobrar', text: 'Presupuesto total (con IGV) − cobrado. Si es negativo, el cliente tiene saldo a favor.' },
  { icon: 'lucide:shopping-cart', term: 'Costo real', text: 'Lo registrado en Compras y contrataciones; el saldo con proveedores es lo que falta pagarles.' },
  { icon: 'lucide:trending-up', term: 'Utilidad estimada', text: 'Ingreso sin IGV − costo real − costo presupuestado de las partidas que aún no tienen costo real. Al completar Compras queda la utilidad final.' },
  { icon: 'lucide:coins', term: 'Otras monedas', text: 'Los cobros en otra moneda se convierten con su tipo de cambio o el del presupuesto; sin tipo de cambio no descuentan el saldo.' },
]
const allCostsKnown = computed(() => (s.value?.pendingCost ?? 0) < 0.01)

const actionsFor = (p: InteriorProjectPaymentDto) =>
  filterActions([
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => openEdit(p) },
    { label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => void remove(p) },
  ])

const th = 'border-b border-gray-200 px-3 py-2.5 text-theme-xs font-medium uppercase tracking-wide whitespace-nowrap text-gray-500 dark:border-gray-800 dark:text-gray-400'
const td = 'border-b border-gray-100 px-3 py-2.5 text-sm dark:border-gray-800'
</script>

<template>
  <LoadingState v-if="isLoading" class="py-16" />
  <p v-else-if="isError || !s" class="py-12 text-center text-sm text-gray-400 dark:text-gray-500">No se pudo cargar la liquidación.</p>
  <div v-else class="space-y-6">
    <SectionIntro
      title="Liquidación del proyecto"
      :subtitle="`Cuánto se cobró al cliente, cuánto costó el proyecto y cuánto queda de utilidad, en ${currency}.`"
      help-title="¿Qué muestra la liquidación?"
      :help="HELP"
    />
    <div class="grid grid-cols-2 gap-3 xl:grid-cols-5">
      <StatsCard compact title="Presupuesto" :value="money(s.budgetTotal)" :subtitle="s.igvTotal ? `IGV ${money(s.igvTotal)}` : 'total al cliente'">
        <template #icon><AppIcon icon="lucide:file-spreadsheet" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Cobrado" :value="money(s.totalClientPaid)" :subtitle="`${paidPct}% del total`">
        <template #icon><AppIcon icon="lucide:wallet" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        :title="overpaid ? 'Saldo a favor' : 'Por cobrar'"
        :value="money(Math.abs(s.pendingToCollect))"
        :subtitle="s.scheduledPayments ? `${money(s.scheduledPayments)} programado` : overpaid ? 'cobrado de más' : 'saldo del cliente'"
      >
        <template #icon><AppIcon icon="lucide:hourglass" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Costo real" :value="money(s.totalActualCost)" :subtitle="s.supplierBalance > 0 ? `${money(s.supplierBalance)} por pagar` : 'compras'">
        <template #icon><AppIcon icon="lucide:shopping-cart" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        class="col-span-2 xl:col-span-1"
        :title="allCostsKnown ? 'Utilidad' : 'Utilidad estimada'"
        :value="money(s.milestoneUtility)"
        :subtitle="s.marginPct != null ? `${s.marginPct}% de margen${allCostsKnown ? '' : ' (estimado)'}` : 'sin presupuesto'"
      >
        <template #icon><AppIcon icon="lucide:trending-up" :size="20" /></template>
      </StatsCard>
    </div>

    <BaseAlert v-if="s.unconverted.length" type="warning" title="Cobros sin tipo de cambio">
      {{ s.unconverted.map((u) => money(u.amount, u.currency)).join(' · ') }} no se descuentan del saldo porque
      están en otra moneda y no tienen tipo de cambio. Edite el cobro o indique el tipo de cambio del presupuesto.
    </BaseAlert>

    <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
      <FormSectionCard class="xl:col-span-2" title="Cobros del cliente" subtitle="A cuenta, saldo y pago final" icon="lucide:banknote" show-icon>
        <template #actions>
          <BaseButton v-if="canWrite" variant="primary" size="sm" icon="lucide:plus" @click="openCreate">Registrar cobro</BaseButton>
        </template>
        <div class="-mx-6 -mb-6 overflow-x-auto">
          <table class="w-full min-w-max border-collapse">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th :class="[th, 'text-left']">Fecha</th>
                <th :class="[th, 'text-left']">Concepto</th>
                <th :class="[th, 'text-right']">Monto</th>
                <th :class="[th, 'text-left']">Estado</th>
                <th :class="[th, 'w-12']" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in sortedPayments" :key="p.id" class="hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                <td :class="[td, 'whitespace-nowrap text-gray-500 dark:text-gray-400']">{{ formatShortDate(p.paidAt) }}</td>
                <td :class="td">
                  <p class="text-gray-800 dark:text-white/90">{{ p.concept }}</p>
                  <p class="text-theme-xs text-gray-400">{{ PAYMENT_TYPE_LABELS[p.paymentType ?? 'OTHER'] ?? p.paymentType }}</p>
                </td>
                <td :class="[td, 'text-right tabular-nums']">
                  <p :class="['font-medium', p.status === 'CANCELLED' ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-white/90']">
                    {{ money(p.amount, paymentCurrency(p)) }}
                  </p>
                  <p v-if="equivalentOf(p)" class="text-theme-xs text-gray-400">{{ equivalentOf(p) }}</p>
                </td>
                <td :class="td"><Badge :variant="statusOf(p).variant">{{ statusOf(p).label }}</Badge></td>
                <td :class="[td, 'text-right']"><ActionsDropdown :items="actionsFor(p)" /></td>
              </tr>
              <tr v-if="!sortedPayments.length">
                <td colspan="5" class="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Aún no hay cobros registrados.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </FormSectionCard>

      <aside class="space-y-6">
        <FormSectionCard title="Liquidación" :subtitle="`En ${currency}`" icon="lucide:scale" show-icon>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between gap-3"><dt class="text-gray-500 dark:text-gray-400">Presupuesto total</dt><dd class="font-medium tabular-nums">{{ money(s.budgetTotal) }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-gray-500 dark:text-gray-400">Cobrado a cuenta</dt><dd class="tabular-nums">{{ money(s.depositsOnAccount) }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-gray-500 dark:text-gray-400">Total cobrado</dt><dd class="tabular-nums">{{ money(s.totalClientPaid) }}</dd></div>
            <div v-for="c in s.paidByCurrency" :key="c.currency" class="flex justify-between gap-3 ps-3 text-theme-xs">
              <dt class="text-gray-400">incluye cobros en {{ c.currency }}</dt><dd class="tabular-nums text-gray-500">{{ money(c.amount, c.currency) }}</dd>
            </div>
            <div class="flex justify-between gap-3 border-t border-gray-100 pt-2 dark:border-gray-800">
              <dt class="font-medium text-gray-800 dark:text-white/90">{{ overpaid ? 'Saldo a favor del cliente' : 'Por cobrar' }}</dt>
              <dd class="font-semibold tabular-nums">{{ money(Math.abs(s.pendingToCollect)) }}</dd>
            </div>
            <div v-if="s.igvTotal" class="flex justify-between gap-3 pt-2">
              <dt class="flex items-center gap-1 text-gray-500 dark:text-gray-400">Ingreso sin IGV <HelpTooltip :size="13" width="w-64" :text="`Presupuesto total − IGV (${money(s.igvTotal)}). El IGV se paga a SUNAT, no es ingreso del proyecto.`" /></dt>
              <dd class="tabular-nums">{{ money(s.netRevenue) }}</dd>
            </div>
            <div class="flex justify-between gap-3" :class="!s.igvTotal && 'pt-2'"><dt class="text-gray-500 dark:text-gray-400">Costo real (compras)</dt><dd class="tabular-nums">{{ money(s.totalActualCost) }}</dd></div>
            <div v-if="!allCostsKnown" class="flex justify-between gap-3">
              <dt class="flex items-center gap-1 text-gray-500 dark:text-gray-400">Costo pendiente <HelpTooltip :size="13" width="w-64" text="Costo presupuestado de las partidas que aún no tienen costo real en Compras. Se reemplaza al registrar el costo real." /></dt>
              <dd class="tabular-nums">{{ money(s.pendingCost) }}</dd>
            </div>
            <div class="flex justify-between gap-3"><dt class="text-gray-500 dark:text-gray-400">Abonado a proveedores</dt><dd class="tabular-nums">{{ money(s.totalSupplierPayments) }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-gray-500 dark:text-gray-400">Saldo con proveedores</dt><dd class="tabular-nums">{{ money(s.supplierBalance) }}</dd></div>
            <div class="flex justify-between gap-3 border-t border-gray-100 pt-2 dark:border-gray-800">
              <dt class="font-medium text-gray-800 dark:text-white/90">{{ allCostsKnown ? 'Utilidad del proyecto' : 'Utilidad estimada' }}</dt>
              <dd :class="['font-semibold tabular-nums', s.milestoneUtility < 0 ? 'text-error-500' : 'text-success-600 dark:text-success-400']">{{ money(s.milestoneUtility) }}</dd>
            </div>
          </dl>
        </FormSectionCard>

        <FormSectionCard v-if="topGroups.length" title="Por grupo" :subtitle="globalMode ? 'Costo directo (GG y utilidad se suman al total)' : 'Precio al cliente'" icon="lucide:layers" show-icon>
          <dl class="space-y-2 text-sm">
            <div v-for="g in topGroups" :key="g.id" class="flex justify-between gap-3">
              <dt class="min-w-0 truncate text-gray-500 dark:text-gray-400">{{ g.code }} · {{ g.description }}</dt>
              <dd class="shrink-0 tabular-nums">{{ money(globalMode ? g.cost : g.price) }}</dd>
            </div>
          </dl>
        </FormSectionCard>
      </aside>
    </div>

    <ClientPaymentFormModal
      v-model:open="modalOpen"
      :project-id="projectId"
      :payment="editing"
      :budget-currency="currency"
      :budget-exchange-rate="rate"
    />
  </div>
</template>
