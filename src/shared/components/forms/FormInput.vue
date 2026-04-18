<script setup lang="ts">
import { useSlots, computed } from 'vue'

/**
 * FormInput — único input de formulario de texto/número/fecha del design system.
 * (Reemplaza el antiguo BaseInput, eliminado por duplicar esta misma funcionalidad.)
 */

interface Props {
  /** VeeValidate / bindings pueden enviar undefined hasta el primer input */
  modelValue?: string | number | null
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date'
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
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  required: false,
  inputClass: '',
})

const slots = useSlots()
const hasSuffix = computed(() => Boolean(slots.suffix))

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

const inputId = props.id ?? `input-${Math.random().toString(36).slice(2, 11)}`

const displayValue = () => {
  const v = props.modelValue
  if (v === null || v === undefined) return ''
  return String(v)
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const val = target.value
  emit('update:modelValue', props.type === 'number' ? Number(val) || 0 : val as string | number)
}
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium mb-1"
      :style="{ color: 'var(--color-text-primary)' }"
    >
      {{ label }}
      <span v-if="required" :style="{ color: 'var(--color-error)' }">*</span>
    </label>
    <div class="relative w-full">
      <input
        :id="inputId"
        :type="type"
        :value="displayValue()"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :maxlength="maxlength"
        :inputmode="inputmode"
        class="w-full px-4 py-2.5 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[var(--color-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
        :class="[hasSuffix ? 'pr-12' : '', props.inputClass]"
        :style="{
          borderColor: error ? 'var(--color-error)' : 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          colorScheme: 'inherit',
        }"
        @input="handleInput"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
      />
      <div
        v-if="hasSuffix"
        class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none [&_button]:pointer-events-auto"
      >
        <slot name="suffix" />
      </div>
    </div>
    <p v-if="error" class="mt-1 text-sm" :style="{ color: 'var(--color-error)' }">
      {{ error }}
    </p>
    <p v-else-if="hint" class="mt-1 text-sm" :style="{ color: 'var(--color-text-muted)' }">
      {{ hint }}
    </p>
  </div>
</template>
