<script setup lang="ts">
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
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { formatPen } from '../../../asientos/domain/journal.utils'
import {
  useContabilidadSuppliers,
  useContabilidadCreateSupplier,
  useContabilidadUpdateSupplier,
} from '../composables/useContabilidadPurchases'
import type { ContabilidadSupplierDTO } from '../../domain/purchases.types'
import { SUPPLIER_COUNTRY_OPTIONS } from '../../domain/purchases.types'
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const listParams = computed(() => ({
  search: debouncedSearch.value.trim() || undefined,
  activeOnly: true,
}))

const { data, isLoading, refetch } = useContabilidadSuppliers(listParams)
const rows = computed(() => data.value?.suppliers ?? [])

const { mutate: createSupplier, isPending: creating } = useContabilidadCreateSupplier()
const { mutate: updateSupplier, isPending: updating } = useContabilidadUpdateSupplier()

const modalOpen = ref(false)
const editing = ref<ContabilidadSupplierDTO | null>(null)
const form = ref({
  ruc: '',
  businessName: '',
  countryCode: 'PE',
  isNonDomiciled: false,
  tradeName: '',
  address: '',
  email: '',
  phone: '',
  isActive: true,
})

const countryOptions = SUPPLIER_COUNTRY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))

function isForeignSupplier(row: ContabilidadSupplierDTO) {
  return row.isNonDomiciled || row.countryCode !== 'PE'
}

function openNew() {
  editing.value = null
  form.value = {
    ruc: '',
    businessName: '',
    countryCode: 'PE',
    isNonDomiciled: false,
    tradeName: '',
    address: '',
    email: '',
    phone: '',
    isActive: true,
  }
  modalOpen.value = true
}

function openEdit(row: ContabilidadSupplierDTO) {
  editing.value = row
  form.value = {
    ruc: row.ruc,
    businessName: row.businessName,
    countryCode: row.countryCode || 'PE',
    isNonDomiciled: row.isNonDomiciled,
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
    updateSupplier(
      {
        id: editing.value.id,
        body: {
          businessName: form.value.businessName.trim(),
          countryCode: form.value.countryCode,
          isNonDomiciled: form.value.isNonDomiciled,
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
      void markapAlert.toast.warning('RUC debe tener 11 dígitos')
      return
    }
    createSupplier(
      {
        ruc: form.value.ruc.trim(),
        businessName: form.value.businessName.trim(),
        countryCode: form.value.countryCode,
        isNonDomiciled: form.value.isNonDomiciled,
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
      title="Proveedores"
      subtitle="Maestro de proveedores y saldo de cuentas por pagar (421)."
    >
      <template #actions>
        <BaseButton variant="primary" @click="openNew">
        <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
        Nuevo proveedor
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
          { key: 'c2', label: 'País' },
          { key: 'c3', label: 'Saldo CxP', align: 'right' },
          { key: 'c4', label: 'Facturas', align: 'center' },
          { key: 'c5', label: 'Estado' },
          { key: 'c6', label: '' },
        ]"
        :data="rows"
        empty-text="Sin proveedores registrados"
      >
        <template #row="{ row }">
            <td class="py-2.5 px-4 font-mono">{{ row.ruc }}</td>
            <td class="py-2.5 px-4">
              <div class="font-medium">{{ row.businessName }}</div>
              <div v-if="row.tradeName" class="text-xs text-gray-400 dark:text-gray-500">{{ row.tradeName }}</div>
            </td>
            <td class="py-2.5 px-4">
              <span class="font-mono text-xs">{{ row.countryCode }}</span>
              <Badge v-if="isForeignSupplier(row)" variant="warning" class="ml-2">No dom.</Badge>
            </td>
            <td class="py-2.5 px-4 text-right font-mono font-semibold">{{ formatPen(row.payableBalance) }}</td>
            <td class="py-2.5 px-4 text-center">{{ row.invoiceCount }}</td>
            <td class="py-2.5 px-4">
              <Badge :variant="row.isActive ? 'success' : 'neutral'">{{ row.isActive ? 'Activo' : 'Inactivo' }}</Badge>
            </td>
            <td class="py-2.5 px-4 text-right">
              <BaseButton variant="secondary" size="sm" @click="openEdit(row)">Editar</BaseButton>
            </td>
        </template>
      </DataTable>
    </BaseCard>

    <BaseModal v-model="modalOpen" :title="editing ? 'Editar proveedor' : 'Nuevo proveedor'" size="md">
      <form class="space-y-4" @submit.prevent="submitForm">
        <FormInput
          v-model="form.ruc"
          label="RUC"
          maxlength="11"
          inputmode="numeric"
          required
          :disabled="Boolean(editing)"
        />
        <FormInput v-model="form.businessName" label="Razón social" required />
        <div class="grid gap-4 sm:grid-cols-2">
          <FormSelect v-model="form.countryCode" label="País" :options="countryOptions" />
          <div class="flex items-end pb-1">
            <FormCheckbox
              v-model="form.isNonDomiciled"
              label="Proveedor no domiciliado (PLE 8.2)"
            />
          </div>
        </div>
        <FormInput v-model="form.tradeName" label="Nombre comercial" />
        <FormInput v-model="form.address" label="Dirección" />
        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput v-model="form.email" label="Correo" type="email" />
          <FormInput v-model="form.phone" label="Teléfono" />
        </div>
        <FormCheckbox v-if="editing" v-model="form.isActive" label="Proveedor activo" />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="creating || updating">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
