<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('alquileres')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { propertiesRepositoryKey } from '../../application/ports/properties.port'
import { useService } from '@shared/presentation/di/services'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCreateProperty } from '../composables/useProperties'
import { navigateAfterAlquileresSave } from '../../../../presentation/navigation/navigateAfterAlquileresSave'
import type { PropertyFormPayload } from '../../domain/property.types'
import PropiedadForm from '../components/PropiedadForm.vue'
import PropertyMediaQueueSection, { type QueuedMediaRow } from '../components/PropertyMediaQueueSection.vue'
const propertiesApiRepository = useService(propertiesRepositoryKey)
const router = useRouter()

const createMutation = useCreateProperty()

/** Archivos en cola: se suben cuando la propiedad ya existe */
const mediaRows = ref<QueuedMediaRow[]>([{ file: null, kind: 'photo', error: '' }])

const goBack = () => router.push('/alquileres/propiedades')

async function onSubmit(payload: PropertyFormPayload) {
  try {
    const created = await createMutation.mutateAsync({
      applicationSlug: 'alquileres',
      ...payload,
      mediaItems: null,
    })
    for (const row of mediaRows.value) {
      if (!row.file) continue
      await propertiesApiRepository.uploadMedia(created.id, row.file, row.kind)
    }
    await navigateAfterAlquileresSave(router, {
      listPath: '/alquileres/propiedades',
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
      title="Nueva Propiedad"
      subtitle="Registrar un nuevo inmueble en alquiler"
      back
      @back="goBack"
      class="mb-6"
    />

    <PropiedadForm
      submit-label="Guardar Propiedad"
      :submitting="createMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    >
      <template #media>
        <PropertyMediaQueueSection v-model="mediaRows" :can-write="canWrite" />
      </template>
    </PropiedadForm>
  </div>
</template>
