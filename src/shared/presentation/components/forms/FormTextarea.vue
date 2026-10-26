<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'
import { fieldErrorClass, fieldHintClass, fieldLabelClass, textareaClass } from './field-classes'
/**
 * FormTextarea — `Field` + `Textarea` de TailAdmin.
 */

interface Props {
  /** VeeValidate / bindings pueden enviar undefined hasta el primer input */
  modelValue?: string | null
  placeholder?: string
  label?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  rows?: number
  id?: string
}

// Atributos nativos (maxlength, readonly…) al <textarea>; class y style al contenedor.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false,
  required: false,
  rows: 4,
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

const textareaId = props.id ?? `textarea-${useId()}`
const messageId = `${textareaId}-message`
const attrs = useAttrs()
const wrapperAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const controlAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  void _class
  void _style
  return rest
})

const displayValue = () => {
  const v = props.modelValue
  if (v === null || v === undefined) return ''
  return String(v)
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div role="group" data-slot="field" class="flex w-full flex-col gap-2" v-bind="wrapperAttrs">
    <label v-if="label" :for="textareaId" :class="fieldLabelClass">
      {{ label }}
      <span v-if="required" class="text-error-500">*</span>
    </label>
    <textarea
      v-bind="controlAttrs"
      :id="textareaId"
      data-slot="textarea"
      :value="displayValue()"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :rows="rows"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error || hint ? messageId : undefined"
      :class="textareaClass"
      class="resize-none"
      @input="handleInput"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
    />
    <p v-if="error" :id="messageId" role="alert" :class="fieldErrorClass">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="messageId" :class="fieldHintClass">
      {{ hint }}
    </p>
  </div>
</template>
