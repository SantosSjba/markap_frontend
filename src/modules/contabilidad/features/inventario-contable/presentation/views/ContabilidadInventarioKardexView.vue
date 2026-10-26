<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import { formatPen } from '../../../asientos/domain/journal.utils'
import {
  useContabilidadInventoryCatalog,
  useContabilidadInventoryItems,
  useContabilidadInventoryKardex,
} from '../composables/useContabilidadInventory'
import type { ContabilidadInventoryKardexLineDTO } from '../../domain/inventory.types'
const router = useRouter()
const selectedItemId = ref('')

const { data: itemsData } = useContabilidadInventoryItems(computed(() => ({})))
const itemOptions = computed(() =>
  (itemsData.value?.items ?? []).map((i) => ({
    value: i.id,
    label: `${i.code} — ${i.description}`,
  })),
)

const { data: catalog } = useContabilidadInventoryCatalog()
const { data: kardexData, isLoading } = useContabilidadInventoryKardex(
  computed(() => selectedItemId.value || undefined),
)

const item = computed(() => kardexData.value?.item)
const lines = computed(() => kardexData.value?.lines ?? [])

function typeLabel(type: string) {
  return catalog.value?.movementTypeLabels?.[type] ?? type
}

function goJournal(line: ContabilidadInventoryKardexLineDTO) {
  if (!line.journalEntryId) return
  void router.push({ name: 'contabilidad-asiento-detalle', params: { id: line.journalEntryId } })
}
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      icon="lucide:scroll-text"
      title="Kardex valorizado"
      subtitle="Historial de movimientos y saldos acumulados por ítem."
    />

    <FormSelect
      v-model="selectedItemId"
      label="Ítem"
      :options="itemOptions"
      placeholder="Seleccione un ítem…"
      class="max-w-xl"
    />

    <div v-if="item" class="grid gap-4 sm:grid-cols-3">
      <StatsCard title="Stock actual" :value="`${item.quantityOnHand} ${item.unit}`" />
      <StatsCard title="Costo promedio" :value="formatPen(item.avgUnitCost)" />
      <StatsCard title="Valor total" :value="formatPen(item.valuedBalance)" />
    </div>

    <BaseCard v-if="selectedItemId" padding="none" class="block overflow-hidden">
      <div v-if="isLoading" class="p-10 text-center text-sm text-gray-400 dark:text-gray-500">
        Cargando kardex…
      </div>
      <div v-else-if="!lines.length" class="p-10 text-center text-sm text-gray-400 dark:text-gray-500">
        Sin movimientos para este ítem.
      </div>
      <DataTable
        :columns="[
          { key: 'c0', label: 'Fecha' },
          { key: 'c1', label: 'Tipo' },
          { key: 'c2', label: 'Cant.', align: 'right' },
          { key: 'c3', label: 'C.U.', align: 'right' },
          { key: 'c4', label: 'Importe', align: 'right' },
          { key: 'c5', label: 'Saldo cant.', align: 'right' },
          { key: 'c6', label: 'Saldo S/', align: 'right' },
          { key: 'c7', label: '' },
        ]"
        :data="lines"
      >
        <template #row="{ row: line }">
            <td class="py-2.5 px-4 whitespace-nowrap">{{ line.movementDate }}</td>
            <td class="py-2.5 px-4">{{ typeLabel(line.movementType) }}</td>
            <td class="py-2.5 px-4 text-right font-mono">{{ line.quantity }}</td>
            <td class="py-2.5 px-4 text-right font-mono">{{ formatPen(line.unitCost) }}</td>
            <td class="py-2.5 px-4 text-right font-mono">{{ formatPen(line.totalAmount) }}</td>
            <td class="py-2.5 px-4 text-right font-mono">{{ line.runningQuantity }}</td>
            <td class="py-2.5 px-4 text-right font-mono font-medium">{{ formatPen(line.runningValue) }}</td>
            <td class="py-2.5 px-4 text-right">
              <BaseButton v-if="line.journalEntryId" variant="ghost" size="sm" @click="goJournal(line)">Asiento</BaseButton>
            </td>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
