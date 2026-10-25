<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'
import AppIcon from '../ui/AppIcon.vue'
/**
 * FormSelect - Componente select reutilizable con props
 */

interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

interface Props {
  modelValue?: string | number | null
  options: Option[]
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  loading?: boolean
  required?: boolean
  id?: string
}

// Atributos nativos al <select>; class y style al contenedor.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Seleccionar...',
  disabled: false,
  loading: false,
  required: false,
})

const emit = defineEmits(['update:modelValue', 'change'])

const selectId = props.id ?? `select-${useId()}`
const messageId = `${selectId}-message`
const attrs = useAttrs()
const wrapperAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const controlAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  void _class
  void _style
  return rest
})

const selectValue = () => {
  const v = props.modelValue
  if (v === null || v === undefined || v === '') return ''
  return String(v)
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  // Devuelve el valor original de la opción (número si la opción es numérica).
  const option = props.options.find((o) => String(o.value) === target.value)
  const value = target.value === '' ? null : (option?.value ?? target.value)
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <div class="w-full" v-bind="wrapperAttrs">
    <label
      v-if="label"
      :for="selectId"
      class="block text-sm font-medium mb-1"
      :style="{ color: 'var(--color-text-primary)' }"
    >
      {{ label }}
      <span v-if="required" :style="{ color: 'var(--color-error)' }">*</span>
    </label>
    <div class="relative">
      <select
        v-bind="controlAttrs"
        :id="selectId"
        :value="selectValue()"
        :disabled="disabled || loading"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? messageId : undefined"
        class="w-full px-4 py-2.5 rounded-lg border appearance-none pr-10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[var(--color-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
        :style="{
          borderColor: error ? 'var(--color-error)' : 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          colorScheme: 'inherit',
        }"
        @change="handleChange"
      >
        <option value="" disabled>{{ placeholder }}</option>
        <option
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
          :disabled="opt.disabled"
        >
          {{ opt.label }}
        </option>
      </select>
      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <AppIcon
          v-if="loading"
          icon="line-md:loading-loop"
          :size="16"
          color="var(--color-primary)"
        />
        <AppIcon
          v-else
          icon="lucide:chevron-down"
          :size="20"
          color="var(--color-text-muted)"
        />
      </div>
    </div>
    <p v-if="error" :id="messageId" role="alert" class="mt-1 text-sm" :style="{ color: 'var(--color-error)' }">
      {{ error }}
    </p>
  </div>
</template>
