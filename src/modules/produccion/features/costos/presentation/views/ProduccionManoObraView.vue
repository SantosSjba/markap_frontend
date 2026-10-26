<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin } = useApplicationAccess('produccion')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import { ref, computed } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import {
  useProduccionLaborRatesList,
  useLaborRateMutations,
} from '../composables/useProduccionCosts'
import { formatSol, LABOR_STAGES } from '../labels'
import type { ProduccionLaborRate } from '../../domain/costs.types'
const listParams = ref({ page: 1, limit: 50 })
const searchInput = ref('')

const { data: result, isLoading } = useProduccionLaborRatesList(
  computed(() => ({ ...listParams.value, search: searchInput.value.trim() || undefined })),
)
const { create, update, remove } = useLaborRateMutations()

const rows = computed(() => result.value?.data ?? [])

const showModal = ref(false)
const editing = ref<ProduccionLaborRate | null>(null)
const name = ref('')
const stage = ref<string>(LABOR_STAGES[0])
const hourlyRate = ref(0)
const isActive = ref(true)
const saving = ref(false)

const columns = [
  { key: 'name', label: 'Nombre', align: 'left' as const },
  { key: 'stage', label: 'Etapa', align: 'left' as const },
  { key: 'hourlyRate', label: 'Tarifa/h', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

function openNew() {
  editing.value = null
  name.value = ''
  stage.value = LABOR_STAGES[0]
  hourlyRate.value = 0
  isActive.value = true
  showModal.value = true
}

function openEdit(r: ProduccionLaborRate) {
  editing.value = r
  name.value = r.name
  stage.value = r.stage
  hourlyRate.value = r.hourlyRate
  isActive.value = r.isActive
  showModal.value = true
}

async function save() {
  if (!name.value.trim()) return
  saving.value = true
  try {
    const payload = {
      name: name.value.trim(),
      stage: stage.value,
      hourlyRate: Number(hourlyRate.value),
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

async function del(r: ProduccionLaborRate) {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar tarifa?',
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
      title="Mano de obra"
      subtitle="Tarifas por etapa para calcular el costeo de muebles."
    >
      <template #actions>
        <BaseButton v-if="canWrite" variant="primary" @click="openNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nueva tarifa
      </BaseButton>
      </template>
    </PageHeader>

    <BaseCard padding="none" class="block overflow-hidden">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin tarifas definidas." row-key="id">
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar…" />
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4 font-medium">{{ (row as ProduccionLaborRate).name }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionLaborRate).stage }}</td>
          <td class="py-3 px-4 text-sm">{{ formatSol((row as ProduccionLaborRate).hourlyRate) }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionLaborRate).isActive ? 'Activa' : 'Inactiva' }}</td>
          <td class="py-3 px-4 text-right space-x-2">
            <BaseButton v-if="canWrite" @click="openEdit(row as ProduccionLaborRate)" variant="link">Editar</BaseButton>
            <BaseButton v-if="canAdmin" @click="del(row as ProduccionLaborRate)" variant="link" class="text-error-500 dark:text-error-400">Eliminar</BaseButton>
          </td>
        </template>
      </DataTable>
    </BaseCard>

    <BaseModal v-model="showModal" size="md">
      <template #title>{{ editing ? 'Editar tarifa' : 'Nueva tarifa' }}</template>
      <div class="p-4 space-y-4">
        <FormInput v-model="name" label="Nombre" required />
        <div>
          <FormSelect
            v-model="stage"
            :options="(LABOR_STAGES).map((x) => ({ value: x, label: x }))"
            label="Etapa"
          />
        </div>
        <FormInput v-model="hourlyRate" type="number" label="Tarifa por hora (S/)" required />
        <FormCheckbox v-model="isActive" label="Activa" />
      </div>
      <div class="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-800">
        <BaseButton variant="ghost" @click="showModal = false">Cancelar</BaseButton>
        <BaseButton v-if="canWrite" variant="primary" :loading="saving" @click="save">Guardar</BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
