<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('ventas')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { ventasPropertiesRepositoryKey } from '../../application/ports/ventas-properties.port'
import { useService } from '@shared/presentation/di/services'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVentasCreateProperty } from '../composables/useVentasProperties'
import { navigateAfterVentasSave } from '../../../../presentation/navigation/navigateAfterVentasSave'
import type { VentasCreatePropertyPayload } from '../../domain/property.types'
import VentasPropiedadForm from '../components/VentasPropiedadForm.vue'
import PropertyMediaQueueSection, {
  type QueuedMediaRow,
} from '@modules/alquileres/features/propiedades/presentation/components/PropertyMediaQueueSection.vue'
const ventasPropertiesApiRepository = useService(ventasPropertiesRepositoryKey)
const route = useRoute()
const router = useRouter()

const createMutation = useVentasCreateProperty()

/** Propietario recién creado en otra pantalla (`?selectedClientId=`) */
const preselectedOwnerId = computed(() =>
  typeof route.query.selectedClientId === 'string' ? route.query.selectedClientId : undefined,
)

/** Archivos en cola: se suben cuando la propiedad ya existe */
const mediaRows = ref<QueuedMediaRow[]>([{ file: null, kind: 'photo', error: '' }])

const goBack = () => router.push('/ventas/propiedades')

async function onSubmit(payload: Omit<VentasCreatePropertyPayload, 'mediaItems'>) {
  try {
    const created = await createMutation.mutateAsync({ ...payload, mediaItems: null })
    for (const row of mediaRows.value) {
      if (!row.file) continue
      await ventasPropertiesApiRepository.uploadMedia(created.id, row.file, row.kind)
    }
    await navigateAfterVentasSave(router, {
      listPath: '/ventas/propiedades',
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
      subtitle="Registrar un inmueble en venta"
      back
      @back="goBack"
      class="mb-6"
    />

    <VentasPropiedadForm
      :preselected-owner-id="preselectedOwnerId"
      submit-label="Guardar Propiedad"
      :submitting="createMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    >
      <template #media>
        <PropertyMediaQueueSection v-model="mediaRows" :can-write="canWrite" />
      </template>
    </VentasPropiedadForm>
  </div>
</template>
