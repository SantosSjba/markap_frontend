<script setup lang="ts">
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import { projectBudgetRepositoryKey as repoKey } from '../../application/ports/project-budget.port'
import { useService } from '@shared/presentation/di/services'
import { ref, toRef } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import {
  useDeleteBudgetAttachment,
  useProjectBudgetAttachments,
  useUploadBudgetAttachment,
} from '../composables/useProjectBudget'
const repo = useService(repoKey)

const props = defineProps<{
  projectId: string
}>()

const projectIdRef = toRef(props, 'projectId')
const fileDraft = ref<File | null>(null)

const { data: attachments, isLoading } = useProjectBudgetAttachments(projectIdRef)
const upload = useUploadBudgetAttachment(projectIdRef)
const deleteAtt = useDeleteBudgetAttachment(projectIdRef)

async function submitUpload() {
  if (!fileDraft.value) return
  await upload.mutateAsync({ file: fileDraft.value })
  fileDraft.value = null
}

async function onDelete(id: string) {
  const ok = await markapAlert.confirmDanger({
    title: 'Eliminar adjunto',
    text: '¿Eliminar este archivo del presupuesto?',
  })
  if (!ok) return
  await deleteAtt.mutateAsync(id)
}

async function openAttachment(id: string) {
  try {
    const url = await repo.getAttachmentDownloadUrl(id)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch {
    void markapAlert.toast.error('No se pudo abrir el archivo')
  }
}

function formatSize(bytes: number | null) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <FormSectionCard title="Adjuntos del presupuesto" subtitle="Cotizaciones, fichas técnicas, comprobantes" icon="lucide:paperclip" dense>
    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row gap-3 items-start">
        <div class="flex-1 w-full">
          <FileDropzone
            v-model="fileDraft"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.doc,.docx"
            :max-size="15 * 1024 * 1024"
          />
        </div>
        <BaseButton
          variant="primary"
          size="sm"
          class="shrink-0"
          :disabled="!fileDraft"
          :loading="upload.isPending.value"
          @click="submitUpload"
        >
          Subir
        </BaseButton>
      </div>

      <div v-if="isLoading" class="text-sm text-gray-400 dark:text-gray-500">Cargando adjuntos…</div>
      <ul v-else-if="attachments?.length" class="divide-y border-gray-200 dark:border-gray-800">
        <li
          v-for="att in attachments"
          :key="att.id"
          class="flex items-center justify-between gap-3 py-2 text-sm"
        >
          <BaseButton variant="link" icon="lucide:file" class="min-w-0 text-gray-800 dark:text-white/90" @click="openAttachment(att.id)"><span class="truncate">{{ att.originalFileName }}</span></BaseButton>
          <div class="flex items-center gap-3 shrink-0">
            <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatSize(att.sizeBytes) }}</span>
            <IconButton @click="onDelete(att.id)" icon="lucide:trash-2" label="Eliminar" danger size="xs" />
          </div>
        </li>
      </ul>
      <p v-else class="text-sm text-gray-400 dark:text-gray-500">Sin adjuntos en este proyecto.</p>
    </div>
  </FormSectionCard>
</template>
