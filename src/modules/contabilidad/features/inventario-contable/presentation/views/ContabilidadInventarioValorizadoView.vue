<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import { computed } from 'vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import { formatPen } from '../../../asientos/domain/journal.utils'
import { useContabilidadInventoryValuedBalance } from '../composables/useContabilidadInventory'
const { data, isLoading } = useContabilidadInventoryValuedBalance()
const lines = computed(() => data.value?.lines ?? [])
const totalValue = computed(() => data.value?.totalValue ?? '0.00')
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      icon="lucide:scale"
      title="Saldo valorizado"
      subtitle="Inventario permanente al cierre — alimenta PLE 3.1 en cuentas 20/21."
    />

    <StatsCard title="Total inventario valorizado" :value="formatPen(totalValue)" />

    <BaseCard padding="none" class="block overflow-hidden">
      <div v-if="isLoading" class="p-10 text-center text-sm text-gray-400 dark:text-gray-500">
        Cargando…
      </div>
      <div v-else-if="!lines.length" class="p-10 text-center text-sm text-gray-400 dark:text-gray-500">
        No hay ítems con saldo valorizado.
      </div>
      <DataTable
        :columns="[
          { key: 'c0', label: 'Código' },
          { key: 'c1', label: 'Descripción' },
          { key: 'c2', label: 'Cuenta' },
          { key: 'c3', label: 'Cantidad', align: 'right' },
          { key: 'c4', label: 'C.U.', align: 'right' },
          { key: 'c5', label: 'Valor S/', align: 'right' },
        ]"
        :data="lines"
        row-key="itemId"
      >
        <template #row="{ row: line }">
            <td class="py-2.5 px-4 font-mono">{{ line.itemCode }}</td>
            <td class="py-2.5 px-4">{{ line.description }}</td>
            <td class="py-2.5 px-4">
              <span class="font-mono text-xs">{{ line.accountCode }}</span>
            </td>
            <td class="py-2.5 px-4 text-right font-mono">{{ line.quantityOnHand }} {{ line.unit }}</td>
            <td class="py-2.5 px-4 text-right font-mono">{{ formatPen(line.avgUnitCost) }}</td>
            <td class="py-2.5 px-4 text-right font-mono font-semibold">{{ formatPen(line.valuedBalance) }}</td>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
