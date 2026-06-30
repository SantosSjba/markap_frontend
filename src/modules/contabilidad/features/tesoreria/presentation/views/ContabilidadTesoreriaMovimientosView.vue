<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  Badge,
  DataTable,
  FormSelect,
  PageHeader,
  SearchInput,
} from '@shared/components'
import { useDebouncedRef } from '@/shared/composables/useDebouncedRef'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import { useContabilidadTreasuryMovements } from '../../application/useContabilidadTreasury'
import {
  TREASURY_MOVEMENT_FILTER_OPTIONS,
  TREASURY_SOURCE_FILTER_OPTIONS,
  TREASURY_MOVEMENT_TYPE_LABELS,
  TREASURY_SOURCE_TYPE_LABELS,
  type ContabilidadTreasuryMovementDTO,
} from '../../domain/treasury.types'

const router = useRouter()
const { activePeriod } = useContabilidadActivePeriod()

const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput, 300)
const typeFilter = ref('')
const sourceFilter = ref('')

const listParams = computed(() => ({
  periodId: activePeriod.value?.id,
  movementType: typeFilter.value || undefined,
  sourceType: sourceFilter.value || undefined,
  search: debouncedSearch.value.trim() || undefined,
}))

const { data, isLoading } = useContabilidadTreasuryMovements(listParams)
const rows = computed(() => data.value?.movements ?? [])

const columns = [
  { key: 'movementDate', label: 'Fecha', sortable: true },
  { key: 'movementType', label: 'Tipo' },
  { key: 'sourceType', label: 'Medio' },
  { key: 'description', label: 'Glosa' },
  { key: 'amount', label: 'Importe', align: 'right' as const },
  { key: 'journal', label: 'Asiento', align: 'right' as const },
]

function typeLabel(type: string) {
  return TREASURY_MOVEMENT_TYPE_LABELS[type] ?? data.value?.movementTypeLabels?.[type] ?? type
}

function goJournal(row: ContabilidadTreasuryMovementDTO) {
  if (!row.journalEntryId) return
  void router.push({ name: 'contabilidad-asiento-detalle', params: { id: row.journalEntryId } })
}
</script>

<template>
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
    <PageHeader
      icon="lucide:arrow-left-right"
      title="Movimientos de tesorería"
      subtitle="Ingresos, egresos y transferencias del periodo activo."
    />

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <DataTable
        :columns="columns"
        :data="rows"
        :loading="isLoading"
        empty-text="Sin movimientos en este periodo."
        row-key="id"
      >
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar por glosa…" />
          </div>
          <div class="w-full sm:w-[180px] shrink-0">
            <FormSelect v-model="sourceFilter" :options="TREASURY_SOURCE_FILTER_OPTIONS" />
          </div>
          <div class="w-full sm:w-[200px] shrink-0">
            <FormSelect v-model="typeFilter" :options="TREASURY_MOVEMENT_FILTER_OPTIONS" />
          </div>
        </template>

        <template #row="{ row }">
          <td class="py-3 px-4 text-sm whitespace-nowrap">
            {{ (row as ContabilidadTreasuryMovementDTO).movementDate }}
          </td>
          <td class="py-3 px-4">
            <Badge :variant="(row as ContabilidadTreasuryMovementDTO).movementType === 'IN' || (row as ContabilidadTreasuryMovementDTO).movementType === 'TRANSFER_IN' ? 'success' : 'warning'">
              {{ typeLabel((row as ContabilidadTreasuryMovementDTO).movementType) }}
            </Badge>
          </td>
          <td class="py-3 px-4 text-sm">
            {{ TREASURY_SOURCE_TYPE_LABELS[(row as ContabilidadTreasuryMovementDTO).sourceType] ?? (row as ContabilidadTreasuryMovementDTO).sourceType }}
            <span class="block text-xs" :style="{ color: 'var(--color-text-muted)' }">
              {{ (row as ContabilidadTreasuryMovementDTO).cashBoxCode ?? (row as ContabilidadTreasuryMovementDTO).bankCode }}
            </span>
          </td>
          <td class="py-3 px-4 text-sm max-w-xs truncate">
            {{ (row as ContabilidadTreasuryMovementDTO).description }}
          </td>
          <td class="py-3 px-4 text-sm text-right font-mono font-semibold">
            {{ formatPen((row as ContabilidadTreasuryMovementDTO).amount) }}
          </td>
          <td class="py-3 px-4 text-right">
            <BaseButton
              v-if="(row as ContabilidadTreasuryMovementDTO).journalEntryId"
              variant="ghost"
              size="sm"
              @click="goJournal(row as ContabilidadTreasuryMovementDTO)"
            >
              Ver
            </BaseButton>
          </td>
        </template>
      </DataTable>
    </div>
  </div>
</template>
