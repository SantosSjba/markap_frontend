<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import { useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { useCreateInteriorClient } from '../composables/useClients'
import type { InteriorClientFormPayload } from '../../domain/client.types'
import InteriorClienteForm from '../components/InteriorClienteForm.vue'

const router = useRouter()
const createMutation = useCreateInteriorClient()
const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/clientes`)

async function onSubmit(payload: InteriorClientFormPayload) {
  try {
    const created = await createMutation.mutateAsync(payload)
    router.push(`${INTERIORISMO_BASE_PATH}/clientes/${created.id}`)
  } catch {
    void 0
  }
}
</script>

<template>
  <div>
    <PageHeader title="Nuevo cliente" subtitle="Persona o empresa, contacto y dirección" back class="mb-6" @back="goBack" />
    <InteriorClienteForm
      submit-label="Registrar cliente"
      :submitting="createMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    />
  </div>
</template>
