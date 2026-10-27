<script setup lang="ts">
import AppIcon from '../ui/AppIcon.vue'
/**
 * FormSectionCard — `ComponentCard` de TailAdmin: cabecera con título y descripción,
 * cuerpo separado por borde. El `icon` solo se dibuja con `showIcon` (fichas de detalle);
 * en formularios se mantiene el diseño TailAdmin sin icono.
 */
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** Nombre de icono (ej. lucide:map-pin). Solo se muestra con `showIcon`. */
    icon?: string
    showIcon?: boolean
    iconColor?: string
    /** Sin efecto visual: TailAdmin usa un único tamaño de tarjeta. Se conserva por compatibilidad. */
    dense?: boolean
  }>(),
  {
    subtitle: undefined,
    icon: undefined,
    iconColor: undefined,
    showIcon: false,
    dense: false,
  },
)
</script>

<template>
  <section
    class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3"
  >
    <div class="flex items-start justify-between gap-3 px-6 py-5">
      <div
        v-if="showIcon && icon"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10"
      >
        <AppIcon :icon="icon" :size="20" :color="iconColor ?? 'var(--color-primary)'" />
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="text-base font-medium text-gray-800 dark:text-white/90">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ subtitle }}
        </p>
      </div>
      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" />
      </div>
    </div>
    <div class="border-t border-gray-100 p-4 sm:p-6 dark:border-gray-800">
      <slot />
    </div>
  </section>
</template>
