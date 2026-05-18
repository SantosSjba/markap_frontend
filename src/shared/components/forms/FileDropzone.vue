<script setup lang="ts">
/**
 * FileDropzone - Input de archivo con zona de arrastrar y soltar, ancho completo
 */

import { ref, computed } from 'vue'
import AppIcon from '@shared/components/ui/AppIcon.vue'

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

const inputId = props.id ?? `filedrop-${Math.random().toString(36).slice(2, 11)}`
const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const files = computed(() => {
  const v = props.modelValue
  if (!v) return []
  return Array.isArray(v) ? v : [v]
})

const hasFiles = computed(() => files.value.length > 0)

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
  if (props.maxSize != null) {
    const oversized = selected.filter((f) => f.size > props.maxSize!)
    if (oversized.length > 0) {
      emit('error', `Algunos archivos superan el tamaño máximo (${fileSize(props.maxSize)})`)
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
    emit('error', 'Solo se permite un archivo')
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
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium mb-1.5"
      :style="{ color: 'var(--color-text-primary)' }"
    >
      {{ label }}
      <span v-if="required" :style="{ color: 'var(--color-error)' }">*</span>
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
      tabindex="0"
      class="w-full rounded-xl border-2 border-dashed transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 flex flex-col items-center justify-center gap-2 px-4 cursor-pointer"
      :class="[
        hasFiles ? 'min-h-[88px] py-4' : 'min-h-[140px] py-6',
        { 'opacity-60 cursor-not-allowed': disabled },
      ]"
      :style="{
        borderColor: error
          ? 'var(--color-error)'
          : isDragging
            ? 'var(--color-primary)'
            : hasFiles
              ? 'var(--color-success, #16a34a)'
              : 'var(--color-border)',
        backgroundColor: isDragging
          ? 'var(--color-primary-muted, rgba(11, 176, 190, 0.08))'
          : hasFiles
            ? 'var(--color-success, #16a34a)0a'
            : 'var(--color-surface)',
        '--ring-color': 'var(--color-primary)',
      }"
      @click="triggerSelect"
      @keydown.enter.space.prevent="triggerSelect"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <AppIcon
        :icon="hasFiles ? 'lucide:file-check-2' : 'lucide:cloud-upload'"
        :size="hasFiles ? 32 : 40"
        :color="
          hasFiles
            ? 'var(--color-success, #16a34a)'
            : isDragging
              ? 'var(--color-primary)'
              : 'var(--color-text-muted)'
        "
        class="shrink-0 transition-colors duration-200"
        aria-hidden="true"
      />
      <p
        class="text-sm text-center max-w-md leading-snug"
        :style="{ color: hasFiles ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }"
      >
        {{ displayText }}
      </p>
      <p
        v-if="accept && !hasFiles"
        class="text-xs text-center"
        :style="{ color: 'var(--color-text-muted)' }"
      >
        Aceptados: {{ accept }}
      </p>
    </div>

    <!-- Lista de archivos seleccionados -->
    <ul
      v-if="files.length > 0"
      class="mt-3 space-y-2"
    >
      <li
        v-for="(file, index) in files"
        :key="`${file.name}-${file.size}-${index}`"
        class="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm"
        :style="{
          backgroundColor: 'var(--color-surface-elevated, var(--color-surface))',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }"
      >
        <div
          class="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
          :style="{ backgroundColor: 'var(--color-primary)14' }"
        >
          <AppIcon icon="lucide:file-text" :size="16" color="var(--color-primary)" />
        </div>
        <span class="flex-1 min-w-0 truncate font-medium" :title="file.name">{{ file.name }}</span>
        <span class="text-xs shrink-0" :style="{ color: 'var(--color-text-muted)' }">
          {{ fileSize(file.size) }}
        </span>
        <button
          type="button"
          class="p-1 rounded hover:bg-[var(--color-hover)] transition-colors"
          :style="{ color: 'var(--color-text-muted)' }"
          aria-label="Quitar archivo"
          @click.stop="removeFile(index)"
        >
          <AppIcon icon="lucide:x" :size="16" color="currentColor" />
        </button>
      </li>
      <li v-if="files.length > 1">
        <button
          type="button"
          class="text-xs underline"
          :style="{ color: 'var(--color-text-muted)' }"
          @click.stop="clearAll"
        >
          Quitar todos
        </button>
      </li>
    </ul>

    <p
      v-if="error"
      class="mt-1.5 text-sm"
      :style="{ color: 'var(--color-error)' }"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      class="mt-1.5 text-xs"
      :style="{ color: 'var(--color-text-muted)' }"
    >
      {{ hint }}
    </p>
  </div>
</template>
