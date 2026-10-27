<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin } = useApplicationAccess('ventas')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseAlert from '@shared/presentation/components/ui/BaseAlert.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import { useVentasAgent, useVentasUpdateAgent, useVentasDeleteAgent } from '../composables/useAgents'
import { navigateAfterVentasSave } from '../../../../presentation/navigation/navigateAfterVentasSave'
import type { AgentFormPayload } from '@modules/alquileres/features/agentes/domain/agent.types'
import AgenteForm from '@modules/alquileres/features/agentes/presentation/components/AgenteForm.vue'
const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const showDeleteConfirm = ref(false)
const showStatusConfirm = ref(false)

const { data: agent, isLoading: loadingAgent, isError: agentError } = useVentasAgent(id)
const updateMutation = useVentasUpdateAgent()
const deleteMutation = useVentasDeleteAgent()

const goBack = () => router.push('/ventas/agentes')

async function onSubmit(payload: AgentFormPayload) {
  try {
    await updateMutation.mutateAsync({ id: id.value, data: payload })
    await navigateAfterVentasSave(router, { listPath: '/ventas/agentes' })
  } catch {
    void 0
  }
}

async function toggleActive() {
  showStatusConfirm.value = false
  try {
    await updateMutation.mutateAsync({ id: id.value, data: { isActive: !agent.value?.isActive } })
    await navigateAfterVentasSave(router, { listPath: '/ventas/agentes' })
  } catch {
    void 0
  }
}

async function handleDelete() {
  showDeleteConfirm.value = false
  try {
    await deleteMutation.mutateAsync(id.value)
    await navigateAfterVentasSave(router, { listPath: '/ventas/agentes' })
  } catch {
    void 0
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Editar Agente"
      :subtitle="agent?.fullName ?? 'Cargando...'"
      back
      @back="goBack"
      class="mb-6"
    />

    <LoadingState v-if="loadingAgent" />

    <BaseAlert v-else-if="agentError || !agent" type="error">
      <span class="text-sm font-medium">No se encontró el agente o ocurrió un error.</span>
    </BaseAlert>

    <AgenteForm
      v-else
      :initial="agent"
      submit-label="Guardar cambios"
      :submitting="updateMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    >
      <template v-if="canWrite" #extra>
        <FormSectionCard title="Estado" subtitle="Disponibilidad del agente en listados y procesos de venta">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <!-- Activar / desactivar -->
            <div
              class="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800"
            >
              <AppIcon
                :icon="agent.isActive ? 'lucide:user-x' : 'lucide:user-check'"
                :size="20"
                :color="agent.isActive ? 'var(--color-warning, #f59e0b)' : 'var(--color-success)'"
                class="mt-0.5 shrink-0"
              />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {{ agent.isActive ? 'Desactivar agente' : 'Reactivar agente' }}
                </p>
                <p class="mt-0.5 mb-3 text-xs text-gray-400 dark:text-gray-500">
                  {{
                    agent.isActive
                      ? 'Deja de aparecer en listados activos y conserva su historial.'
                      : 'Vuelve a mostrarse como activo en listados y búsquedas.'
                  }}
                </p>
                <BaseButton
                  v-if="!showStatusConfirm"
                  type="button"
                  variant="secondary"
                  size="sm"
                  @click="showStatusConfirm = true"
                >
                  {{ agent.isActive ? 'Desactivar' : 'Reactivar' }}
                </BaseButton>
                <div v-else class="flex gap-2">
                  <BaseButton
                    type="button"
                    :variant="agent.isActive ? 'danger' : 'primary'"
                    size="sm"
                    :disabled="updateMutation.isPending.value"
                    @click="toggleActive"
                  >
                    Confirmar
                  </BaseButton>
                  <BaseButton type="button" variant="secondary" size="sm" @click="showStatusConfirm = false">
                    Cancelar
                  </BaseButton>
                </div>
              </div>
            </div>

            <!-- Eliminar (soft delete): solo administradores -->
            <div
              v-if="canAdmin"
              class="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800"
            >
              <AppIcon icon="lucide:trash-2" :size="20" color="var(--color-error)" class="mt-0.5 shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Eliminar agente</p>
                <p class="mt-0.5 mb-3 text-xs text-gray-400 dark:text-gray-500">
                  Se oculta de todos los listados; el historial se conserva.
                </p>
                <BaseButton
                  v-if="!showDeleteConfirm"
                  type="button"
                  variant="danger"
                  size="sm"
                  @click="showDeleteConfirm = true"
                >
                  Eliminar agente
                </BaseButton>
                <div v-else class="flex gap-2">
                  <BaseButton
                    type="button"
                    variant="danger"
                    size="sm"
                    :disabled="deleteMutation.isPending.value"
                    @click="handleDelete"
                  >
                    Confirmar
                  </BaseButton>
                  <BaseButton type="button" variant="secondary" size="sm" @click="showDeleteConfirm = false">
                    Cancelar
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>
        </FormSectionCard>
      </template>
    </AgenteForm>
  </div>
</template>
