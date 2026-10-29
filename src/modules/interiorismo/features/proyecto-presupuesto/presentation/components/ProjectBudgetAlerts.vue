<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@shared/presentation/ui/dropdown-menu'
import { formatMoney } from '@shared/utils/money'
import type { BudgetSheetDto, ProjectSettlementDto } from '../../domain/project-budget.types'
import { PURCHASES_VIEWS, type PurchasesView } from '../../domain/purchases-views'
/**
 * Alertas financieras del proyecto en un botón con contador (no ocupan espacio fijo).
 * Cada alerta lleva a donde se resuelve: cobros en Liquidación; proveedores en Compras,
 * con la vista ya filtrada.
 */

const props = defineProps<{
  budget?: BudgetSheetDto | null
  settlement?: ProjectSettlementDto | null
}>()

const emit = defineEmits<{ go: [target: { tab: 'compras' | 'liquidacion'; view?: PurchasesView }] }>()

const allItems = computed(() => props.budget?.rows.filter((r) => r.kind === 'ITEM') ?? [])
const currency = computed(() => props.budget?.budget.currency ?? 'PEN')

const pendingClientCollect = computed(() => props.settlement?.pendingToCollect ?? 0)

const supplierBalanceItems = computed(() => allItems.value.filter(PURCHASES_VIEWS.balance.test))
const totalSupplierPending = computed(() => supplierBalanceItems.value.reduce((s, i) => s + (i.supplierBalance ?? 0), 0))

const itemsWithoutSupplier = computed(() => allItems.value.filter(PURCHASES_VIEWS.noSupplier.test))

const alerts = computed(() => {
  const list: { icon: string; title: string; detail: string; action: string; go: () => void }[] = []
  if (pendingClientCollect.value > 0.01) {
    list.push({
      icon: 'lucide:wallet',
      title: `Cobro pendiente al cliente: ${formatMoney(pendingClientCollect.value, currency.value)}`,
      detail: 'Lo que falta cobrar según el presupuesto y los pagos registrados.',
      action: 'Ver liquidación',
      go: () => emit('go', { tab: 'liquidacion' }),
    })
  }
  if (supplierBalanceItems.value.length) {
    list.push({
      icon: 'lucide:hand-coins',
      title: `Saldo por pagar a proveedores: ${formatMoney(totalSupplierPending.value, currency.value)}`,
      detail: `En ${supplierBalanceItems.value.length} partida(s): costo real mayor que lo abonado.`,
      action: 'Ver partidas con saldo',
      go: () => emit('go', { tab: 'compras', view: 'balance' }),
    })
  }
  if (itemsWithoutSupplier.value.length) {
    list.push({
      icon: 'lucide:truck',
      title: `${itemsWithoutSupplier.value.length} partida(s) con costo real sin proveedor`,
      detail: 'Asigne a quién se compró o contrató para controlar los pagos.',
      action: 'Asignar proveedor',
      go: () => emit('go', { tab: 'compras', view: 'noSupplier' }),
    })
  }
  return list
})
</script>

<template>
  <DropdownMenu v-if="alerts.length">
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-warning-300 bg-warning-50 px-3 text-sm font-medium text-warning-700 transition-colors hover:bg-warning-100 dark:border-warning-500/40 dark:bg-warning-500/10 dark:text-warning-400 dark:hover:bg-warning-500/20"
        :aria-label="`Alertas financieras: ${alerts.length}`"
      >
        <AppIcon icon="lucide:triangle-alert" :size="16" />
        <span class="hidden sm:inline">Alertas</span>
        <span class="flex size-5 items-center justify-center rounded-full bg-warning-500 text-theme-xs font-semibold text-white">
          {{ alerts.length }}
        </span>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[min(24rem,calc(100vw-24px))] p-2">
      <DropdownMenuLabel class="px-3 pt-1 pb-2 text-theme-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
        Alertas financieras
      </DropdownMenuLabel>
      <DropdownMenuItem v-for="a in alerts" :key="a.icon" class="items-start py-3" @select="a.go()">
        <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400">
          <AppIcon :icon="a.icon" :size="16" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ a.title }}</span>
          <span class="block text-theme-xs font-normal text-gray-500 dark:text-gray-400">{{ a.detail }}</span>
          <span class="mt-1 inline-flex items-center gap-1 text-theme-xs font-medium text-brand-500">
            {{ a.action }} <AppIcon icon="lucide:arrow-right" :size="12" />
          </span>
        </span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
