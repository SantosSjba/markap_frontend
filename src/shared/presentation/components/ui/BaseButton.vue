<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { Button } from '../../ui/button'
import type { ButtonSize, ButtonVariant } from '../../ui/button'
import { LoaderCircleIcon } from '../../icons/layout'
import AppIcon from './AppIcon.vue'
/**
 * BaseButton — `Button` de TailAdmin con la API histórica de Markap
 * (variant primary/secondary/outline/ghost/danger/link, size sm/md/lg, icon, loading, block).
 */

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  block?: boolean
  /** Icono lucide/iconify antes del texto (ej. lucide:save) */
  icon?: string
  /** Texto mientras `loading` (por defecto «Cargando...») */
  loadingText?: string
  /** Navegación interna: se renderiza como `RouterLink` */
  to?: RouteLocationRaw
  /** Enlace externo/descarga: se renderiza como `<a>` */
  href?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  block: false,
  icon: undefined,
  loadingText: 'Cargando...',
  to: undefined,
  href: undefined,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const variantMap: Record<NonNullable<Props['variant']>, ButtonVariant> = {
  primary: 'default',
  secondary: 'outline',
  outline: 'outline',
  ghost: 'ghost',
  danger: 'destructive',
  link: 'link',
}

const sizeMap: Record<NonNullable<Props['size']>, ButtonSize> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
}

const buttonVariant = computed(() => variantMap[props.variant])
const buttonSize = computed(() => sizeMap[props.size])

const tag = computed(() => (props.to ? RouterLink : props.href ? 'a' : 'button'))

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <Button
    :as="tag"
    :to="to"
    :href="href"
    :type="type"
    :variant="buttonVariant"
    :size="buttonSize"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :class="block ? 'w-full' : undefined"
    @click="handleClick"
  >
    <template v-if="loading">
      <LoaderCircleIcon class="animate-spin" />
      <span>{{ loadingText }}</span>
    </template>
    <template v-else>
      <AppIcon v-if="icon" :icon="icon" color="currentColor" />
      <slot />
    </template>
  </Button>
</template>
