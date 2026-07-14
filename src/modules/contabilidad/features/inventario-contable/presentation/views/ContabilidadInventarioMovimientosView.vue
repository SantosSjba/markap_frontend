<script setup lang="ts">
import { toCalendarDateString } from '@/shared/utils/formatters'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  BaseModal,
  Badge,
  DataTable,
  FormInput,
  FormSelect,
  FormTextarea,
  PageHeader,
} from '@shared/components'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import {
  useContabilidadCreateInventoryMovement,
  useContabilidadInventoryCatalog,
  useContabilidadInventoryItems,
  useContabilidadInventoryMovements,
} from '../../application/useContabilidadInventory'
import {
  INVENTORY_MOVEMENT_TYPE,
  INVENTORY_MOVEMENT_TYPE_OPTIONS,
  INVENTORY_OFFSET_TYPE_OPTIONS,
  type ContabilidadInventoryMovementDTO,
} from '../../domain/inventory.types'

const router = useRouter()
const { activePeriod } = useContabilidadActivePeriod()

const typeFilter = ref('')
const listParams = computed(() => ({
  periodId: activePeriod.value?.id,
  movementType: typeFilter.value || undefined,
}))

const { data, isLoading } = useContabilidadInventoryMovements(listParams)
const rows = computed(() => data.value?.movements ?? [])

const { data: catalog } = useContabilidadInventoryCatalog()
const { data: itemsData } = useContabilidadInventoryItems(computed(() => ({ activeOnly: 'true' })))
const itemOptions = computed(() =>
  (itemsData.value?.items ?? []).map((i) => ({ value: i.id, label: `${i.code} — ${i.description}` })),
)

const { mutate: createMovement, isPending: saving } = useContabilidadCreateInventoryMovement()

const modalOpen = ref(false)
const form = ref<{
  itemId: string
  movementType: string
  movementDate: string
  quantity: string
  unitCost: string
  offsetType: string
  notes: string
}>({
  itemId: '',
  movementType: INVENTORY_MOVEMENT_TYPE.IN,
  movementDate: toCalendarDateString(),
  quantity: '',
  unitCost: '',
  offsetType: 'PAYABLE',
  notes: '',
})

const columns = [
  { key: 'date', label: 'Fecha' },
  { key: 'type', label: 'Tipo' },
  { key: 'item', label: 'Ítem' },
  { key: 'qty', label: 'Cantidad', align: 'right' as const },
  { key: 'amount', label: 'Importe', align: 'right' as const },
  { key: 'journal', label: 'Asiento', align: 'right' as const },
]

function typeLabel(type: string) {
  return catalog.value?.movementTypeLabels?.[type] ?? type
}

function openModal() {
  form.value = {
    itemId: '',
    movementType: INVENTORY_MOVEMENT_TYPE.IN,
    movementDate: toCalendarDateString(),
    quantity: '',
    unitCost: '',
    offsetType: 'PAYABLE',
    notes: '',
  }
  modalOpen.value = true
}

function submit() {
  if (!activePeriod.value) return
  createMovement(
    {
      ...form.value,
      periodId: activePeriod.value.id,
      quantity: form.value.quantity,
      unitCost: form.value.unitCost || undefined,
    },
    { onSuccess: () => { modalOpen.value = false } },
  )
}

function goJournal(row: ContabilidadInventoryMovementDTO) {
  if (!row.journalEntryId) return
  void router.push({ name: 'contabilidad-asiento-detalle', params: { id: row.journalEntryId } })
}

const showOffset = computed(
  () =>
    form.value.movementType === INVENTORY_MOVEMENT_TYPE.IN ||
    (form.value.movementType === INVENTORY_MOVEMENT_TYPE.ADJUST && Number(form.value.quantity) > 0),
)
</script>

<template>
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
    <PageHeader
      icon="lucide:arrow-left-right"
      title="Movimientos de inventario"
      subtitle="Entradas, salidas y ajustes con asiento automático (Dr 20 / Cr 421|601 · Dr 691 / Cr 20)."
    >
      <template #actions>
        <BaseButton :disabled="!activePeriod" @click="openModal">Registrar movimiento</BaseButton>
      </template>
    </PageHeader>

    <p v-if="!activePeriod" class="text-sm" :style="{ color: 'var(--color-warning)' }">
      Configure el periodo activo en Configuraci�n ? Contexto contable.
    </p>

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
          <div class="w-full sm:w-[200px]">
            <FormSelect v-model="typeFilter" :options="INVENTORY_MOVEMENT_TYPE_OPTIONS" />
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm whitespace-nowrap">{{ (row as ContabilidadInventoryMovementDTO).movementDate }}</td>
          <td class="py-3 px-4">
            <Badge :variant="(row as ContabilidadInventoryMovementDTO).movementType === 'IN' ? 'success' : 'warning'">
              {{ typeLabel((row as ContabilidadInventoryMovementDTO).movementType) }}
            </Badge>
          </td>
          <td class="py-3 px-4 text-sm">
            <span class="font-mono text-xs">{{ (row as ContabilidadInventoryMovementDTO).itemCode }}</span>
            {{ (row as ContabilidadInventoryMovementDTO).itemDescription }}
          </td>
          <td class="py-3 px-4 text-right font-mono text-sm">{{ (row as ContabilidadInventoryMovementDTO).quantity }}</td>
          <td class="py-3 px-4 text-right font-mono text-sm">{{ formatPen((row as ContabilidadInventoryMovementDTO).totalAmount) }}</td>
          <td class="py-3 px-4 text-right">
            <BaseButton
              v-if="(row as ContabilidadInventoryMovementDTO).journalEntryId"
              variant="ghost"
              size="sm"
              @click="goJournal(row as ContabilidadInventoryMovementDTO)"
            >
              Ver
            </BaseButton>
          </td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="modalOpen" title="Registrar movimiento" size="md">
      <div class="space-y-4">
        <FormSelect v-model="form.itemId" label="Ítem" :options="itemOptions" />
        <FormSelect
          v-model="form.movementType"
          label="Tipo"
          :options="INVENTORY_MOVEMENT_TYPE_OPTIONS.filter((o) => o.value)"
        />
        <FormInput v-model="form.movementDate" label="Fecha" type="date" />
        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput v-model="form.quantity" label="Cantidad" inputmode="decimal" />
          <FormInput
            v-if="form.movementType !== 'OUT'"
            v-model="form.unitCost"
            label="Costo unitario (S/)"
            inputmode="decimal"
          />
        </div>
        <FormSelect
          v-if="showOffset"
          v-model="form.offsetType"
          label="Contrapartida entrada"
          :options="INVENTORY_OFFSET_TYPE_OPTIONS"
        />
        <FormTextarea v-model="form.notes" label="Notas" :rows="2" />
        <p v-if="form.movementType === 'ADJUST'" class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
          En ajustes use cantidad positiva (entrada) o negativa (salida).
        </p>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
        <BaseButton :loading="saving" @click="submit">Registrar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
