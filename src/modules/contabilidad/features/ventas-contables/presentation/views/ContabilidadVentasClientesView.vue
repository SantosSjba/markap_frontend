<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('contabilidad')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import { computed, ref } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { formatPen } from '../../../asientos/domain/journal.utils'
import {
  useContabilidadCustomers,
  useContabilidadCreateCustomer,
  useContabilidadUpdateCustomer,
} from '../composables/useContabilidadSales'
import type { ContabilidadCustomerDTO } from '../../domain/sales.types'
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const listParams = computed(() => ({
  search: debouncedSearch.value.trim() || undefined,
  activeOnly: true,
}))

const { data, isLoading, refetch } = useContabilidadCustomers(listParams)
const rows = computed(() => data.value?.customers ?? [])

const { mutate: createCustomer, isPending: creating } = useContabilidadCreateCustomer()
const { mutate: updateCustomer, isPending: updating } = useContabilidadUpdateCustomer()

const modalOpen = ref(false)
const editing = ref<ContabilidadCustomerDTO | null>(null)
const form = ref({
  ruc: '',
  businessName: '',
  tradeName: '',
  address: '',
  email: '',
  phone: '',
  isActive: true,
})

function openNew() {
  editing.value = null
  form.value = {
    ruc: '',
    businessName: '',
    tradeName: '',
    address: '',
    email: '',
    phone: '',
    isActive: true,
  }
  modalOpen.value = true
}

function openEdit(row: ContabilidadCustomerDTO) {
  editing.value = row
  form.value = {
    ruc: row.ruc,
    businessName: row.businessName,
    tradeName: row.tradeName ?? '',
    address: row.address ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    isActive: row.isActive,
  }
  modalOpen.value = true
}

function submitForm() {
  if (!form.value.businessName.trim()) {
    void markapAlert.toast.warning('Razón social obligatoria')
    return
  }
  if (editing.value) {
    updateCustomer(
      {
        id: editing.value.id,
        body: {
          businessName: form.value.businessName.trim(),
          tradeName: form.value.tradeName.trim() || null,
          address: form.value.address.trim() || null,
          email: form.value.email.trim() || null,
          phone: form.value.phone.trim() || null,
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
    if (!/^\d{11}$/.test(form.value.ruc.trim())) {
      void markapAlert.toast.warning('RUC/DNI debe tener 11 dígitos')
      return
    }
    createCustomer(
      {
        ruc: form.value.ruc.trim(),
        businessName: form.value.businessName.trim(),
        tradeName: form.value.tradeName.trim() || null,
        address: form.value.address.trim() || null,
        email: form.value.email.trim() || null,
        phone: form.value.phone.trim() || null,
      },
      {
        onSuccess: () => {
          modalOpen.value = false
          void refetch()
        },
      },
    )
  }
}
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      title="Clientes"
      subtitle="Maestro de clientes y saldo de cuentas por cobrar (1041)."
    >
      <template #actions>
        <BaseButton v-if="canWrite" variant="primary" @click="openNew">
        <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
        Nuevo cliente
      </BaseButton>
      </template>
    </PageHeader>

    <SearchInput v-model="searchInput" placeholder="Buscar por RUC o razón social…" class="w-full max-w-md" />

    <LoadingState v-if="isLoading" />

    <BaseCard v-else padding="none" class="block overflow-hidden">
      <DataTable
        :columns="[
          { key: 'c0', label: 'RUC' },
          { key: 'c1', label: 'Razón social' },
          { key: 'c2', label: 'Saldo CxC', align: 'right' },
          { key: 'c3', label: 'Comprobantes', align: 'center' },
          { key: 'c4', label: 'Estado' },
          { key: 'c5', label: '' },
        ]"
        :data="rows"
        empty-text="Sin clientes registrados"
      >
        <template #row="{ row }">
            <td class="py-2.5 px-4 font-mono">{{ row.ruc }}</td>
            <td class="py-2.5 px-4">
              <div class="font-medium">{{ row.businessName }}</div>
              <div v-if="row.tradeName" class="text-xs text-gray-400 dark:text-gray-500">{{ row.tradeName }}</div>
            </td>
            <td class="py-2.5 px-4 text-right font-mono font-semibold">{{ formatPen(row.receivableBalance) }}</td>
            <td class="py-2.5 px-4 text-center">{{ row.invoiceCount }}</td>
            <td class="py-2.5 px-4">
              <Badge :variant="row.isActive ? 'success' : 'neutral'">{{ row.isActive ? 'Activo' : 'Inactivo' }}</Badge>
            </td>
            <td class="py-2.5 px-4 text-right">
              <BaseButton v-if="canWrite" variant="secondary" size="sm" @click="openEdit(row)">Editar</BaseButton>
            </td>
        </template>
      </DataTable>
    </BaseCard>

    <BaseModal v-model="modalOpen" :title="editing ? 'Editar cliente' : 'Nuevo cliente'" size="md">
      <form class="space-y-4" @submit.prevent="submitForm">
        <FormInput
          v-model="form.ruc"
          label="RUC / documento"
          maxlength="11"
          inputmode="numeric"
          required
          :disabled="Boolean(editing)"
        />
        <FormInput v-model="form.businessName" label="Razón social" required />
        <FormInput v-model="form.tradeName" label="Nombre comercial" />
        <FormInput v-model="form.address" label="Dirección" />
        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput v-model="form.email" label="Correo" type="email" />
          <FormInput v-model="form.phone" label="Teléfono" />
        </div>
        <FormCheckbox v-if="editing" v-model="form.isActive" label="Cliente activo" />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton v-if="canWrite" type="submit" variant="primary" :loading="creating || updating">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
