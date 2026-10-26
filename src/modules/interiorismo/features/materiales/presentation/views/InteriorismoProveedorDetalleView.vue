<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin } = useApplicationAccess('interiorismo')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { formatDateTime } from '@shared/utils/formatters'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import type { InteriorSupplierCatalogLinkDto } from '../../domain/suppliers.types'
import type { ListInteriorCatalogMaterialsParams } from '../../domain/catalog.types'
import {
  useInteriorMaterialSupplierDetail,
  useUpdateInteriorMaterialSupplier,
  useDeleteInteriorMaterialSupplier,
  useLinkInteriorSupplierCatalog,
  useUnlinkInteriorSupplierCatalog,
  useRecordInteriorMaterialPurchase,
} from '../composables/useInteriorMaterialSuppliers'
import { useInteriorCatalogMaterialsList } from '../composables/useInteriorCatalogMaterials'
import { formatSol, formatQty } from '../labels'
const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const activeTab = ref('datos')
const tabs = [
  { id: 'datos', label: 'Datos', icon: 'lucide:building-2' },
  { id: 'vinculos', label: 'Materiales', icon: 'lucide:link' },
  { id: 'compras', label: 'Historial compras', icon: 'lucide:shopping-cart' },
]

const { data: detail, isLoading } = useInteriorMaterialSupplierDetail(id)
const updateMut = useUpdateInteriorMaterialSupplier(id)
const deleteMut = useDeleteInteriorMaterialSupplier()
const linkMut = useLinkInteriorSupplierCatalog(id)
const unlinkMut = useUnlinkInteriorSupplierCatalog()
const purchaseMut = useRecordInteriorMaterialPurchase(id)

const companyName = ref('')
const ruc = ref('')
const contactName = ref('')
const phone = ref('')
const email = ref('')

watch(
  detail,
  (d) => {
    if (!d) return
    companyName.value = d.companyName
    ruc.value = d.ruc
    contactName.value = d.contactName ?? ''
    phone.value = d.phone ?? ''
    email.value = d.email ?? ''
  },
  { immediate: true },
)

const catalogParams = ref<ListInteriorCatalogMaterialsParams>({ page: 1, limit: 400 })
const { data: catalogRes } = useInteriorCatalogMaterialsList(catalogParams)

const linkedMaterialIds = computed(
  () => new Set((detail.value?.catalogLinks ?? []).map((l) => l.catalogMaterialId)),
)

const catalogLinkOptions = computed(() =>
  (catalogRes.value?.data ?? [])
    .filter((m) => !linkedMaterialIds.value.has(m.id))
    .map((m) => ({ value: m.id, label: `${m.code} · ${m.name}` })),
)

const catalogPurchaseOptions = computed(() => [
  { value: '', label: 'Sin material del catálogo' },
  ...(catalogRes.value?.data ?? []).map((m) => ({
    value: m.id,
    label: `${m.code} · ${m.name}`,
  })),
])

const showLinkModal = ref(false)
const linkMaterialId = ref('')
const linkSku = ref('')
const linkNotes = ref('')

watch(showLinkModal, (open) => {
  if (open) {
    const opts = catalogLinkOptions.value
    const first = opts[0]
    linkMaterialId.value = first != null ? String(first.value) : ''
    linkSku.value = ''
    linkNotes.value = ''
  }
})

async function submitLink() {
  const mid = linkMaterialId.value.trim()
  if (!mid) return
  await linkMut.mutateAsync({
    catalogMaterialId: mid,
    supplierSku: linkSku.value.trim() || null,
    notes: linkNotes.value.trim() || null,
  })
  showLinkModal.value = false
}

const showPurchaseModal = ref(false)
const purchaseMaterialId = ref('')
const purchaseAt = ref('')
const purchaseQty = ref(1)
const purchasePrice = ref(0)
const purchaseInvoice = ref('')
const purchaseNotes = ref('')

function localNowSlice() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

watch(showPurchaseModal, (open) => {
  if (open) {
    purchaseMaterialId.value = ''
    purchaseAt.value = localNowSlice()
    purchaseQty.value = 1
    purchasePrice.value = 0
    purchaseInvoice.value = ''
    purchaseNotes.value = ''
  }
})

async function submitPurchase() {
  await purchaseMut.mutateAsync({
    catalogMaterialId: purchaseMaterialId.value.trim() || null,
    purchasedAt: new Date(purchaseAt.value).toISOString(),
    quantity: Number(purchaseQty.value),
    unitPrice: Number(purchasePrice.value),
    invoiceRef: purchaseInvoice.value.trim() || null,
    notes: purchaseNotes.value.trim() || null,
  })
  showPurchaseModal.value = false
}

async function saveDatos() {
  await updateMut.mutateAsync({
    companyName: companyName.value.trim(),
    ruc: ruc.value.trim(),
    contactName: contactName.value.trim() || null,
    phone: phone.value.trim() || null,
    email: email.value.trim() || null,
  })
}

async function removeSupplier() {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar proveedor?',
    text: 'Se eliminarán vínculos e historial asociado a este proveedor.',
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await deleteMut.mutateAsync(id.value)
  await router.replace(`${INTERIORISMO_BASE_PATH}/materiales/proveedores`)
}

async function unlinkRow(link: InteriorSupplierCatalogLinkDto) {
  const ok = await markapAlert.confirmDanger({
    title: '¿Quitar material?',
    text: `Se desvinculará ${link.materialCode} del proveedor.`,
    confirmText: 'Quitar',
  })
  if (!ok) return
  await unlinkMut.mutateAsync(link.id)
}

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/materiales/proveedores`)

const linkColumns = [
  { key: 'materialCode', label: 'Código', align: 'left' as const },
  { key: 'materialName', label: 'Material', align: 'left' as const },
  { key: 'category', label: 'Categoría', align: 'left' as const },
  { key: 'supplierSku', label: 'SKU proveedor', align: 'left' as const },
  { key: 'notes', label: 'Notas', align: 'left' as const },
  { key: 'id', label: '', align: 'right' as const },
]

const linkRows = computed(() => detail.value?.catalogLinks ?? [])

const purchaseColumns = [
  { key: 'when', label: 'Fecha', align: 'left' as const },
  { key: 'mat', label: 'Material', align: 'left' as const },
  { key: 'qty', label: 'Cant.', align: 'left' as const },
  { key: 'unit', label: 'P. unit.', align: 'left' as const },
  { key: 'total', label: 'Total', align: 'left' as const },
  { key: 'inv', label: 'Factura', align: 'left' as const },
]

const purchaseRows = computed(() =>
  (detail.value?.purchases ?? []).map((p) => ({
    id: p.id,
    when: formatDateTime(p.purchasedAt),
    mat:
      p.materialName != null
        ? `${p.materialCode ? `${p.materialCode} · ` : ''}${p.materialName}`
        : '—',
    qty: formatQty(p.quantity),
    unit: formatSol(p.unitPrice),
    total: formatSol(p.totalAmount),
    inv: p.invoiceRef ?? '—',
  })),
)
</script>

<template>
  <div class="max-w-[1100px] mx-auto space-y-6">
    <PageHeader
      :title="detail?.companyName ?? '…'"
      :subtitle="`RUC ${detail?.ruc ?? '…'}`"
      eyebrow="Proveedor"
    >
      <template #actions>
        <div class="flex flex-wrap gap-2">
        <BaseButton variant="ghost" type="button" @click="goBack">
          <AppIcon icon="lucide:arrow-left" :size="18" class="mr-1.5" />
          Listado
        </BaseButton>
        <BaseButton v-if="canAdmin" variant="danger" type="button" :loading="deleteMut.isPending.value" @click="removeSupplier">
          Eliminar
        </BaseButton>
      </div>
      </template>
    </PageHeader>

    <div v-if="isLoading" class="text-sm text-gray-500 dark:text-gray-400">Cargando…</div>

    <template v-else-if="detail">
      <BaseTabs v-model="activeTab" :tabs="tabs" />

      <div v-show="activeTab === 'datos'" class="space-y-4 pt-4">
        <BaseCard class="block space-y-4 max-w-[640px]">
          <FormInput v-model="companyName" label="Empresa" required />
          <FormInput v-model="ruc" label="RUC" required />
          <FormInput v-model="contactName" label="Contacto" />
          <div class="grid sm:grid-cols-2 gap-4">
            <FormInput v-model="phone" label="Teléfono" type="tel" />
            <FormInput v-model="email" label="Correo" type="email" />
          </div>
          <div class="flex justify-end">
            <BaseButton v-if="canWrite" variant="primary" type="button" :loading="updateMut.isPending.value" @click="saveDatos">
              Guardar datos
            </BaseButton>
          </div>
        </BaseCard>
      </div>

      <div v-show="activeTab === 'vinculos'" class="space-y-4 pt-4">
        <div class="flex justify-end">
          <BaseButton
            variant="primary"
            type="button"
            :disabled="catalogLinkOptions.length === 0"
            @click="showLinkModal = true"
          >
            <AppIcon icon="lucide:link" :size="18" class="mr-1.5" />
            Vincular material
          </BaseButton>
        </div>
        <BaseCard padding="none" class="block overflow-hidden">
          <DataTable
            empty-text="Este proveedor aún no tiene materiales del catálogo vinculados."
            :columns="linkColumns"
            :data="linkRows"
            row-key="id"
          >
            <template #row="{ row }">
              <td class="py-3 px-4 text-sm">{{ (row as InteriorSupplierCatalogLinkDto).materialCode }}</td>
              <td class="py-3 px-4 text-sm font-medium text-gray-800 dark:text-white/90">
                {{ (row as InteriorSupplierCatalogLinkDto).materialName }}
              </td>
              <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                {{ (row as InteriorSupplierCatalogLinkDto).category }}
              </td>
              <td class="py-3 px-4 text-sm">{{ (row as InteriorSupplierCatalogLinkDto).supplierSku ?? '—' }}</td>
              <td class="py-3 px-4 text-sm max-w-[220px] truncate" :title="(row as InteriorSupplierCatalogLinkDto).notes ?? ''">
                {{ (row as InteriorSupplierCatalogLinkDto).notes ?? '—' }}
              </td>
              <td class="py-3 px-4 text-right">
                <BaseButton variant="ghost" type="button" class="text-error-600 dark:text-error-500" @click="unlinkRow(row as InteriorSupplierCatalogLinkDto)">
                  Quitar
                </BaseButton>
              </td>
            </template>
          </DataTable>
        </BaseCard>
      </div>

      <div v-show="activeTab === 'compras'" class="space-y-4 pt-4">
        <div class="flex justify-end">
          <BaseButton variant="primary" type="button" @click="showPurchaseModal = true">
            <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
            Registrar compra
          </BaseButton>
        </div>
        <BaseCard padding="none" class="block overflow-hidden">
          <DataTable empty-text="Sin compras registradas." :columns="purchaseColumns" :data="purchaseRows" row-key="id">
            <template #row="{ row }">
              <td class="py-3 px-4 text-sm">{{ (row as { when: string }).when }}</td>
              <td class="py-3 px-4 text-sm">{{ (row as { mat: string }).mat }}</td>
              <td class="py-3 px-4 text-sm">{{ (row as { qty: string }).qty }}</td>
              <td class="py-3 px-4 text-sm">{{ (row as { unit: string }).unit }}</td>
              <td class="py-3 px-4 text-sm font-medium">{{ (row as { total: string }).total }}</td>
              <td class="py-3 px-4 text-sm">{{ (row as { inv: string }).inv }}</td>
            </template>
          </DataTable>
        </BaseCard>
      </div>
    </template>

    <BaseModal v-model="showLinkModal" title="Vincular material del catálogo" size="md">
      <div class="space-y-4">
        <p v-if="catalogLinkOptions.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay más materiales disponibles para vincular (o el catálogo está vacío).
        </p>
        <template v-else>
          <FormSelect v-model="linkMaterialId" label="Material" :options="catalogLinkOptions" required />
          <FormInput v-model="linkSku" label="SKU del proveedor (opcional)" />
          <FormTextarea v-model="linkNotes" label="Notas (opcional)" :rows="3" />
        </template>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="secondary" type="button" @click="showLinkModal = false">Cancelar</BaseButton>
          <BaseButton
            variant="primary"
            type="button"
            :disabled="!catalogLinkOptions.length || !linkMaterialId"
            :loading="linkMut.isPending.value"
            @click="submitLink"
          >
            Vincular
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <BaseModal v-model="showPurchaseModal" title="Registrar compra" size="md">
      <div class="space-y-4">
        <FormSelect v-model="purchaseMaterialId" label="Material (opcional)" :options="catalogPurchaseOptions" />
        <FormInput v-model="purchaseAt" type="datetime-local" label="Fecha y hora" required />
        <div class="grid grid-cols-2 gap-3">
          <FormInput v-model="purchaseQty" type="number" label="Cantidad" required />
          <FormInput v-model="purchasePrice" type="number" label="Precio unitario" required />
        </div>
        <FormInput v-model="purchaseInvoice" label="Factura / referencia (opcional)" />
        <FormTextarea v-model="purchaseNotes" label="Notas (opcional)" :rows="2" />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="secondary" type="button" @click="showPurchaseModal = false">Cancelar</BaseButton>
          <BaseButton v-if="canWrite" variant="primary" type="button" :loading="purchaseMut.isPending.value" @click="submitPurchase">
            Guardar
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
