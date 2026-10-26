<script setup lang="ts">
import { computed } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert'
import type { AlertVariant } from '../../ui/alert'
import { Button } from '../../ui/button'
import {
  AlertIcon,
  CheckCircleIcon,
  InfoIcon,
  OctagonAlertIcon,
  XIcon,
} from '../../icons/layout'
/**
 * BaseAlert — `Alert` de TailAdmin (info | success | warning | error).
 */

interface Props {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  dismissible?: boolean
  icon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  title: undefined,
  dismissible: false,
  icon: true,
})

const emit = defineEmits<{
  dismiss: []
}>()

const variantMap: Record<NonNullable<Props['type']>, AlertVariant> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'destructive',
}

const iconMap = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: AlertIcon,
  error: OctagonAlertIcon,
}

const variant = computed(() => variantMap[props.type])
const iconComponent = computed(() => iconMap[props.type])
</script>

<template>
  <Alert :variant="variant" class="p-4" :class="dismissible ? 'pe-12' : undefined">
    <component :is="iconComponent" v-if="icon" class="size-5" />
    <AlertTitle v-if="title">{{ title }}</AlertTitle>
    <AlertDescription>
      <slot />
    </AlertDescription>
    <Button
      v-if="dismissible"
      variant="ghost"
      size="icon-xs"
      class="absolute end-2 top-2 text-gray-400 hover:text-gray-700 dark:hover:text-white"
      aria-label="Cerrar"
      @click="emit('dismiss')"
    >
      <XIcon class="size-4" />
    </Button>
  </Alert>
</template>
