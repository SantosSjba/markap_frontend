<script lang="ts">
export interface HelpTooltipItem {
  /** Término que se explica (ej. «Costo real») */
  term: string
  text: string
  /** Icono Iconify opcional delante del término */
  icon?: string
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { PopoverArrow, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import AppIcon from './AppIcon.vue'
/**
 * HelpTooltip — ícono «?» que explica algo al pasar el puntero, al enfocarlo con el teclado o al
 * tocarlo (móvil). Acepta un texto corto, una lista de términos o contenido libre en el slot.
 * Reemplaza los párrafos de ayuda que ocupan espacio fijo en la pantalla.
 */

const props = withDefaults(
  defineProps<{
    title?: string
    text?: string
    items?: HelpTooltipItem[]
    /** Texto accesible del botón */
    label?: string
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
    size?: number
    /** Ancho del globo (clase Tailwind) */
    width?: string
  }>(),
  {
    title: undefined,
    text: undefined,
    items: () => [],
    label: 'Más información',
    side: 'bottom',
    align: 'center',
    size: 15,
    width: 'w-80',
  },
)

const open = ref(false)
let pinned = false
let closeTimer: ReturnType<typeof setTimeout> | undefined

function show() {
  clearTimeout(closeTimer)
  open.value = true
}
/** Pequeña espera para poder llevar el puntero del ícono al globo sin que se cierre */
function hideSoon() {
  clearTimeout(closeTimer)
  if (pinned) return
  closeTimer = setTimeout(() => (open.value = false), 120)
}
function togglePinned() {
  clearTimeout(closeTimer)
  // Un clic fija la ayuda ya abierta por hover/foco; otro clic la cierra.
  // Se maneja en captura para evitar que el trigger la alterne una segunda vez.
  pinned = !pinned
  open.value = pinned
}
watch(open, (value) => {
  if (!value) pinned = false
})
onBeforeUnmount(() => clearTimeout(closeTimer))
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger
      type="button"
      :aria-label="props.title ?? label"
      class="inline-flex shrink-0 cursor-help items-center justify-center rounded-full align-middle text-gray-400 outline-none transition-colors hover:text-brand-500 focus-visible:text-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:text-gray-500 dark:hover:text-brand-400"
      @pointerenter="(e: PointerEvent) => e.pointerType === 'mouse' && show()"
      @pointerleave="(e: PointerEvent) => e.pointerType === 'mouse' && hideSoon()"
      @click.capture.stop="togglePinned"
      @focus="show"
      @blur="hideSoon"
    >
      <AppIcon icon="lucide:circle-help" :size="size" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :side="side"
        :align="align"
        :side-offset="6"
        :collision-padding="12"
        :class="[
          'z-99999 max-h-[var(--reka-popover-content-available-height)] max-w-[calc(100vw-24px)] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white p-4 text-left shadow-theme-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 dark:border-gray-800 dark:bg-[#1E2635]',
          width,
        ]"
        @pointerenter="show"
        @pointerleave="hideSoon"
        @open-auto-focus.prevent
      >
        <p v-if="title" class="mb-1.5 text-sm font-semibold text-gray-800 dark:text-white/90">{{ title }}</p>
        <p v-if="text" class="text-theme-xs leading-relaxed text-gray-500 dark:text-gray-400">{{ text }}</p>
        <dl v-if="items.length" :class="['space-y-2', (title || text) && 'mt-3']">
          <div v-for="item in items" :key="item.term" class="flex gap-2">
            <AppIcon v-if="item.icon" :icon="item.icon" :size="14" class="mt-0.5 shrink-0 text-brand-500" />
            <div class="min-w-0">
              <dt class="text-theme-xs font-semibold text-gray-700 dark:text-gray-200">{{ item.term }}</dt>
              <dd class="text-theme-xs leading-relaxed text-gray-500 dark:text-gray-400">{{ item.text }}</dd>
            </div>
          </div>
        </dl>
        <slot />
        <PopoverArrow class="fill-white stroke-gray-200 dark:fill-[#1E2635] dark:stroke-gray-800" :width="12" :height="6" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
