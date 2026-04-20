<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Vista placeholder para secciones en desarrollo
 */
const route = useRoute()
const title = computed(() => (route.meta.title as string) || 'Sección')
</script>

<template>
  <div>
    <h1 class="text-xl font-bold" style="color: var(--color-text-primary);">
      {{ title }}
    </h1>
    <p class="text-sm mt-2" style="color: var(--color-text-secondary);">
      Esta sección está en desarrollo
    </p>
  </div>
</template>
