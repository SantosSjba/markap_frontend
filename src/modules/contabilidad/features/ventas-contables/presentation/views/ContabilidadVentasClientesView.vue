<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  BaseButton,
  AppIcon,
  BaseModal,
  Badge,
  FormInput,
  FormCheckbox,
  SearchInput,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useDebouncedRef } from '@/shared/composables/useDebouncedRef'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import {
  useContabilidadCustomers,
  useContabilidadCreateCustomer,
  useContabilidadUpdateCustomer,
} from '../../application/useContabilidadSales'
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
  form.value = { ruc: '', businessName: '', tradeName: '', address: '', email: '', phone: '', isActive: true }
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
      { onSuccess: () => { modalOpen.value = false; void refetch() } },
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
      { onSuccess: () => { modalOpen.value = false; void refetch() } },
    )
  }
}
</script>

<template>
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Clientes</h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Maestro de clientes y saldo de cuentas por cobrar (1041).
        </p>
      </div>
      <BaseButton variant="primary" @click="openNew">
        <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
        Nuevo cliente
      </BaseButton>
    </div>

    <SearchInput v-model="searchInput" placeholder="Buscar por RUC o razón social…" class="w-full max-w-md" />

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div
      v-else
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">RUC</th>
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Razón social</th>
            <th class="text-right py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Saldo CxC</th>
            <th class="text-center py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Comprobantes</th>
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Estado</th>
            <th class="py-3 px-4 w-24" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            class="border-b last:border-b-0"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <td class="py-2.5 px-4 font-mono">{{ row.ruc }}</td>
            <td class="py-2.5 px-4">
              <div class="font-medium">{{ row.businessName }}</div>
              <div v-if="row.tradeName" class="text-xs" :style="{ color: 'var(--color-text-muted)' }">{{ row.tradeName }}</div>
            </td>
            <td class="py-2.5 px-4 text-right font-mono font-semibold">{{ formatPen(row.receivableBalance) }}</td>
            <td class="py-2.5 px-4 text-center">{{ row.invoiceCount }}</td>
            <td class="py-2.5 px-4">
              <Badge :variant="row.isActive ? 'success' : 'neutral'">{{ row.isActive ? 'Activo' : 'Inactivo' }}</Badge>
            </td>
            <td class="py-2.5 px-4 text-right">
              <BaseButton variant="secondary" size="sm" @click="openEdit(row)">Editar</BaseButton>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="6" class="py-8 text-center" :style="{ color: 'var(--color-text-muted)' }">
              Sin clientes registrados
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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
          <BaseButton type="submit" variant="primary" :loading="creating || updating">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
