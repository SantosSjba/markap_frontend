<script setup lang="ts">
import { computed, useId } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
import { useCreateAgent } from '../composables/useAgents'
import type { AgentFormPayload, AgentType } from '../../domain/agent.types'
import AgenteForm from './AgenteForm.vue'
/**
 * AgenteFormModal — alta rápida de un agente sin salir del formulario actual
 * (ej. distribución financiera de un contrato). Emite `created` con el agente nuevo.
 */

const props = defineProps<{ agentType: AgentType }>()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  created: [agent: { id: string; fullName: string }]
}>()

const { canWrite } = useApplicationAccess('alquileres')
const createMutation = useCreateAgent()
const formId = `agente-form-${useId()}`

const title = computed(() =>
  props.agentType === 'INTERNAL' ? 'Nuevo agente interno' : 'Nuevo agente externo',
)

async function onSubmit(payload: AgentFormPayload) {
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
  <BaseModal v-model="open" :title="title" size="lg" persistent>
    <!-- v-if: el formulario se reinicia cada vez que se abre el modal -->
    <AgenteForm
      v-if="open"
      variant="modal"
      :form-id="formId"
      :preset-type="agentType"
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
