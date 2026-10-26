<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('alquileres')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { propertiesRepositoryKey } from '../../application/ports/properties.port'
import { useService } from '@shared/presentation/di/services'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { useCreateProperty } from '../composables/useProperties'
import { navigateAfterAlquileresSave } from '../../../../presentation/navigation/navigateAfterAlquileresSave'
import type { PropertyFormPayload } from '../../domain/property.types'
import PropiedadForm from '../components/PropiedadForm.vue'
const propertiesApiRepository = useService(propertiesRepositoryKey)
const router = useRouter()

const createMutation = useCreateProperty()

/** Archivos en cola: se suben cuando la propiedad ya existe */
const mediaRows = ref<{ file: File | null; kind: 'photo' | 'plan'; error: string }[]>([
  { file: null, kind: 'photo', error: '' },
])

function addMediaRow() {
  mediaRows.value.push({ file: null, kind: 'photo', error: '' })
}
function removeMediaRow(i: number) {
  mediaRows.value.splice(i, 1)
  if (!mediaRows.value.length) mediaRows.value.push({ file: null, kind: 'photo', error: '' })
}

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
        <FormSectionCard title="Multimedia" subtitle="Fotos y planos; se suben al guardar la propiedad">
          <div class="space-y-4">
            <div v-for="(row, idx) in mediaRows" :key="idx" class="space-y-2">
              <div class="flex items-end gap-2">
                <FormSelect
                  v-model="row.kind"
                  class="w-36"
                  :options="[{ value: 'photo', label: 'Foto' }, { value: 'plan', label: 'Plano' }]"
                  label="Tipo"
                />
                <BaseButton
                  v-if="mediaRows.length > 1"
                  type="button"
                  variant="ghost"
                  size="lg"
                  icon="lucide:trash-2"
                  class="px-3!"
                  :aria-label="`Quitar archivo ${idx + 1}`"
                  @click="removeMediaRow(idx)"
                />
              </div>
              <FileDropzone
                v-model="row.file"
                :label="row.kind === 'plan' ? 'Plano' : 'Foto'"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                :max-size="25 * 1024 * 1024"
                :multiple="false"
                :error="row.error"
                @error="(m: string) => (row.error = m)"
              />
            </div>
          </div>
          <BaseButton
            v-if="canWrite"
            type="button"
            variant="ghost"
            size="sm"
            icon="lucide:plus"
            class="mt-4"
            @click="addMediaRow"
          >
            Añadir archivo
          </BaseButton>
        </FormSectionCard>
      </template>
    </PropiedadForm>
  </div>
</template>
