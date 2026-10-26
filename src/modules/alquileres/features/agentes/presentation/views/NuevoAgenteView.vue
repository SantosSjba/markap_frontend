<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('alquileres')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCreateAgent } from '../composables/useAgents'
import { navigateAfterAlquileresSave } from '../../../../presentation/navigation/navigateAfterAlquileresSave'
import type { AgentFormPayload, AgentType } from '../../domain/agent.types'
import AgenteForm from '../components/AgenteForm.vue'
const route = useRoute()
const router = useRouter()

/** Path para volver tras registrar (ej. distribución financiera de un contrato). */
const returnTo = computed(() => {
  const t = route.query.returnTo
  return typeof t === 'string' ? t : ''
})

/** Campo a autoseleccionar al volver: external | internal */
const agentField = computed(() => {
  const f = route.query.agentField
  return f === 'external' || f === 'internal' ? f : ''
})

const presetAgentType = computed((): AgentType | null => {
  const t = route.query.agentType
  return t === 'INTERNAL' || t === 'EXTERNAL' ? t : null
})

const createMutation = useCreateAgent()

const goBack = () => {
  if (returnTo.value) router.push(returnTo.value)
  else router.push('/alquileres/agentes')
}

async function onSubmit(payload: AgentFormPayload) {
  try {
    const data = await createMutation.mutateAsync({ applicationSlug: 'alquileres', ...payload })
    await navigateAfterAlquileresSave(router, {
      listPath: '/alquileres/agentes',
      returnTo: returnTo.value && data?.id ? returnTo.value : undefined,
      returnQuery:
        returnTo.value && data?.id
          ? {
              selectedAgentId: data.id,
              ...(agentField.value ? { agentField: agentField.value } : {}),
            }
          : undefined,
      invalidate: () => createMutation.invalidateList(),
    })
  } catch {
    void 0
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Nuevo Agente"
      subtitle="Registrar agente interno o externo"
      back
      @back="goBack"
      class="mb-6"
    />

    <AgenteForm
      :preset-type="presetAgentType"
      submit-label="Crear agente"
      :submitting="createMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    />
  </div>
</template>
