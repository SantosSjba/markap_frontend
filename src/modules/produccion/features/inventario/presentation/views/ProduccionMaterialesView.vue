<script setup lang="ts">
import { ref, computed } from 'vue'
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
import { markapAlert } from '@/shared/composables'
import { useProduccionMaterialsList, useMaterialMutations } from '../../application/useProduccionInventory'
import { formatSol, formatQty, MATERIAL_CATEGORIES } from '../labels'
import type { ProduccionMaterial } from '../../domain/inventory.types'

const listParams = ref({ page: 1, limit: 50 })
const searchInput = ref('')
const categoryFilter = ref('')

const { data: result, isLoading } = useProduccionMaterialsList(
  computed(() => ({
    ...listParams.value,
    search: searchInput.value.trim() || undefined,
    category: categoryFilter.value || undefined,
  })),
)
const { create, update, remove } = useMaterialMutations()

const rows = computed(() => result.value?.data ?? [])

const showModal = ref(false)
const editing = ref<ProduccionMaterial | null>(null)
const code = ref('')
const name = ref('')
const category = ref('Tableros')
const unit = ref('und')
const unitCost = ref(0)
const minStockQty = ref(0)
const notes = ref('')
const isActive = ref(true)
const saving = ref(false)

const categoryOptions = MATERIAL_CATEGORIES.map((c) => ({ value: c, label: c }))

const columns = [
  { key: 'code', label: 'Código', align: 'left' as const },
  { key: 'name', label: 'Material', align: 'left' as const },
  { key: 'category', label: 'Categoría', align: 'left' as const },
  { key: 'unitCost', label: 'Costo unit.', align: 'left' as const },
  { key: 'minStockQty', label: 'Mínimo', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

function openNew() {
  editing.value = null
  code.value = ''
  name.value = ''
  category.value = 'Tableros'
  unit.value = 'und'
  unitCost.value = 0
  minStockQty.value = 0
  notes.value = ''
  isActive.value = true
  showModal.value = true
}

function openEdit(r: ProduccionMaterial) {
  editing.value = r
  code.value = r.code
  name.value = r.name
  category.value = r.category
  unit.value = r.unit
  unitCost.value = r.unitCost
  minStockQty.value = r.minStockQty
  notes.value = r.notes ?? ''
  isActive.value = r.isActive
  showModal.value = true
}

async function save() {
  if (!name.value.trim() || !code.value.trim()) return
  saving.value = true
  try {
    if (editing.value) {
      await update.mutateAsync({
        id: editing.value.id,
        payload: {
          name: name.value.trim(),
          category: category.value,
          unit: unit.value.trim(),
          unitCost: Number(unitCost.value),
          minStockQty: Number(minStockQty.value),
          isActive: isActive.value,
          notes: notes.value.trim() || null,
        },
      })
    } else {
      await create.mutateAsync({
        code: code.value.trim(),
        name: name.value.trim(),
        category: category.value,
        unit: unit.value.trim(),
        unitCost: Number(unitCost.value),
        minStockQty: Number(minStockQty.value),
        isActive: isActive.value,
        notes: notes.value.trim() || null,
      })
    }
    showModal.value = false
  } finally {
    saving.value = false
  }
}

async function del(r: ProduccionMaterial) {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar material?',
    text: `${r.code} — ${r.name}`,
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await remove.mutateAsync(r.id)
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1100px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Materiales</h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Catálogo de insumos para producción. El stock se gestiona en Movimientos.
        </p>
      </div>
      <BaseButton variant="primary" @click="openNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nuevo material
      </BaseButton>
    </div>

    <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin materiales registrados." row-key="id">
        <template #toolbar>
          <div class="flex flex-wrap gap-3">
            <SearchInput v-model="searchInput" placeholder="Buscar código o nombre…" class="max-w-xs" />
            <FormSelect v-model="categoryFilter" :options="[{ value: '', label: 'Todas las categorías' }, ...categoryOptions]" class="max-w-[200px]" />
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4 font-mono text-sm">{{ (row as ProduccionMaterial).code }}</td>
          <td class="py-3 px-4 font-medium">{{ (row as ProduccionMaterial).name }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionMaterial).category }}</td>
          <td class="py-3 px-4 text-sm">{{ formatSol((row as ProduccionMaterial).unitCost) }}</td>
          <td class="py-3 px-4 text-sm">{{ formatQty((row as ProduccionMaterial).minStockQty, (row as ProduccionMaterial).unit) }}</td>
          <td class="py-3 px-4 text-right space-x-2">
            <button type="button" class="text-sm hover:underline" :style="{ color: 'var(--color-primary)' }" @click="openEdit(row as ProduccionMaterial)">Editar</button>
            <button type="button" class="text-sm hover:underline" :style="{ color: 'var(--color-error)' }" @click="del(row as ProduccionMaterial)">Eliminar</button>
          </td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="showModal" size="md">
      <template #title>{{ editing ? 'Editar material' : 'Nuevo material' }}</template>
      <div class="p-4 space-y-4">
        <FormInput v-model="code" label="Código" :disabled="!!editing" placeholder="MAT-001" />
        <FormInput v-model="name" label="Nombre" placeholder="Melamina blanca 18mm" />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormSelect v-model="category" label="Categoría" :options="categoryOptions" />
          <FormInput v-model="unit" label="Unidad" placeholder="und, plancha, kg…" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput v-model.number="unitCost" label="Costo unitario (S/)" type="number" min="0" step="0.01" />
          <FormInput v-model.number="minStockQty" label="Stock mínimo" type="number" min="0" step="0.01" />
        </div>
        <FormTextarea v-model="notes" label="Notas" :rows="2" />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="isActive" type="checkbox" class="rounded" />
          Activo
        </label>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="showModal = false">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="saving" @click="save">Guardar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
