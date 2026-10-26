<script setup lang="ts">
import { computed, useId } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
import { useCreateClient } from '../composables/useClients'
import type { ClientFormPayload } from '../../domain/client.types'
import ClienteForm from './ClienteForm.vue'
/**
 * ClienteFormModal — alta rápida de un cliente sin salir del formulario actual
 * (ej. propietario desde Nueva propiedad). Emite `created` con el id del cliente nuevo;
 * la creación ya invalida los combos de propietarios / inquilinos.
 */

type ClientType = 'OWNER' | 'TENANT'

const props = withDefaults(
  defineProps<{
    clientType: ClientType
    /** Permite cambiar el tipo dentro del modal */
    allowTypeChange?: boolean
  }>(),
  { allowTypeChange: false },
)

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  created: [client: { id: string; fullName: string }]
}>()

const { canWrite } = useApplicationAccess('alquileres')
const createMutation = useCreateClient()
const formId = `cliente-form-${useId()}`

const title = computed(() => {
  if (props.allowTypeChange) return 'Nuevo cliente'
  return props.clientType === 'OWNER' ? 'Nuevo propietario' : 'Nuevo inquilino'
})

async function onSubmit(payload: ClientFormPayload) {
  try {
    const data = await createMutation.mutateAsync({ applicationSlug: 'alquileres', ...payload })
    emit('created', { id: data.id, fullName: payload.fullName })
    open.value = false
  } catch {
    void 0
  }
}
</script>

<template>
  <BaseModal v-model="open" :title="title" size="xl" persistent>
    <!-- v-if: el formulario se reinicia cada vez que se abre el modal -->
    <ClienteForm
      v-if="open"
      variant="modal"
      :form-id="formId"
      :default-client-type="clientType"
      :lock-client-type="!allowTypeChange"
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
