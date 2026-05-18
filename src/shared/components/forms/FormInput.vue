<script setup lang="ts">
import { ref, useSlots, computed } from 'vue'
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

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  required: false,
  inputClass: '',
  showPasswordToggle: true,
})

const slots = useSlots()
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
        :type="inputType"
        :value="displayValue()"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :maxlength="maxlength"
        :inputmode="inputmode"
        class="w-full px-4 py-2.5 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[var(--color-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
        :class="[hasRightAdornment ? 'pr-12' : '', props.inputClass]"
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
    <p v-if="error" class="mt-1 text-sm" :style="{ color: 'var(--color-error)' }">
      {{ error }}
    </p>
    <p v-else-if="hint" class="mt-1 text-sm" :style="{ color: 'var(--color-text-muted)' }">
      {{ hint }}
    </p>
  </div>
</template>
