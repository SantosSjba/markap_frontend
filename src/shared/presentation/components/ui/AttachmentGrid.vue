<script lang="ts">
export interface AttachmentGridItem {
  id: string
  name: string
  mimeType: string | null
  sizeBytes: number | null
  createdAt: string
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { markapAlert } from '../../composables/useMarkapAlert'
import { formatDateTime, formatFileSize } from '@shared/utils/formatters'
import { fileKind } from '@shared/utils/file-kind'
import AppIcon from './AppIcon.vue'
import IconButton from './IconButton.vue'
import ListRowsSkeleton from './ListRowsSkeleton.vue'
/**
 * AttachmentGrid — archivos de respaldo como fichas (tipo, nombre, tamaño y fecha) con una ficha
 * final para agregar más. Se puede soltar archivos en cualquier parte de la grilla.
 * Solo muestra y valida; la vista decide cómo subir (`upload`), abrir y eliminar.
 * `pick()` abre el selector de archivos (p. ej. desde un botón de la cabecera).
 */

const props = withDefaults(
  defineProps<{
    items: AttachmentGridItem[]
    canWrite?: boolean
    loading?: boolean
    /** Archivos que se están subiendo (muestra fichas de carga) */
    uploading?: number
    /** Extensiones aceptadas, como en `<input accept>` (ej. ".pdf,.xlsx") */
    accept?: string
    maxSize?: number
    emptyText?: string
  }>(),
  {
    canWrite: true,
    loading: false,
    uploading: 0,
    accept: '',
    maxSize: undefined,
    emptyText: 'Aún no hay archivos.',
  },
)

const emit = defineEmits<{
  upload: [files: File[]]
  open: [id: string]
  remove: [id: string]
}>()

const input = ref<HTMLInputElement | null>(null)
const dragging = ref(false)

const kindOf = (item: AttachmentGridItem) => fileKind(item.name, item.mimeType)

function meta(item: AttachmentGridItem) {
  return [kindOf(item).label, item.sizeBytes != null ? formatFileSize(item.sizeBytes) : null, formatDateTime(item.createdAt)]
    .filter(Boolean)
    .join(' · ')
}

/** El navegador no aplica `accept` al soltar: se valida igual que al elegir */
function accepted(file: File) {
  const rules = props.accept.split(',').map((r) => r.trim().toLowerCase()).filter(Boolean)
  const name = file.name.toLowerCase()
  return !rules.length || rules.some((r) => (r.startsWith('.') ? name.endsWith(r) : file.type === r))
}

function handle(list: FileList | null | undefined) {
  const files = [...(list ?? [])]
  if (!files.length) return
  const wrongType = files.filter((f) => !accepted(f))
  const tooBig = files.filter((f) => accepted(f) && props.maxSize && f.size > props.maxSize)
  if (wrongType.length) {
    void markapAlert.toast.error('Tipo de archivo no permitido', wrongType.map((f) => f.name).join(', '))
  }
  if (tooBig.length && props.maxSize) {
    void markapAlert.toast.error(
      `Supera el máximo de ${formatFileSize(props.maxSize)}`,
      tooBig.map((f) => f.name).join(', '),
    )
  }
  const ok = files.filter((f) => !wrongType.includes(f) && !tooBig.includes(f))
  if (ok.length) emit('upload', ok)
}

function pick() {
  if (props.canWrite) input.value?.click()
}

function onChange(e: Event) {
  const el = e.target as HTMLInputElement
  handle(el.files)
  el.value = ''
}

function onDragOver(e: DragEvent) {
  if (!props.canWrite || !e.dataTransfer?.types.includes('Files')) return
  e.preventDefault()
  dragging.value = true
}

function onDrop(e: DragEvent) {
  if (!props.canWrite) return
  e.preventDefault()
  dragging.value = false
  handle(e.dataTransfer?.files)
}

defineExpose({ pick })
</script>

<template>
  <div
    class="relative rounded-xl transition-colors"
    :class="dragging && 'bg-brand-50/60 outline-2 outline-dashed outline-offset-4 outline-brand-400 dark:bg-brand-500/5'"
    @dragover="onDragOver"
    @dragleave.self="dragging = false"
    @drop="onDrop"
  >
    <input ref="input" type="file" class="sr-only" multiple :accept="accept" @change="onChange" />

    <ListRowsSkeleton v-if="loading" :rows="2" />

    <p v-else-if="!items.length && !uploading && !canWrite" class="text-sm text-gray-400 dark:text-gray-500">
      {{ emptyText }}
    </p>

    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="item in items"
        :key="item.id"
        class="group/file flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/40"
      >
        <span :class="['flex size-10 shrink-0 items-center justify-center rounded-lg', kindOf(item).tone]">
          <AppIcon :icon="kindOf(item).icon" :size="20" />
        </span>
        <button type="button" class="min-w-0 flex-1 text-left" :title="item.name" @click="emit('open', item.id)">
          <p class="truncate text-sm font-medium text-gray-800 group-hover/file:text-brand-500 dark:text-white/90">
            {{ item.name }}
          </p>
          <p class="truncate text-theme-xs text-gray-400 dark:text-gray-500">{{ meta(item) }}</p>
        </button>
        <div class="flex shrink-0 items-center">
          <IconButton icon="lucide:external-link" label="Abrir" size="xs" @click="emit('open', item.id)" />
          <IconButton v-if="canWrite" icon="lucide:trash-2" label="Eliminar" size="xs" danger @click="emit('remove', item.id)" />
        </div>
      </div>

      <div
        v-for="n in uploading"
        :key="`up-${n}`"
        class="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 p-3 dark:border-gray-700"
      >
        <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          <AppIcon icon="lucide:loader-circle" :size="18" class="animate-spin text-gray-400" />
        </span>
        <p class="text-sm text-gray-500 dark:text-gray-400">Subiendo…</p>
      </div>

      <button
        v-if="canWrite"
        type="button"
        class="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 p-3 text-left text-gray-500 transition-colors hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-brand-500/5"
        :class="!items.length && !uploading && 'sm:col-span-2 xl:col-span-3 justify-center py-8'"
        @click="pick"
      >
        <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          <AppIcon icon="lucide:upload" :size="18" />
        </span>
        <span class="min-w-0">
          <span class="block text-sm font-medium">{{ items.length ? 'Agregar archivos' : 'Suba o arrastre archivos aquí' }}</span>
          <span class="block truncate text-theme-xs text-gray-400 dark:text-gray-500">
            <template v-if="maxSize">Hasta {{ formatFileSize(maxSize) }} por archivo</template>
            <template v-else>Puede elegir varios a la vez</template>
          </span>
        </span>
      </button>
    </div>
  </div>
</template>
