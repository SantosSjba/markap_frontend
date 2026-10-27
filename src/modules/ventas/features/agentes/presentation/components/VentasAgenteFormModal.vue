<script setup lang="ts">
import { useId } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
import type { AgentFormPayload } from '@modules/alquileres/features/agentes/domain/agent.types'
import AgenteForm from '@modules/alquileres/features/agentes/presentation/components/AgenteForm.vue'
import { useVentasCreateAgent } from '../composables/useAgents'
/**
 * VentasAgenteFormModal — alta rápida de un asesor de Ventas sin salir del formulario actual
 * (ej. comisiones de un proceso). Emite `created` cuando el listado de asesores ya lo incluye.
 */

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  created: [agent: { id: string; fullName: string }]
}>()

const { canWrite } = useApplicationAccess('ventas')
const createMutation = useVentasCreateAgent()
const formId = `ventas-agente-form-${useId()}`

async function onSubmit(payload: AgentFormPayload) {
  try {
    const data = await createMutation.mutateAsync(payload)
    await createMutation.invalidateList()
    emit('created', { id: data.id, fullName: payload.fullName })
    open.value = false
  } catch {
    void 0
  }
}
</script>

<template>
  <BaseModal v-model="open" title="Nuevo asesor" size="lg" persistent>
    <!-- v-if: el formulario se reinicia cada vez que se abre el modal -->
    <AgenteForm
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
