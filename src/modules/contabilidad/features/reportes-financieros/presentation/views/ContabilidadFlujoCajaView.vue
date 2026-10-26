<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import { computed } from 'vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '../../../asientos/domain/journal.utils'
import { useContabilidadCashFlowTreasury } from '../composables/useContabilidadReports'
const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)

const { data, isLoading, isError, refetch } = useContabilidadCashFlowTreasury(periodId)
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      icon="lucide:banknote"
      title="Flujo de caja"
      subtitle="Movimientos de tesorería del periodo (método directo)"
    />

    <p v-if="!activePeriod" class="text-sm text-warning-600 dark:text-orange-400">
      Configure el periodo activo en Configuración ? Contexto contable.
    </p>

    <LoadingState v-if="isLoading" />

    <div v-else-if="isError" class="text-center py-8">
      <BaseButton @click="refetch()" variant="link">Reintentar</BaseButton>
    </div>

    <template v-else-if="data">
      <div class="grid gap-4 sm:grid-cols-3">
        <BaseCard padding="sm" class="block">
          <p class="text-xs text-gray-500 dark:text-gray-400">Ingresos totales</p>
          <p class="font-mono font-bold text-lg">{{ formatPen(data.totalIn) }}</p>
        </BaseCard>
        <BaseCard padding="sm" class="block">
          <p class="text-xs text-gray-500 dark:text-gray-400">Egresos totales</p>
          <p class="font-mono font-bold text-lg">{{ formatPen(data.totalOut) }}</p>
        </BaseCard>
        <BaseCard padding="sm" class="block">
          <p class="text-xs text-gray-500 dark:text-gray-400">Variación neta</p>
          <p class="font-mono font-bold text-lg">{{ formatPen(data.netChange) }}</p>
        </BaseCard>
      </div>

      <BaseCard padding="none" class="block overflow-hidden">
        <DataTable
          :columns="[
            { key: 'c0', label: 'Tipo' },
            { key: 'c1', label: 'Ingresos', align: 'right' },
            { key: 'c2', label: 'Egresos', align: 'right' },
            { key: 'c3', label: 'Neto', align: 'right' },
          ]"
          :data="data.rows"
          row-key="movementType"
        >
          <template #row="{ row }">
              <td class="py-2 px-4">{{ row.label }}</td>
              <td class="py-2 px-4 text-right font-mono">{{ formatPen(row.inAmount) }}</td>
              <td class="py-2 px-4 text-right font-mono">{{ formatPen(row.outAmount) }}</td>
              <td class="py-2 px-4 text-right font-mono">{{ formatPen(row.netAmount) }}</td>
          </template>
        </DataTable>
      </BaseCard>

      <div class="grid gap-4 sm:grid-cols-2 text-sm">
        <BaseCard padding="sm" class="block">
          <p class="font-semibold mb-2">Caja</p>
          <p>Ingresos {{ formatPen(data.cashIn) }} · Egresos {{ formatPen(data.cashOut) }}</p>
        </BaseCard>
        <BaseCard padding="sm" class="block">
          <p class="font-semibold mb-2">Bancos</p>
          <p>Ingresos {{ formatPen(data.bankIn) }} · Egresos {{ formatPen(data.bankOut) }}</p>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
