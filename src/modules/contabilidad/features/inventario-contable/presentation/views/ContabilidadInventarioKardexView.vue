<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, FormSelect, PageHeader, StatsCard } from '@shared/components'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import {
  useContabilidadInventoryCatalog,
  useContabilidadInventoryItems,
  useContabilidadInventoryKardex,
} from '../../application/useContabilidadInventory'
import type { ContabilidadInventoryKardexLineDTO } from '../../domain/inventory.types'

const router = useRouter()
const selectedItemId = ref('')

const { data: itemsData } = useContabilidadInventoryItems(computed(() => ({})))
const itemOptions = computed(() =>
  (itemsData.value?.items ?? []).map((i) => ({ value: i.id, label: `${i.code} — ${i.description}` })),
)

const { data: catalog } = useContabilidadInventoryCatalog()
const { data: kardexData, isLoading } = useContabilidadInventoryKardex(computed(() => selectedItemId.value || undefined))

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
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
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

    <div
      v-if="selectedItemId"
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <div v-if="isLoading" class="p-10 text-center text-sm" :style="{ color: 'var(--color-text-muted)' }">
        Cargando kardex…
      </div>
      <div v-else-if="!lines.length" class="p-10 text-center text-sm" :style="{ color: 'var(--color-text-muted)' }">
        Sin movimientos para este ítem.
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
            <th class="text-left py-3 px-4 font-medium">Fecha</th>
            <th class="text-left py-3 px-4 font-medium">Tipo</th>
            <th class="text-right py-3 px-4 font-medium">Cant.</th>
            <th class="text-right py-3 px-4 font-medium">C.U.</th>
            <th class="text-right py-3 px-4 font-medium">Importe</th>
            <th class="text-right py-3 px-4 font-medium">Saldo cant.</th>
            <th class="text-right py-3 px-4 font-medium">Saldo S/</th>
            <th class="py-3 px-4 w-20" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="line in lines"
            :key="line.id"
            class="border-b last:border-0"
            :style="{ borderColor: 'var(--color-border)' }"
          >
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
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
