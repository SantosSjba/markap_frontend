<script setup lang="ts">
import HelpTooltip, { type HelpTooltipItem } from './HelpTooltip.vue'
/**
 * SectionIntro — encabezado corto de una sección o pestaña: título, «?» con la explicación
 * completa (HelpTooltip) y una línea que dice para qué sirve. El slot `actions` va a la derecha.
 * Así la ayuda no ocupa espacio fijo y todas las pestañas se presentan igual.
 */

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    helpTitle?: string
    help?: HelpTooltipItem[]
    helpText?: string
  }>(),
  { subtitle: undefined, helpTitle: undefined, help: () => [], helpText: undefined },
)
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="min-w-0">
      <h3 class="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-white/90">
        {{ title }}
        <HelpTooltip
          v-if="help.length || helpText"
          :title="helpTitle ?? `¿Qué es «${title}»?`"
          :items="help"
          :text="helpText"
          width="w-96"
          align="start"
        />
      </h3>
      <p v-if="subtitle" class="text-theme-xs text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
