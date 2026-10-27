<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'

/** Motivo para regresar un proceso activo a una etapa anterior (queda en el seguimiento). */
const props = defineProps<{
  modelValue: boolean
  processCode?: string
  fromLabel: string
  toLabel: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [reason: string]
  cancel: []
}>()

const reason = ref('')
const error = ref('')
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    reason.value = ''
    error.value = ''
  },
)

function close() {
  emit('update:modelValue', false)
  emit('cancel')
}

function submit() {
  const text = reason.value.trim()
  if (text.length < 5) {
    error.value = 'Indique el motivo (mínimo 5 caracteres).'
    return
  }
  error.value = ''
  emit('confirm', text)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Regresar a una etapa anterior"
    size="md"
    @update:model-value="(v: boolean) => (v ? emit('update:modelValue', true) : close())"
  >
    <div class="space-y-4 p-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        <template v-if="processCode">Proceso <strong>{{ processCode }}</strong> — </template>
        pasará de <strong>{{ fromLabel }}</strong> a <strong>{{ toLabel }}</strong>. El motivo queda registrado en las
        actividades del proceso.
      </p>
      <FormTextarea
        v-model="reason"
        label="Motivo del retroceso"
        placeholder="Ej. La notaría observó la minuta y hay que corregirla"
        :rows="3"
        :error="error"
        required
      />
      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="outline" icon="lucide:x" :disabled="loading" @click="close">Cancelar</BaseButton>
        <BaseButton variant="primary" icon="lucide:undo-2" :loading="loading" @click="submit">Regresar de etapa</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
