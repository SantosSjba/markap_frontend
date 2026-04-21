<script setup lang="ts">
import AppIcon from '@shared/components/ui/AppIcon.vue'

/**
 * BaseAlert Component
 * Reusable alert/notification component
 */

interface Props {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  dismissible?: boolean
  icon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  dismissible: false,
  icon: true,
})

const emit = defineEmits<{
  dismiss: []
}>()

const typeClasses = {
  info:
    'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-100',
  success:
    'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/50 dark:border-green-800 dark:text-green-100',
  warning:
    'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-100',
  error:
    'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800 dark:text-red-100',
}

const iconColors = {
  info: 'text-blue-500 dark:text-blue-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-500 dark:text-red-400',
}
</script>

<template>
  <div
    :class="[
      'flex items-start gap-3 p-4 border rounded-lg',
      typeClasses[type],
    ]"
    role="alert"
  >
    <!-- Icon -->
    <div v-if="icon" :class="['flex-shrink-0', iconColors[type]]">
      <AppIcon v-if="type === 'info'" icon="lucide:info" :size="20" color="currentColor" />
      <AppIcon v-else-if="type === 'success'" icon="lucide:circle-check" :size="20" color="currentColor" />
      <AppIcon v-else-if="type === 'warning'" icon="lucide:triangle-alert" :size="20" color="currentColor" />
      <AppIcon v-else-if="type === 'error'" icon="lucide:circle-x" :size="20" color="currentColor" />
    </div>

    <!-- Content -->
    <div class="flex-1">
      <h4 v-if="title" class="font-medium mb-1">{{ title }}</h4>
      <div class="text-sm">
        <slot />
      </div>
    </div>

    <!-- Dismiss button -->
    <button
      v-if="dismissible"
      type="button"
      class="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
      @click="emit('dismiss')"
    >
      <AppIcon icon="lucide:x" :size="16" color="currentColor" />
    </button>
  </div>
</template>
