<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('contabilidad')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import { ref } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import {
  useContabilidadCostCentersList,
  useContabilidadCreateCostCenter,
  useContabilidadUpdateCostCenter,
  useContabilidadDeactivateCostCenter,
} from '../composables/useContabilidadCostCenters'
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
      {
        onSuccess: () => {
          modalOpen.value = false
          void refetch()
        },
      },
    )
  } else {
    createCenter(
      { code: form.value.code.trim(), name: form.value.name.trim() },
      {
        onSuccess: () => {
          modalOpen.value = false
          void refetch()
        },
      },
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
  <div class="w-full space-y-6">
    <PageHeader
      title="Centros de costo"
      subtitle="Segmentación analítica para asientos y reportes por área."
    >
      <template #actions>
        <BaseButton v-if="canWrite" variant="primary" @click="openNew">
        <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
        Nuevo centro
      </BaseButton>
      </template>
    </PageHeader>

    <SearchInput v-model="searchInput" placeholder="Buscar por código o nombre…" class="max-w-md" />

    <LoadingState v-if="isLoading" />

    <BaseCard v-else-if="isError" padding="lg" class="block text-center">
      <BaseButton variant="secondary" @click="refetch()">Reintentar</BaseButton>
    </BaseCard>

    <BaseCard v-else padding="none" class="block overflow-hidden">
      <Table class="w-full text-sm">
        <TableHeader>
          <TableRow class="border-b border-gray-200 dark:border-gray-800">
            <TableCell is-header class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Código</TableCell>
            <TableCell is-header class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Nombre</TableCell>
            <TableCell is-header class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Estado</TableCell>
            <TableCell is-header class="py-3 px-4" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="row in rows"
            :key="row.id"
            class="border-b last:border-b-0 border-gray-200 dark:border-gray-800" :style="{ opacity: row.isActive ? 1 : 0.55 }"
          >
            <TableCell class="py-2.5 px-4 font-mono text-xs text-brand-500 dark:text-brand-400">{{ row.code }}</TableCell>
            <TableCell class="py-2.5 px-4 text-gray-800 dark:text-white/90">{{ row.name }}</TableCell>
            <TableCell :class="(row.isActive) ? 'text-success-600 dark:text-success-500' : 'text-gray-400 dark:text-gray-500'" class="py-2.5 px-4 text-xs">
              {{ row.isActive ? 'Activo' : 'Inactivo' }}
            </TableCell>
            <TableCell class="py-2.5 px-4 text-right">
              <div class="flex justify-end gap-1">
                <BaseButton v-if="canWrite" variant="ghost" size="sm" @click="openEdit(row)">
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
            </TableCell>
          </TableRow>
          <TableRow v-if="!rows?.length">
            <TableCell colspan="4" class="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Sin centros de costo
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </BaseCard>

    <BaseModal v-model="modalOpen" :title="editing ? 'Editar centro de costo' : 'Nuevo centro de costo'" size="md">
      <form class="space-y-4" @submit.prevent="submitForm">
        <FormInput v-model="form.code" label="Código" hint="2-12 caracteres, mayúsculas" />
        <FormInput v-model="form.name" label="Nombre" required />
        <FormCheckbox v-if="editing" v-model="form.isActive" label="Activo" />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton v-if="canWrite" type="submit" variant="primary" :loading="creating || updating">
            {{ editing ? 'Guardar' : 'Crear' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
