<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import AppIcon from './AppIcon.vue'
/**
 * ActionCard — tarjeta clicable de acción rápida (icono de marca, título y descripción)
 * con los tokens de tarjeta de TailAdmin. `stacked` centra el icono sobre el texto.
 */

withDefaults(
  defineProps<{
    title: string
    description?: string
    /** Icono Iconify (ej. lucide:plus) */
    icon?: string
    layout?: 'row' | 'stacked'
    /** Navegación interna: se renderiza como `RouterLink` */
    to?: RouteLocationRaw
  }>(),
  {
    description: undefined,
    icon: undefined,
    layout: 'row',
    to: undefined,
  },
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    :type="to ? undefined : 'button'"
    class="group flex w-full rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-gray-50 focus-visible:ring-3 focus-visible:ring-brand-500/20 focus-visible:outline-hidden dark:border-gray-800 dark:bg-white/3 dark:hover:border-brand-800 dark:hover:bg-white/5"
    :class="layout === 'stacked' ? 'flex-col items-center gap-3 text-center' : 'items-start gap-3 text-start'"
    @click="emit('click', $event)"
  >
    <span
      v-if="icon"
      class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/12 dark:text-brand-400"
    >
      <AppIcon :icon="icon" class="size-5" />
    </span>
    <span class="flex min-w-0 flex-col gap-0.5">
      <span class="text-sm font-medium text-gray-800 dark:text-white/90">{{ title }}</span>
      <span v-if="description" class="text-xs text-gray-500 dark:text-gray-400">
        {{ description }}
      </span>
    </span>
  </component>
</template>
