<script setup lang="ts">
/**
 * FormCheckbox Component
 * Reusable checkbox component
 */

interface Props {
  modelValue: boolean
  label?: string
  description?: string
  disabled?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [value: boolean]
}>()

const inputId = props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
  emit('change', target.checked)
}
</script>

<template>
  <div class="flex items-start">
    <div class="flex items-center h-5">
      <input
        :id="inputId"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        class="w-4 h-4 rounded border focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-[var(--color-primary)]"
        style="accent-color: var(--color-primary); border-color: var(--color-border);"
        @change="handleChange"
      />
    </div>

    <div v-if="label || description" class="ml-3">
      <label
        :for="inputId"
        class="text-sm font-medium"
        :style="{
          color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }"
      >
        {{ label }}
      </label>
      <p v-if="description" class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
        {{ description }}
      </p>
    </div>
  </div>
</template>
