<script setup lang="ts">
import { useId } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
import { useVentasCreateProperty } from '../composables/useVentasProperties'
import type { VentasCreatePropertyPayload } from '../../domain/property.types'
import VentasPropiedadForm from './VentasPropiedadForm.vue'
/**
 * VentasPropiedadFormModal — alta rápida de un inmueble sin salir del formulario actual
 * (ej. Nuevo proceso de venta). Emite `created` cuando los combos de inmuebles ya lo incluyen.
 * Las fotos y planos se agregan después, al editar la propiedad.
 */

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  created: [property: { id: string; code: string }]
}>()

const { canWrite } = useApplicationAccess('ventas')
const createMutation = useVentasCreateProperty()
const formId = `ventas-propiedad-form-${useId()}`

async function onSubmit(payload: Omit<VentasCreatePropertyPayload, 'mediaItems'>) {
  try {
    const created = await createMutation.mutateAsync({ ...payload, mediaItems: null })
    // Recarga los combos de inmuebles antes de seleccionarlo
    await createMutation.invalidateList()
    emit('created', { id: created.id, code: payload.code })
    open.value = false
  } catch {
    void 0
  }
}
</script>

<template>
  <BaseModal v-model="open" title="Nuevo inmueble" size="xl" persistent>
    <!-- v-if: el formulario se reinicia cada vez que se abre el modal -->
    <VentasPropiedadForm
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
