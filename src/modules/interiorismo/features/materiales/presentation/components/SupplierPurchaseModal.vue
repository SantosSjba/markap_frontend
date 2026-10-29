<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormCombobox from '@shared/presentation/components/forms/FormCombobox.vue'
import { useCurrencyCatalog } from '@shared/presentation/composables/useCurrencyCatalog'
import { formatMoney } from '@shared/utils/money'
import { toCalendarDateString } from '@shared/utils/formatters'
import type { ListInteriorCatalogMaterialsParams } from '../../domain/catalog.types'
import { useInteriorCatalogMaterialsList } from '../composables/useInteriorCatalogMaterials'
import { useRecordInteriorMaterialPurchase } from '../composables/useInteriorMaterialSuppliers'
/** Registrar una compra al proveedor (material del catálogo opcional, cantidad, precio y moneda). */

const props = defineProps<{ supplierId: string }>()
const open = defineModel<boolean>('open', { required: true })
const purchaseMut = useRecordInteriorMaterialPurchase(toRef(props, 'supplierId'))
const { options: currencyOptions } = useCurrencyCatalog()

const catalogParams = ref<ListInteriorCatalogMaterialsParams>({ page: 1, limit: 100 })
const { data: catalog } = useInteriorCatalogMaterialsList(catalogParams)
const materialOptions = computed(() =>
  (catalog.value?.data ?? []).map((m) => ({ value: m.id, label: `${m.code} · ${m.name}` })),
)

const draft = ref({ materialId: '', date: '', quantity: '1', unitPrice: '', currency: 'PEN', invoiceRef: '', notes: '' })
const error = ref('')
watch(open, (o) => {
  if (!o) return
  draft.value = { materialId: '', date: toCalendarDateString(), quantity: '1', unitPrice: '', currency: 'PEN', invoiceRef: '', notes: '' }
  error.value = ''
})
// Al elegir el material se propone su precio y moneda de referencia
watch(
  () => draft.value.materialId,
  (id) => {
    const m = catalog.value?.data.find((x) => x.id === id)
    if (m && !draft.value.unitPrice) {
      draft.value.unitPrice = String(m.price)
      draft.value.currency = m.currency
    }
  },
)
const total = computed(() => {
  const t = Number(draft.value.quantity) * Number(draft.value.unitPrice)
  return Number.isFinite(t) && t > 0 ? formatMoney(t, draft.value.currency) : '—'
})

async function submit() {
  const quantity = Number(draft.value.quantity)
  const unitPrice = Number(draft.value.unitPrice)
  if (!(quantity > 0) || !(unitPrice >= 0) || draft.value.unitPrice === '') {
    error.value = 'Ingrese cantidad y precio unitario'
    return
  }
  error.value = ''
  try {
    await purchaseMut.mutateAsync({
      catalogMaterialId: draft.value.materialId || null,
      purchasedAt: new Date(`${draft.value.date}T12:00:00-05:00`).toISOString(),
      quantity,
      unitPrice,
      currency: draft.value.currency,
      invoiceRef: draft.value.invoiceRef.trim() || null,
      notes: draft.value.notes.trim() || null,
    })
    open.value = false
  } catch {
    void 0
  }
}
</script>

<template>
  <BaseModal v-model="open" title="Registrar compra" size="md">
    <div class="grid grid-cols-1 gap-4 p-1 sm:grid-cols-2">
      <FormCombobox v-model="draft.materialId" class="sm:col-span-2" label="Material del catálogo (opcional)" placeholder="Buscar material..." :options="materialOptions" />
      <FormInput v-model="draft.date" type="date" label="Fecha" required />
      <FormInput v-model="draft.invoiceRef" label="Factura / comprobante" placeholder="F001-123" />
      <FormInput v-model="draft.quantity" type="number" inputmode="decimal" label="Cantidad" required />
      <FormInput v-model="draft.unitPrice" type="number" inputmode="decimal" label="Precio unitario" :error="error" required />
      <FormSelect v-model="draft.currency" label="Moneda" :options="currencyOptions" />
      <div class="flex flex-col justify-end"><p class="text-theme-xs text-gray-400">Total</p><p class="text-lg font-bold text-brand-500">{{ total }}</p></div>
      <FormInput v-model="draft.notes" class="sm:col-span-2" label="Notas" placeholder="Opcional" />
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton variant="outline" @click="open = false">Cancelar</BaseButton>
        <BaseButton variant="primary" icon="lucide:save" :loading="purchaseMut.isPending.value" @click="submit">Registrar</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
