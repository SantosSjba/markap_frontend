<script setup lang="ts">
import { computed } from 'vue'
import { DataTable, PageHeader } from '@shared/components'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import { useContabilidadTreasuryMovements } from '@modules/contabilidad/features/tesoreria/application/useContabilidadTreasury'
import type { ContabilidadTreasuryMovementDTO } from '@modules/contabilidad/features/tesoreria/domain/treasury.types'

const { activePeriod } = useContabilidadActivePeriod()

const listParams = computed(() => ({
  periodId: activePeriod.value?.id,
  sourceType: 'BANK',
}))

const { data, isLoading } = useContabilidadTreasuryMovements(listParams)
const rows = computed(() => data.value?.movements ?? [])

const columns = [
  { key: 'movementDate', label: 'Fecha' },
  { key: 'movementType', label: 'Tipo' },
  { key: 'description', label: 'Glosa' },
  { key: 'amount', label: 'Importe', align: 'right' as const },
]
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:landmark"
      title="Libro bancos"
      subtitle="Movimientos bancarios del periodo (consulta 1.1)."
    />
    <div
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin movimientos bancarios." row-key="id">
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadTreasuryMovementDTO).movementDate }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadTreasuryMovementDTO).movementType }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadTreasuryMovementDTO).description }}</td>
          <td class="py-3 px-4 text-sm text-right font-mono font-semibold">
            {{ formatPen((row as ContabilidadTreasuryMovementDTO).amount) }}
          </td>
        </template>
      </DataTable>
    </div>
  </div>
</template>
