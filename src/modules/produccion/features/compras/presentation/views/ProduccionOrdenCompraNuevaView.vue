<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, FormInput, FormSelect, FormTextarea, AppIcon } from '@shared/components'
import { useProduccionSuppliersList, usePurchaseOrderMutations } from '../../application/useProduccionPurchases'
import { useProduccionMaterialsList } from '../../../inventario/application/useProduccionInventory'
import { formatSol } from '../labels'

const router = useRouter()
const { create } = usePurchaseOrderMutations()

const { data: suppliersRes } = useProduccionSuppliersList(ref({ page: 1, limit: 100, isActive: true }))
const { data: materialsRes } = useProduccionMaterialsList(ref({ page: 1, limit: 200, isActive: true }))

const supplierOptions = computed(() =>
  (suppliersRes.value?.data ?? []).map((s) => ({ value: s.id, label: `${s.companyName} (${s.ruc})` })),
)
const materialOptions = computed(() =>
  (materialsRes.value?.data ?? []).map((m) => ({ value: m.id, label: `${m.code} · ${m.name}`, unitCost: m.unitCost })),
)

const supplierId = ref('')
const expectedAt = ref('')
const notes = ref('')
const lines = ref<{ materialId: string; quantityOrdered: number; unitPrice: number }[]>([
  { materialId: '', quantityOrdered: 1, unitPrice: 0 },
])
const saving = ref(false)

const total = computed(() =>
  lines.value.reduce((s, l) => s + (Number(l.quantityOrdered) || 0) * (Number(l.unitPrice) || 0), 0),
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
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto space-y-6">
    <div class="flex items-center gap-3">
      <BaseButton variant="ghost" @click="router.push({ name: 'produccion-compras-ordenes-compra' })">
        <AppIcon icon="lucide:arrow-left" :size="18" class="mr-1" />
        Volver
      </BaseButton>
      <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Nueva orden de compra</h1>
    </div>

    <div class="rounded-xl border p-4 space-y-4" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
      <FormSelect v-model="supplierId" label="Proveedor" :options="supplierOptions" />
      <FormInput v-model="expectedAt" label="Fecha esperada de entrega" type="date" />
      <FormTextarea v-model="notes" label="Notas" :rows="2" />

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-sm">Líneas</h2>
          <BaseButton variant="secondary" size="sm" @click="addLine">
            <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
            Agregar línea
          </BaseButton>
        </div>
        <div
          v-for="(line, i) in lines"
          :key="i"
          class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 rounded-lg"
          :style="{ background: 'var(--color-bg)' }"
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
            <button v-if="lines.length > 1" type="button" class="text-sm" :style="{ color: 'var(--color-error)' }" @click="removeLine(i)">
              <AppIcon icon="lucide:trash-2" :size="18" />
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t" :style="{ borderColor: 'var(--color-border)' }">
        <span class="text-sm font-medium">Total estimado</span>
        <span class="text-lg font-bold">{{ formatSol(total) }}</span>
      </div>

      <BaseButton variant="primary" :loading="saving" @click="save">Crear orden (borrador)</BaseButton>
    </div>
  </div>
</template>
