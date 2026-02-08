<script setup lang="ts">
import { useTheme } from '@shared/composables'

/**
 * ThemeToggle Component
 * Button to switch between light and dark mode
 */

interface Props {
  /** Use light color for dark backgrounds (e.g. login gradient) */
  variant?: 'default' | 'light'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    :class="[
      'p-2.5 rounded-lg transition-all duration-200 border-2',
      variant === 'light'
        ? 'border-white/40 hover:bg-white/20 hover:border-white/60 text-white'
        : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-hover)]',
    ]"
    :style="variant === 'default' ? { color: 'var(--color-text-secondary)' } : {}"
    @click="toggleTheme"
  >
    <!-- Sun icon (show when dark - click to go light) -->
    <svg
      v-if="isDark"
      class="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
    <!-- Moon icon (show when light - click to go dark) -->
    <svg
      v-else
      class="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  </button>
</template>
