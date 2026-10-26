<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('alquileres')
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClient, useUpdateClient } from '../composables/useClients'
import { navigateAfterAlquileresSave } from '../../../../presentation/navigation/navigateAfterAlquileresSave'
import type { ClientFormPayload } from '../../domain/client.types'
import ClienteForm from '../components/ClienteForm.vue'
const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const { data: client, isLoading: loadingClient, isError: clientError } = useClient(id)
const updateMutation = useUpdateClient()

// Los compradores (BUYER) pertenecen a Ventas y no se editan desde Alquileres.
watch(
  client,
  (c) => {
    if (c?.clientType === 'BUYER') void router.replace('/alquileres/clientes')
  },
  { immediate: true },
)

watch(
  () => clientError.value,
  (isErr) => {
    if (isErr) router.replace('/alquileres/clientes')
  },
)

const goBack = () => router.push('/alquileres/clientes')

async function onSubmit(payload: ClientFormPayload) {
  try {
    await updateMutation.mutateAsync({ id: id.value, data: payload })
    await navigateAfterAlquileresSave(router, {
      listPath: '/alquileres/clientes',
      invalidate: () => updateMutation.invalidateList(),
    })
  } catch {
    void 0
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Editar Cliente"
      subtitle="Modificar datos del cliente"
      back
      @back="goBack"
      class="mb-6"
    />

    <LoadingState v-if="loadingClient" class="py-12" />

    <ClienteForm
      v-else-if="client && client.clientType !== 'BUYER'"
      :initial="client"
      submit-label="Guardar Cambios"
      :submitting="updateMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    />
  </div>
</template>
