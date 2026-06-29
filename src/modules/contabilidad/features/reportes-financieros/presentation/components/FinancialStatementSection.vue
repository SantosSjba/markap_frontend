<script setup lang="ts">
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import type { FinancialStatementLineDTO } from '../../domain/financial.types'

defineProps<{
  title: string
  lines: FinancialStatementLineDTO[]
  total: string
  showPrior?: boolean
}>()
</script>

<template>
  <div
    class="rounded-xl border overflow-hidden"
    :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
  >
    <div class="px-4 py-3 border-b font-semibold" :style="{ borderColor: 'var(--color-border)' }">
      {{ title }}
    </div>
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
          <th class="text-left py-2 px-4">Cuenta</th>
          <th class="text-left py-2 px-4">Descripción</th>
          <th v-if="showPrior" class="text-right py-2 px-4">Periodo ant.</th>
          <th class="text-right py-2 px-4">Periodo actual</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="line in lines"
          :key="line.accountId"
          class="border-b last:border-0"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <td class="py-2 px-4 font-mono">{{ line.accountCode }}</td>
          <td class="py-2 px-4">{{ line.accountName }}</td>
          <td v-if="showPrior" class="py-2 px-4 text-right font-mono">
            {{ formatPen(line.priorAmount) }}
          </td>
          <td class="py-2 px-4 text-right font-mono">{{ formatPen(line.amount) }}</td>
        </tr>
        <tr class="font-semibold" :style="{ backgroundColor: 'var(--color-surface-muted)' }">
          <td class="py-2 px-4" :colspan="showPrior ? 3 : 2">Total</td>
          <td class="py-2 px-4 text-right font-mono">{{ formatPen(total) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
