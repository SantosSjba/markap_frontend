<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, FormSelect, FormSectionCard, AppIcon } from '@shared/components'
import { useArquitecturaProjectsList } from '@modules/arquitectura/features/proyectos/application/useArquitecturaProjects'
import { ARQUITECTURA_BASE_PATH } from '@modules/arquitectura/config/routes.constants'

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
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[720px] mx-auto space-y-6">
    <div class="flex items-start gap-3">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)] shrink-0"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="goBack"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Nuevo presupuesto
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          El presupuesto vive dentro de un proyecto. Elija uno existente o cree un proyecto nuevo.
        </p>
      </div>
    </div>

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
      <BaseButton variant="outline" type="button" @click="createProject">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Crear proyecto y presupuesto
      </BaseButton>
    </FormSectionCard>
  </div>
</template>
