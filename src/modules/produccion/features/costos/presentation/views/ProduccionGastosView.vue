<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import { ref, computed } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import {
  useProduccionExtraCostsList,
  useExtraCostMutations,
} from '../composables/useProduccionCosts'
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
  <div class="space-y-6">
    <PageHeader
      title="Gastos adicionales"
      subtitle="Catálogo de gastos reutilizables en el costeo (transporte, embalaje, etc.)."
    >
      <template #actions>
        <BaseButton variant="primary" @click="openNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nuevo concepto
      </BaseButton>
      </template>
    </PageHeader>

    <BaseCard padding="none" class="block overflow-hidden">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin gastos en catálogo." row-key="id">
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar…" />
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4 font-medium">{{ (row as ProduccionExtraCostCatalogItem).name }}</td>
          <td class="py-3 px-4 text-sm">{{ formatSol((row as ProduccionExtraCostCatalogItem).defaultAmount) }}</td>
          <td class="py-3 px-4 text-sm truncate max-w-[200px] text-gray-500 dark:text-gray-400">
            {{ (row as ProduccionExtraCostCatalogItem).description ?? '—' }}
          </td>
          <td class="py-3 px-4 text-right space-x-2">
            <BaseButton @click="openEdit(row as ProduccionExtraCostCatalogItem)" variant="link">Editar</BaseButton>
            <BaseButton @click="del(row as ProduccionExtraCostCatalogItem)" variant="link" class="text-error-500 dark:text-error-400">Eliminar</BaseButton>
          </td>
        </template>
      </DataTable>
    </BaseCard>

    <BaseModal v-model="showModal" size="md">
      <template #title>{{ editing ? 'Editar gasto' : 'Nuevo gasto' }}</template>
      <div class="p-4 space-y-4">
        <FormInput v-model="name" label="Concepto" required />
        <FormInput v-model="defaultAmount" type="number" label="Monto referencia (S/)" required />
        <FormTextarea v-model="description" label="Descripción" :rows="2" />
        <FormCheckbox v-model="isActive" label="Activo" />
      </div>
      <div class="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-800">
        <BaseButton variant="ghost" @click="showModal = false">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="saving" @click="save">Guardar</BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
