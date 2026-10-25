<script setup lang="ts">
import { computed } from 'vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '../../../asientos/domain/journal.utils'
import { useContabilidadTreasuryMovements } from '../../../tesoreria/presentation/composables/useContabilidadTreasury'
import type { ContabilidadTreasuryMovementDTO } from '../../../tesoreria/domain/treasury.types'
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
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
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
