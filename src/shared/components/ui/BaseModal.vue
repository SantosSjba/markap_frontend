<script setup lang="ts">
import { watch } from 'vue'
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

// Handle escape key
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !props.persistent) {
          close()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.removeEventListener('keydown', handleEscape)
      }
    } else {
      document.body.style.overflow = ''
    }
  }
)
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
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
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
            :class="[
              'relative w-full rounded-xl shadow-xl',
              sizeClasses[size],
            ]"
            style="background-color: var(--color-surface);"
          >
            <!-- Header -->
            <div
              v-if="title || $slots.title || closable"
              class="flex items-center justify-between p-4 border-b"
              style="border-color: var(--color-border);"
            >
              <slot name="title">
                <h3 v-if="title" class="text-lg font-semibold" style="color: var(--color-text-primary);">
                  {{ title }}
                </h3>
              </slot>
              <button
                v-if="closable"
                type="button"
                class="p-1 rounded hover-surface transition-colors ml-auto"
                style="color: var(--color-text-muted);"
                @click="close"
              >
                <AppIcon icon="lucide:x" :size="20" color="currentColor" />
              </button>
            </div>

            <!-- Body -->
            <div class="p-4">
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="p-4 border-t rounded-b-xl"
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
