<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('alquileres')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { useRental, useUpdateRental } from '../composables/useRentals'
import { navigateAfterAlquileresSave } from '../../../../presentation/navigation/navigateAfterAlquileresSave'
import type { RentalFormPayload } from '../../domain/rental.types'
import AlquilerForm from '../components/AlquilerForm.vue'
import RentalAttachmentsSection from '../components/RentalAttachmentsSection.vue'
const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const contractFile = ref<File | null>(null)
const deliveryActFile = ref<File | null>(null)

const {
  data: rental,
  isLoading: loadingRental,
  isError: rentalError,
  error: rentalFetchError,
  refetch: refetchRental,
} = useRental(id)
const updateMutation = useUpdateRental()

const goBack = () => router.push(`/alquileres/contratos/${id.value}`)

async function onSubmit(payload: RentalFormPayload) {
  try {
    await updateMutation.mutateAsync({
      id: id.value,
      data: payload,
      files: {
        contractFile: contractFile.value ?? undefined,
        deliveryActFile: deliveryActFile.value ?? undefined,
      },
    })
    contractFile.value = null
    deliveryActFile.value = null
    await navigateAfterAlquileresSave(router, {
      listPath: '/alquileres/contratos',
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
      :title="`Editar alquiler ${rental?.code ?? ''}`"
      subtitle="Fechas, montos, inquilinos, adjuntos y estado del contrato"
      back
      @back="goBack"
      class="mb-6"
    />

    <LoadingState v-if="loadingRental" text="Cargando contrato..." class="py-24" />

    <div v-else-if="rentalError || !rental" class="flex flex-col items-center justify-center gap-3 py-16">
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="max-w-md text-center text-sm font-medium text-error-500 dark:text-error-400">
        {{ rentalError ? getApiErrorMessage(rentalFetchError) : 'No se encontró el alquiler.' }}
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <BaseButton v-if="rentalError" variant="outline" size="sm" @click="() => refetchRental()">Reintentar</BaseButton>
        <BaseButton variant="outline" size="sm" @click="goBack">Volver</BaseButton>
      </div>
    </div>

    <AlquilerForm
      v-else
      :initial="rental"
      submit-label="Guardar cambios"
      :submitting="updateMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    >
      <template #attachments>
        <RentalAttachmentsSection
          v-model:contract-file="contractFile"
          v-model:delivery-act-file="deliveryActFile"
          :attachments="rental.attachments"
        />
      </template>
    </AlquilerForm>
  </div>
</template>
