<script setup lang="ts">
import { useId } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
import { useCreateProperty } from '../composables/useProperties'
import type { PropertyFormPayload } from '../../domain/property.types'
import PropiedadForm from './PropiedadForm.vue'
/**
 * PropiedadFormModal — alta rápida de una propiedad sin salir del formulario actual
 * (ej. Nuevo alquiler). Emite `created` con el id de la propiedad nueva una vez que el
 * combo de propiedades ya la incluye. La multimedia se agrega luego desde Editar propiedad.
 */

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  created: [property: { id: string; code: string }]
}>()

const { canWrite } = useApplicationAccess('alquileres')
const createMutation = useCreateProperty()
const formId = `propiedad-form-${useId()}`

async function onSubmit(payload: PropertyFormPayload) {
  try {
    const created = await createMutation.mutateAsync({
      applicationSlug: 'alquileres',
      ...payload,
      mediaItems: null,
    })
    // Esperar el combo actualizado: así quien la seleccione hereda su monto y moneda
    await createMutation.invalidateList()
    emit('created', { id: created.id, code: created.code })
    open.value = false
  } catch {
    void 0
  }
}
</script>

<template>
  <BaseModal v-model="open" title="Nueva propiedad" size="xl" persistent>
    <!-- v-if: el formulario se reinicia cada vez que se abre el modal -->
    <PropiedadForm
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
