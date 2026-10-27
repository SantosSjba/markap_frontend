<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('ventas')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVentasClient, useVentasUpdateClient } from '../composables/useVentasClients'
import { navigateAfterVentasSave } from '../../../../presentation/navigation/navigateAfterVentasSave'
import type { CreateVentasClientPayload } from '../../domain/client.types'
import VentasClienteForm from '../components/VentasClienteForm.vue'

const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const { data: client, isLoading: loadingClient, isError: clientError } = useVentasClient(id)
const updateMutation = useVentasUpdateClient()

/** Solo compradores y propietarios de Ventas se editan aquí */
const isEditable = computed(
  () =>
    client.value?.applicationSlug === 'ventas' &&
    (client.value.clientType === 'BUYER' || client.value.clientType === 'OWNER'),
)

watch(
  client,
  (c) => {
    if (c && !isEditable.value) void router.replace('/ventas/clientes')
  },
  { immediate: true },
)

watch(
  () => clientError.value,
  (isErr) => {
    if (isErr) void router.replace('/ventas/clientes')
  },
)

const goBack = () => router.push('/ventas/clientes')

async function onSubmit(payload: CreateVentasClientPayload) {
  try {
    await updateMutation.mutateAsync({ id: id.value, data: payload })
    await navigateAfterVentasSave(router, { listPath: '/ventas/clientes' })
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

    <VentasClienteForm
      v-else-if="client && isEditable"
      :initial="client"
      submit-label="Guardar Cambios"
      :submitting="updateMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    />
  </div>
</template>
