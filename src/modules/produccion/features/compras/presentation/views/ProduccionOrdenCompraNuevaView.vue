<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin } = useApplicationAccess('produccion')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import {
  useProduccionSuppliersList,
  usePurchaseOrderMutations,
} from '../composables/useProduccionPurchases'
import { useProduccionMaterialsList } from '../../../inventario/presentation/composables/useProduccionInventory'
import { formatSol } from '../labels'
const router = useRouter()
const { create } = usePurchaseOrderMutations()

const { data: suppliersRes } = useProduccionSuppliersList(
  ref({ page: 1, limit: 100, isActive: true }),
)
const { data: materialsRes } = useProduccionMaterialsList(
  ref({ page: 1, limit: 200, isActive: true }),
)

const supplierOptions = computed(() =>
  (suppliersRes.value?.data ?? []).map((s) => ({
    value: s.id,
    label: `${s.companyName} (${s.ruc})`,
  })),
)
const materialOptions = computed(() =>
  (materialsRes.value?.data ?? []).map((m) => ({
    value: m.id,
    label: `${m.code} · ${m.name}`,
    unitCost: m.unitCost,
  })),
)

const supplierId = ref('')
const expectedAt = ref('')
const notes = ref('')
const lines = ref<{ materialId: string; quantityOrdered: number; unitPrice: number }[]>([
  { materialId: '', quantityOrdered: 1, unitPrice: 0 },
])
const saving = ref(false)

const total = computed(() =>
  lines.value.reduce(
    (s, l) => s + (Number(l.quantityOrdered) || 0) * (Number(l.unitPrice) || 0),
    0,
  ),
)

function addLine() {
  lines.value.push({ materialId: '', quantityOrdered: 1, unitPrice: 0 })
}

function removeLine(i: number) {
  if (lines.value.length > 1) lines.value.splice(i, 1)
}

function onMaterialChange(i: number) {
  const line = lines.value[i]
  if (!line) return
  const mat = materialOptions.value.find((m) => m.value === line.materialId)
  if (mat && line.unitPrice === 0) {
    line.unitPrice = mat.unitCost
  }
}

async function save() {
  if (!supplierId.value || lines.value.some((l) => !l.materialId)) return
  saving.value = true
  try {
    const order = await create.mutateAsync({
      supplierId: supplierId.value,
      expectedAt: expectedAt.value ? new Date(expectedAt.value).toISOString() : null,
      notes: notes.value.trim() || null,
      lines: lines.value.map((l) => ({
        materialId: l.materialId,
        quantityOrdered: Number(l.quantityOrdered),
        unitPrice: Number(l.unitPrice),
      })),
    })
    void router.push({ name: 'produccion-compras-orden-detalle', params: { id: order.id } })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Nueva orden de compra"
      back
      @back="router.push({ name: 'produccion-compras-ordenes-compra' })"
    />

    <BaseCard padding="sm" class="block space-y-4">
      <FormSelect v-model="supplierId" label="Proveedor" :options="supplierOptions" />
      <FormInput v-model="expectedAt" label="Fecha esperada de entrega" type="date" />
      <FormTextarea v-model="notes" label="Notas" :rows="2" />

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-sm">Líneas</h2>
          <BaseButton v-if="canWrite" variant="secondary" size="sm" @click="addLine">
            <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
            Agregar línea
          </BaseButton>
        </div>
        <div
          v-for="(line, i) in lines"
          :key="i"
          class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 rounded-lg bg-gray-50 dark:bg-gray-900"
        >
          <div class="sm:col-span-5">
            <FormSelect
              v-model="line.materialId"
              label="Material"
              :options="materialOptions"
              @update:model-value="onMaterialChange(i)"
            />
          </div>
          <div class="sm:col-span-3">
            <FormInput v-model.number="line.quantityOrdered" label="Cantidad" type="number" min="0.01" step="0.01" />
          </div>
          <div class="sm:col-span-3">
            <FormInput v-model.number="line.unitPrice" label="Precio unit. (S/)" type="number" min="0" step="0.01" />
          </div>
          <div class="sm:col-span-1 flex justify-end pb-1">
            <IconButton v-if="(lines.length > 1) && canAdmin" @click="removeLine(i)" icon="lucide:trash-2" label="Eliminar" danger />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
        <span class="text-sm font-medium">Total estimado</span>
        <span class="text-lg font-bold">{{ formatSol(total) }}</span>
      </div>

      <BaseButton v-if="canWrite" variant="primary" :loading="saving" @click="save">Crear orden (borrador)</BaseButton>
    </BaseCard>
  </div>
</template>
