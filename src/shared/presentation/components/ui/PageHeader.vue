<script setup lang="ts">
import IconButton from './IconButton.vue'
/**
 * PageHeader — encabezado de página de TailAdmin (`PageBreadcrumb`):
 * título a la izquierda y acciones a la derecha.
 *
 * - `back`: muestra el botón «Volver» (emite `back`).
 * - `eyebrow`: texto pequeño sobre el título.
 * - Slots: `#badges` (junto al título), `#subtitle` (subtítulo enriquecido), `#actions`.
 * `icon`/`iconColor`/`large` se mantienen por compatibilidad; la plantilla no muestra icono.
 */
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    eyebrow?: string
    back?: boolean
    /** Nombre de icono (ej. lucide:users). No se muestra en el diseño TailAdmin. */
    icon?: string
    iconColor?: string
    /** Sin efecto en TailAdmin; se conserva por compatibilidad. */
    large?: boolean
  }>(),
  {
    subtitle: undefined,
    eyebrow: undefined,
    back: false,
    icon: undefined,
    iconColor: undefined,
    large: false,
  },
)

const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex min-w-0 flex-1 items-start gap-3">
      <IconButton
        v-if="back"
        icon="lucide:arrow-left"
        label="Volver"
        variant="outline"
        class="mt-0.5 shrink-0"
        @click="emit('back')"
      />
      <div class="min-w-0">
        <p v-if="eyebrow" class="text-theme-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
          {{ eyebrow }}
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">
            {{ title }}
          </h2>
          <slot name="badges" />
        </div>
        <p
          v-if="subtitle || $slots.subtitle"
          class="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          <slot name="subtitle">{{ subtitle }}</slot>
        </p>
      </div>
    </div>
    <div v-if="$slots.actions" class="flex w-full flex-wrap items-center gap-3 sm:w-auto">
      <slot name="actions" />
    </div>
  </div>
</template>
