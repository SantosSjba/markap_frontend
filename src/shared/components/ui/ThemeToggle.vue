<script setup lang="ts">
import { useTheme } from '@shared/composables'
import AppIcon from '@shared/components/ui/AppIcon.vue'

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
    <AppIcon v-if="isDark" icon="lucide:sun" :size="20" color="currentColor" />
    <AppIcon v-else icon="lucide:moon" :size="20" color="currentColor" />
  </button>
</template>
