<script setup lang="ts">
import { ref, useSlots, useAttrs, computed, useId } from 'vue'
import { EyeCloseIcon, EyeIcon } from '../../icons/layout'
import { cn } from '../../utils/cn'
import { fieldErrorClass, fieldHintClass, fieldLabelClass, inputClass } from './field-classes'
/**
 * FormInput — `Field` + `Input` de TailAdmin: único input de texto/número/fecha del design system.
 */

interface Props {
  /** VeeValidate / bindings pueden enviar undefined hasta el primer input */
  modelValue?: string | number | null
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time' | 'datetime-local'
  placeholder?: string
  label?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  id?: string
  /** Clases extra en el input nativo (ej. tipografía centrada) */
  inputClass?: string
  maxlength?: number | string
  inputmode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  /** Mostrar ojito para ver/ocultar (solo type="password"). Por defecto true. */
  showPasswordToggle?: boolean
  /** `sm`: compacto (h-9); `xs`: celda de hoja (h-8). El tamaño normal queda como predeterminado. */
  size?: 'xs' | 'sm' | 'default'
  /** Celda de hoja: conserva edición, accesibilidad y eventos del input compartido. */
  variant?: 'default' | 'cell'
}

// Atributos nativos (min, step, max, autocomplete, readonly, name…) van al <input>;
// class y style se quedan en el contenedor.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  required: false,
  inputClass: '',
  showPasswordToggle: true,
  size: 'default',
  variant: 'default',
})

const slots = useSlots()
const attrs = useAttrs()
const wrapperAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  void _class
  void _style
  return rest
})
const passwordVisible = ref(false)

const hasPasswordToggle = computed(() => props.type === 'password' && props.showPasswordToggle)
const hasSuffixSlot = computed(() => Boolean(slots.suffix))
const hasRightAdornment = computed(() => hasSuffixSlot.value || hasPasswordToggle.value)

const inputType = computed(() => {
  if (hasPasswordToggle.value) {
    return passwordVisible.value ? 'text' : 'password'
  }
  return props.type
})

function togglePasswordVisible() {
  passwordVisible.value = !passwordVisible.value
}

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

const inputId = props.id ?? `input-${useId()}`
const messageId = `${inputId}-message`

/**
 * Texto que el usuario está escribiendo en un campo numérico: permite dejarlo
 * vacío mientras edita sin que salte a 0 (el modelo sigue recibiendo un número).
 */
const editingText = ref<string | null>(null)

const displayValue = () => {
  if (props.type === 'number' && editingText.value !== null) return editingText.value
  const v = props.modelValue
  if (v === null || v === undefined) return ''
  return String(v)
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const val = target.value
  if (props.type === 'number') {
    editingText.value = val
    emit('update:modelValue', Number(val) || 0)
    return
  }
  emit('update:modelValue', val)
}

const controlClass = computed(() =>
  cn(
    inputClass,
    props.size === 'sm' && 'h-9 rounded-lg py-2 ps-3 pe-3',
    props.size === 'xs' && 'h-8 rounded-md py-1 ps-2 pe-2',
    props.variant === 'cell' && 'border-transparent bg-transparent shadow-none hover:border-gray-200 focus:bg-white focus-visible:bg-white dark:border-transparent dark:bg-transparent dark:hover:border-gray-700 dark:focus:bg-gray-900 dark:focus-visible:bg-gray-900',
    hasRightAdornment.value && 'pe-12',
    props.inputClass,
  ),
)

const handleBlur = (event: FocusEvent) => {
  editingText.value = null
  emit('blur', event)
}
</script>

<template>
  <div role="group" data-slot="field" :class="['flex w-full min-w-0 flex-col', size === 'default' ? 'gap-2' : 'gap-1']" v-bind="wrapperAttrs">
    <label v-if="label" :for="inputId" :class="[fieldLabelClass, size !== 'default' && 'text-theme-xs text-gray-500 dark:text-gray-400']">
      {{ label }}
      <span v-if="required" class="text-error-500">*</span>
    </label>
    <div class="relative w-full">
      <input
        v-bind="inputAttrs"
        :id="inputId"
        data-slot="input"
        :type="inputType"
        :value="displayValue()"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :maxlength="maxlength"
        :inputmode="inputmode"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error || hint ? messageId : undefined"
        :class="controlClass"
        @input="handleInput"
        @blur="handleBlur"
        @focus="emit('focus', $event)"
      />
      <div
        v-if="hasRightAdornment"
        class="pointer-events-none absolute inset-y-0 end-0 flex items-center gap-1 pe-3.5 text-gray-500 dark:text-gray-400 [&_button]:pointer-events-auto"
      >
        <button
          v-if="hasPasswordToggle"
          type="button"
          class="flex size-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          :aria-label="passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          :disabled="disabled"
          tabindex="-1"
          @click="togglePasswordVisible"
        >
          <EyeIcon v-if="passwordVisible" class="size-5" />
          <EyeCloseIcon v-else class="size-5" />
        </button>
        <slot v-if="hasSuffixSlot" name="suffix" />
      </div>
    </div>
    <p v-if="error" :id="messageId" role="alert" :class="fieldErrorClass">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="messageId" :class="fieldHintClass">
      {{ hint }}
    </p>
  </div>
</template>
