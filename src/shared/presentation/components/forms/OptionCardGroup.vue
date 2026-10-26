<script setup lang="ts">
import { useId } from 'vue'
import type { AcceptableValue } from 'reka-ui'
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group'
import AppIcon from '../ui/AppIcon.vue'
import { fieldErrorClass, fieldLabelClass } from './field-classes'
/**
 * OptionCardGroup — selección única en tarjetas (RadioGroup de TailAdmin con
 * `FieldLabel` en modo tarjeta: borde y fondo de marca al quedar marcado).
 */

export interface OptionCard {
  value: string
  label: string
  description?: string
  /** Icono Iconify (ej. lucide:user) */
  icon?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    options: OptionCard[]
    label?: string
    error?: string
    disabled?: boolean
    /** Columnas desde `sm` (1–4) */
    columns?: 1 | 2 | 3 | 4
  }>(),
  {
    modelValue: undefined,
    label: undefined,
    error: undefined,
    disabled: false,
    columns: 2,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const baseId = `option-card-${useId()}`

const columnClass = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

function onUpdate(value: AcceptableValue) {
  const next = String(value)
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<template>
  <div role="group" data-slot="field" class="flex w-full flex-col gap-2">
    <span v-if="label" :class="fieldLabelClass">{{ label }}</span>
    <RadioGroup
      :model-value="props.modelValue ?? undefined"
      :disabled="disabled"
      class="grid grid-cols-1 gap-3"
      :class="columnClass[columns]"
      @update:model-value="onUpdate"
    >
      <label
        v-for="opt in options"
        :key="opt.value"
        :for="`${baseId}-${opt.value}`"
        class="group/option flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 has-data-checked:border-brand-500 has-data-checked:bg-brand-500/5 has-data-disabled:cursor-not-allowed has-data-disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:has-data-checked:border-brand-500 dark:has-data-checked:bg-brand-500/10"
      >
        <RadioGroupItem
          :id="`${baseId}-${opt.value}`"
          :value="opt.value"
          :disabled="opt.disabled"
          class="mt-0.5"
        />
        <AppIcon
          v-if="opt.icon"
          :icon="opt.icon"
          class="size-6 shrink-0 text-gray-500 group-has-data-checked/option:text-brand-500 dark:text-gray-400 dark:group-has-data-checked/option:text-brand-400"
        />
        <span class="flex min-w-0 flex-col gap-0.5">
          <span class="text-sm font-medium text-gray-800 dark:text-white/90">{{ opt.label }}</span>
          <span v-if="opt.description" class="text-xs text-gray-500 dark:text-gray-400">
            {{ opt.description }}
          </span>
        </span>
      </label>
    </RadioGroup>
    <p v-if="error" role="alert" :class="fieldErrorClass">{{ error }}</p>
  </div>
</template>
