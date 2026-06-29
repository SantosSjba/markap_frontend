<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, PageHeader } from '@shared/components'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import { useContabilidadCashFlowTreasury } from '../../application/useContabilidadReports'

const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)

const { data, isLoading, isError, refetch } = useContabilidadCashFlowTreasury(periodId)
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:banknote"
      title="Flujo de caja"
      subtitle="Movimientos de tesorería del periodo (método directo)"
    />

    <p v-if="!activePeriod" class="text-sm" :style="{ color: 'var(--color-warning)' }">
      Seleccione un periodo activo en la barra superior.
    </p>

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div v-else-if="isError" class="text-center py-8">
      <button type="button" class="text-sm underline" @click="refetch()">Reintentar</button>
    </div>

    <template v-else-if="data">
      <div class="grid gap-4 sm:grid-cols-3">
        <div
          class="rounded-xl border p-4"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <p class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">Ingresos totales</p>
          <p class="font-mono font-bold text-lg">{{ formatPen(data.totalIn) }}</p>
        </div>
        <div
          class="rounded-xl border p-4"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <p class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">Egresos totales</p>
          <p class="font-mono font-bold text-lg">{{ formatPen(data.totalOut) }}</p>
        </div>
        <div
          class="rounded-xl border p-4"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <p class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">Variación neta</p>
          <p class="font-mono font-bold text-lg">{{ formatPen(data.netChange) }}</p>
        </div>
      </div>

      <div
        class="rounded-xl border overflow-hidden"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <th class="text-left py-2 px-4">Tipo</th>
              <th class="text-right py-2 px-4">Ingresos</th>
              <th class="text-right py-2 px-4">Egresos</th>
              <th class="text-right py-2 px-4">Neto</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in data.rows"
              :key="row.movementType"
              class="border-b last:border-0"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <td class="py-2 px-4">{{ row.label }}</td>
              <td class="py-2 px-4 text-right font-mono">{{ formatPen(row.inAmount) }}</td>
              <td class="py-2 px-4 text-right font-mono">{{ formatPen(row.outAmount) }}</td>
              <td class="py-2 px-4 text-right font-mono">{{ formatPen(row.netAmount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 text-sm">
        <div
          class="rounded-xl border p-4"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <p class="font-semibold mb-2">Caja</p>
          <p>Ingresos {{ formatPen(data.cashIn) }} · Egresos {{ formatPen(data.cashOut) }}</p>
        </div>
        <div
          class="rounded-xl border p-4"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <p class="font-semibold mb-2">Bancos</p>
          <p>Ingresos {{ formatPen(data.bankIn) }} · Egresos {{ formatPen(data.bankOut) }}</p>
        </div>
      </div>
    </template>
  </div>
</template>
