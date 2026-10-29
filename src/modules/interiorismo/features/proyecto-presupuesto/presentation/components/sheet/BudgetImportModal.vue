<script setup lang="ts">
import { ref, toRef, watch } from 'vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseAlert from '@shared/presentation/components/ui/BaseAlert.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import { useImportBudgetExcel } from '../../composables/useProjectBudget'
/**
 * Importa un Excel de presupuesto. Reconoce los dos formatos de la clienta: Markap Spaces
 * (costo + utilidad por partida) y PRIZE (metrado × P.U. con GG + utilidad al final).
 */

const props = defineProps<{ projectId: string; hasRows: boolean }>()
const open = defineModel<boolean>('open', { required: true })

const file = ref<File | null>(null)
const replace = ref(false)
const warnings = ref<string[]>([])
const importExcel = useImportBudgetExcel(toRef(props, 'projectId'))

watch(open, (o) => {
  if (o) {
    file.value = null
    replace.value = false
    warnings.value = []
  }
})

async function submit() {
  if (!file.value) return
  try {
    const result = await importExcel.mutateAsync({ file: file.value, replace: replace.value })
    warnings.value = result.import.warnings
    if (!warnings.value.length) open.value = false
  } catch {
    void 0
  }
}
</script>

<template>
  <BaseModal v-model="open" title="Importar presupuesto desde Excel" size="md">
    <div class="space-y-4 p-1">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Se lee la hoja con más partidas. Formatos reconocidos: <strong>Markap Spaces</strong> (Nivel → Ambiente →
        Categoría, con Costo, Costo real e IGV) y <strong>PRIZE</strong> (Ítem, Unidad, Metrado, P.U., Parcial y
        «Gastos generales y utilidad» al pie).
      </p>
      <FileDropzone v-model="file" accept=".xlsx,.xls" />
      <FormCheckbox
        v-if="hasRows"
        v-model="replace"
        label="Reemplazar el contenido actual (si no, se agrega al final)"
      />
      <BaseAlert v-if="warnings.length" type="warning" title="Importado con observaciones">
        <ul class="list-disc space-y-1 ps-4 text-sm">
          <li v-for="w in warnings" :key="w">{{ w }}</li>
        </ul>
      </BaseAlert>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton variant="outline" type="button" @click="open = false">{{ warnings.length ? 'Cerrar' : 'Cancelar' }}</BaseButton>
        <BaseButton
          v-if="!warnings.length"
          variant="primary"
          icon="lucide:upload"
          :disabled="!file"
          :loading="importExcel.isPending.value"
          @click="submit"
        >
          Importar
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
