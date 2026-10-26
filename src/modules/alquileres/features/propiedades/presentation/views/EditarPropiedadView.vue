<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('alquileres')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { useService } from '@shared/presentation/di/services'
import { FILE_ACCESS } from '@shared/application/ports/file-access.port'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import {
  usePropertyById,
  useUpdateProperty,
  useUploadPropertyMedia,
} from '../composables/useProperties'
import { navigateAfterAlquileresSave } from '../../../../presentation/navigation/navigateAfterAlquileresSave'
import type { PropertyFormPayload, PropertyMediaItem } from '../../domain/property.types'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { resolveFileDownloadUrl } from '@shared/utils/archivo-url'
import PropiedadForm from '../components/PropiedadForm.vue'
const fileAccess = useService(FILE_ACCESS)
const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const { data: property, isLoading: loadingProperty, isError: propertyError } = usePropertyById(id)
const updateMutation = useUpdateProperty()
const { mutateAsync: uploadMedia, isPending: uploadingMedia } = useUploadPropertyMedia()

// ── Multimedia: en edición los archivos se suben al instante ──
const mediaItems = ref<PropertyMediaItem[]>([])
const newMediaFile = ref<File | null>(null)
const newMediaKind = ref<'photo' | 'plan'>('photo')
const newMediaError = ref('')

watch(
  property,
  (p) => {
    mediaItems.value = p?.mediaItems?.length ? p.mediaItems.map((x) => ({ ...x })) : []
  },
  { immediate: true },
)

function removeMediaItem(i: number) {
  mediaItems.value.splice(i, 1)
}

async function onUploadMedia() {
  if (!newMediaFile.value) {
    newMediaError.value = 'Seleccione un archivo'
    return
  }
  newMediaError.value = ''
  const res = await uploadMedia({ id: id.value, file: newMediaFile.value, kind: newMediaKind.value })
  mediaItems.value = res.mediaItems ?? [...mediaItems.value, res.mediaItem]
  newMediaFile.value = null
}

async function openMediaItem(item: PropertyMediaItem) {
  try {
    if (item.archivoId) {
      const data = await fileAccess.getDownloadUrl(encodeURIComponent(item.archivoId), {
        applicationSlug: 'alquileres',
      })
      if (data?.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer')
        return
      }
    }
    if (/^https?:\/\//i.test(item.url)) {
      window.open(item.url, '_blank', 'noopener,noreferrer')
      return
    }
    const data = await fileAccess.resolveDownloadUrl(item.url, { applicationSlug: 'alquileres' })
    if (data?.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer')
      return
    }
    const legacy = resolveFileDownloadUrl({ filePath: item.url })
    if (legacy !== '#') {
      window.open(legacy, '_blank', 'noopener,noreferrer')
      return
    }
    void markapAlert.toast.error('No hay archivo disponible')
  } catch (e) {
    void markapAlert.toast.error('No se pudo abrir el archivo', getApiErrorMessage(e))
  }
}

const goBack = () => router.push('/alquileres/propiedades')

async function onSubmit(payload: PropertyFormPayload) {
  try {
    await updateMutation.mutateAsync({
      id: id.value,
      data: { ...payload, mediaItems: mediaItems.value.length ? mediaItems.value : null },
    })
    await navigateAfterAlquileresSave(router, {
      listPath: '/alquileres/propiedades',
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
      subtitle="Modificar datos del inmueble"
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

    <PropiedadForm
      v-else
      :initial="property"
      submit-label="Guardar Cambios"
      :submitting="updateMutation.isPending.value"
      :can-write="canWrite"
      @submit="onSubmit"
      @cancel="goBack"
    >
      <template #media>
        <FormSectionCard title="Multimedia" subtitle="Fotos y planos del inmueble">
          <ul v-if="mediaItems.length" class="mb-4 space-y-2 text-sm">
            <li
              v-for="(item, idx) in mediaItems"
              :key="`${item.url}-${idx}`"
              class="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 border-gray-200 dark:border-gray-800"
            >
              <span class="min-w-0 truncate">
                {{ item.kind === 'plan' ? 'Plano' : 'Foto' }} · {{ item.url.split('/').pop() }}
              </span>
              <div class="flex shrink-0 gap-2">
                <BaseButton type="button" variant="outline" size="sm" @click="openMediaItem(item)">
                  Ver
                </BaseButton>
                <BaseButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon="lucide:trash-2"
                  :aria-label="`Quitar archivo ${idx + 1}`"
                  @click="removeMediaItem(idx)"
                />
              </div>
            </li>
          </ul>
          <p v-else class="mb-4 text-sm text-gray-400 dark:text-gray-500">Sin archivos multimedia.</p>

          <div class="space-y-2">
            <FormSelect
              v-model="newMediaKind"
              class="w-36"
              :options="[{ value: 'photo', label: 'Foto' }, { value: 'plan', label: 'Plano' }]"
              label="Tipo"
            />
            <FileDropzone
              v-model="newMediaFile"
              label="Nuevo archivo"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              :max-size="25 * 1024 * 1024"
              :multiple="false"
              :error="newMediaError"
              @error="(m: string) => (newMediaError = m)"
            />
          </div>
          <BaseButton
            v-if="canWrite"
            type="button"
            variant="secondary"
            size="sm"
            icon="lucide:upload"
            class="mt-3"
            :loading="uploadingMedia"
            @click="onUploadMedia"
          >
            Subir ahora
          </BaseButton>
        </FormSectionCard>
      </template>
    </PropiedadForm>
  </div>
</template>
