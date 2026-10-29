<script setup lang="ts">
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import ExcelIcon from '@shared/presentation/components/ui/ExcelIcon.vue'
import HelpTooltip from '@shared/presentation/components/ui/HelpTooltip.vue'
/**
 * Encabezado de una pestaña de Reportes: título, descripción, controles propios
 * (slot `actions`, p. ej. el período) y exportación a Excel.
 */
defineProps<{
  title: string
  subtitle: string
  icon: string
  exporting?: boolean
  /** Cómo se calcula o qué incluye el reporte («?» junto al título) */
  help?: string
}>()
const emit = defineEmits<{ export: [] }>()
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
    <div class="flex items-center gap-3 min-w-0">
      <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-brand-50 dark:bg-brand-500/12">
        <AppIcon :icon="icon" :size="18" color="var(--color-primary)" />
      </div>
      <div class="min-w-0">
        <h2 class="flex items-center gap-1.5 text-base font-semibold text-gray-800 dark:text-white/90">
          {{ title }}
          <HelpTooltip v-if="help" :title="title" :text="help" width="w-80" align="start" />
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
      <BaseButton variant="outline" size="sm" :loading="exporting" @click="emit('export')">
        <ExcelIcon class="w-4 h-4" />
        Exportar
      </BaseButton>
    </div>
  </div>
</template>
