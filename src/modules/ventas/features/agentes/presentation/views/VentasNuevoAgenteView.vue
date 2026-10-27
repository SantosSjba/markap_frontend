<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('ventas')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVentasCreateAgent } from '../composables/useAgents'
import { navigateAfterVentasSave } from '../../../../presentation/navigation/navigateAfterVentasSave'
import type { AgentFormPayload, AgentType } from '@modules/alquileres/features/agentes/domain/agent.types'
import AgenteForm from '@modules/alquileres/features/agentes/presentation/components/AgenteForm.vue'
const route = useRoute()
const router = useRouter()

/** Path para volver tras registrar (ej. comisiones de un proceso de venta). */
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

const createMutation = useVentasCreateAgent()

const goBack = () => {
  if (returnTo.value) router.push(returnTo.value)
  else router.push('/ventas/agentes')
}

async function onSubmit(payload: AgentFormPayload) {
  try {
    const data = await createMutation.mutateAsync(payload)
    await navigateAfterVentasSave(router, {
      listPath: '/ventas/agentes',
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
