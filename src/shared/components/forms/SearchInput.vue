<script setup lang="ts">
import AppIcon from '@shared/components/ui/AppIcon.vue'

/**
 * SearchInput - Input de búsqueda reutilizable con icono que no se superpone al texto
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
      class="w-full py-2.5 pl-11 pr-4 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed"
      :style="{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
      }"
      @input="handleInput"
    />
  </div>
</template>
