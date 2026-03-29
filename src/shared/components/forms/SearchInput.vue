<script setup lang="ts">
import AppIcon from '@shared/components/ui/AppIcon.vue'

/**
 * SearchInput - Input de búsqueda con icono a la izquierda.
 * El padding izquierdo va en :style (inline) para imponerse a main.css input[type="search"].
 */
interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  placeholder: 'Buscar...',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="relative w-full">
    <AppIcon
      icon="lucide:search"
      :size="20"
      color="var(--color-text-muted)"
      class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0"
      aria-hidden="true"
    />
    <input
      :value="modelValue"
      type="search"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[var(--color-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
      :style="{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
        colorScheme: 'inherit',
        paddingTop: '0.625rem',
        paddingBottom: '0.625rem',
        paddingRight: '1rem',
        paddingLeft: '2.75rem',
      }"
      @input="handleInput"
    />
  </div>
</template>
