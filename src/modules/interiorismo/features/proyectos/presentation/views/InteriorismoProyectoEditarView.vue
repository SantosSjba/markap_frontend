<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { useInteriorProjectDetail, useUpdateInteriorProject } from '../composables/useInteriorProjects'
import type { InteriorProjectFormPayload } from '../../domain/project.types'
import InteriorProyectoForm from '../components/InteriorProyectoForm.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { data: project, isLoading, isError, error, refetch } = useInteriorProjectDetail(id)
const updateMut = useUpdateInteriorProject()

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/proyectos/${id.value}`)

async function onSubmit(payload: InteriorProjectFormPayload) {
  const { code, ...rest } = payload
  try {
    await updateMut.mutateAsync({
      id: id.value,
      // El código solo viaja si se regeneró
      payload: code !== project.value?.code ? { ...rest, code } : rest,
    })
    goBack()
  } catch {
    void 0
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Editar proyecto"
      :subtitle="project ? `${project.code} · ${project.client.fullName}` : 'Cargando…'"
      back
      class="mb-6"
      @back="goBack"
    />

    <LoadingState v-if="isLoading" text="Cargando proyecto..." class="py-24" />
    <div v-else-if="isError || !project" class="flex flex-col items-center justify-center gap-3 py-16">
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="max-w-md text-center text-sm font-medium text-error-500 dark:text-error-400">
        {{ isError ? getApiErrorMessage(error) : 'No se encontró el proyecto.' }}
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <BaseButton v-if="isError" variant="outline" size="sm" @click="() => refetch()">Reintentar</BaseButton>
        <BaseButton variant="outline" size="sm" @click="router.push(`${INTERIORISMO_BASE_PATH}/proyectos`)">
          Volver al listado
        </BaseButton>
      </div>
    </div>
    <InteriorProyectoForm
      v-else
      :initial="project"
      submit-label="Guardar cambios"
      :submitting="updateMut.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    />
  </div>
</template>
