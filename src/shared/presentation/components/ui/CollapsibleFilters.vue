<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseButton from './BaseButton.vue'
/**
 * CollapsibleFilters — botón «Filtros» (con el número de filtros activos) que muestra u oculta
 * un panel con los filtros del listado. Pensado para el slot #toolbar de DataTable:
 * renderiza el botón en la fila del buscador y el panel debajo a todo el ancho.
 * Cerrado por defecto; con `storageKey` recuerda si el usuario lo dejó abierto.
 */

const props = withDefaults(
  defineProps<{
    /** Filtros con valor distinto al predeterminado */
    activeCount?: number
    storageKey?: string
  }>(),
  { activeCount: 0, storageKey: undefined },
)

const emit = defineEmits<{ clear: [] }>()

function readOpen(): boolean {
  if (!props.storageKey) return false
  try {
    return localStorage.getItem(props.storageKey) === '1'
  } catch {
    return false
  }
}

const open = ref(readOpen())
watch(open, (value) => {
  if (!props.storageKey) return
  try {
    localStorage.setItem(props.storageKey, value ? '1' : '0')
  } catch {
    /* almacenamiento no disponible: la preferencia dura la sesión */
  }
})
</script>

<template>
  <BaseButton
    type="button"
    variant="outline"
    icon="lucide:sliders-horizontal"
    class="shrink-0"
    :aria-expanded="open"
    @click="open = !open"
  >
    Filtros
    <span
      v-if="activeCount > 0"
      class="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-theme-xs font-semibold text-white"
    >
      {{ activeCount }}
    </span>
  </BaseButton>

  <div v-if="open" class="basis-full w-full rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/2">
    <slot />
    <div v-if="activeCount > 0" class="mt-3 flex justify-end">
      <BaseButton type="button" variant="ghost" size="sm" icon="lucide:x" @click="emit('clear')">
        Limpiar filtros
      </BaseButton>
    </div>
  </div>
</template>
