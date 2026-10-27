<script setup lang="ts">
import { useId } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
import { useQueryClient } from '@tanstack/vue-query'
import { useVentasCreateClient } from '../composables/useVentasClients'
import { ventasPropertyKeys } from '../../../propiedades/presentation/composables/useVentasProperties'
import type { CreateVentasClientPayload, VentasClientType } from '../../domain/client.types'
import VentasClienteForm from './VentasClienteForm.vue'
/**
 * VentasClienteFormModal — alta rápida de un cliente de Ventas sin salir del formulario actual
 * (ej. propietario desde Nueva propiedad). Emite `created` con el id del cliente nuevo;
 * la creación ya invalida los combos de propietarios.
 */

const props = defineProps<{ clientType: VentasClientType }>()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  created: [client: { id: string; fullName: string }]
}>()

const { canWrite } = useApplicationAccess('ventas')
const createMutation = useVentasCreateClient()
const formId = `ventas-cliente-form-${useId()}`

const queryClient = useQueryClient()

async function onSubmit(payload: CreateVentasClientPayload) {
  try {
    const data = await createMutation.mutateAsync(payload)
    // El combo de propietarios de propiedades vive en otra caché: recargarlo antes de seleccionar
    await queryClient.invalidateQueries({ queryKey: [...ventasPropertyKeys.root, 'owners'] })
    emit('created', { id: data.id, fullName: payload.fullName })
    open.value = false
  } catch {
    void 0
  }
}
</script>

<template>
  <BaseModal
    v-model="open"
    :title="props.clientType === 'OWNER' ? 'Nuevo propietario' : 'Nuevo comprador'"
    size="xl"
    persistent
  >
    <!-- v-if: el formulario se reinicia cada vez que se abre el modal -->
    <VentasClienteForm
      v-if="open"
      variant="modal"
      :form-id="formId"
      :default-client-type="clientType"
      lock-client-type
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
