<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { useProduccionUnitOptions } from '../../../configuracion/presentation/composables/useProduccionConfigOptions'
export type BomLineDraft = {
  key: string
  materialName: string
  unit: string
  quantity: number
  unitCost?: number | ''
  notes?: string
}

const lines = defineModel<BomLineDraft[]>({ required: true })
const { options: unitOptions, defaultUnit } = useProduccionUnitOptions()

function addLine() {
  lines.value = [
    ...lines.value,
    {
      key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      materialName: '',
      unit: defaultUnit.value,
      quantity: 1,
      unitCost: '',
      notes: '',
    },
  ]
}

function removeLine(key: string) {
  lines.value = lines.value.filter((l) => l.key !== key)
}
</script>

<template>
  <BaseCard class="block space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-gray-800 dark:text-white/90">
          Lista de materiales (BOM)
        </p>
        <p class="text-xs mt-0.5 text-gray-500 dark:text-gray-400">
          Materiales base para costeo. En fases posteriores se vincularán al inventario.
        </p>
      </div>
      <BaseButton variant="outline" size="sm" type="button" @click="addLine">
        <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
        Agregar línea
      </BaseButton>
    </div>

    <div v-if="!lines.length" class="text-sm py-6 text-center text-gray-500 dark:text-gray-400">
      Sin materiales definidos. Agregue líneas para el despiece base.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(line, idx) in lines"
        :key="line.key"
        class="grid gap-3 p-3 rounded-lg border sm:grid-cols-12 items-end border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
      >
        <div class="sm:col-span-1 text-xs font-medium pt-2 text-gray-500 dark:text-gray-400">
          {{ idx + 1 }}
        </div>
        <div class="sm:col-span-4">
          <FormInput v-model="line.materialName" label="Material" required placeholder="Ej. Melamina 15mm" />
        </div>
        <div class="sm:col-span-2">
          <FormInput v-model="line.quantity" type="number" label="Cantidad" required />
        </div>
        <div class="sm:col-span-2">
          <FormSelect v-model="line.unit" label="Unidad" :options="unitOptions" />
        </div>
        <div class="sm:col-span-2">
          <FormInput v-model="line.unitCost" type="number" label="Costo unit." placeholder="S/" />
        </div>
        <div class="sm:col-span-2">
          <FormInput v-model="line.notes" label="Notas" placeholder="Opcional" />
        </div>
        <div class="sm:col-span-1 flex justify-end pb-1">
          <IconButton @click="removeLine(line.key)" icon="lucide:trash-2" label="Quitar línea" danger />
        </div>
      </div>
    </div>
  </BaseCard>
</template>
