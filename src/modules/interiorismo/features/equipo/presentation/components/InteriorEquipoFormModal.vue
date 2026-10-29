<script setup lang="ts">
import { useId } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
import { useCreateInteriorTeamMember } from '../composables/useTeam'
import type { TeamMemberFormPayload, TeamRole } from '../../domain/team.types'
import InteriorEquipoForm from './InteriorEquipoForm.vue'
/**
 * InteriorEquipoFormModal — alta rápida de un integrante sin salir del formulario actual
 * (ej. desde Nuevo proyecto). Emite `created` con el integrante y sus funciones para asignarlo.
 */

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ created: [member: { id: string; fullName: string; roles: TeamRole[] }] }>()

const { canWrite } = useApplicationAccess('interiorismo')
const createMutation = useCreateInteriorTeamMember()
const formId = `interior-equipo-form-${useId()}`

async function onSubmit(payload: TeamMemberFormPayload) {
  try {
    const data = await createMutation.mutateAsync(payload)
    emit('created', { id: data.id, fullName: payload.fullName, roles: payload.roles })
    open.value = false
  } catch {
    void 0
  }
}
</script>

<template>
  <BaseModal v-model="open" title="Nuevo integrante del equipo" size="lg" persistent>
    <!-- v-if: el formulario se reinicia cada vez que se abre el modal -->
    <InteriorEquipoForm
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
