<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('ventas')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { useVentasCreateClient } from '../composables/useVentasClients'
import { ventasPropertyKeys } from '../../../propiedades/presentation/composables/useVentasProperties'
import { navigateAfterVentasSave } from '../../../../presentation/navigation/navigateAfterVentasSave'
import { invalidateQuerySubtree } from '@shared/utils/invalidateQuerySubtree'
import type { CreateVentasClientPayload } from '../../domain/client.types'
import VentasClienteForm from '../components/VentasClienteForm.vue'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()

/** returnTo: path para volver tras registrar (ej. alta de propiedad o proceso) */
const returnTo = computed(() => (typeof route.query.returnTo === 'string' ? route.query.returnTo : ''))
const defaultClientType = computed(() => (route.query.clientType === 'OWNER' ? 'OWNER' : 'BUYER'))

const createMutation = useVentasCreateClient()

const goBack = () => {
  if (returnTo.value) void router.push(returnTo.value)
  else void router.push('/ventas/clientes')
}

async function onSubmit(payload: CreateVentasClientPayload) {
  try {
    const data = await createMutation.mutateAsync(payload)
    await navigateAfterVentasSave(router, {
      listPath: '/ventas/clientes',
      returnTo: returnTo.value || undefined,
      returnQuery: returnTo.value && data?.id ? { selectedClientId: data.id } : undefined,
      invalidate:
        returnTo.value && data?.id
          ? () => invalidateQuerySubtree(queryClient, ventasPropertyKeys.root)
          : undefined,
    })
  } catch {
    void 0
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Nuevo Cliente"
      subtitle="Registrar un comprador / lead o un propietario"
      back
      @back="goBack"
      class="mb-6"
    />

    <VentasClienteForm
      :default-client-type="defaultClientType"
      submit-label="Guardar Cliente"
      :submitting="createMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    />
  </div>
</template>
