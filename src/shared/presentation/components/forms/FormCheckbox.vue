<script setup lang="ts">
import { useId } from 'vue'
import { Checkbox } from '../../ui/checkbox'
/**
 * FormCheckbox — `Checkbox` de TailAdmin con etiqueta y descripción.
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

const inputId = props.id || `checkbox-${useId()}`

const handleChange = (value: boolean | 'indeterminate') => {
  const checked = value === true
  emit('update:modelValue', checked)
  emit('change', checked)
}
</script>

<template>
  <div class="flex items-start gap-3">
    <Checkbox
      :id="inputId"
      :model-value="modelValue"
      :disabled="disabled"
      class="mt-0.5"
      @update:model-value="handleChange"
    />

    <div v-if="label || description" class="flex flex-col gap-0.5">
      <label
        :for="inputId"
        class="text-sm font-medium"
        :class="
          disabled
            ? 'cursor-not-allowed text-gray-400 dark:text-gray-500'
            : 'cursor-pointer text-gray-700 dark:text-gray-300'
        "
      >
        {{ label }}
      </label>
      <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400">
        {{ description }}
      </p>
    </div>
  </div>
</template>
