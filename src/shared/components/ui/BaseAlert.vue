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
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
}

const iconColors = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
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
