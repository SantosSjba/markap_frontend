<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import FormCombobox from '@shared/presentation/components/forms/FormCombobox.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { formatFileSize } from '@shared/utils/formatters'
import { useInteriorProjectOptions } from '../../../proyectos/presentation/composables/useInteriorProjects'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import type { InteriorDocumentType } from '../../domain/document.types'
import { DOCUMENT_TYPE_FORM_OPTIONS } from '../documentNav'
import { useUploadInteriorDocument } from '../composables/useInteriorDocuments'
/**
 * Subir uno o varios documentos a un proyecto: tipo, y un título por archivo (por defecto su
 * nombre sin extensión). Se suben uno tras otro; los que fallan quedan en la lista.
 */

const props = defineProps<{ projectId?: string; defaultType?: InteriorDocumentType }>()
const open = defineModel<boolean>('open', { required: true })

const { options: projectOptions } = useInteriorProjectOptions()

const projectId = ref('')
const docType = ref<InteriorDocumentType>('CONTRATO')
const dropped = ref<File | File[] | null>(null)
const queue = ref<{ file: File; title: string }[]>([])
const error = ref('')
const uploading = ref(false)
const uploadMut = useUploadInteriorDocument()

watch(open, (o) => {
  if (!o) return
  projectId.value = props.projectId ?? ''
  docType.value = props.defaultType ?? 'CONTRATO'
  queue.value = []
  error.value = ''
})
watch(dropped, (files) => {
  if (!files) return
  const list = Array.isArray(files) ? files : [files]
  queue.value = [...queue.value, ...list.map((file) => ({ file, title: file.name.replace(/\.[^.]+$/, '') }))]
  dropped.value = null
})

async function submit() {
  if (!projectId.value) {
    error.value = 'Seleccione el proyecto'
    return
  }
  if (!queue.value.length) {
    error.value = 'Agregue al menos un archivo'
    return
  }
  error.value = ''
  uploading.value = true
  const pending = [...queue.value]
  for (const item of pending) {
    try {
      await uploadMut.mutateAsync({ projectId: projectId.value, docType: docType.value, title: item.title.trim() || item.file.name, file: item.file })
      queue.value = queue.value.filter((q) => q !== item)
    } catch {
      void 0
    }
  }
  uploading.value = false
  if (!queue.value.length) open.value = false
}
</script>

<template>
  <BaseModal v-model="open" title="Subir documentos" size="lg">
    <div class="space-y-4 p-1">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormCombobox v-if="!props.projectId" v-model="projectId" label="Proyecto" placeholder="Buscar proyecto..." :options="projectOptions" required />
        <FormSelect v-model="docType" label="Tipo de documento" :options="DOCUMENT_TYPE_FORM_OPTIONS" />
      </div>
      <FileDropzone v-model="dropped" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.zip" :max-size="50 * 1024 * 1024" hint="Varios archivos a la vez (hasta 50 MB c/u)" />
      <ul v-if="queue.length" class="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
        <li v-for="(q, i) in queue" :key="`${q.file.name}-${i}`" class="flex items-center gap-3 px-3 py-2">
          <FormInput v-model="q.title" size="sm" class="min-w-0 flex-1" :aria-label="`Título de ${q.file.name}`" />
          <span class="shrink-0 text-theme-xs text-gray-400">{{ formatFileSize(q.file.size) }}</span>
          <IconButton icon="lucide:x" label="Quitar" @click="queue.splice(i, 1)" />
        </li>
      </ul>
      <p v-if="error" class="text-sm text-error-500">{{ error }}</p>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton variant="outline" @click="open = false">Cancelar</BaseButton>
        <BaseButton variant="primary" icon="lucide:upload" :loading="uploading" @click="submit">
          Subir {{ queue.length > 1 ? `${queue.length} archivos` : '' }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
