<script setup lang="ts">
import { ref } from 'vue'
import { BaseButton, FormTextarea } from '@shared/components'
import BaseModal from '@shared/components/ui/BaseModal.vue'

const props = defineProps<{
  modelValue: boolean
  processCode?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [reason: string]
}>()

const reason = ref('')
const error = ref('')

function close() {
  emit('update:modelValue', false)
  reason.value = ''
  error.value = ''
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
    title="Registrar venta caída"
    size="md"
    @update:model-value="(v: boolean) => (v ? emit('update:modelValue', true) : close())"
  >
    <div class="p-4 space-y-4">
      <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
        <template v-if="processCode">
          Proceso <strong>{{ processCode }}</strong> —
        </template>
        La oportunidad quedará como <strong>perdida</strong>. Las comisiones pendientes se anularán y no
        podrá retroceder etapas en el pipeline.
      </p>
      <FormTextarea
        v-model="reason"
        label="Motivo de la caída"
        placeholder="Ej. El comprador desistió por financiamiento; eligió otro inmueble…"
        :rows="4"
        :error="error"
        required
      />
      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="outline" icon="lucide:x" :disabled="loading" @click="close">Cancelar</BaseButton>
        <BaseButton variant="danger" icon="lucide:ban" :loading="loading" @click="submit">
          Confirmar venta caída
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
