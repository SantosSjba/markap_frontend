<script setup lang="ts">
import { ref, computed } from 'vue'
import { BaseButton, DataTable, FormInput, FormTextarea, SearchInput, AppIcon, BaseModal } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useProduccionExtraCostsList, useExtraCostMutations } from '../../application/useProduccionCosts'
import { formatSol } from '../labels'
import type { ProduccionExtraCostCatalogItem } from '../../domain/costs.types'

const listParams = ref({ page: 1, limit: 50 })
const searchInput = ref('')

const { data: result, isLoading } = useProduccionExtraCostsList(
  computed(() => ({ ...listParams.value, search: searchInput.value.trim() || undefined })),
)
const { create, update, remove } = useExtraCostMutations()

const rows = computed(() => result.value?.data ?? [])

const showModal = ref(false)
const editing = ref<ProduccionExtraCostCatalogItem | null>(null)
const name = ref('')
const defaultAmount = ref(0)
const description = ref('')
const isActive = ref(true)
const saving = ref(false)

const columns = [
  { key: 'name', label: 'Concepto', align: 'left' as const },
  { key: 'defaultAmount', label: 'Monto ref.', align: 'left' as const },
  { key: 'description', label: 'Descripción', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

function openNew() {
  editing.value = null
  name.value = ''
  defaultAmount.value = 0
  description.value = ''
  isActive.value = true
  showModal.value = true
}

function openEdit(r: ProduccionExtraCostCatalogItem) {
  editing.value = r
  name.value = r.name
  defaultAmount.value = r.defaultAmount
  description.value = r.description ?? ''
  isActive.value = r.isActive
  showModal.value = true
}

async function save() {
  if (!name.value.trim()) return
  saving.value = true
  try {
    const payload = {
      name: name.value.trim(),
      defaultAmount: Number(defaultAmount.value),
      description: description.value.trim() || null,
      isActive: isActive.value,
    }
    if (editing.value) {
      await update.mutateAsync({ id: editing.value.id, payload })
    } else {
      await create.mutateAsync(payload)
    }
    showModal.value = false
  } finally {
    saving.value = false
  }
}

async function del(r: ProduccionExtraCostCatalogItem) {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar concepto?',
    text: r.name,
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await remove.mutateAsync(r.id)
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[960px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Gastos adicionales</h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Catálogo de gastos reutilizables en el costeo (transporte, embalaje, etc.).
        </p>
      </div>
      <BaseButton variant="primary" @click="openNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nuevo concepto
      </BaseButton>
    </div>

    <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin gastos en catálogo." row-key="id">
        <template #toolbar>
          <SearchInput v-model="searchInput" placeholder="Buscar…" class="max-w-xs" />
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4 font-medium">{{ (row as ProduccionExtraCostCatalogItem).name }}</td>
          <td class="py-3 px-4 text-sm">{{ formatSol((row as ProduccionExtraCostCatalogItem).defaultAmount) }}</td>
          <td class="py-3 px-4 text-sm truncate max-w-[200px]" :style="{ color: 'var(--color-text-secondary)' }">
            {{ (row as ProduccionExtraCostCatalogItem).description ?? '—' }}
          </td>
          <td class="py-3 px-4 text-right space-x-2">
            <button type="button" class="text-sm hover:underline" :style="{ color: 'var(--color-primary)' }" @click="openEdit(row as ProduccionExtraCostCatalogItem)">Editar</button>
            <button type="button" class="text-sm hover:underline" :style="{ color: 'var(--color-error)' }" @click="del(row as ProduccionExtraCostCatalogItem)">Eliminar</button>
          </td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="showModal" size="md">
      <template #title>{{ editing ? 'Editar gasto' : 'Nuevo gasto' }}</template>
      <div class="p-4 space-y-4">
        <FormInput v-model="name" label="Concepto" required />
        <FormInput v-model="defaultAmount" type="number" label="Monto referencia (S/)" required />
        <FormTextarea v-model="description" label="Descripción" :rows="2" />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="isActive" type="checkbox" class="rounded" />
          Activo
        </label>
      </div>
      <div class="flex justify-end gap-2 p-4 border-t" :style="{ borderColor: 'var(--color-border)' }">
        <BaseButton variant="ghost" @click="showModal = false">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="saving" @click="save">Guardar</BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
