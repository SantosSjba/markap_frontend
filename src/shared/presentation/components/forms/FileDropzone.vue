<script setup lang="ts">
import { ref, computed, useId } from 'vue'
import { CheckCircleIcon, FileIcon, UploadIcon, XIcon } from '../../icons/layout'
import { fieldErrorClass, fieldHintClass, fieldLabelClass } from './field-classes'
/**
 * FileDropzone - Input de archivo con zona de arrastrar y soltar, ancho completo
 */

interface Props {
  modelValue?: File | File[] | null
  accept?: string
  multiple?: boolean
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  id?: string
  /** Tamaño máximo en bytes (ej: 10 * 1024 * 1024 = 10 MB) */
  maxSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  accept: '',
  multiple: false,
  placeholder: 'Arrastra un archivo aquí o haz clic para seleccionar',
  disabled: false,
  required: false,
  maxSize: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: File | File[] | null): void
  (e: 'error', message: string): void
}>()

const inputId = props.id ?? `filedrop-${useId()}`
const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
/** Rechazo local (tamaño, tipo, cantidad); se muestra aunque la vista no escuche `error`. */
const localError = ref('')
const shownError = computed(() => props.error || localError.value)

function reject(message: string) {
  localError.value = message
  emit('error', message)
}

/** Formatos aceptados en lenguaje del usuario (PDF, JPG, imágenes…) en lugar de tipos MIME. */
const acceptLabel = computed(() => {
  const labels = props.accept
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean)
    .map((r) =>
      r.startsWith('.')
        ? r.slice(1).toUpperCase()
        : r === 'image/*'
          ? 'imágenes'
          : r === 'video/*'
            ? 'videos'
            : r === 'application/pdf'
              ? 'PDF'
              : '',
    )
    .filter(Boolean)
  return [...new Set(labels)].join(', ') || props.accept
})

/** Comprueba `accept` (extensiones y tipos MIME); al arrastrar el navegador no lo aplica. */
function matchesAccept(file: File) {
  const rules = props.accept
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean)
  if (rules.length === 0) return true
  const name = file.name.toLowerCase()
  const type = (file.type || '').toLowerCase()
  return rules.some((rule) =>
    rule.startsWith('.')
      ? name.endsWith(rule)
      : rule.endsWith('/*')
        ? type.startsWith(rule.slice(0, -1))
        : type === rule,
  )
}

const files = computed(() => {
  const v = props.modelValue
  if (!v) return []
  return Array.isArray(v) ? v : [v]
})

const hasFiles = computed(() => files.value.length > 0)

/** Borde y fondo del `DropzoneInput` de TailAdmin según el estado. */
const zoneClass = computed(() => {
  if (shownError.value) return 'border-error-500 bg-error-50/60 dark:bg-error-950/20'
  if (isDragging.value) return 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/20'
  if (hasFiles.value) return 'border-success-500 bg-success-50/40 dark:bg-success-950/20'
  return 'border-gray-300 bg-gray-50 hover:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500'
})

const displayText = computed(() => {
  if (!hasFiles.value) return props.placeholder
  if (files.value.length === 1) {
    return 'Archivo listo — clic o arrastra para reemplazar'
  }
  return `${files.value.length} archivos — clic para cambiar`
})

const fileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function triggerSelect() {
  if (props.disabled) return
  inputRef.value?.click()
}

function onInputChange(e: Event) {
  const input = e.target as HTMLInputElement
  const selected = input.files
  if (!selected?.length) {
    emit('update:modelValue', null)
    return
  }
  validateAndEmit(Array.from(selected))
  input.value = ''
}

function validateAndEmit(selected: File[]) {
  localError.value = ''
  const wrongType = selected.filter((f) => !matchesAccept(f))
  if (wrongType.length > 0) {
    reject(
      `Tipo de archivo no permitido: ${wrongType.map((f) => f.name).join(', ')}. Formatos aceptados: ${acceptLabel.value}.`,
    )
    return
  }
  if (props.maxSize != null) {
    const oversized = selected.filter((f) => f.size > props.maxSize!)
    if (oversized.length > 0) {
      reject(`El archivo supera el tamaño máximo permitido (${fileSize(props.maxSize)}).`)
      return
    }
  }
  if (props.multiple) {
    emit('update:modelValue', selected)
  } else {
    emit('update:modelValue', selected[0] ?? null)
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false
  if (props.disabled) return
  const items = e.dataTransfer?.files
  if (!items?.length) return
  const list = Array.from(items)
  if (!props.multiple && list.length > 1) {
    reject('Solo se permite un archivo. Arrastra un único archivo.')
    return
  }
  validateAndEmit(list)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  if (props.disabled) return
  isDragging.value = true
}

function onDragLeave(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false
}

function removeFile(index: number) {
  if (props.disabled) return
  const list = files.value.filter((_, i) => i !== index)
  if (list.length === 0) emit('update:modelValue', null)
  else if (props.multiple) emit('update:modelValue', list)
  else emit('update:modelValue', list[0] ?? null)
}

function clearAll() {
  if (props.disabled) return
  localError.value = ''
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <label v-if="label" :for="inputId" :class="fieldLabelClass">
      {{ label }}
      <span v-if="required" class="text-error-500">*</span>
    </label>

    <input
      :id="inputId"
      ref="inputRef"
      type="file"
      class="sr-only"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      :required="required && files.length === 0"
      @change="onInputChange"
    />

    <div
      role="button"
      :tabindex="disabled ? -1 : 0"
      :aria-label="label || placeholder"
      :aria-disabled="disabled || undefined"
      class="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center transition-all duration-200 outline-hidden focus-visible:border-brand-500 focus-visible:ring-3 focus-visible:ring-brand-500/20"
      :class="[
        zoneClass,
        hasFiles ? 'py-5' : 'py-7',
        { 'cursor-not-allowed opacity-60': disabled },
      ]"
      @click="triggerSelect"
      @keydown.enter.space.prevent="triggerSelect"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div
        class="mb-3 flex items-center justify-center rounded-full"
        :class="[
          hasFiles
            ? 'size-12 bg-success-100 text-success-600 dark:bg-success-500/15 dark:text-success-500'
            : 'size-14 bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        ]"
      >
        <CheckCircleIcon v-if="hasFiles" class="size-6" />
        <UploadIcon v-else class="size-6" />
      </div>
      <p
        class="max-w-md text-sm leading-snug"
        :class="hasFiles ? 'font-medium text-gray-800 dark:text-white/90' : 'text-gray-700 dark:text-gray-400'"
      >
        {{ displayText }}
      </p>
      <p v-if="accept && !hasFiles" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Formatos aceptados: {{ acceptLabel }}
      </p>
      <span
        v-if="!hasFiles && !disabled"
        class="mt-3 text-sm font-medium text-brand-500 underline hover:text-brand-600"
      >
        Buscar archivo
      </span>
    </div>

    <!-- Lista de archivos seleccionados -->
    <ul v-if="files.length > 0" class="mt-1 space-y-2">
      <li
        v-for="(file, index) in files"
        :key="`${file.name}-${file.size}-${index}`"
        class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
      >
        <div
          class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
        >
          <FileIcon class="size-4" />
        </div>
        <span
          class="min-w-0 flex-1 truncate font-medium text-gray-800 dark:text-white/90"
          :title="file.name"
        >{{ file.name }}</span>
        <span class="shrink-0 text-xs text-gray-500 dark:text-gray-400">
          {{ fileSize(file.size) }}
        </span>
        <button
          type="button"
          class="flex size-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white"
          aria-label="Quitar archivo"
          @click.stop="removeFile(index)"
        >
          <XIcon class="size-4" />
        </button>
      </li>
      <li v-if="files.length > 1">
        <button
          type="button"
          class="text-xs font-medium text-error-500 hover:text-error-600 dark:text-error-400"
          @click.stop="clearAll"
        >
          Quitar todos
        </button>
      </li>
    </ul>

    <p v-if="shownError" role="alert" :class="fieldErrorClass">
      {{ shownError }}
    </p>
    <p v-else-if="hint" :class="fieldHintClass">
      {{ hint }}
    </p>
  </div>
</template>
