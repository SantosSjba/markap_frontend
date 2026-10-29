<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin } = useApplicationAccess('interiorismo')

import { computed, ref, toRef } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import HelpTooltip from '@shared/presentation/components/ui/HelpTooltip.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { formatShortDate, toCalendarDateString } from '@shared/utils/formatters'
import type { InteriorExecutionEvidenceDto, InteriorExecutionTaskDto } from '../../domain/execution.types'
import { useDeleteExecutionEvidence, useOpenExecutionEvidenceFile, useUploadExecutionEvidence } from '../composables/useInteriorExecution'
import { EVIDENCE_LABELS, PHASE_LABELS } from '../labels'
/** ExecutionEvidences — galería de fotos y documentos de obra, con subida y filtro por tarea. */

const props = defineProps<{ projectId: string; evidences: readonly InteriorExecutionEvidenceDto[]; tasks: readonly InteriorExecutionTaskDto[] }>()

const taskFilter = ref('')
const taskTitle = computed(() => new Map(props.tasks.map((t) => [t.id, t.title])))
const taskFilterOptions = computed(() => [{ value: '', label: 'Todas las tareas' }, ...props.tasks.map((t) => ({ value: t.id, label: t.title }))])
const visible = computed(() =>
  [...props.evidences].filter((e) => !taskFilter.value || e.taskId === taskFilter.value).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)),
)

const pid = toRef(props, 'projectId')
const upload = useUploadExecutionEvidence(pid)
const deleteEv = useDeleteExecutionEvidence(pid)
const openFile = useOpenExecutionEvidenceFile()

// ── Subida ──
const uploadOpen = ref(false)
const draft = ref({ kind: 'PHOTO', title: '', taskId: '', date: toCalendarDateString(), file: null as File | null })
const kindOptions = Object.entries(EVIDENCE_LABELS).map(([value, label]) => ({ value, label }))
const taskOptions = computed(() => [{ value: '', label: 'Sin tarea asociada' }, ...props.tasks.map((t) => ({ value: t.id, label: `${PHASE_LABELS[t.phase] ?? t.phase}: ${t.title}` }))])

function openUpload() {
  draft.value = { kind: 'PHOTO', title: '', taskId: taskFilter.value, date: toCalendarDateString(), file: null }
  uploadOpen.value = true
}
function onFile(file: File | null) {
  draft.value.file = file
  if (file && !draft.value.title) draft.value.title = file.name.replace(/\.[^.]+$/, '')
  if (file) draft.value.kind = file.type.startsWith('image/') ? 'PHOTO' : 'DOCUMENT'
}
async function save() {
  const d = draft.value
  if (!d.file) return void markapAlert.toast.error('Selecciona un archivo')
  if (!d.title.trim()) return void markapAlert.toast.error('Indica un título')
  await upload.mutateAsync({ kind: d.kind, title: d.title.trim(), file: d.file, taskId: d.taskId || null, capturedAt: `${d.date}T12:00:00.000Z` })
  uploadOpen.value = false
}
async function remove(e: InteriorExecutionEvidenceDto) {
  const ok = await markapAlert.confirmDanger({ title: '¿Eliminar evidencia?', text: e.title, confirmText: 'Eliminar' })
  if (ok) await deleteEv.mutateAsync(e.id)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <div v-if="tasks.length" class="w-full min-w-0 sm:w-[260px]"><FormSelect v-model="taskFilter" :options="taskFilterOptions" /></div>
      <span class="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        {{ visible.length }} {{ visible.length === 1 ? 'archivo' : 'archivos' }}
        <HelpTooltip
          title="Evidencias de obra"
          text="Fotos y documentos que respaldan el avance (antes/después, instalación, conformidad). Asócielos a una tarea para encontrarlos con el filtro. Los contratos y planos van en Documentos."
          width="w-72"
        />
      </span>
      <BaseButton v-if="canWrite" variant="primary" size="sm" icon="lucide:upload" class="sm:ml-auto" @click="openUpload">Subir evidencia</BaseButton>
    </div>

    <div v-if="!visible.length" class="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400 dark:border-gray-800 dark:text-gray-500">
      Sin fotos ni documentos de obra.
    </div>
    <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <figure v-for="e in visible" :key="e.id" class="group overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <button type="button" class="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-gray-100 dark:bg-white/[0.03]" @click="openFile(e)">
          <img v-if="e.kind === 'PHOTO' && e.downloadUrl" :src="e.downloadUrl" :alt="e.title" class="size-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
          <AppIcon v-else :icon="e.kind === 'PHOTO' ? 'lucide:image' : 'lucide:file-text'" :size="32" class="text-gray-400" />
        </button>
        <figcaption class="flex items-start gap-2 p-2.5">
          <div class="min-w-0 flex-1">
            <p class="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90" :title="e.title">{{ e.title }}</p>
            <p class="truncate text-theme-xs text-gray-500 dark:text-gray-400">{{ formatShortDate(e.capturedAt) }}<template v-if="e.taskId && taskTitle.get(e.taskId)"> · {{ taskTitle.get(e.taskId) }}</template></p>
          </div>
          <button v-if="canAdmin" type="button" class="shrink-0 text-gray-400 opacity-0 transition-opacity hover:text-error-500 group-hover:opacity-100 focus:opacity-100" aria-label="Eliminar evidencia" @click="remove(e)">
            <AppIcon icon="lucide:trash-2" :size="16" />
          </button>
        </figcaption>
      </figure>
    </div>

    <BaseModal v-model="uploadOpen" title="Subir evidencia" size="md">
      <div class="space-y-4">
        <FileDropzone :model-value="draft.file" accept=".png,.jpg,.jpeg,.webp,.heic,.pdf,.doc,.docx" :max-size="25 * 1024 * 1024" @update:model-value="(v) => onFile(Array.isArray(v) ? (v[0] ?? null) : v)" />
        <FormInput v-model="draft.title" label="Título" required />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect v-model="draft.kind" label="Tipo" :options="kindOptions" />
          <FormInput v-model="draft.date" type="date" label="Fecha" />
        </div>
        <FormSelect v-model="draft.taskId" label="Tarea" :options="taskOptions" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" @click="uploadOpen = false">Cancelar</BaseButton>
          <BaseButton variant="primary" icon="lucide:upload" :loading="upload.isPending.value" @click="save">Subir</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
