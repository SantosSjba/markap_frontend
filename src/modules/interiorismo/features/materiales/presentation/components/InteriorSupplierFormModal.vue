<script setup lang="ts">
import { useId } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
import { useCreateInteriorMaterialSupplier } from '../composables/useInteriorMaterialSuppliers'
import InteriorSupplierForm from './InteriorSupplierForm.vue'
/** Alta rápida sin salir de la pantalla actual; emite `created` con el registro nuevo. */

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ created: [item: { id: string; name: string }] }>()

const { canWrite } = useApplicationAccess('interiorismo')
const createMutation = useCreateInteriorMaterialSupplier()
const formId = `interior-supplier-form-${useId()}`

async function onSubmit(payload: Parameters<typeof createMutation.mutateAsync>[0]) {
  try {
    const created = await createMutation.mutateAsync(payload)
    emit('created', { id: created.id, name: created.companyName })
    open.value = false
  } catch {
    void 0
  }
}
</script>

<template>
  <BaseModal v-model="open" title="Nuevo proveedor" size="lg" persistent>
    <InteriorSupplierForm v-if="open" variant="modal" :form-id="formId" submit-label="Registrar" :submitting="createMutation.isPending.value" :can-write="canWrite" @submit="onSubmit" @cancel="open = false" />
    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" type="button" @click="open = false">Cancelar</BaseButton>
        <BaseButton v-if="canWrite" type="submit" :form="formId" variant="primary" icon="lucide:save" :loading="createMutation.isPending.value" loading-text="Guardando...">Registrar</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
