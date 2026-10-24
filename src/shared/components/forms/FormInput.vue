<script setup lang="ts">
import { ref, useSlots, useAttrs, computed, useId } from 'vue'
import AppIcon from '@shared/components/ui/AppIcon.vue'

/**
 * FormInput — único input de formulario de texto/número/fecha del design system.
 * (Reemplaza el antiguo BaseInput, eliminado por duplicar esta misma funcionalidad.)
 */

interface Props {
  /** VeeValidate / bindings pueden enviar undefined hasta el primer input */
  modelValue?: string | number | null
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'datetime-local'
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

const hasPasswordToggle = computed(
  () => props.type === 'password' && props.showPasswordToggle,
)
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

const handleBlur = (event: FocusEvent) => {
  editingText.value = null
  emit('blur', event)
}
</script>

<template>
  <div class="w-full" v-bind="wrapperAttrs">
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
        v-bind="inputAttrs"
        :id="inputId"
        :type="inputType"
        :value="displayValue()"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :maxlength="maxlength"
        :inputmode="inputmode"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error || hint ? messageId : undefined"
        class="w-full px-4 py-2.5 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[var(--color-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
        :class="[hasRightAdornment ? 'pr-12' : '', props.inputClass]"
        :style="{
          borderColor: error ? 'var(--color-error)' : 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          colorScheme: 'inherit',
        }"
        @input="handleInput"
        @blur="handleBlur"
        @focus="emit('focus', $event)"
      />
      <div
        v-if="hasRightAdornment"
        class="absolute inset-y-0 right-0 flex items-center gap-1 pr-3 pointer-events-none [&_button]:pointer-events-auto"
      >
        <button
          v-if="hasPasswordToggle"
          type="button"
          class="p-0.5 rounded transition-colors hover:opacity-80"
          style="color: var(--color-text-muted)"
          :aria-label="passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          :disabled="disabled"
          tabindex="-1"
          @click="togglePasswordVisible"
        >
          <AppIcon
            :icon="passwordVisible ? 'lucide:eye-off' : 'lucide:eye'"
            :size="20"
            color="currentColor"
          />
        </button>
        <slot v-if="hasSuffixSlot" name="suffix" />
      </div>
    </div>
    <p v-if="error" :id="messageId" role="alert" class="mt-1 text-sm" :style="{ color: 'var(--color-error)' }">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="messageId" class="mt-1 text-sm" :style="{ color: 'var(--color-text-muted)' }">
      {{ hint }}
    </p>
  </div>
</template>
