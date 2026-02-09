<script setup lang="ts">
/**
 * FormInput - Componente de input reutilizable con props
 */

interface Props {
  modelValue: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  label?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'blur', event: FocusEvent): void
  (e: 'focus', event: FocusEvent): void
}>()

const inputId = props.id ?? `input-${Math.random().toString(36).slice(2, 11)}`

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const val = target.value
  emit('update:modelValue', props.type === 'number' ? Number(val) || 0 : val)
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
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      class="w-full px-4 py-2.5 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed"
      :style="{
        borderColor: error ? 'var(--color-error)' : 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
      }"
      @input="handleInput"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
    />
    <p v-if="error" class="mt-1 text-sm" :style="{ color: 'var(--color-error)' }">
      {{ error }}
    </p>
    <p v-else-if="hint" class="mt-1 text-sm" :style="{ color: 'var(--color-text-muted)' }">
      {{ hint }}
    </p>
  </div>
</template>
