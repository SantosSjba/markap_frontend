<script setup lang="ts">
import { ref, computed } from 'vue'
import { BaseButton, DataTable, FormInput, SearchInput, AppIcon, BaseModal } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useProduccionLaborRatesList, useLaborRateMutations } from '../../application/useProduccionCosts'
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
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Mano de obra</h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Tarifas por etapa para calcular el costeo de muebles.
        </p>
      </div>
      <BaseButton variant="primary" @click="openNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nueva tarifa
      </BaseButton>
    </div>

    <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
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
            <button type="button" class="text-sm hover:underline" :style="{ color: 'var(--color-primary)' }" @click="openEdit(row as ProduccionLaborRate)">Editar</button>
            <button type="button" class="text-sm hover:underline" :style="{ color: 'var(--color-error)' }" @click="del(row as ProduccionLaborRate)">Eliminar</button>
          </td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="showModal" size="md">
      <template #title>{{ editing ? 'Editar tarifa' : 'Nueva tarifa' }}</template>
      <div class="p-4 space-y-4">
        <FormInput v-model="name" label="Nombre" required />
        <div>
          <label class="block text-sm font-medium mb-1.5">Etapa</label>
          <select v-model="stage" class="w-full px-3 py-2 rounded-lg border text-sm" :style="{ borderColor: 'var(--color-border)' }">
            <option v-for="s in LABOR_STAGES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <FormInput v-model="hourlyRate" type="number" label="Tarifa por hora (S/)" required />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="isActive" type="checkbox" class="rounded" />
          Activa
        </label>
      </div>
      <div class="flex justify-end gap-2 p-4 border-t" :style="{ borderColor: 'var(--color-border)' }">
        <BaseButton variant="ghost" @click="showModal = false">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="saving" @click="save">Guardar</BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
