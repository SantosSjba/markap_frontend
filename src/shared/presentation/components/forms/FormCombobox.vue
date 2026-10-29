<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { ComboboxAnchor, ComboboxInput, ComboboxTrigger, type AcceptableValue } from 'reka-ui'
import { Combobox, ComboboxContent, ComboboxItem } from '../../ui/combobox'
import { ChevronDownIcon, LoaderCircleIcon } from '../../icons/layout'
import { fieldErrorClass, fieldLabelClass } from './field-classes'
/**
 * FormCombobox — select con búsqueda (Combobox de Reka UI) con la misma API que FormSelect.
 * Para listas largas (inmuebles, clientes): filtra por texto sin distinguir mayúsculas ni tildes.
 * Usa el input de Reka directamente: el `InputGroupInput` de la librería pisa el texto con su propio v-model.
 */

interface Option {
  value: string
  label: string
  /** Texto secundario debajo de la etiqueta (ej. documento, dirección) */
  description?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    options: Option[]
    placeholder?: string
    label?: string
    error?: string
    disabled?: boolean
    loading?: boolean
    required?: boolean
    id?: string
    emptyText?: string
    /** Máximo de opciones visibles a la vez (el resto aparece al buscar) */
    maxVisible?: number
  }>(),
  {
    modelValue: null,
    placeholder: 'Buscar...',
    disabled: false,
    loading: false,
    required: false,
    emptyText: 'Sin resultados',
    maxVisible: 100,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const inputId = props.id ?? `combobox-${useId()}`
const messageId = `${inputId}-message`
const search = ref('')

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase('es-PE')

const filtered = computed(() => {
  // Con una opción elegida el input muestra su etiqueta: eso no es una búsqueda
  const term = search.value.trim() === labelFor(props.modelValue ?? '') ? '' : search.value.trim()
  const q = normalize(term)
  const list = q
    ? props.options.filter((o) => normalize(`${o.label} ${o.description ?? ''}`).includes(q))
    : props.options
  return list.slice(0, props.maxVisible)
})

const labelFor = (value: AcceptableValue) =>
  props.options.find((o) => o.value === value)?.label ?? ''

function onSelect(value: AcceptableValue) {
  emit('update:modelValue', typeof value === 'string' ? value : '')
  search.value = ''
}
</script>

<template>
  <div role="group" data-slot="field" class="flex w-full flex-col gap-2">
    <label v-if="label" :for="inputId" :class="fieldLabelClass">
      {{ label }}
      <span v-if="required" class="text-error-500">*</span>
    </label>
    <Combobox
      :model-value="modelValue ?? undefined"
      ignore-filter
      reset-search-term-on-blur
      :disabled="disabled || loading"
      @update:model-value="onSelect"
    >
      <ComboboxAnchor
        class="flex h-11 w-full items-center rounded-[10px] border border-gray-300 bg-white shadow-theme-xs transition-colors focus-within:border-brand-300 focus-within:ring-3 focus-within:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:border-brand-500/40"
        :class="[
          error ? 'border-error-500! ring-3 ring-error-500/20' : '',
          disabled || loading ? 'cursor-not-allowed bg-gray-100/50 dark:bg-gray-800/50' : '',
        ]"
      >
        <!-- `key`: si las opciones llegan después del valor, se vuelve a pintar la etiqueta elegida -->
        <ComboboxInput
          :id="inputId"
          :key="labelFor(modelValue ?? '') ? 'resolved' : 'pending'"
          v-model="search"
          :display-value="labelFor"
          :placeholder="loading ? 'Cargando...' : placeholder"
          :aria-invalid="error ? 'true' : undefined"
          :aria-describedby="error ? messageId : undefined"
          :disabled="disabled || loading"
          class="h-full min-w-0 flex-1 rounded-[10px] border-0 bg-transparent ps-4 text-sm shadow-none ring-0 focus:ring-0 text-gray-800 outline-hidden placeholder:text-gray-400 disabled:cursor-not-allowed dark:text-white/90 dark:placeholder:text-gray-500"
        />
        <LoaderCircleIcon v-if="loading" class="me-3 size-4 animate-spin text-brand-500" />
        <ComboboxTrigger v-else class="flex h-full items-center pe-3.5 ps-2 text-gray-500 dark:text-gray-400" aria-label="Ver opciones">
          <ChevronDownIcon class="size-4" />
        </ComboboxTrigger>
      </ComboboxAnchor>
      <ComboboxContent>
        <p v-if="!filtered.length" class="py-3 text-center text-sm text-gray-500 dark:text-gray-400">
          {{ emptyText }}
        </p>
        <ComboboxItem
          v-for="opt in filtered"
          :key="opt.value"
          :value="opt.value"
          :disabled="opt.disabled"
        >
          <span class="flex min-w-0 flex-col">
            <span class="truncate">{{ opt.label }}</span>
            <span v-if="opt.description" class="truncate text-theme-xs font-normal text-gray-400 dark:text-gray-500">
              {{ opt.description }}
            </span>
          </span>
        </ComboboxItem>
        <p
          v-if="filtered.length === maxVisible && options.length > maxVisible"
          class="px-3 pt-1 text-theme-xs text-gray-400 dark:text-gray-500"
        >
          Escribe para ver más resultados
        </p>
      </ComboboxContent>
    </Combobox>
    <p v-if="error" :id="messageId" role="alert" :class="fieldErrorClass">{{ error }}</p>
  </div>
</template>
