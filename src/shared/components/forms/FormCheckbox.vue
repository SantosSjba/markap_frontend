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
        class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
        @change="handleChange"
      />
    </div>

    <div v-if="label || description" class="ml-3">
      <label
        :for="inputId"
        :class="[
          'text-sm font-medium',
          disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer',
        ]"
      >
        {{ label }}
      </label>
      <p v-if="description" class="text-sm text-gray-500">
        {{ description }}
      </p>
    </div>
  </div>
</template>
