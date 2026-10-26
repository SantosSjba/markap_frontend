<script setup lang="ts">
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const title = computed(() => (route.meta.title as string) || 'Sección')
</script>

<template>
  <PageHeader
    :title="title"
  >
    <template #actions>
      <p class="text-sm mt-2 text-gray-500 dark:text-gray-400">
      Esta sección está en desarrollo
    </p>
    </template>
  </PageHeader>
</template>
