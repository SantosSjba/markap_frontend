<script setup lang="ts">
import { computed } from 'vue'
import { formatMoney } from '@shared/utils/money'
import type { BudgetHeaderDto, BudgetSheetTotals } from '../../../domain/project-budget.types'
/** Totales al pie de la hoja: costo directo → utilidad / GG → subtotal → IGV → total (+ equivalente). */

const props = defineProps<{ totals: BudgetSheetTotals; header: BudgetHeaderDto }>()

const lines = computed(() => {
  const t = props.totals
  const h = props.header
  const perLine = h.marginMode === 'PER_LINE'
  return [
    { label: 'Costo directo', value: t.directCost },
    { label: perLine ? 'Utilidad (por partida)' : `Utilidad ${h.utilityPct}%`, value: t.utility },
    ...(t.overhead || !perLine ? [{ label: `Gastos generales ${h.overheadPct}%`, value: t.overhead }] : []),
    { label: 'Subtotal', value: t.subtotal },
    ...(h.igvMode === 'NONE' ? [] : [{ label: h.igvMode === 'GLOBAL' ? `IGV ${h.igvPct}%` : 'IGV (por partida)', value: t.igv }]),
  ]
})
</script>

<template>
  <div
    class="sticky bottom-0 z-10 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 rounded-2xl border border-gray-200 bg-white/95 px-5 py-3 shadow-theme-md backdrop-blur dark:border-gray-800 dark:bg-gray-900/95"
  >
    <dl class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <div v-for="l in lines" :key="l.label">
        <dt class="text-theme-xs text-gray-400 dark:text-gray-500">{{ l.label }}</dt>
        <dd class="font-medium tabular-nums text-gray-800 dark:text-white/90">{{ formatMoney(l.value, header.currency) }}</dd>
      </div>
      <div v-if="totals.actualCost">
        <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Costo real</dt>
        <dd class="font-medium tabular-nums text-gray-800 dark:text-white/90">{{ formatMoney(totals.actualCost, header.currency) }}</dd>
      </div>
    </dl>
    <div class="text-right">
      <p class="text-theme-xs text-gray-400 dark:text-gray-500">
        Total{{ header.igvMode === 'NONE' ? ' (no incluye IGV)' : '' }}
      </p>
      <p class="text-xl font-bold tabular-nums text-brand-500 dark:text-brand-400">{{ formatMoney(totals.total, header.currency) }}</p>
      <p v-if="totals.equivalent" class="text-theme-xs tabular-nums text-gray-500 dark:text-gray-400">
        ≈ {{ formatMoney(totals.equivalent.amount, totals.equivalent.currency) }} (TC {{ header.exchangeRate }})
      </p>
    </div>
  </div>
</template>
