<script setup lang="ts">
import { Button } from '../../ui/button'
import { useTheme } from '../../composables/useTheme'
import { MoonIcon, SunIcon } from '../../icons/layout'
/**
 * ThemeToggle — botón de tema de TailAdmin.
 * `default`: botón outline del header. `floating`: botón redondo de las pantallas de acceso.
 */

interface Props {
  variant?: 'default' | 'floating'
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const { isDarkMode, toggleTheme } = useTheme()
</script>

<template>
  <Button
    v-if="variant === 'floating'"
    class="size-14 rounded-full"
    :aria-label="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    @click="toggleTheme"
  >
    <MoonIcon class="block dark:hidden" />
    <SunIcon class="hidden dark:block" />
  </Button>
  <Button
    v-else
    variant="outline"
    size="icon-lg"
    class="relative"
    :aria-label="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    @click="toggleTheme"
  >
    <SunIcon v-if="isDarkMode" />
    <MoonIcon v-else />
  </Button>
</template>
