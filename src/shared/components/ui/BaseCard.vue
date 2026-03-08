<script setup lang="ts">
/**
 * BaseCard Component
 * Reusable card container component
 */

interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  border?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
  shadow: 'sm',
  rounded: 'lg',
  border: true,
})

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const shadowClasses = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
}

const roundedClasses = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
}
</script>

<template>
  <div
    :class="[
      paddingClasses[props.padding],
      shadowClasses[props.shadow],
      roundedClasses[props.rounded],
    ]"
    :style="{
      backgroundColor: 'var(--color-surface)',
      border: props.border ? '1px solid var(--color-border)' : 'none',
    }"
  >
    <!-- Header -->
    <div
      v-if="$slots.header"
      class="pb-4 mb-4"
      :style="{ borderBottom: '1px solid var(--color-border)' }"
    >
      <slot name="header" />
    </div>

    <!-- Content -->
    <slot />

    <!-- Footer -->
    <div
      v-if="$slots.footer"
      class="pt-4 mt-4"
      :style="{ borderTop: '1px solid var(--color-border)' }"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
