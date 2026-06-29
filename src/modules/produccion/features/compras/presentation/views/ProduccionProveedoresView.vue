<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  DataTable,
  FormInput,
  FormTextarea,
  SearchInput,
  AppIcon,
  BaseModal,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useProduccionSuppliersList, useSupplierMutations } from '../../application/useProduccionPurchases'
import type { ProduccionSupplierListItem } from '../../domain/purchases.types'

const router = useRouter()
const listParams = ref({ page: 1, limit: 50 })
const searchInput = ref('')

const { data: result, isLoading } = useProduccionSuppliersList(
  computed(() => ({ ...listParams.value, search: searchInput.value.trim() || undefined })),
)
const { create, update, remove } = useSupplierMutations()

const rows = computed(() => result.value?.data ?? [])

const showModal = ref(false)
const editing = ref<ProduccionSupplierListItem | null>(null)
const companyName = ref('')
const ruc = ref('')
const contactName = ref('')
const phone = ref('')
const email = ref('')
const notes = ref('')
const isActive = ref(true)
const saving = ref(false)

const columns = [
  { key: 'companyName', label: 'Empresa', align: 'left' as const },
  { key: 'ruc', label: 'RUC', align: 'left' as const },
  { key: 'contactName', label: 'Contacto', align: 'left' as const },
  { key: 'phone', label: 'Teléfono', align: 'left' as const },
  { key: 'linkedMaterialsCount', label: 'Materiales', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

function openNew() {
  editing.value = null
  companyName.value = ''
  ruc.value = ''
  contactName.value = ''
  phone.value = ''
  email.value = ''
  notes.value = ''
  isActive.value = true
  showModal.value = true
}

function openEdit(r: ProduccionSupplierListItem) {
  editing.value = r
  companyName.value = r.companyName
  ruc.value = r.ruc
  contactName.value = r.contactName ?? ''
  phone.value = r.phone ?? ''
  email.value = r.email ?? ''
  isActive.value = r.isActive
  notes.value = ''
  showModal.value = true
}

function goDetail(r: ProduccionSupplierListItem) {
  void router.push({ name: 'produccion-compras-proveedor-detalle', params: { id: r.id } })
}

async function save() {
  if (!companyName.value.trim() || !ruc.value.trim()) return
  saving.value = true
  try {
    const payload = {
      companyName: companyName.value.trim(),
      ruc: ruc.value.trim(),
      contactName: contactName.value.trim() || null,
      phone: phone.value.trim() || null,
      email: email.value.trim() || null,
      isActive: isActive.value,
      notes: notes.value.trim() || null,
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

async function del(r: ProduccionSupplierListItem) {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar proveedor?',
    text: r.companyName,
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await remove.mutateAsync(r.id)
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1100px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Proveedores</h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Empresas que abastecen materiales al taller.
        </p>
      </div>
      <BaseButton variant="primary" @click="openNew">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nuevo proveedor
      </BaseButton>
    </div>

    <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin proveedores." row-key="id">
        <template #toolbar>
          <SearchInput v-model="searchInput" placeholder="Buscar empresa o RUC…" class="max-w-xs" />
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4">
            <button type="button" class="font-medium text-left hover:underline" :style="{ color: 'var(--color-primary)' }" @click="goDetail(row as ProduccionSupplierListItem)">
              {{ (row as ProduccionSupplierListItem).companyName }}
            </button>
          </td>
          <td class="py-3 px-4 font-mono text-sm">{{ (row as ProduccionSupplierListItem).ruc }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionSupplierListItem).contactName ?? '—' }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionSupplierListItem).phone ?? '—' }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionSupplierListItem).linkedMaterialsCount }}</td>
          <td class="py-3 px-4 text-right space-x-2">
            <button type="button" class="text-sm hover:underline" :style="{ color: 'var(--color-primary)' }" @click="openEdit(row as ProduccionSupplierListItem)">Editar</button>
            <button type="button" class="text-sm hover:underline" :style="{ color: 'var(--color-error)' }" @click="del(row as ProduccionSupplierListItem)">Eliminar</button>
          </td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="showModal" size="md">
      <template #title>{{ editing ? 'Editar proveedor' : 'Nuevo proveedor' }}</template>
      <div class="p-4 space-y-4">
        <FormInput v-model="companyName" label="Razón social" />
        <FormInput v-model="ruc" label="RUC" />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput v-model="contactName" label="Contacto" />
          <FormInput v-model="phone" label="Teléfono" />
        </div>
        <FormInput v-model="email" label="Email" type="email" />
        <FormTextarea v-model="notes" label="Notas" :rows="2" />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="isActive" type="checkbox" class="rounded" />
          Activo
        </label>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="showModal = false">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="saving" @click="save">Guardar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
