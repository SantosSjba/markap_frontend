<script setup lang="ts">
import { computed } from 'vue'
import { PageHeader, StatsCard } from '@shared/components'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import { useContabilidadInventoryValuedBalance } from '../../application/useContabilidadInventory'

const { data, isLoading } = useContabilidadInventoryValuedBalance()
const lines = computed(() => data.value?.lines ?? [])
const totalValue = computed(() => data.value?.totalValue ?? '0.00')
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:scale"
      title="Saldo valorizado"
      subtitle="Inventario permanente al cierre — alimenta PLE 3.1 en cuentas 20/21."
    />

    <StatsCard title="Total inventario valorizado" :value="formatPen(totalValue)" />

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <div v-if="isLoading" class="p-10 text-center text-sm" :style="{ color: 'var(--color-text-muted)' }">
        Cargando…
      </div>
      <div v-else-if="!lines.length" class="p-10 text-center text-sm" :style="{ color: 'var(--color-text-muted)' }">
        No hay ítems con saldo valorizado.
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
            <th class="text-left py-3 px-4 font-medium">Código</th>
            <th class="text-left py-3 px-4 font-medium">Descripción</th>
            <th class="text-left py-3 px-4 font-medium">Cuenta</th>
            <th class="text-right py-3 px-4 font-medium">Cantidad</th>
            <th class="text-right py-3 px-4 font-medium">C.U.</th>
            <th class="text-right py-3 px-4 font-medium">Valor S/</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="line in lines"
            :key="line.itemId"
            class="border-b last:border-0"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <td class="py-2.5 px-4 font-mono">{{ line.itemCode }}</td>
            <td class="py-2.5 px-4">{{ line.description }}</td>
            <td class="py-2.5 px-4">
              <span class="font-mono text-xs">{{ line.accountCode }}</span>
            </td>
            <td class="py-2.5 px-4 text-right font-mono">{{ line.quantityOnHand }} {{ line.unit }}</td>
            <td class="py-2.5 px-4 text-right font-mono">{{ formatPen(line.avgUnitCost) }}</td>
            <td class="py-2.5 px-4 text-right font-mono font-semibold">{{ formatPen(line.valuedBalance) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
