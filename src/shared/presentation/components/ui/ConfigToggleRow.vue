<script setup lang="ts">
import { useId } from 'vue'
import { Switch } from '../../ui/switch'
/**
 * ConfigToggleRow — fila de ajuste con el `Switch` de TailAdmin.
 */
const props = defineProps<{
  modelValue: boolean
  title: string
  description?: string
  disabled?: boolean
  noBorder?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const switchId = `config-toggle-${useId()}`

function onUpdate(value: boolean) {
  if (!props.disabled) emit('update:modelValue', value)
}
</script>

<template>
  <div
    class="flex items-center justify-between gap-6 px-5 py-4"
    :class="noBorder ? undefined : 'border-t border-gray-100 dark:border-gray-800'"
  >
    <label :for="switchId" class="min-w-0" :class="disabled ? 'cursor-not-allowed' : 'cursor-pointer'">
      <span
        class="block text-sm font-medium"
        :class="disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-white/90'"
      >{{ title }}</span>
      <span v-if="description" class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
        {{ description }}
      </span>
    </label>
    <Switch
      :id="switchId"
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="onUpdate"
    />
  </div>
</template>
