<script setup lang="ts">
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
/** Error de carga de una pestaña de Reportes con opción de reintentar. */
defineProps<{ error: unknown }>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="text-center py-10 space-y-3">
    <p class="text-sm text-error-500 dark:text-error-400">{{ getApiErrorMessage(error) }}</p>
    <BaseButton variant="outline" size="sm" @click="emit('retry')">Reintentar</BaseButton>
  </div>
</template>
