<script lang="ts">
const openModals: symbol[] = []
</script>

<script setup lang="ts">
import { onBeforeUnmount, useId, watch } from 'vue'
import { Button } from '../../ui/button'
import { XIcon } from '../../icons/layout'
/**
 * BaseModal — modal genérico con el aspecto del `Dialog` de TailAdmin
 * (título, cuerpo con scroll, pie opcional con slot `footer`).
 * Mantiene su propia pila de apertura en lugar de Reka `Dialog`: así no atrapa el foco
 * ni bloquea los SweetAlert (con inputs) que se abren encima del modal.
 */

interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  size: 'md',
  closable: true,
  persistent: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const sizeClasses = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  full: 'sm:max-w-[calc(100%-2rem)]',
}

const close = () => {
  if (props.closable) {
    emit('update:modelValue', false)
    emit('close')
  }
}

const handleBackdropClick = () => {
  if (!props.persistent) {
    close()
  }
}

const titleId = `modal-title-${useId()}`

/**
 * Pila de modales abiertos: Escape cierra solo el de arriba y el scroll del
 * body se restaura cuando se cierra el último (también si la vista se desmonta
 * con el modal abierto).
 */
const token = Symbol('modal')

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || openModals[openModals.length - 1] !== token || props.persistent) return
  e.stopPropagation()
  close()
}

function release() {
  const index = openModals.indexOf(token)
  if (index === -1) return
  openModals.splice(index, 1)
  document.removeEventListener('keydown', onKeydown)
  if (openModals.length === 0) document.body.style.overflow = ''
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      if (openModals.includes(token)) return
      openModals.push(token)
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onKeydown)
    } else {
      release()
    }
  },
  { immediate: true },
)

onBeforeUnmount(release)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-100"
      leave-active-class="transition-opacity duration-100"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto p-4"
      >
        <!-- Backdrop (DialogOverlay de TailAdmin) -->
        <div
          data-slot="dialog-overlay"
          class="fixed inset-0 bg-black/50 supports-backdrop-filter:backdrop-blur-xs dark:bg-black/70"
          @click="handleBackdropClick"
        />

        <!-- Contenido (DialogContent de TailAdmin) -->
        <Transition
          enter-active-class="transition-all duration-100"
          leave-active-class="transition-all duration-100"
          enter-from-class="opacity-0 scale-95"
          leave-to-class="opacity-0 scale-95"
          appear
        >
          <div
            v-if="modelValue"
            role="dialog"
            aria-modal="true"
            data-slot="dialog-content"
            :aria-labelledby="title ? titleId : undefined"
            :class="[
              'relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-sm text-gray-700 shadow-theme-lg outline-none dark:border-gray-800 dark:bg-[#1E2635] dark:text-gray-300',
              sizeClasses[size],
            ]"
          >
            <!-- Header -->
            <div
              v-if="title || $slots.title || closable"
              data-slot="dialog-header"
              class="flex shrink-0 items-start gap-2 border-b border-gray-100 px-6 pt-6 pb-4 dark:border-gray-800"
              :class="closable ? 'pe-14' : undefined"
            >
              <slot name="title">
                <h3
                  v-if="title"
                  :id="titleId"
                  data-slot="dialog-title"
                  class="text-lg font-semibold text-gray-800 dark:text-white/90"
                >
                  {{ title }}
                </h3>
              </slot>
              <Button
                v-if="closable"
                variant="ghost"
                size="icon-sm"
                class="absolute end-3 top-3 rounded-full text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                aria-label="Cerrar"
                @click="close"
              >
                <XIcon />
              </Button>
            </div>

            <!-- Body: única zona con scroll; encabezado y pie quedan fijos -->
            <div class="min-h-0 flex-1 overflow-y-auto px-6 pb-6" :class="title || $slots.title || closable ? 'pt-5' : 'pt-6'">
              <slot />
            </div>

            <!-- Footer (DialogFooter de TailAdmin) -->
            <div
              v-if="$slots.footer"
              data-slot="dialog-footer"
              class="shrink-0 border-t border-gray-100 px-6 py-4 dark:border-gray-800"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
