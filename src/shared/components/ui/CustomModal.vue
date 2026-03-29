<script setup lang="ts">
import AppIcon from '@shared/components/ui/AppIcon.vue'

/**
 * CustomModal - Modal reutilizable con encabezado por props, botones Cancelar/Guardar y slot para el contenido
 */
interface Props {
  /** Controla visibilidad (v-model) */
  modelValue: boolean
  /** Título del encabezado */
  title?: string
  /** Texto del botón cancelar */
  cancelLabel?: string
  /** Texto del botón guardar */
  saveLabel?: string
  /** Muestra loading en el botón guardar */
  loading?: boolean
  /** Deshabilita el botón guardar */
  saveDisabled?: boolean
  /** Tamaño: sm, md, lg, xl, full */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Cerrar al hacer clic en backdrop */
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  cancelLabel: 'Cancelar',
  saveLabel: 'Guardar',
  loading: false,
  saveDisabled: false,
  size: 'md',
  closable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  cancel: []
  save: []
}>()

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
}

const close = () => {
  if (props.closable) {
    emit('update:modelValue', false)
    emit('cancel')
  }
}

const onSave = () => {
  emit('save')
}

const handleBackdropClick = () => {
  if (props.closable) close()
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/50"
          aria-hidden="true"
          @click="handleBackdropClick"
        />
        <Transition
          enter-active-class="transition-all duration-200"
          leave-active-class="transition-all duration-150"
          enter-from-class="opacity-0 scale-95"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title ? 'custom-modal-title' : undefined"
            :class="['relative w-full rounded-xl shadow-xl', sizeClasses[size]]"
            :style="{ backgroundColor: 'var(--color-surface)' }"
          >
            <!-- Header -->
            <div
              class="flex items-center justify-between px-5 py-4 border-b"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <h2
                v-if="title"
                id="custom-modal-title"
                class="text-lg font-semibold"
                :style="{ color: 'var(--color-text-primary)' }"
              >
                {{ title }}
              </h2>
              <span v-else />
              <button
                v-if="closable"
                type="button"
                class="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-hover)]"
                :style="{ color: 'var(--color-text-muted)' }"
                aria-label="Cerrar"
                @click="close"
              >
                <AppIcon icon="lucide:x" :size="20" color="currentColor" />
              </button>
            </div>

            <!-- Body (slot) -->
            <div class="px-5 py-4 max-h-[70vh] overflow-y-auto">
              <slot />
            </div>

            <!-- Footer: Cancelar / Guardar -->
            <div
              class="flex items-center justify-end gap-3 px-5 py-4 border-t"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <slot name="footer-before" />
              <button
                type="button"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                :style="{
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'transparent',
                }"
                :disabled="loading"
                @click="close"
              >
                {{ cancelLabel }}
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
                :style="{ backgroundColor: 'var(--color-primary)' }"
                :disabled="saveDisabled || loading"
                @click="onSave"
              >
                <span v-if="loading" class="inline-flex items-center gap-2">
                  <AppIcon icon="line-md:loading-loop" :size="16" color="currentColor" />
                  {{ saveLabel }}...
                </span>
                <span v-else>{{ saveLabel }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
