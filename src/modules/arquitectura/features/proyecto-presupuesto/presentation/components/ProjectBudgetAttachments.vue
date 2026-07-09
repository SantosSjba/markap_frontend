<script setup lang="ts">
import { ref, toRef } from 'vue'
import { BaseButton, FileDropzone, FormSectionCard, AppIcon } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import {
  useDeleteBudgetAttachment,
  useProjectBudgetAttachments,
  useUploadBudgetAttachment,
} from '../../application/useProjectBudget'
import { projectBudgetApiRepository as repo } from '../../infrastructure/project-budget.api.repository'

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
    text: 'Â¿Eliminar este archivo del presupuesto?',
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
  if (bytes == null) return 'â€”'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <FormSectionCard title="Adjuntos del presupuesto" subtitle="Cotizaciones, fichas tÃ©cnicas, comprobantes" icon="lucide:paperclip" dense>
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

      <div v-if="isLoading" class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Cargando adjuntosâ€¦</div>
      <ul v-else-if="attachments?.length" class="divide-y" :style="{ borderColor: 'var(--color-border)' }">
        <li
          v-for="att in attachments"
          :key="att.id"
          class="flex items-center justify-between gap-3 py-2 text-sm"
        >
          <button
            type="button"
            class="flex items-center gap-2 min-w-0 text-left hover:underline"
            :style="{ color: 'var(--color-text-primary)' }"
            @click="openAttachment(att.id)"
          >
            <AppIcon icon="lucide:file" :size="16" class="shrink-0" />
            <span class="truncate">{{ att.originalFileName }}</span>
          </button>
          <div class="flex items-center gap-3 shrink-0">
            <span class="text-xs" :style="{ color: 'var(--color-text-muted)' }">{{ formatSize(att.sizeBytes) }}</span>
            <button type="button" class="opacity-60 hover:opacity-100" @click="onDelete(att.id)">
              <AppIcon icon="lucide:trash-2" :size="14" />
            </button>
          </div>
        </li>
      </ul>
      <p v-else class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Sin adjuntos en este proyecto.</p>
    </div>
  </FormSectionCard>
</template>
