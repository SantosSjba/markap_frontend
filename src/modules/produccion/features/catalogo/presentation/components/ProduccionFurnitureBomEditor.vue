<script setup lang="ts">
import { BaseButton, FormInput, FormSelect, AppIcon } from '@shared/components'
import { useProduccionUnitOptions } from '@modules/produccion/features/configuracion'

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
  <div
    class="space-y-4 p-4 sm:p-6 rounded-xl border"
    :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">
          Lista de materiales (BOM)
        </p>
        <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Materiales base para costeo. En fases posteriores se vincularán al inventario.
        </p>
      </div>
      <BaseButton variant="outline" size="sm" type="button" @click="addLine">
        <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
        Agregar línea
      </BaseButton>
    </div>

    <div v-if="!lines.length" class="text-sm py-6 text-center" :style="{ color: 'var(--color-text-secondary)' }">
      Sin materiales definidos. Agregue líneas para el despiece base.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(line, idx) in lines"
        :key="line.key"
        class="grid gap-3 p-3 rounded-lg border sm:grid-cols-12 items-end"
        :style="{ borderColor: 'var(--color-border)', background: 'var(--color-background)' }"
      >
        <div class="sm:col-span-1 text-xs font-medium pt-2" :style="{ color: 'var(--color-text-secondary)' }">
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
          <button
            type="button"
            class="p-2 rounded-lg hover:bg-[var(--color-hover)]"
            title="Quitar línea"
            :style="{ color: 'var(--color-error)' }"
            @click="removeLine(line.key)"
          >
            <AppIcon icon="lucide:trash-2" :size="18" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
