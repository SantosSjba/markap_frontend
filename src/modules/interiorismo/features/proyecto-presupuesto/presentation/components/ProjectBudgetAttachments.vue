<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AttachmentGrid from '@shared/presentation/components/ui/AttachmentGrid.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { useService } from '@shared/presentation/di/services'
import { projectBudgetRepositoryKey as repoKey } from '../../application/ports/project-budget.port'
import {
  useDeleteBudgetAttachment,
  useProjectBudgetAttachments,
  useUploadBudgetAttachment,
} from '../composables/useProjectBudget'
/** Adjuntos del presupuesto (cotizaciones, planos, el Excel original): se suben al elegirlos o soltarlos. */

const props = defineProps<{ projectId: string; canWrite: boolean }>()

const repo = useService(repoKey)
const projectIdRef = toRef(props, 'projectId')
const { data: attachments, isLoading } = useProjectBudgetAttachments(projectIdRef)
const upload = useUploadBudgetAttachment(projectIdRef)
const deleteAtt = useDeleteBudgetAttachment(projectIdRef)

const grid = ref<InstanceType<typeof AttachmentGrid> | null>(null)
const uploading = ref(0)
const items = computed(() =>
  (attachments.value ?? []).map((a) => ({
    id: a.id,
    name: a.originalFileName,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    createdAt: a.createdAt,
  })),
)

async function onUpload(files: File[]) {
  uploading.value += files.length
  for (const file of files) {
    try {
      await upload.mutateAsync({ file })
    } catch {
      /* onError avisa */
    } finally {
      uploading.value--
    }
  }
}

async function onRemove(id: string) {
  const ok = await markapAlert.confirmDanger({
    title: 'Eliminar adjunto',
    text: '¿Eliminar este archivo del presupuesto?',
  })
  if (ok) await deleteAtt.mutateAsync(id)
}

async function onOpen(id: string) {
  try {
    const url = await repo.getAttachmentDownloadUrl(id)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch {
    void markapAlert.toast.error('No se pudo abrir el archivo')
  }
}
</script>

<template>
  <FormSectionCard
    title="Adjuntos del presupuesto"
    subtitle="Cotizaciones, planos, fichas técnicas o el Excel original"
    icon="lucide:paperclip"
    show-icon
  >
    <template v-if="canWrite" #actions>
      <BaseButton variant="outline" size="sm" icon="lucide:upload" @click="grid?.pick()">Subir archivos</BaseButton>
    </template>
    <AttachmentGrid
      ref="grid"
      :items="items"
      :can-write="canWrite"
      :loading="isLoading"
      :uploading="uploading"
      accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.doc,.docx"
      :max-size="15 * 1024 * 1024"
      empty-text="Sin adjuntos en este presupuesto."
      @upload="onUpload"
      @open="onOpen"
      @remove="onRemove"
    />
  </FormSectionCard>
</template>
