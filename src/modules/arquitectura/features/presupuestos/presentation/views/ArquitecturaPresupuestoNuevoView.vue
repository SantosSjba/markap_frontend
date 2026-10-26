<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('arquitectura')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { useArquitecturaProjectsList } from '../../../proyectos/presentation/composables/useArquitecturaProjects'
import { ARQUITECTURA_BASE_PATH } from '../../../../config/routes.constants'
const router = useRouter()
const selectedProjectId = ref('')

const listParams = ref({ page: 1, limit: 200 })
const { data: projectsData, isLoading } = useArquitecturaProjectsList(listParams)

const projectOptions = computed(() => [
  { value: '', label: 'Seleccione un proyecto…' },
  ...(projectsData.value?.data ?? []).map((p) => ({
    value: p.id,
    label: `${p.code} — ${p.name}`,
  })),
])

const goBack = () => router.push(`${ARQUITECTURA_BASE_PATH}/presupuestos`)

const openExisting = () => {
  if (!selectedProjectId.value) return
  router.push({
    path: `${ARQUITECTURA_BASE_PATH}/proyectos/${selectedProjectId.value}`,
    query: { tab: 'presupuesto' },
  })
}

const createProject = () => {
  router.push({
    path: `${ARQUITECTURA_BASE_PATH}/proyectos/nuevo`,
    query: { from: 'presupuestos', openTab: 'presupuesto' },
  })
}
</script>

<template>
  <div class="max-w-[720px] mx-auto space-y-6">
    <PageHeader
      title="Nuevo presupuesto"
      subtitle="El presupuesto vive dentro de un proyecto. Elija uno existente o cree un proyecto nuevo."
      back
      @back="goBack"
    />

    <FormSectionCard
      title="Proyecto existente"
      subtitle="Abrir la pestaña Presupuesto del proyecto seleccionado"
      icon="lucide:folder-search"
    >
      <div class="space-y-4 max-w-md">
        <FormSelect
          v-model="selectedProjectId"
          label="Proyecto"
          :options="projectOptions"
          :disabled="isLoading"
        />
        <BaseButton
          variant="primary"
          type="button"
          :disabled="!selectedProjectId"
          @click="openExisting"
        >
          Continuar al presupuesto
        </BaseButton>
      </div>
    </FormSectionCard>

    <FormSectionCard
      title="Proyecto nuevo"
      subtitle="Registrar el proyecto y pasar directo al armado del presupuesto"
      icon="lucide:folder-plus"
    >
      <BaseButton v-if="canWrite" variant="outline" type="button" @click="createProject">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Crear proyecto y presupuesto
      </BaseButton>
    </FormSectionCard>
  </div>
</template>
