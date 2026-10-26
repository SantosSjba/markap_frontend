<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import { computed, ref } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { formatPen } from '../../../asientos/domain/journal.utils'
import { useContabilidadAccountsTree } from '../../../plan-cuentas/presentation/composables/useContabilidadAccounts'
import { flattenMovementAccounts } from '../../../asientos/domain/journal.utils'
import {
  useContabilidadCreateInventoryItem,
  useContabilidadInventoryItems,
} from '../composables/useContabilidadInventory'
import {
  INVENTORY_COST_METHOD_OPTIONS,
  type ContabilidadInventoryItemDTO,
} from '../../domain/inventory.types'
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput, 300)
const listParams = computed(() => ({ search: debouncedSearch.value.trim() || undefined }))

const { data, isLoading } = useContabilidadInventoryItems(listParams)
const rows = computed(() => data.value?.items ?? [])

const emptySearch = ref('')
const { data: accountsData } = useContabilidadAccountsTree(emptySearch)
const accountOptions = computed(() =>
  flattenMovementAccounts(accountsData.value?.tree ?? []).filter(
    (o) => o.label.startsWith('20') || o.label.startsWith('21'),
  ),
)

const { mutate: createItem, isPending: saving } = useContabilidadCreateInventoryItem()
const modalOpen = ref(false)
const form = ref({
  code: '',
  description: '',
  accountId: '',
  unit: 'UN',
  costMethod: 'PROMEDIO',
})

const columns = [
  { key: 'code', label: 'Código', sortable: true },
  { key: 'description', label: 'Descripción' },
  { key: 'account', label: 'Cuenta 20/21' },
  { key: 'stock', label: 'Stock', align: 'right' as const },
  { key: 'valued', label: 'Valorizado', align: 'right' as const },
]

function openModal() {
  form.value = { code: '', description: '', accountId: '', unit: 'UN', costMethod: 'PROMEDIO' }
  modalOpen.value = true
}

function submit() {
  createItem(form.value, {
    onSuccess: () => {
      modalOpen.value = false
    },
  })
}
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      icon="lucide:package"
      title="Ítems de inventario"
      subtitle="Catálogo permanente valorizado — cuentas 20 y 21."
    >
      <template #actions>
        <BaseButton @click="openModal">Nuevo ítem</BaseButton>
      </template>
    </PageHeader>

    <BaseCard padding="none" class="block overflow-hidden">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin ítems." row-key="id">
        <template #toolbar>
          <SearchInput v-model="searchInput" placeholder="Buscar código o descripción…" class="flex-1 max-w-md" />
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4 font-mono text-sm">{{ (row as ContabilidadInventoryItemDTO).code }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadInventoryItemDTO).description }}</td>
          <td class="py-3 px-4 text-sm">
            <span class="font-mono text-xs">{{ (row as ContabilidadInventoryItemDTO).accountCode }}</span>
            <span class="block text-xs text-gray-400 dark:text-gray-500">
              {{ (row as ContabilidadInventoryItemDTO).accountName }}
            </span>
          </td>
          <td class="py-3 px-4 text-right font-mono text-sm">
            {{ (row as ContabilidadInventoryItemDTO).quantityOnHand }} {{ (row as ContabilidadInventoryItemDTO).unit }}
          </td>
          <td class="py-3 px-4 text-right font-mono text-sm font-semibold">
            {{ formatPen((row as ContabilidadInventoryItemDTO).valuedBalance) }}
          </td>
        </template>
      </DataTable>
    </BaseCard>

    <BaseModal v-model="modalOpen" title="Nuevo ítem de inventario" size="md">
      <div class="space-y-4">
        <FormInput v-model="form.code" label="Código" placeholder="MAT-001" />
        <FormInput v-model="form.description" label="Descripción" />
        <FormSelect v-model="form.accountId" label="Cuenta inventario (20/21)" :options="accountOptions" />
        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput v-model="form.unit" label="Unidad" placeholder="UN" />
          <FormSelect v-model="form.costMethod" label="Método de costo" :options="INVENTORY_COST_METHOD_OPTIONS" />
        </div>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
        <BaseButton :loading="saving" @click="submit">Guardar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
