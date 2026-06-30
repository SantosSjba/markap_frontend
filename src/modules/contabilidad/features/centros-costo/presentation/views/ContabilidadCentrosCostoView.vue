<script setup lang="ts">
import { ref } from 'vue'
import {
  BaseButton,
  AppIcon,
  BaseModal,
  FormInput,
  FormCheckbox,
  SearchInput,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useDebouncedRef } from '@/shared/composables/useDebouncedRef'
import {
  useContabilidadCostCentersList,
  useContabilidadCreateCostCenter,
  useContabilidadUpdateCostCenter,
  useContabilidadDeactivateCostCenter,
} from '../../application/useContabilidadCostCenters'
import type { ContabilidadCostCenterDTO } from '../../domain/cost-center.types'

const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)

const { data: rows, isLoading, isError, refetch } = useContabilidadCostCentersList(debouncedSearch)
const { mutate: createCenter, isPending: creating } = useContabilidadCreateCostCenter()
const { mutate: updateCenter, isPending: updating } = useContabilidadUpdateCostCenter()
const { mutate: deactivateCenter, isPending: deactivating } = useContabilidadDeactivateCostCenter()

const modalOpen = ref(false)
const editing = ref<ContabilidadCostCenterDTO | null>(null)
const form = ref({ code: '', name: '', isActive: true })

function openNew() {
  editing.value = null
  form.value = { code: '', name: '', isActive: true }
  modalOpen.value = true
}

function openEdit(row: ContabilidadCostCenterDTO) {
  editing.value = row
  form.value = { code: row.code, name: row.name, isActive: row.isActive }
  modalOpen.value = true
}

function submitForm() {
  if (!form.value.code.trim() || !form.value.name.trim()) {
    void markapAlert.toast.warning('Código y nombre son obligatorios')
    return
  }
  if (editing.value) {
    updateCenter(
      {
        id: editing.value.id,
        body: {
          code: form.value.code.trim(),
          name: form.value.name.trim(),
          isActive: form.value.isActive,
        },
      },
      { onSuccess: () => { modalOpen.value = false; void refetch() } },
    )
  } else {
    createCenter(
      { code: form.value.code.trim(), name: form.value.name.trim() },
      { onSuccess: () => { modalOpen.value = false; void refetch() } },
    )
  }
}

async function confirmDeactivate(row: ContabilidadCostCenterDTO) {
  const ok = await markapAlert.confirmDanger({
    title: 'Desactivar centro de costo',
    text: `${row.code} — ${row.name}`,
    confirmText: 'Desactivar',
  })
  if (!ok) return
  deactivateCenter(row.id, { onSuccess: () => void refetch() })
}
</script>

<template>
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Centros de costo
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Segmentación analítica para asientos y reportes por área.
        </p>
      </div>
      <BaseButton variant="primary" @click="openNew">
        <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
        Nuevo centro
      </BaseButton>
    </div>

    <SearchInput v-model="searchInput" placeholder="Buscar por código o nombre…" class="max-w-md" />

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div
      v-else-if="isError"
      class="rounded-xl border p-8 text-center"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <BaseButton variant="secondary" @click="refetch()">Reintentar</BaseButton>
    </div>

    <div
      v-else
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Código</th>
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Nombre</th>
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Estado</th>
            <th class="py-3 px-4" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            class="border-b last:border-b-0"
            :style="{ borderColor: 'var(--color-border)', opacity: row.isActive ? 1 : 0.55 }"
          >
            <td class="py-2.5 px-4 font-mono text-xs" :style="{ color: 'var(--color-primary)' }">{{ row.code }}</td>
            <td class="py-2.5 px-4" :style="{ color: 'var(--color-text-primary)' }">{{ row.name }}</td>
            <td class="py-2.5 px-4 text-xs" :style="{ color: row.isActive ? 'var(--color-success)' : 'var(--color-text-muted)' }">
              {{ row.isActive ? 'Activo' : 'Inactivo' }}
            </td>
            <td class="py-2.5 px-4 text-right">
              <div class="flex justify-end gap-1">
                <BaseButton variant="ghost" size="sm" @click="openEdit(row)">
                  <AppIcon icon="lucide:pencil" :size="16" />
                </BaseButton>
                <BaseButton
                  v-if="row.isActive"
                  variant="ghost"
                  size="sm"
                  :loading="deactivating"
                  @click="confirmDeactivate(row)"
                >
                  <AppIcon icon="lucide:ban" :size="16" />
                </BaseButton>
              </div>
            </td>
          </tr>
          <tr v-if="!rows?.length">
            <td colspan="4" class="py-8 text-center text-sm" :style="{ color: 'var(--color-text-muted)' }">
              Sin centros de costo
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal v-model="modalOpen" :title="editing ? 'Editar centro de costo' : 'Nuevo centro de costo'" size="md">
      <form class="space-y-4" @submit.prevent="submitForm">
        <FormInput v-model="form.code" label="Código" hint="2-12 caracteres, mayúsculas" />
        <FormInput v-model="form.name" label="Nombre" required />
        <FormCheckbox v-if="editing" v-model="form.isActive" label="Activo" />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="creating || updating">
            {{ editing ? 'Guardar' : 'Crear' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
