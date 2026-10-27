<script setup lang="ts">
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
/**
 * PropertyMediaQueueSection — multimedia en el alta de una propiedad (Alquileres y Ventas):
 * los archivos quedan en cola y la vista los sube cuando la propiedad ya existe.
 */
export type QueuedMediaRow = { file: File | null; kind: 'photo' | 'plan'; error: string }

withDefaults(defineProps<{ canWrite?: boolean }>(), { canWrite: true })

const rows = defineModel<QueuedMediaRow[]>({ required: true })

const KIND_OPTIONS = [
  { value: 'photo', label: 'Foto' },
  { value: 'plan', label: 'Plano' },
]

function addRow() {
  rows.value = [...rows.value, { file: null, kind: 'photo', error: '' }]
}
function removeRow(i: number) {
  const next = rows.value.filter((_, idx) => idx !== i)
  rows.value = next.length ? next : [{ file: null, kind: 'photo', error: '' }]
}
</script>

<template>
  <FormSectionCard title="Multimedia" subtitle="Fotos y planos; se suben al guardar la propiedad">
    <div class="space-y-4">
      <div v-for="(row, idx) in rows" :key="idx" class="space-y-2">
        <div class="flex items-end gap-2">
          <FormSelect v-model="row.kind" class="w-36" :options="KIND_OPTIONS" label="Tipo" />
          <BaseButton
            v-if="rows.length > 1"
            type="button"
            variant="ghost"
            size="lg"
            icon="lucide:trash-2"
            class="px-3!"
            :aria-label="`Quitar archivo ${idx + 1}`"
            @click="removeRow(idx)"
          />
        </div>
        <FileDropzone
          v-model="row.file"
          :label="row.kind === 'plan' ? 'Plano' : 'Foto'"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          :max-size="25 * 1024 * 1024"
          :multiple="false"
          :error="row.error"
          @error="(m: string) => (row.error = m)"
        />
      </div>
    </div>
    <BaseButton
      v-if="canWrite"
      type="button"
      variant="ghost"
      size="sm"
      icon="lucide:plus"
      class="mt-4"
      @click="addRow"
    >
      Añadir archivo
    </BaseButton>
  </FormSectionCard>
</template>
