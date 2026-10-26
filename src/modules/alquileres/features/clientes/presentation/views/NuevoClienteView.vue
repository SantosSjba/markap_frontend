<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('alquileres')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCreateClient } from '../composables/useClients'
import { navigateAfterAlquileresSave } from '../../../../presentation/navigation/navigateAfterAlquileresSave'
import type { ClientFormPayload } from '../../domain/client.types'
import ClienteForm from '../components/ClienteForm.vue'
const route = useRoute()
const router = useRouter()

/** returnTo: path para volver tras registrar (ej. /alquileres/propiedades/nueva) */
const returnTo = computed(() => {
  const t = route.query.returnTo
  return typeof t === 'string' ? t : ''
})

const defaultClientType = computed(() =>
  route.query.clientType === 'TENANT' ? 'TENANT' : 'OWNER',
)

const createMutation = useCreateClient()

const goBack = () => {
  if (returnTo.value) router.push(returnTo.value)
  else router.push('/alquileres/clientes')
}

async function onSubmit(payload: ClientFormPayload) {
  try {
    const data = await createMutation.mutateAsync({ applicationSlug: 'alquileres', ...payload })
    const tenantIndex = route.query.tenantIndex
    const returnQuery =
      returnTo.value && data?.id
        ? {
            selectedClientId: data.id,
            ...(typeof tenantIndex === 'string' && tenantIndex !== '' ? { tenantIndex } : {}),
          }
        : undefined

    await navigateAfterAlquileresSave(router, {
      listPath: '/alquileres/clientes',
      returnTo: returnTo.value && data?.id ? returnTo.value : undefined,
      returnQuery,
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
      title="Nuevo Cliente"
      subtitle="Registrar un nuevo propietario o inquilino"
      back
      @back="goBack"
      class="mb-6"
    />

    <ClienteForm
      :default-client-type="defaultClientType"
      submit-label="Guardar Cliente"
      :submitting="createMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    />
  </div>
</template>
