<script lang="ts">
const openModals: symbol[] = []
</script>

<script setup lang="ts">
import { onBeforeUnmount, useId, watch } from 'vue'
import AppIcon from '@shared/components/ui/AppIcon.vue'

/**
 * BaseModal — modal genérico (título, cuerpo, pie opcional con slot `footer`).
 * Para flujos con Cancelar / Guardar, usa el slot `footer` con `BaseButton`.
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
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
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
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50"
          @click="handleBackdropClick"
        />

        <!-- Modal content -->
        <Transition
          enter-active-class="transition-all duration-300"
          leave-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title ? titleId : undefined"
            :class="[
              'relative w-full rounded-xl shadow-xl flex flex-col max-h-[min(90dvh,calc(100vh-2rem))] overflow-hidden',
              sizeClasses[size],
            ]"
            style="background-color: var(--color-surface);"
          >
            <!-- Header -->
            <div
              v-if="title || $slots.title || closable"
              class="flex shrink-0 items-center justify-between p-4 border-b"
              style="border-color: var(--color-border);"
            >
              <slot name="title">
                <h3 v-if="title" :id="titleId" class="text-lg font-semibold" style="color: var(--color-text-primary);">
                  {{ title }}
                </h3>
              </slot>
              <button
                v-if="closable"
                type="button"
                class="p-1 rounded hover-surface transition-colors ml-auto"
                aria-label="Cerrar"
                style="color: var(--color-text-muted);"
                @click="close"
              >
                <AppIcon icon="lucide:x" :size="20" color="currentColor" />
              </button>
            </div>

            <!-- Body (scroll when content is taller than viewport) -->
            <div class="min-h-0 flex-1 overflow-y-auto p-4">
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="shrink-0 p-4 border-t rounded-b-xl"
              style="border-color: var(--color-border); background-color: var(--color-background);"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
