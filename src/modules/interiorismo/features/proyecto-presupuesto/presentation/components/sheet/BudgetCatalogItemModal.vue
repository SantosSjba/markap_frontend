<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormCombobox from '@shared/presentation/components/forms/FormCombobox.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { formatMoney } from '@shared/utils/money'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import {
  useInteriorCatalogMaterialsOptions,
  useInteriorCatalogMaterialDetail,
} from '../../../../materiales/presentation/composables/useInteriorCatalogMaterials'
import InteriorMaterialFormModal from '../../../../materiales/presentation/components/InteriorMaterialFormModal.vue'
import {
  catalogBudgetRow,
  catalogReferencePrice,
} from '../../../domain/catalog-budget-row'
import type {
  BudgetSheetDto,
  CreateBudgetRowsPayload,
} from '../../../domain/project-budget.types'

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{
  sheet: BudgetSheetDto
  anchorId: string | null
  saving: boolean
  canWrite: boolean
}>()
const emit = defineEmits<{ add: [payload: CreateBudgetRowsPayload] }>()
const catalog = useInteriorCatalogMaterialsOptions(open)
const selectedId = ref('')
const detail = useInteriorCatalogMaterialDetail(selectedId)
const selected = computed(() =>
  catalog.data.value?.find((m) => m.id === selectedId.value),
)
const materialOpen = ref(false)
const description = ref('')
const unit = ref('und')
const quantity = ref<number | string>(1)
const unitPrice = ref<number | string>('')
const supplierId = ref('')
const groupId = ref('')
const error = ref('')
const initializedId = ref('')
const options = computed(() =>
  (catalog.data.value ?? []).map((m) => ({
    value: m.id,
    label: `${m.code} · ${m.name}`,
    description: `${m.category} · ${formatMoney(m.price, m.currency)} / ${m.unit}`,
  })),
)
const groups = computed(() => [
  { value: '', label: 'Sin grupo (nivel principal)' },
  ...props.sheet.rows
    .filter((r) => r.kind === 'GROUP')
    .map((r) => ({ value: r.id, label: `${r.code} · ${r.description}` })),
])
const suppliers = computed(() => [
  { value: '', label: 'Definir después en Compras' },
  ...(detail.data.value?.suppliers ?? []).map((s) => ({
    value: s.supplierId,
    label: s.companyName,
  })),
])
const mismatch = computed(
  () =>
    !!selected.value && selected.value.currency !== props.sheet.budget.currency,
)
watch(selected, (m) => {
  if (!m || m.id === initializedId.value) return
  initializedId.value = m.id
  description.value = m.name
  unit.value = m.unit
  quantity.value = 1
  unitPrice.value = catalogReferencePrice(m, props.sheet.budget.currency) ?? ''
  supplierId.value = ''
  error.value = ''
})
watch(
  open,
  (value) => {
    if (!value) return
    initializedId.value = ''
    selectedId.value = ''
    description.value = ''
    unitPrice.value = ''
    supplierId.value = ''
    error.value = ''
    const anchor = props.sheet.rows.find((r) => r.id === props.anchorId)
    groupId.value =
      anchor?.kind === 'GROUP' ? anchor.id : (anchor?.parentId ?? '')
  },
  { immediate: true },
)
function submit() {
  if (
    !props.canWrite ||
    props.saving ||
    !selected.value ||
    catalog.isError.value
  )
    return
  if (unitPrice.value === '' || quantity.value === '') {
    error.value =
      'Complete la cantidad y el costo unitario en la moneda del presupuesto.'
    return
  }
  try {
    const row = catalogBudgetRow({
      description: description.value,
      unit: unit.value,
      quantity: Number(quantity.value),
      unitPrice: Number(unitPrice.value),
      supplierId: supplierId.value,
    })
    const anchor = props.sheet.rows.find((r) => r.id === props.anchorId)
    emit('add', {
      parentId: groupId.value || null,
      afterRowId:
        anchor &&
        anchor.kind !== 'GROUP' &&
        (anchor.parentId ?? '') === groupId.value
          ? anchor.id
          : null,
      rows: [row],
    })
  } catch {
    error.value =
      'Complete una descripción y unidad, una cantidad mayor que cero y un costo no negativo.'
  }
}
</script>

<template>
  <BaseModal
    v-model="open"
    title="Agregar partida desde catálogo"
    size="lg"
    persistent
  >
    <form id="budget-catalog-item" class="space-y-4" @submit.prevent="submit">
      <p class="text-sm text-gray-500">
        Use un material o producto recurrente como referencia. Puede adaptar la
        descripción y el costo para este proyecto; cambiar el catálogo después
        no modifica este presupuesto.
      </p>
      <div class="flex items-end gap-2">
        <FormCombobox
          v-model="selectedId"
          class="min-w-0 flex-1"
          label="Material o producto"
          :options="options"
          :loading="catalog.isLoading.value"
          :disabled="saving"
          placeholder="Buscar por código, nombre o categoría…"
          empty-text="Sin coincidencias en el catálogo"
        />
        <BaseButton
          v-if="canWrite"
          size="sm"
          variant="outline"
          :disabled="saving"
          @click="materialOpen = true"
          >Nuevo</BaseButton
        >
      </div>
      <div v-if="catalog.isError.value" class="space-y-2">
        <p role="alert" class="text-sm text-error-500">
          {{ getApiErrorMessage(catalog.error.value) }}
        </p>
        <BaseButton size="sm" variant="outline" @click="catalog.refetch()"
          >Reintentar</BaseButton
        >
      </div>
      <template v-if="selected">
        <FormSelect
          v-model="groupId"
          label="Ubicación en el presupuesto"
          :options="groups"
          :disabled="saving"
        />
        <FormInput
          v-model="description"
          label="Descripción de la partida"
          :disabled="saving"
          required
        />
        <div class="grid gap-3 sm:grid-cols-3">
          <FormInput
            v-model="unit"
            label="Unidad"
            :disabled="saving"
            required
          />
          <FormInput
            v-model="quantity"
            type="number"
            label="Cantidad / metrado"
            :min="0.0001"
            step="any"
            :disabled="saving"
            required
          />
          <FormInput
            v-model="unitPrice"
            type="number"
            :label="`Costo unitario (${sheet.budget.currency})`"
            :min="0"
            step="any"
            :disabled="saving"
            required
          />
        </div>
        <p v-if="mismatch" role="status" class="text-sm text-warning-600">
          La referencia es {{ formatMoney(selected.price, selected.currency) }}.
          Ingrese el costo en {{ sheet.budget.currency }}; no se convierte
          automáticamente.
        </p>
        <FormSelect
          v-model="supplierId"
          label="Proveedor de referencia (opcional)"
          :options="suppliers"
          :loading="detail.isLoading.value"
          :disabled="saving || detail.isError.value"
        />
        <p v-if="detail.isError.value" class="text-xs text-gray-500">
          No se pudieron cargar los proveedores vinculados. Puede asignar uno
          después en Compras.
        </p>
        <p class="text-xs text-gray-500">
          Costo estimado:
          {{
            unitPrice === '' || quantity === ''
              ? '—'
              : formatMoney(
                  Number(quantity) * Number(unitPrice),
                  sheet.budget.currency,
                )
          }}. La utilidad y el IGV se calculan con las condiciones del
          presupuesto. Agregar la partida no registra una compra ni descuenta
          stock.
        </p>
      </template>
      <p v-if="error" role="alert" class="text-sm text-error-500">
        {{ error }}
      </p>
    </form>
    <template #footer
      ><div class="flex justify-end gap-2">
        <BaseButton variant="outline" :disabled="saving" @click="open = false"
          >Cancelar</BaseButton
        ><BaseButton
          type="submit"
          form="budget-catalog-item"
          :loading="saving"
          :disabled="!canWrite || !selected || catalog.isError.value"
          >Agregar partida</BaseButton
        >
      </div></template
    >
  </BaseModal>
  <InteriorMaterialFormModal
    v-model:open="materialOpen"
    @created="(item) => (selectedId = item.id)"
  />
</template>
