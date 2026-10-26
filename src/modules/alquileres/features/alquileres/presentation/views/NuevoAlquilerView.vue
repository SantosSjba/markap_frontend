<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('alquileres')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCreateRental } from '../composables/useRentals'
import { navigateAfterAlquileresSave } from '../../../../presentation/navigation/navigateAfterAlquileresSave'
import type { RentalFormPayload } from '../../domain/rental.types'
import AlquilerForm from '../components/AlquilerForm.vue'
import RentalAttachmentsSection from '../components/RentalAttachmentsSection.vue'
const router = useRouter()

const contractFile = ref<File | null>(null)
const deliveryActFile = ref<File | null>(null)
const createRentalMutation = useCreateRental()

const goBack = () => router.push('/alquileres/contratos')

async function onSubmit(payload: RentalFormPayload) {
  try {
    await createRentalMutation.mutateAsync({
      data: { applicationSlug: 'alquileres', ...payload, propertyId: payload.propertyId! },
      files: {
        contractFile: contractFile.value ?? undefined,
        deliveryActFile: deliveryActFile.value ?? undefined,
      },
    })
    await navigateAfterAlquileresSave(router, {
      listPath: '/alquileres/contratos',
      invalidate: () => createRentalMutation.invalidateList(),
    })
  } catch {
    void 0
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Nuevo Alquiler"
      subtitle="Registrar un contrato de alquiler"
      back
      @back="goBack"
      class="mb-6"
    />

    <AlquilerForm
      submit-label="Guardar contrato"
      :submitting="createRentalMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    >
      <template #attachments>
        <RentalAttachmentsSection
          v-model:contract-file="contractFile"
          v-model:delivery-act-file="deliveryActFile"
        />
      </template>
    </AlquilerForm>
  </div>
</template>
