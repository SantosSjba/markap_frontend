<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { useService } from '@shared/presentation/di/services'
import { FILE_ACCESS } from '@shared/application/ports/file-access.port'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { resolveFileDownloadUrl } from '@shared/utils/archivo-url'
/**
 * PropertyMediaManagerSection — multimedia al editar una propiedad (Alquileres y Ventas):
 * lista los archivos (ver / quitar) y sube los nuevos al instante con `upload`.
 * Quitar solo cambia la lista; se guarda junto con la propiedad.
 */
export type ManagedMediaItem = { url: string; kind: 'photo' | 'plan'; archivoId?: string }

const props = withDefaults(
  defineProps<{
    applicationSlug: string
    upload: (
      file: File,
      kind: 'photo' | 'plan',
    ) => Promise<{ mediaItems?: ManagedMediaItem[] | null; mediaItem: ManagedMediaItem }>
    uploading?: boolean
    canWrite?: boolean
  }>(),
  { uploading: false, canWrite: true },
)

const items = defineModel<ManagedMediaItem[]>({ required: true })

const fileAccess = useService(FILE_ACCESS)
const newFile = ref<File | null>(null)
const newKind = ref<'photo' | 'plan'>('photo')
const newError = ref('')

const KIND_OPTIONS = [
  { value: 'photo', label: 'Foto' },
  { value: 'plan', label: 'Plano' },
]

function removeItem(i: number) {
  items.value = items.value.filter((_, idx) => idx !== i)
}

async function onUpload() {
  if (!newFile.value) {
    newError.value = 'Seleccione un archivo'
    return
  }
  newError.value = ''
  try {
    const res = await props.upload(newFile.value, newKind.value)
    items.value = res.mediaItems ?? [...items.value, res.mediaItem]
    newFile.value = null
  } catch {
    // el aviso de error lo muestra la mutación
  }
}

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

async function openItem(item: ManagedMediaItem) {
  const scope = { applicationSlug: props.applicationSlug }
  try {
    if (item.archivoId) {
      const data = await fileAccess.getDownloadUrl(encodeURIComponent(item.archivoId), scope)
      if (data?.url) return openUrl(data.url)
    }
    if (/^https?:\/\//i.test(item.url)) return openUrl(item.url)
    const data = await fileAccess.resolveDownloadUrl(item.url, scope)
    if (data?.url) return openUrl(data.url)
    const legacy = resolveFileDownloadUrl({ filePath: item.url })
    if (legacy !== '#') return openUrl(legacy)
    void markapAlert.toast.error('No hay archivo disponible')
  } catch (e) {
    void markapAlert.toast.error('No se pudo abrir el archivo', getApiErrorMessage(e))
  }
}
</script>

<template>
  <FormSectionCard title="Multimedia" subtitle="Fotos y planos del inmueble">
    <ul v-if="items.length" class="mb-4 space-y-2 text-sm">
      <li
        v-for="(item, idx) in items"
        :key="`${item.url}-${idx}`"
        class="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 border-gray-200 dark:border-gray-800"
      >
        <span class="min-w-0 truncate">
          {{ item.kind === 'plan' ? 'Plano' : 'Foto' }} · {{ item.url.split('/').pop() }}
        </span>
        <div class="flex shrink-0 gap-2">
          <BaseButton type="button" variant="outline" size="sm" @click="openItem(item)">Ver</BaseButton>
          <BaseButton
            type="button"
            variant="ghost"
            size="sm"
            icon="lucide:trash-2"
            :aria-label="`Quitar archivo ${idx + 1}`"
            @click="removeItem(idx)"
          />
        </div>
      </li>
    </ul>
    <p v-else class="mb-4 text-sm text-gray-400 dark:text-gray-500">Sin archivos multimedia.</p>

    <div class="space-y-2">
      <FormSelect v-model="newKind" class="w-36" :options="KIND_OPTIONS" label="Tipo" />
      <FileDropzone
        v-model="newFile"
        label="Nuevo archivo"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        :max-size="25 * 1024 * 1024"
        :multiple="false"
        :error="newError"
        @error="(m: string) => (newError = m)"
      />
    </div>
    <BaseButton
      v-if="canWrite"
      type="button"
      variant="secondary"
      size="sm"
      icon="lucide:upload"
      class="mt-3"
      :loading="uploading"
      @click="onUpload"
    >
      Subir ahora
    </BaseButton>
  </FormSectionCard>
</template>
