<script setup lang="ts">
import { formatDateTime } from '@/shared/utils/formatters'
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  BaseButton,
  DataTable,
  FormInput,
  FormSelect,
  FormTextarea,
  SearchInput,
  AppIcon,
  BaseModal,
} from '@shared/components'
import {
  useProduccionMaterialsList,
  useProduccionMovementsList,
  useMovementMutations,
} from '../../application/useProduccionInventory'
import { formatQty, MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_OPTIONS } from '../labels'
import type { ProduccionStockMovement, ProduccionStockMovementType } from '../../domain/inventory.types'

const route = useRoute()

const listParams = ref({ page: 1, limit: 50 })
const searchInput = ref('')
const materialFilter = ref('')
const typeFilter = ref('')

const { data: materialsResult } = useProduccionMaterialsList(ref({ page: 1, limit: 200 }))
const materialOptions = computed(() => {
  const items = materialsResult.value?.data ?? []
  return [
    { value: '', label: 'Todos los materiales' },
    ...items.map((m) => ({ value: m.id, label: `${m.code} — ${m.name}` })),
  ]
})

const { data: result, isLoading } = useProduccionMovementsList(
  computed(() => ({
    ...listParams.value,
    search: searchInput.value.trim() || undefined,
    materialId: materialFilter.value || undefined,
    movementType: (typeFilter.value || undefined) as ProduccionStockMovementType | undefined,
  })),
)
const createMovement = useMovementMutations()

const rows = computed(() => result.value?.data ?? [])

onMounted(() => {
  const q = route.query.materialId
  if (typeof q === 'string' && q) materialFilter.value = q
})

watch(
  () => route.query.materialId,
  (id) => {
    if (typeof id === 'string') materialFilter.value = id
  },
)

const showModal = ref(false)
const movementType = ref<ProduccionStockMovementType>('IN')
const materialId = ref('')
const quantity = ref(0)
const unitCost = ref<number | ''>('')
const reference = ref('')
const notes = ref('')
const saving = ref(false)

const typeFilterOptions = [
  { value: '', label: 'Todos los tipos' },
  ...MOVEMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
]

const columns = [
  { key: 'createdAt', label: 'Fecha', align: 'left' as const },
  { key: 'material', label: 'Material', align: 'left' as const },
  { key: 'movementType', label: 'Tipo', align: 'left' as const },
  { key: 'quantity', label: 'Cantidad', align: 'left' as const },
  { key: 'balanceAfter', label: 'Saldo', align: 'left' as const },
  { key: 'reference', label: 'Referencia', align: 'left' as const },
]

function formatDate(iso: string) {
  return formatDateTime(iso)
}

function openNew() {
  movementType.value = 'IN'
  materialId.value = materialFilter.value || ''
  quantity.value = 0
  unitCost.value = ''
  reference.value = ''
  notes.value = ''
  showModal.value = true
}

const quantityHint = computed(() => {
  if (movementType.value === 'ADJUST') return 'Stock final deseado después del ajuste'
  return 'Cantidad del movimiento'
})

async function save() {
  if (!materialId.value || quantity.value < 0) return
  saving.value = true
  try {
    await createMovement.mutateAsync({
      materialId: materialId.value,
      movementType: movementType.value,
      quantity: Number(quantity.value),
      unitCost: unitCost.value === '' ? undefined : Number(unitCost.value),
      reference: reference.value.trim() || null,
      notes: notes.value.trim() || null,
    })
    showModal.value = false
  } finally {
    saving.value = false
  }
}

function movementBadgeClass(type: ProduccionStockMovementType) {
  if (type === 'IN') return 'text-emerald-600'
  if (type === 'OUT') return 'text-red-600'
  return 'text-amber-600'
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Movimientos</h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Kardex de ingresos, salidas y ajustes de inventario.
        </p>
      </div>
      <BaseButton variant="primary" @click="openNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Registrar movimiento
      </BaseButton>
    </div>

    <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin movimientos registrados." row-key="id">
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar referencia o material…" />
          </div>
          <div class="flex flex-wrap gap-3 shrink-0 sm:flex-nowrap">
            <div class="w-full sm:w-[240px] min-w-0">
              <FormSelect v-model="materialFilter" :options="materialOptions" />
            </div>
            <div class="w-full sm:w-[175px] min-w-0">
              <FormSelect v-model="typeFilter" :options="typeFilterOptions" />
            </div>
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm whitespace-nowrap">{{ formatDate((row as ProduccionStockMovement).createdAt) }}</td>
          <td class="py-3 px-4">
            <div class="font-medium text-sm">{{ (row as ProduccionStockMovement).materialName }}</div>
            <div class="text-xs font-mono" :style="{ color: 'var(--color-text-secondary)' }">{{ (row as ProduccionStockMovement).materialCode }}</div>
          </td>
          <td class="py-3 px-4 text-sm font-medium" :class="movementBadgeClass((row as ProduccionStockMovement).movementType)">
            {{ MOVEMENT_TYPE_LABELS[(row as ProduccionStockMovement).movementType] }}
          </td>
          <td class="py-3 px-4 text-sm">{{ formatQty((row as ProduccionStockMovement).quantity) }}</td>
          <td class="py-3 px-4 text-sm font-medium">{{ formatQty((row as ProduccionStockMovement).balanceAfter) }}</td>
          <td class="py-3 px-4 text-sm truncate max-w-[160px]" :style="{ color: 'var(--color-text-secondary)' }">
            {{ (row as ProduccionStockMovement).reference ?? '—' }}
          </td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="showModal" size="md">
      <template #title>Registrar movimiento</template>
      <div class="p-4 space-y-4">
        <FormSelect v-model="materialId" label="Material" :options="materialOptions.filter((o) => o.value)" />
        <FormSelect
          v-model="movementType"
          label="Tipo"
          :options="MOVEMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))"
        />
        <FormInput v-model.number="quantity" :label="quantityHint" type="number" min="0" step="0.01" />
        <FormInput v-model.number="unitCost" label="Costo unitario (opcional)" type="number" min="0" step="0.01" />
        <FormInput v-model="reference" label="Referencia" placeholder="OC-001, ajuste inventario…" />
        <FormTextarea v-model="notes" label="Notas" :rows="2" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="showModal = false">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="saving" @click="save">Registrar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
