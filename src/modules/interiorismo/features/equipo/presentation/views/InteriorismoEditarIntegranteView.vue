<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin } = useApplicationAccess('interiorismo')

import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseAlert from '@shared/presentation/components/ui/BaseAlert.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import {
  useDeleteInteriorTeamMember,
  useInteriorTeamMember,
  useUpdateInteriorTeamMember,
} from '../composables/useTeam'
import type { TeamMemberFormPayload } from '../../domain/team.types'
import InteriorEquipoForm from '../components/InteriorEquipoForm.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { data: member, isLoading, isError } = useInteriorTeamMember(id)
const updateMutation = useUpdateInteriorTeamMember()
const deleteMutation = useDeleteInteriorTeamMember()

const showStatusConfirm = ref(false)
const showDeleteConfirm = ref(false)

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/equipo`)

async function onSubmit(payload: TeamMemberFormPayload) {
  try {
    await updateMutation.mutateAsync({ id: id.value, data: payload })
    goBack()
  } catch {
    void 0
  }
}

async function toggleActive() {
  showStatusConfirm.value = false
  try {
    await updateMutation.mutateAsync({ id: id.value, data: { isActive: !member.value?.isActive } })
  } catch {
    void 0
  }
}

async function handleDelete() {
  showDeleteConfirm.value = false
  try {
    await deleteMutation.mutateAsync(id.value)
    goBack()
  } catch {
    void 0
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Editar integrante"
      :subtitle="member?.fullName ?? 'Cargando...'"
      back
      class="mb-6"
      @back="goBack"
    />

    <LoadingState v-if="isLoading" />

    <BaseAlert v-else-if="isError || !member" type="error">
      <span class="text-sm font-medium">No se encontró el integrante o ocurrió un error.</span>
    </BaseAlert>

    <InteriorEquipoForm
      v-else
      :initial="member"
      submit-label="Guardar cambios"
      :submitting="updateMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    >
      <template v-if="canWrite" #extra>
        <FormSectionCard title="Estado" subtitle="Disponibilidad al asignar responsables de proyecto">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800">
              <AppIcon
                :icon="member.isActive ? 'lucide:user-x' : 'lucide:user-check'"
                :size="20"
                :color="member.isActive ? 'var(--color-warning, #f59e0b)' : 'var(--color-success)'"
                class="mt-0.5 shrink-0"
              />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {{ member.isActive ? 'Desactivar integrante' : 'Reactivar integrante' }}
                </p>
                <p class="mt-0.5 mb-3 text-xs text-gray-400 dark:text-gray-500">
                  {{
                    member.isActive
                      ? 'Deja de ofrecerse en proyectos nuevos; los actuales lo conservan.'
                      : 'Vuelve a estar disponible para asignarse en proyectos.'
                  }}
                </p>
                <BaseButton v-if="!showStatusConfirm" type="button" variant="secondary" size="sm" @click="showStatusConfirm = true">
                  {{ member.isActive ? 'Desactivar' : 'Reactivar' }}
                </BaseButton>
                <div v-else class="flex gap-2">
                  <BaseButton
                    type="button"
                    :variant="member.isActive ? 'danger' : 'primary'"
                    size="sm"
                    :disabled="updateMutation.isPending.value"
                    @click="toggleActive"
                  >
                    Confirmar
                  </BaseButton>
                  <BaseButton type="button" variant="secondary" size="sm" @click="showStatusConfirm = false">Cancelar</BaseButton>
                </div>
              </div>
            </div>

            <div
              v-if="canAdmin"
              class="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800"
            >
              <AppIcon icon="lucide:trash-2" :size="20" color="var(--color-error)" class="mt-0.5 shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Eliminar integrante</p>
                <p class="mt-0.5 mb-3 text-xs text-gray-400 dark:text-gray-500">
                  Se oculta del equipo; los proyectos donde figura lo conservan.
                </p>
                <BaseButton v-if="!showDeleteConfirm" type="button" variant="danger" size="sm" @click="showDeleteConfirm = true">
                  Eliminar integrante
                </BaseButton>
                <div v-else class="flex gap-2">
                  <BaseButton type="button" variant="danger" size="sm" :disabled="deleteMutation.isPending.value" @click="handleDelete">
                    Confirmar
                  </BaseButton>
                  <BaseButton type="button" variant="secondary" size="sm" @click="showDeleteConfirm = false">Cancelar</BaseButton>
                </div>
              </div>
            </div>
          </div>
        </FormSectionCard>
      </template>
    </InteriorEquipoForm>
  </div>
</template>
