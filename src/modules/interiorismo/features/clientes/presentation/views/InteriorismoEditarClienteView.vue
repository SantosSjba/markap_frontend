<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { useInteriorClient, useUpdateInteriorClient } from '../composables/useClients'
import type { InteriorClientFormPayload } from '../../domain/client.types'
import InteriorClienteForm from '../components/InteriorClienteForm.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))
const { data: client, isLoading, isError, error, refetch } = useInteriorClient(id)
const updateMutation = useUpdateInteriorClient()
const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/clientes/${id.value}`)

async function onSubmit(payload: InteriorClientFormPayload) {
  try {
    await updateMutation.mutateAsync({ id: id.value, data: payload })
    goBack()
  } catch {
    void 0
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Editar cliente"
      :subtitle="client ? `${client.fullName} · ${client.documentNumber}` : 'Cargando…'"
      back
      class="mb-6"
      @back="goBack"
    />
    <LoadingState v-if="isLoading" text="Cargando cliente..." class="py-24" />
    <div v-else-if="isError || !client" class="flex flex-col items-center justify-center gap-3 py-16">
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="max-w-md text-center text-sm font-medium text-error-500 dark:text-error-400">
        {{ isError ? getApiErrorMessage(error) : 'No se encontró el cliente.' }}
      </p>
      <BaseButton v-if="isError" variant="outline" size="sm" @click="() => refetch()">Reintentar</BaseButton>
    </div>
    <InteriorClienteForm
      v-else
      :initial="client"
      submit-label="Guardar cambios"
      :submitting="updateMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    />
  </div>
</template>
