<script setup lang="ts">
import { useId } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
import { useCreateInteriorClient } from '../composables/useClients'
import type { InteriorClientFormPayload } from '../../domain/client.types'
import InteriorClienteForm from './InteriorClienteForm.vue'
/**
 * InteriorClienteFormModal — alta rápida de un cliente sin salir del formulario actual
 * (ej. desde Nuevo proyecto). Emite `created` con el cliente nuevo para seleccionarlo.
 */

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ created: [client: { id: string; fullName: string }] }>()

const { canWrite } = useApplicationAccess('interiorismo')
const createMutation = useCreateInteriorClient()
const formId = `interior-cliente-form-${useId()}`

async function onSubmit(payload: InteriorClientFormPayload) {
  try {
    const data = await createMutation.mutateAsync(payload)
    emit('created', { id: data.id, fullName: payload.fullName })
    open.value = false
  } catch {
    void 0
  }
}
</script>

<template>
  <BaseModal v-model="open" title="Nuevo cliente" size="xl" persistent>
    <!-- v-if: el formulario se reinicia cada vez que se abre el modal -->
    <InteriorClienteForm
      v-if="open"
      variant="modal"
      :form-id="formId"
      submit-label="Registrar"
      :submitting="createMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="open = false"
    />
    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" type="button" @click="open = false">Cancelar</BaseButton>
        <BaseButton
          v-if="canWrite"
          type="submit"
          :form="formId"
          variant="primary"
          icon="lucide:save"
          :loading="createMutation.isPending.value"
          loading-text="Guardando..."
        >
          Registrar
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
