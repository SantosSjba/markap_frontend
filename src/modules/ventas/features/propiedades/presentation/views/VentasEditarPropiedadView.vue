<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('ventas')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useVentasPropertyById,
  useVentasUpdateProperty,
  useVentasUploadPropertyMedia,
} from '../composables/useVentasProperties'
import { navigateAfterVentasSave } from '../../../../presentation/navigation/navigateAfterVentasSave'
import type { VentasCreatePropertyPayload, VentasPropertyMediaItem } from '../../domain/property.types'
import VentasPropiedadForm from '../components/VentasPropiedadForm.vue'
import PropertyMediaManagerSection from '@modules/alquileres/features/propiedades/presentation/components/PropertyMediaManagerSection.vue'
const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const { data: property, isLoading: loadingProperty, isError: propertyError } = useVentasPropertyById(id)
const updateMutation = useVentasUpdateProperty()
const { mutateAsync: uploadMedia, isPending: uploadingMedia } = useVentasUploadPropertyMedia()

// ── Multimedia: en edición los archivos se suben al instante ──
const mediaItems = ref<VentasPropertyMediaItem[]>([])
watch(
  property,
  (p) => {
    mediaItems.value = p?.mediaItems?.length ? p.mediaItems.map((x) => ({ ...x })) : []
  },
  { immediate: true },
)

const uploadMediaFile = (file: File, kind: 'photo' | 'plan') => uploadMedia({ id: id.value, file, kind })

const goBack = () => router.push('/ventas/propiedades')

async function onSubmit(payload: Omit<VentasCreatePropertyPayload, 'mediaItems'>) {
  try {
    await updateMutation.mutateAsync({
      id: id.value,
      data: { ...payload, mediaItems: mediaItems.value.length ? mediaItems.value : null },
    })
    await navigateAfterVentasSave(router, {
      listPath: '/ventas/propiedades',
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
      :title="'Editar Propiedad ' + (property?.code ? `– ${property.code}` : '')"
      subtitle="Modificar datos del inmueble en venta"
      back
      @back="goBack"
      class="mb-6"
    />

    <LoadingState v-if="loadingProperty" text="Cargando propiedad..." class="py-24" />

    <div
      v-else-if="propertyError || !property"
      class="flex flex-col items-center justify-center py-16 gap-3"
    >
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="text-sm font-medium text-error-500 dark:text-error-400">
        No se encontró la propiedad o no tienes acceso.
      </p>
      <BaseButton variant="outline" size="sm" @click="goBack">Volver al listado</BaseButton>
    </div>

    <VentasPropiedadForm
      v-else
      :initial="property"
      submit-label="Guardar Cambios"
      :submitting="updateMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    >
      <template #media>
        <PropertyMediaManagerSection
          v-model="mediaItems"
          application-slug="ventas"
          :upload="uploadMediaFile"
          :uploading="uploadingMedia"
          :can-write="canWrite"
        />
      </template>
    </VentasPropiedadForm>
  </div>
</template>
