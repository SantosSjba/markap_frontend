<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import { formatPen } from '../../../asientos/domain/journal.utils'
import type { FinancialStatementLineDTO } from '../../domain/financial.types'
defineProps<{
  title: string
  lines: FinancialStatementLineDTO[]
  total: string
  showPrior?: boolean
}>()
</script>

<template>
  <BaseCard padding="none" class="block overflow-hidden">
    <div class="px-4 py-3 border-b font-semibold border-gray-200 dark:border-gray-800">
      {{ title }}
    </div>
    <Table class="w-full text-sm">
      <TableHeader>
        <TableRow class="border-b border-gray-200 dark:border-gray-800">
          <TableCell is-header class="text-left py-2 px-4">Cuenta</TableCell>
          <TableCell is-header class="text-left py-2 px-4">Descripción</TableCell>
          <TableCell is-header v-if="showPrior" class="text-right py-2 px-4">Periodo ant.</TableCell>
          <TableCell is-header class="text-right py-2 px-4">Periodo actual</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="line in lines"
          :key="line.accountId"
          class="border-b last:border-0 border-gray-200 dark:border-gray-800"
        >
          <TableCell class="py-2 px-4 font-mono">{{ line.accountCode }}</TableCell>
          <TableCell class="py-2 px-4">{{ line.accountName }}</TableCell>
          <TableCell v-if="showPrior" class="py-2 px-4 text-right font-mono">
            {{ formatPen(line.priorAmount) }}
          </TableCell>
          <TableCell class="py-2 px-4 text-right font-mono">{{ formatPen(line.amount) }}</TableCell>
        </TableRow>
        <TableRow class="font-semibold bg-gray-100 dark:bg-gray-950">
          <TableCell class="py-2 px-4" :colspan="showPrior ? 3 : 2">Total</TableCell>
          <TableCell class="py-2 px-4 text-right font-mono">{{ formatPen(total) }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </BaseCard>
</template>
