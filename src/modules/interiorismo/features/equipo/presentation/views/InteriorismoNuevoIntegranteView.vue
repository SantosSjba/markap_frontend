<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import { useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { useCreateInteriorTeamMember } from '../composables/useTeam'
import type { TeamMemberFormPayload } from '../../domain/team.types'
import InteriorEquipoForm from '../components/InteriorEquipoForm.vue'

const router = useRouter()
const createMutation = useCreateInteriorTeamMember()
const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/equipo`)

async function onSubmit(payload: TeamMemberFormPayload) {
  try {
    await createMutation.mutateAsync(payload)
    goBack()
  } catch {
    void 0
  }
}
</script>

<template>
  <div>
    <PageHeader title="Nuevo integrante" subtitle="Responsable que podrá asignarse en los proyectos" back class="mb-6" @back="goBack" />
    <InteriorEquipoForm
      submit-label="Registrar integrante"
      :submitting="createMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    />
  </div>
</template>
