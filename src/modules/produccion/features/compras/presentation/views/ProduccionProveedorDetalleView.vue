<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BaseButton,
  BaseModal,
  DataTable,
  FormInput,
  FormSelect,
  FormTextarea,
  AppIcon,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import {
  useProduccionSupplierDetail,
  useSupplierMutations,
} from '../../application/useProduccionPurchases'
import { useProduccionMaterialsList } from '../../../inventario/application/useProduccionInventory'
import type { ProduccionSupplierMaterialLink } from '../../domain/purchases.types'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { data: detail, isLoading } = useProduccionSupplierDetail(id)
const { update, remove, linkMaterial, unlinkMaterial } = useSupplierMutations()

const companyName = ref('')
const ruc = ref('')
const contactName = ref('')
const phone = ref('')
const email = ref('')
const notes = ref('')
const isActive = ref(true)
const saving = ref(false)

watch(detail, (d) => {
  if (!d) return
  companyName.value = d.companyName
  ruc.value = d.ruc
  contactName.value = d.contactName ?? ''
  phone.value = d.phone ?? ''
  email.value = d.email ?? ''
  notes.value = d.notes ?? ''
  isActive.value = d.isActive
}, { immediate: true })

const { data: materialsRes } = useProduccionMaterialsList(ref({ page: 1, limit: 200 }))
const linkedIds = computed(() => new Set((detail.value?.materialLinks ?? []).map((l) => l.materialId)))
const materialOptions = computed(() =>
  (materialsRes.value?.data ?? [])
    .filter((m) => !linkedIds.value.has(m.id))
    .map((m) => ({ value: m.id, label: `${m.code} · ${m.name}` })),
)

const showLinkModal = ref(false)
const linkMaterialId = ref('')
const linkSku = ref('')
const linkNotes = ref('')

const linkColumns = [
  { key: 'material', label: 'Material', align: 'left' as const },
  { key: 'sku', label: 'SKU proveedor', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

async function save() {
  saving.value = true
  try {
    await update.mutateAsync({
      id: id.value,
      payload: {
        companyName: companyName.value.trim(),
        ruc: ruc.value.trim(),
        contactName: contactName.value.trim() || null,
        phone: phone.value.trim() || null,
        email: email.value.trim() || null,
        isActive: isActive.value,
        notes: notes.value.trim() || null,
      },
    })
  } finally {
    saving.value = false
  }
}

async function del() {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar proveedor?',
    text: detail.value?.companyName,
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await remove.mutateAsync(id.value)
  void router.push({ name: 'produccion-compras-proveedores' })
}

async function saveLink() {
  if (!linkMaterialId.value) return
  await linkMaterial.mutateAsync({
    supplierId: id.value,
    materialId: linkMaterialId.value,
    supplierSku: linkSku.value.trim() || null,
    notes: linkNotes.value.trim() || null,
  })
  showLinkModal.value = false
}

async function unlink(link: ProduccionSupplierMaterialLink) {
  const ok = await markapAlert.confirmDanger({
    title: '¿Quitar vínculo?',
    text: link.materialName,
    confirmText: 'Quitar',
  })
  if (!ok) return
  await unlinkMaterial.mutateAsync(link.id)
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[900px] mx-auto space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <BaseButton variant="ghost" @click="router.push({ name: 'produccion-compras-proveedores' })">
        <AppIcon icon="lucide:arrow-left" :size="18" class="mr-1" />
        Volver
      </BaseButton>
      <h1 class="text-xl font-bold flex-1" :style="{ color: 'var(--color-text-primary)' }">
        {{ detail?.companyName ?? 'Proveedor' }}
      </h1>
      <BaseButton variant="danger" @click="del">Eliminar</BaseButton>
    </div>

    <div v-if="isLoading" class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">Cargando…</div>

    <template v-else-if="detail">
      <div class="rounded-xl border p-4 space-y-4" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
        <h2 class="font-semibold text-sm">Datos del proveedor</h2>
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
        <BaseButton variant="primary" :loading="saving" @click="save">Guardar cambios</BaseButton>
      </div>

      <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
        <div class="flex items-center justify-between p-4 border-b" :style="{ borderColor: 'var(--color-border)' }">
          <h2 class="font-semibold text-sm">Materiales que suministra</h2>
          <BaseButton variant="secondary" size="sm" @click="showLinkModal = true">
            <AppIcon icon="lucide:link" :size="16" class="mr-1" />
            Vincular material
          </BaseButton>
        </div>
        <DataTable
          :columns="linkColumns"
          :data="detail.materialLinks"
          empty-text="Sin materiales vinculados."
          row-key="id"
        >
          <template #row="{ row }">
            <td class="py-3 px-4">
              <div class="font-medium text-sm">{{ (row as ProduccionSupplierMaterialLink).materialName }}</div>
              <div class="text-xs font-mono" :style="{ color: 'var(--color-text-secondary)' }">{{ (row as ProduccionSupplierMaterialLink).materialCode }}</div>
            </td>
            <td class="py-3 px-4 text-sm">{{ (row as ProduccionSupplierMaterialLink).supplierSku ?? '—' }}</td>
            <td class="py-3 px-4 text-right">
              <button type="button" class="text-sm hover:underline" :style="{ color: 'var(--color-error)' }" @click="unlink(row as ProduccionSupplierMaterialLink)">Quitar</button>
            </td>
          </template>
        </DataTable>
      </div>
    </template>

    <BaseModal v-model="showLinkModal" size="md">
      <template #title>Vincular material</template>
      <div class="p-4 space-y-4">
        <FormSelect v-model="linkMaterialId" label="Material" :options="materialOptions" />
        <FormInput v-model="linkSku" label="SKU del proveedor (opcional)" />
        <FormTextarea v-model="linkNotes" label="Notas" :rows="2" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="showLinkModal = false">Cancelar</BaseButton>
        <BaseButton variant="primary" @click="saveLink">Vincular</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
