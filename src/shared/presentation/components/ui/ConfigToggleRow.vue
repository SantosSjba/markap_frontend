<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  title: string
  description?: string
  disabled?: boolean
  noBorder?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function toggle() {
  if (!props.disabled) emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <div
    class="flex items-center justify-between px-5 py-4 border-t"
    :style="{ borderColor: noBorder ? 'transparent' : 'var(--color-border)' }"
  >
    <div class="pr-8">
      <p
        class="text-sm font-medium"
        :style="{ color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }"
      >{{ title }}</p>
      <p v-if="description" class="text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">
        {{ description }}
      </p>
    </div>
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
      :style="{ backgroundColor: modelValue ? 'var(--color-primary)' : 'var(--color-border)' }"
      @click="toggle"
    >
      <span
        class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
        :style="{ transform: modelValue ? 'translateX(20px)' : 'translateX(0)' }"
      />
    </button>
  </div>
</template>
