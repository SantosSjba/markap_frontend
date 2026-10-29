<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import { useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { useCreateInteriorProject } from '../composables/useInteriorProjects'
import type { InteriorProjectFormPayload } from '../../domain/project.types'
import InteriorProyectoForm from '../components/InteriorProyectoForm.vue'

const router = useRouter()
const createMut = useCreateInteriorProject()

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/proyectos`)

async function onSubmit(payload: InteriorProjectFormPayload) {
  try {
    const created = await createMut.mutateAsync(payload)
    router.push(`${INTERIORISMO_BASE_PATH}/proyectos/${created.id}`)
  } catch {
    void 0
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Nuevo proyecto"
      subtitle="Cliente, ubicación, alcance, equipo y condiciones económicas"
      back
      class="mb-6"
      @back="goBack"
    />
    <InteriorProyectoForm
      submit-label="Crear proyecto"
      :submitting="createMut.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    />
  </div>
</template>
