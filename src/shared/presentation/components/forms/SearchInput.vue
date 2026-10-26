<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { InputGroup, InputGroupAddon } from '../../ui/input-group'
import { SearchIcon } from '../../icons/layout'
/**
 * SearchInput — buscador de TailAdmin (`InputGroup` con icono a la izquierda).
 */
interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
}

// Atributos nativos al <input>; class y style al contenedor.
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<Props>(), {
  placeholder: 'Buscar...',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const attrs = useAttrs()
const wrapperAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  void _class
  void _style
  return rest
})

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <InputGroup v-bind="wrapperAttrs">
    <InputGroupAddon align="inline-start">
      <SearchIcon class="size-5 text-gray-400" />
    </InputGroupAddon>
    <input
      v-bind="inputAttrs"
      data-slot="input-group-control"
      :value="modelValue"
      type="search"
      :placeholder="placeholder"
      :aria-label="placeholder"
      :disabled="disabled"
      class="h-full w-full min-w-0 flex-1 rounded-none border-0 bg-transparent py-2.5 ps-2 pe-4 text-sm font-normal text-gray-800 shadow-none outline-hidden placeholder:text-gray-400 focus:ring-0 disabled:cursor-not-allowed disabled:text-gray-400 dark:bg-transparent dark:text-white/90 dark:placeholder:text-gray-500"
      @input="handleInput"
    />
  </InputGroup>
</template>
