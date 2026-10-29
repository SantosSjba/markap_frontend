<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'
import type { AcceptableValue } from 'reka-ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { LoaderCircleIcon } from '../../icons/layout'
import { fieldErrorClass, fieldLabelClass } from './field-classes'
/**
 * FormSelect — `Field` + `Select` de TailAdmin (Reka UI) con la API de opciones de Markap.
 * Una opción con valor '' se puede elegir y emite `null`, como el select nativo anterior.
 */

interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

interface Props {
  modelValue?: string | number | null
  options: Option[]
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  loading?: boolean
  required?: boolean
  id?: string
  /** `sm`: compacto (h-9); `xs`: celda de hoja (h-8). El tamaño normal queda como predeterminado. */
  size?: 'xs' | 'sm' | 'default'
  variant?: 'default' | 'cell'
}

// Atributos nativos al disparador; class y style al contenedor.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Seleccionar...',
  disabled: false,
  loading: false,
  required: false,
  size: 'default',
  variant: 'default',
})

const emit = defineEmits(['update:modelValue', 'change'])

/** Reka no admite '' como valor de un item. */
const EMPTY_VALUE = '__markap_empty__'

const selectId = props.id ?? `select-${useId()}`
const messageId = `${selectId}-message`
const attrs = useAttrs()
const wrapperAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const controlAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  void _class
  void _style
  return rest
})

const toItemValue = (value: string | number) => (value === '' ? EMPTY_VALUE : value)

const selectValue = computed<AcceptableValue | undefined>(() => {
  const v = props.modelValue
  if (v === null || v === undefined || v === '') {
    return props.options.some((o) => o.value === '') ? EMPTY_VALUE : undefined
  }
  const option = props.options.find((o) => String(o.value) === String(v))
  return option ? toItemValue(option.value) : v
})

const handleChange = (value: AcceptableValue) => {
  const next = value === EMPTY_VALUE || value === undefined ? null : value
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<template>
  <div role="group" data-slot="field" :class="['flex w-full min-w-0 flex-col', size === 'default' ? 'gap-2' : 'gap-1']" v-bind="wrapperAttrs">
    <label v-if="label" :for="selectId" :class="[fieldLabelClass, size !== 'default' && 'text-theme-xs text-gray-500 dark:text-gray-400']">
      {{ label }}
      <span v-if="required" class="text-error-500">*</span>
    </label>
    <Select
      :model-value="selectValue"
      :disabled="disabled || loading"
      :required="required"
      @update:model-value="handleChange"
    >
      <SelectTrigger
        v-bind="controlAttrs"
        :id="selectId"
        :size="size"
        :class="variant === 'cell' ? 'border-transparent bg-transparent shadow-none hover:border-gray-200 hover:bg-transparent dark:border-transparent dark:bg-transparent dark:hover:border-gray-700 dark:hover:bg-transparent' : undefined"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? messageId : undefined"
      >
        <SelectValue :placeholder="placeholder" class="min-w-0" />
        <LoaderCircleIcon v-if="loading" class="ms-auto size-4 animate-spin text-brand-500" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="opt in options"
          :key="String(opt.value)"
          :value="toItemValue(opt.value)"
          :disabled="opt.disabled"
        >
          {{ opt.label }}
        </SelectItem>
      </SelectContent>
    </Select>
    <p v-if="error" :id="messageId" role="alert" :class="fieldErrorClass">
      {{ error }}
    </p>
  </div>
</template>
